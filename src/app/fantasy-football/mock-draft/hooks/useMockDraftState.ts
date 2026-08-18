"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DraftPick, Player, ScoringFormat, TeamRoster } from "@/types";
import {
  calculateCurrentRound,
  calculateDraftOrder,
  getCurrentDraftSeason,
  initializeTeams,
} from "@/app/fantasy-football/draft-tracker/hooks/useDraftState";
import { mulberry32 } from "@/lib/retirement/random";
import { pickForTeam } from "@/lib/mockDraft";

/**
 * Room state for the mock draft practice simulator. The user owns one slot;
 * every other team is simulated by the pure engine in src/lib/mockDraft.ts.
 * Simulated picks are a deterministic function of (board, seed, pick number),
 * so a persisted room replays identically after a reload as long as every
 * drafted player still exists in the published snapshot.
 */
export interface MockDraftSettings {
  totalTeams: number;
  rounds: number;
  userTeam: number;
  scoringFormat: ScoringFormat;
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
  rounds: 15,
  userTeam: 5,
  scoringFormat: "PPR",
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
 * Run simulated picks forward until the user is on the clock or the draft is
 * over. Returns a new pick list; never mutates the input.
 */
function advanceDraft(
  settings: MockDraftSettings,
  seed: number,
  picks: readonly DraftPick[],
  board: readonly Player[]
): { picks: DraftPick[]; status: MockDraftStatus } {
  const totalPicks = settings.totalTeams * settings.rounds;
  const nextPicks = [...picks];
  const drafted = new Set(nextPicks.map((pick) => pick.player.id));
  const teams = buildTeams(settings, nextPicks);

  while (nextPicks.length < totalPicks) {
    const pickNumber = nextPicks.length + 1;
    const teamNumber = calculateDraftOrder(pickNumber, settings.totalTeams, "snake");
    if (teamNumber === settings.userTeam) {
      return { picks: nextPicks, status: "on-clock" };
    }
    const roster = teams[teamNumber - 1];
    const available = board.filter((player) => !drafted.has(player.id));
    const player = pickForTeam(
      available,
      roster,
      pickNumber,
      settings,
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
 * Decode a persisted room. localStorage is a trust boundary: every field is
 * validated and any drafted player missing from the current board discards
 * the whole save, since a refreshed snapshot cannot honestly resume a room
 * built on players it no longer publishes.
 */
function decodePersistedRoom(
  raw: string,
  board: readonly Player[]
): { settings: MockDraftSettings; seed: number; picks: DraftPick[] } | null {
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
    typeof settings.totalTeams !== "number" ||
    typeof settings.rounds !== "number" ||
    typeof settings.userTeam !== "number" ||
    (settings.scoringFormat !== "PPR" &&
      settings.scoringFormat !== "HALF_PPR" &&
      settings.scoringFormat !== "STANDARD")
  ) {
    return null;
  }
  const decodedSettings: MockDraftSettings = {
    totalTeams: settings.totalTeams,
    rounds: settings.rounds,
    userTeam: settings.userTeam,
    scoringFormat: settings.scoringFormat,
  };
  if (typeof record.seed !== "number" || !Array.isArray(record.picks)) return null;

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
  return { settings: decodedSettings, seed: record.seed, picks };
}

const SETUP_STATE: MockDraftRoomState = {
  status: "setup",
  settings: DEFAULT_MOCK_DRAFT_SETTINGS,
  seed: 0,
  picks: [],
};

export function useMockDraftState(
  board: readonly Player[],
  boardScoring: ScoringFormat
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
    if (!decoded || decoded.picks.length === 0) {
      try {
        window.localStorage.removeItem(getMockDraftStorageKey());
      } catch {
        // Ignore: a failed cleanup only leaves a save that will be re-checked.
      }
      return;
    }
    const totalPicks = decoded.settings.totalTeams * decoded.settings.rounds;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot resume of a persisted room after the board loads
    setState({
      status: decoded.picks.length >= totalPicks ? "complete" : "on-clock",
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
      if (settings.scoringFormat !== boardScoring) return;
      hydratedRef.current = true;
      const roomSeed =
        typeof seed === "number" ? seed : Math.floor(Math.random() * 2 ** 31);
      const advanced = advanceDraft(settings, roomSeed, [], board);
      setState({
        status: advanced.status,
        settings,
        seed: roomSeed,
        picks: advanced.picks,
      });
    },
    [board, boardScoring]
  );

  const makeUserPick = useCallback(
    (player: Player): boolean => {
      if (state.status !== "on-clock") return false;
      const pickNumber = state.picks.length + 1;
      const teamNumber = calculateDraftOrder(
        pickNumber,
        state.settings.totalTeams,
        "snake"
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
        board
      );
      setState({
        status: advanced.status,
        settings: state.settings,
        seed: state.seed,
        picks: advanced.picks,
      });
      return true;
    },
    [board, state]
  );

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
    undoUserPick,
    resetDraft,
  };
}
