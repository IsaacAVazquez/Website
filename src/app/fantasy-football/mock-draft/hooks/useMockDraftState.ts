"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  DraftPick,
  Player,
  RedraftLineupSettings,
  ScoringFormat,
  TeamRoster,
} from "@/types";
import {
  calculateCurrentRound,
  calculateDraftOrder,
  getCurrentDraftSeason,
  initializeTeams,
} from "@/app/fantasy-football/draft-tracker/hooks/useDraftState";
import { DEFAULT_REDRAFT_LINEUP, normalizeRedraftLineup } from "@/lib/redraftLineup";
import { mulberry32 } from "@/lib/retirement/random";
import { pickForTeam, type MockDraftTemper } from "@/lib/mockDraft";

/**
 * Room state for the mock draft practice simulator. The user owns one slot;
 * every other team is simulated by the pure engine in src/lib/mockDraft.ts.
 * Simulated picks are a deterministic function of (board, seed, pick number,
 * settings), so a persisted room replays identically after a reload as long as
 * every drafted player still exists in the published snapshot.
 */
export interface MockDraftSettings {
  totalTeams: number;
  rounds: number;
  userTeam: number;
  scoringFormat: ScoringFormat;
  draftType: "snake" | "linear";
  temper: MockDraftTemper;
  lineup: RedraftLineupSettings;
}

export type MockDraftStatus = "setup" | "on-clock" | "complete";

export interface MockDraftRoomState {
  status: MockDraftStatus;
  settings: MockDraftSettings;
  seed: number;
  picks: DraftPick[];
}

const STORAGE_VERSION = 1;

export const DEFAULT_MOCK_DRAFT_SETTINGS: MockDraftSettings = {
  totalTeams: 10,
  rounds: 5,
  userTeam: 5,
  scoringFormat: "PPR",
  draftType: "snake",
  temper: "normal",
  lineup: DEFAULT_REDRAFT_LINEUP,
};

export function getMockDraftStorageKey(
  season: number = getCurrentDraftSeason()
): string {
  return `fantasy-mock-draft-v${STORAGE_VERSION}-${season}`;
}

/**
 * Each pick draws from its own generator seeded off the room seed and the
 * pick number, so resuming a saved room never has to replay the RNG stream
 * to get back in sync.
 */
function perPickRng(seed: number, pickNumber: number): () => number {
  return mulberry32(seed + pickNumber * 101);
}

function isCountedPosition(
  position: string,
  counts: TeamRoster["positionCounts"]
): position is keyof TeamRoster["positionCounts"] {
  return position in counts;
}

function buildTeams(settings: MockDraftSettings, picks: readonly DraftPick[]): TeamRoster[] {
  const teams = initializeTeams(settings.totalTeams);
  for (const pick of picks) {
    const team = teams[pick.teamNumber - 1];
    if (!team) continue;
    team.picks.push(pick);
    if (isCountedPosition(pick.player.position, team.positionCounts)) {
      team.positionCounts[pick.player.position] += 1;
    }
  }
  return teams;
}

/**
 * Run simulated picks forward until the user is on the clock (or, with
 * stopAtUser false, until the draft is over, the engine picking the user's
 * remaining turns too). Returns a new pick list; never mutates the input.
 */
function advanceDraft(
  settings: MockDraftSettings,
  seed: number,
  picks: readonly DraftPick[],
  board: readonly Player[],
  stopAtUser: boolean
): { picks: DraftPick[]; status: MockDraftStatus } {
  const totalPicks = settings.totalTeams * settings.rounds;
  const nextPicks = [...picks];
  const drafted = new Set(nextPicks.map((pick) => pick.player.id));
  const teams = buildTeams(settings, nextPicks);

  while (nextPicks.length < totalPicks) {
    const pickNumber = nextPicks.length + 1;
    const teamNumber = calculateDraftOrder(pickNumber, settings.totalTeams, settings.draftType);
    if (stopAtUser && teamNumber === settings.userTeam) {
      return { picks: nextPicks, status: "on-clock" };
    }
    const roster = teams[teamNumber - 1];
    const available = board.filter((player) => !drafted.has(player.id));
    const player = pickForTeam(
      available,
      roster,
      pickNumber,
      {
        totalTeams: settings.totalTeams,
        rounds: settings.rounds,
        lineup: settings.lineup,
        // A simmed pick on the user's own turn tracks the board tightly; the
        // room's temper only shapes the other teams.
        temper: teamNumber === settings.userTeam ? "faithful" : settings.temper,
      },
      perPickRng(seed, pickNumber)
    );
    if (!player) break;
    const pick: DraftPick = {
      pickNumber,
      round: calculateCurrentRound(pickNumber, settings.totalTeams),
      teamNumber,
      player,
      timestamp: new Date(),
    };
    nextPicks.push(pick);
    drafted.add(player.id);
    roster.picks.push(pick);
    if (isCountedPosition(player.position, roster.positionCounts)) {
      roster.positionCounts[player.position] += 1;
    }
  }
  return { picks: nextPicks, status: "complete" };
}

interface PersistedPick {
  pickNumber: number;
  teamNumber: number;
  playerId: string;
}

/**
 * Bounds for a persisted room's settings. localStorage is a trust boundary,
 * and `typeof x === "number"` alone let an edited save reach
 * `initializeTeams(1e8)` and freeze the tab, so every numeric setting must be
 * an integer inside a sane room shape (wider than the setup UI's options so
 * old saves survive an options change, but nowhere near allocation size).
 */
const SETTINGS_BOUNDS = {
  totalTeams: { min: 2, max: 20 },
  rounds: { min: 1, max: 30 },
} as const;

function isBoundedInteger(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

/**
 * Decode a persisted room. Every field is validated and any drafted player
 * missing from the current board discards the whole save, since a refreshed
 * snapshot cannot honestly resume a room built on players it no longer
 * publishes. `status` is persisted because it cannot be derived from the pick
 * count alone: a room whose board ran out ends "complete" with fewer than
 * totalTeams*rounds picks, and deriving would resume it soft-locked on-clock.
 */
function decodePersistedRoom(
  raw: string,
  board: readonly Player[]
): {
  settings: MockDraftSettings;
  seed: number;
  picks: DraftPick[];
  status: "on-clock" | "complete" | null;
} | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const record = parsed as Record<string, unknown>;
  if (record.version !== STORAGE_VERSION) return null;

  const settings = record.settings as Record<string, unknown> | undefined;
  if (
    !settings ||
    !isBoundedInteger(
      settings.totalTeams,
      SETTINGS_BOUNDS.totalTeams.min,
      SETTINGS_BOUNDS.totalTeams.max
    ) ||
    !isBoundedInteger(settings.rounds, SETTINGS_BOUNDS.rounds.min, SETTINGS_BOUNDS.rounds.max) ||
    !isBoundedInteger(settings.userTeam, 1, settings.totalTeams as number) ||
    (settings.scoringFormat !== "PPR" &&
      settings.scoringFormat !== "HALF_PPR" &&
      settings.scoringFormat !== "STANDARD")
  ) {
    return null;
  }
  // Rooms saved before the settings grew these fields resume on the values
  // they were actually built with: snake order, normal temper, the default
  // one-QB lineup. normalizeRedraftLineup clamps whatever the save holds.
  const decodedSettings: MockDraftSettings = {
    totalTeams: settings.totalTeams,
    rounds: settings.rounds,
    userTeam: settings.userTeam,
    scoringFormat: settings.scoringFormat,
    draftType: settings.draftType === "linear" ? "linear" : "snake",
    temper:
      settings.temper === "faithful" || settings.temper === "chaotic"
        ? settings.temper
        : "normal",
    lineup: normalizeRedraftLineup(
      settings.lineup as Partial<RedraftLineupSettings> | null | undefined
    ),
  };
  if (typeof record.seed !== "number" || !Number.isFinite(record.seed)) return null;
  if (!Array.isArray(record.picks)) return null;
  if (record.picks.length > decodedSettings.totalTeams * decodedSettings.rounds) return null;
  const status =
    record.status === "on-clock" || record.status === "complete" ? record.status : null;

  const byId = new Map(board.map((player) => [player.id, player]));
  const picks: DraftPick[] = [];
  for (const entry of record.picks as unknown[]) {
    if (typeof entry !== "object" || entry === null) return null;
    const pick = entry as Partial<PersistedPick>;
    if (
      typeof pick.pickNumber !== "number" ||
      typeof pick.teamNumber !== "number" ||
      typeof pick.playerId !== "string" ||
      pick.pickNumber !== picks.length + 1
    ) {
      return null;
    }
    const player = byId.get(pick.playerId);
    if (!player) return null;
    picks.push({
      pickNumber: pick.pickNumber,
      round: calculateCurrentRound(pick.pickNumber, decodedSettings.totalTeams),
      teamNumber: pick.teamNumber,
      player,
      timestamp: new Date(0),
    });
  }
  return { settings: decodedSettings, seed: record.seed, picks, status };
}

const SETUP_STATE: MockDraftRoomState = {
  status: "setup",
  settings: DEFAULT_MOCK_DRAFT_SETTINGS,
  seed: 0,
  picks: [],
};

export function useMockDraftState(
  board: readonly Player[],
  boardScoring: ScoringFormat,
  simulationEnabled = true
) {
  const [state, setState] = useState<MockDraftRoomState>(SETUP_STATE);
  const hydratedRef = useRef(false);

  // Resume a persisted room once a board with the SAME scoring format has
  // arrived. Player ids are identical across scoring boards, so resuming onto
  // the wrong board would silently swap every rank; a mismatched board leaves
  // the save untouched and waits for the right one. An active or already
  // hydrated session never gets overwritten.
  useEffect(() => {
    if (hydratedRef.current || board.length === 0) return;
    let raw: string | null;
    try {
      raw = window.localStorage.getItem(getMockDraftStorageKey());
    } catch {
      return;
    }
    if (!raw) {
      hydratedRef.current = true;
      return;
    }
    let savedScoring: unknown;
    try {
      savedScoring = (JSON.parse(raw) as { settings?: { scoringFormat?: unknown } })
        ?.settings?.scoringFormat;
    } catch {
      savedScoring = null;
    }
    const savedScoringIsValid =
      savedScoring === "PPR" ||
      savedScoring === "HALF_PPR" ||
      savedScoring === "STANDARD";
    if (savedScoringIsValid && savedScoring !== boardScoring) return;
    hydratedRef.current = true;
    const decoded = decodePersistedRoom(raw, board);
    // A zero-pick save is legitimate: drafting from slot 1 persists an
    // on-clock room before the user has made a pick, so only a save that
    // fails decoding or the integrity checks below gets discarded.
    const totalPicks = decoded
      ? decoded.settings.totalTeams * decoded.settings.rounds
      : 0;
    const status =
      decoded === null
        ? null
        : decoded.status ?? (decoded.picks.length >= totalPicks ? "complete" : "on-clock");
    const onClockBelongsToUser =
      decoded !== null &&
      (status !== "on-clock" ||
        (decoded.picks.length < totalPicks &&
          calculateDraftOrder(
            decoded.picks.length + 1,
            decoded.settings.totalTeams,
            decoded.settings.draftType
          ) === decoded.settings.userTeam));
    if (!decoded || status === null || !onClockBelongsToUser) {
      try {
        window.localStorage.removeItem(getMockDraftStorageKey());
      } catch {
        // Ignore: a failed cleanup only leaves a save that will be re-checked.
      }
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot resume of a persisted room after the board loads
    setState({
      status,
      settings: decoded.settings,
      seed: decoded.seed,
      picks: decoded.picks,
    });
  }, [board, boardScoring]);

  // Persist every active room state. Setup states never write, and resetDraft
  // removes the key itself.
  useEffect(() => {
    if (state.status === "setup") return;
    const payload = JSON.stringify({
      version: STORAGE_VERSION,
      status: state.status,
      settings: state.settings,
      seed: state.seed,
      picks: state.picks.map((pick) => ({
        pickNumber: pick.pickNumber,
        teamNumber: pick.teamNumber,
        playerId: pick.player.id,
      })),
    });
    try {
      window.localStorage.setItem(getMockDraftStorageKey(), payload);
    } catch {
      // Ignore: without storage the room simply will not survive a reload.
    }
  }, [state]);

  const startDraft = useCallback(
    (settings: MockDraftSettings, seed?: number) => {
      // The caller is responsible for handing over a board in the room's
      // scoring format; refuse to start a room on the wrong one.
      if (!simulationEnabled || settings.scoringFormat !== boardScoring) return;
      hydratedRef.current = true;
      const roomSeed =
        typeof seed === "number" ? seed : Math.floor(Math.random() * 2 ** 31);
      const advanced = advanceDraft(settings, roomSeed, [], board, true);
      setState({
        status: advanced.status,
        settings,
        seed: roomSeed,
        picks: advanced.picks,
      });
    },
    [board, boardScoring, simulationEnabled]
  );

  const makeUserPick = useCallback(
    (player: Player): boolean => {
      if (!simulationEnabled || state.status !== "on-clock") return false;
      const pickNumber = state.picks.length + 1;
      const teamNumber = calculateDraftOrder(
        pickNumber,
        state.settings.totalTeams,
        state.settings.draftType
      );
      if (teamNumber !== state.settings.userTeam) return false;
      const drafted = new Set(state.picks.map((pick) => pick.player.id));
      const boardPlayer = board.find((candidate) => candidate.id === player.id);
      if (!boardPlayer || drafted.has(boardPlayer.id)) return false;

      const userPick: DraftPick = {
        pickNumber,
        round: calculateCurrentRound(pickNumber, state.settings.totalTeams),
        teamNumber,
        player: boardPlayer,
        timestamp: new Date(),
      };
      const advanced = advanceDraft(
        state.settings,
        state.seed,
        [...state.picks, userPick],
        board,
        true
      );
      setState({
        status: advanced.status,
        settings: state.settings,
        seed: state.seed,
        picks: advanced.picks,
      });
      return true;
    },
    [board, simulationEnabled, state]
  );

  /**
   * Finish the room from here: the engine picks the user's remaining turns
   * too (tracking the board tightly), so the recap is one click away after
   * the rounds worth rehearsing.
   */
  const simToEnd = useCallback(() => {
    if (!simulationEnabled || state.status !== "on-clock") return;
    const advanced = advanceDraft(state.settings, state.seed, state.picks, board, false);
    setState({
      status: advanced.status,
      settings: state.settings,
      seed: state.seed,
      picks: advanced.picks,
    });
  }, [board, simulationEnabled, state]);

  const undoUserPick = useCallback((): boolean => {
    let lastUserIndex = -1;
    for (let index = state.picks.length - 1; index >= 0; index -= 1) {
      if (state.picks[index].teamNumber === state.settings.userTeam) {
        lastUserIndex = index;
        break;
      }
    }
    if (lastUserIndex === -1) return false;
    setState({
      status: "on-clock",
      settings: state.settings,
      seed: state.seed,
      picks: state.picks.slice(0, lastUserIndex),
    });
    return true;
  }, [state]);

  const resetDraft = useCallback(() => {
    try {
      window.localStorage.removeItem(getMockDraftStorageKey());
    } catch {
      // Ignore: the in-memory reset still happens.
    }
    setState(SETUP_STATE);
  }, []);

  const teams = useMemo(
    () => buildTeams(state.settings, state.picks),
    [state.picks, state.settings]
  );
  const availablePlayers = useMemo(() => {
    const drafted = new Set(state.picks.map((pick) => pick.player.id));
    return board.filter((player) => !drafted.has(player.id));
  }, [board, state.picks]);
  const currentPick = state.picks.length + 1;

  return {
    state,
    teams,
    availablePlayers,
    currentPick,
    startDraft,
    makeUserPick,
    simToEnd,
    undoUserPick,
    resetDraft,
  };
}
