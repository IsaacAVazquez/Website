import type {
  BestBallCompetitionFormat,
  BestBallLineupVariant,
} from "@/lib/bestBall";
import type { Player } from "@/types";

export const BEST_BALL_DRAFT_STORAGE_VERSION = 1;
export const BEST_BALL_ROOM_RULES_SCHEMA_VERSION = 2;

export interface BestBallRoomRules {
  contestId: string;
  rulesSchemaVersion: number;
  competitionFormat: BestBallCompetitionFormat;
  lineupVariant: BestBallLineupVariant;
  scoring: "HALF_PPR";
  teams: number;
  rounds: number;
  rosterSize: number;
  lineup: {
    QB: number;
    RB: number;
    WR: number;
    TE: number;
    FLEX: number;
    SUPERFLEX?: number;
  };
}

export interface BestBallDraftPick {
  pickNumber: number;
  round: number;
  teamNumber: number;
  player: Player;
  draftedAt: string;
}

export interface BestBallDraftState {
  schemaVersion: number;
  season: number;
  contestId: string;
  userSlot: number;
  rules: BestBallRoomRules;
  picks: BestBallDraftPick[];
  startedAt: string | null;
  updatedAt: string;
}

function rulesMatch(left: BestBallRoomRules, right: BestBallRoomRules): boolean {
  if (
    !left ||
    typeof left !== "object" ||
    !left.lineup ||
    typeof left.lineup !== "object"
  ) {
    return false;
  }
  return (
    left.contestId === right.contestId &&
    left.rulesSchemaVersion === right.rulesSchemaVersion &&
    left.competitionFormat === right.competitionFormat &&
    left.lineupVariant === right.lineupVariant &&
    left.scoring === right.scoring &&
    left.teams === right.teams &&
    left.rounds === right.rounds &&
    left.rosterSize === right.rosterSize &&
    left.lineup.QB === right.lineup.QB &&
    left.lineup.RB === right.lineup.RB &&
    left.lineup.WR === right.lineup.WR &&
    left.lineup.TE === right.lineup.TE &&
    left.lineup.FLEX === right.lineup.FLEX &&
    left.lineup.SUPERFLEX === right.lineup.SUPERFLEX
  );
}

function isDraftablePlayer(value: unknown): value is Player {
  if (!value || typeof value !== "object") return false;
  const player = value as Partial<Player>;
  return (
    typeof player.id === "string" &&
    player.id.length > 0 &&
    typeof player.name === "string" &&
    player.name.length > 0 &&
    typeof player.team === "string" &&
    ["QB", "RB", "WR", "TE"].includes(String(player.position)) &&
    typeof player.averageRank === "number" &&
    Number.isFinite(player.averageRank) &&
    (player.standardDeviation === undefined ||
      (typeof player.standardDeviation === "number" &&
        Number.isFinite(player.standardDeviation) &&
        player.standardDeviation >= 0))
  );
}

export function getBestBallDraftStorageKey(season: number, contestId: string): string {
  const safeContestId = contestId.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return `fantasy-best-ball-draft-v${BEST_BALL_DRAFT_STORAGE_VERSION}-${season}-${safeContestId}`;
}

export function getBestBallDraftBackupKey(season: number, contestId: string): string {
  return `${getBestBallDraftStorageKey(season, contestId)}-previous`;
}

export function getBestBallTeamForPick(pickNumber: number, teams: number): number {
  if (!Number.isInteger(pickNumber) || pickNumber < 1 || !Number.isInteger(teams) || teams < 2) {
    return 1;
  }
  const round = Math.ceil(pickNumber / teams);
  const position = ((pickNumber - 1) % teams) + 1;
  return round % 2 === 1 ? position : teams - position + 1;
}

export function createBestBallDraftState(
  season: number,
  rules: BestBallRoomRules,
  userSlot: number,
  now: Date = new Date()
): BestBallDraftState {
  const normalizedSlot = Math.min(rules.teams, Math.max(1, Math.floor(userSlot)));
  return {
    schemaVersion: BEST_BALL_DRAFT_STORAGE_VERSION,
    season,
    contestId: rules.contestId,
    userSlot: normalizedSlot,
    rules,
    picks: [],
    startedAt: null,
    updatedAt: now.toISOString(),
  };
}

export function addBestBallDraftPick(
  state: BestBallDraftState,
  player: Player,
  now: Date = new Date()
): BestBallDraftState {
  const totalPicks = state.rules.teams * state.rules.rounds;
  if (state.picks.length >= totalPicks || state.picks.some((pick) => pick.player.id === player.id)) {
    return state;
  }

  const pickNumber = state.picks.length + 1;
  const timestamp = now.toISOString();
  const pick: BestBallDraftPick = {
    pickNumber,
    round: Math.ceil(pickNumber / state.rules.teams),
    teamNumber: getBestBallTeamForPick(pickNumber, state.rules.teams),
    player,
    draftedAt: timestamp,
  };

  return {
    ...state,
    picks: [...state.picks, pick],
    startedAt: state.startedAt ?? timestamp,
    updatedAt: timestamp,
  };
}

export function undoBestBallDraftPick(
  state: BestBallDraftState,
  now: Date = new Date()
): BestBallDraftState {
  if (state.picks.length === 0) return state;
  return {
    ...state,
    picks: state.picks.slice(0, -1),
    updatedAt: now.toISOString(),
  };
}

export function parseBestBallDraftState(
  raw: string,
  expectedSeason: number,
  expectedRules: BestBallRoomRules
): BestBallDraftState | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object") return null;

  const candidate = value as Partial<BestBallDraftState>;
  if (
    candidate.schemaVersion !== BEST_BALL_DRAFT_STORAGE_VERSION ||
    candidate.season !== expectedSeason ||
    candidate.contestId !== expectedRules.contestId ||
    !candidate.rules ||
    !rulesMatch(candidate.rules, expectedRules) ||
    !Number.isInteger(candidate.userSlot) ||
    Number(candidate.userSlot) < 1 ||
    Number(candidate.userSlot) > expectedRules.teams ||
    !Array.isArray(candidate.picks) ||
    typeof candidate.updatedAt !== "string" ||
    Number.isNaN(Date.parse(candidate.updatedAt)) ||
    (candidate.startedAt !== null &&
      (typeof candidate.startedAt !== "string" || Number.isNaN(Date.parse(candidate.startedAt))))
  ) {
    return null;
  }

  const totalPicks = expectedRules.teams * expectedRules.rounds;
  if (candidate.picks.length > totalPicks) return null;

  const seenPlayers = new Set<string>();
  const picks: BestBallDraftPick[] = [];
  for (let index = 0; index < candidate.picks.length; index += 1) {
    const rawPick = candidate.picks[index];
    if (!rawPick || typeof rawPick !== "object") return null;
    const pick = rawPick as Partial<BestBallDraftPick>;
    const pickNumber = index + 1;
    if (
      pick.pickNumber !== pickNumber ||
      pick.round !== Math.ceil(pickNumber / expectedRules.teams) ||
      pick.teamNumber !== getBestBallTeamForPick(pickNumber, expectedRules.teams) ||
      !isDraftablePlayer(pick.player) ||
      seenPlayers.has(pick.player.id) ||
      typeof pick.draftedAt !== "string" ||
      Number.isNaN(Date.parse(pick.draftedAt))
    ) {
      return null;
    }
    seenPlayers.add(pick.player.id);
    picks.push(pick as BestBallDraftPick);
  }

  return {
    schemaVersion: BEST_BALL_DRAFT_STORAGE_VERSION,
    season: expectedSeason,
    contestId: expectedRules.contestId,
    userSlot: Number(candidate.userSlot),
    rules: expectedRules,
    picks,
    startedAt: candidate.startedAt ?? null,
    updatedAt: candidate.updatedAt,
  };
}
