import { BEST_BALL_CONTESTS, getContestPreset } from "@/lib/bestBall";
import {
  DEFAULT_REDRAFT_LINEUP,
  normalizeRedraftLineup,
} from "@/lib/redraftLineup";
import type { RedraftLineupSettings, ScoringFormat } from "@/types";
import type {
  BestBallCompanionRoomConfig,
  CreateBestBallRoomOptions,
  CreateRedraftRoomOptions,
  FantasyCompanionDraftOrder,
  FantasyCompanionRoomConfig,
  RedraftCompanionRoomConfig,
} from "./types";

const MINIMUM_SEASON = 2020;
const MAXIMUM_SEASON = 2100;
const MINIMUM_TEAMS = 2;
const MAXIMUM_TEAMS = 20;
const MINIMUM_ROUNDS = 1;
const MAXIMUM_ROUNDS = 30;
const REDRAFT_SCORING_FORMATS: readonly ScoringFormat[] = [
  "STANDARD",
  "HALF_PPR",
  "PPR",
];
const DRAFT_ORDERS: readonly FantasyCompanionDraftOrder[] = ["snake", "linear"];

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isIntegerInRange(value: unknown, minimum: number, maximum: number): value is number {
  return Number.isInteger(value) && Number(value) >= minimum && Number(value) <= maximum;
}

function requireIntegerInRange(
  value: number,
  minimum: number,
  maximum: number,
  field: string
): number {
  if (!isIntegerInRange(value, minimum, maximum)) {
    throw new RangeError(`${field} must be an integer from ${minimum} through ${maximum}.`);
  }
  return value;
}

function isRedraftLineup(value: unknown): value is RedraftLineupSettings {
  if (!isRecord(value)) return false;
  return (
    value.QB === 1 &&
    isIntegerInRange(value.RB, 1, 3) &&
    isIntegerInRange(value.WR, 1, 4) &&
    isIntegerInRange(value.TE, 1, 2) &&
    isIntegerInRange(value.FLEX, 0, 3) &&
    isIntegerInRange(value.K, 0, 1) &&
    isIntegerInRange(value.DST, 0, 1)
  );
}

function hasValidBaseRoomFields(value: UnknownRecord): boolean {
  return (
    isIntegerInRange(value.season, MINIMUM_SEASON, MAXIMUM_SEASON) &&
    isIntegerInRange(value.teams, MINIMUM_TEAMS, MAXIMUM_TEAMS) &&
    isIntegerInRange(value.rounds, MINIMUM_ROUNDS, MAXIMUM_ROUNDS) &&
    isIntegerInRange(value.userTeam, 1, Number(value.teams)) &&
    DRAFT_ORDERS.includes(value.draftOrder as FantasyCompanionDraftOrder)
  );
}

export function createRedraftRoomConfig(
  options: CreateRedraftRoomOptions
): RedraftCompanionRoomConfig {
  const teams = requireIntegerInRange(
    options.teams ?? 12,
    MINIMUM_TEAMS,
    MAXIMUM_TEAMS,
    "teams"
  );
  const rounds = requireIntegerInRange(
    options.rounds ?? 15,
    MINIMUM_ROUNDS,
    MAXIMUM_ROUNDS,
    "rounds"
  );
  const userTeam = requireIntegerInRange(options.userTeam ?? 1, 1, teams, "userTeam");
  const season = requireIntegerInRange(
    options.season,
    MINIMUM_SEASON,
    MAXIMUM_SEASON,
    "season"
  );
  if (
    options.draftOrder !== undefined &&
    options.draftType !== undefined &&
    options.draftOrder !== options.draftType
  ) {
    throw new RangeError("draftOrder and draftType cannot disagree.");
  }
  const draftOrder = options.draftOrder ?? options.draftType ?? "snake";
  const scoring = options.scoring ?? "PPR";

  if (!DRAFT_ORDERS.includes(draftOrder)) {
    throw new RangeError('draftOrder must be either "snake" or "linear".');
  }
  if (!REDRAFT_SCORING_FORMATS.includes(scoring)) {
    throw new RangeError("scoring must be STANDARD, HALF_PPR, or PPR.");
  }

  return {
    kind: "redraft",
    season,
    teams,
    rounds,
    userTeam,
    draftOrder,
    scoring,
    lineup: normalizeRedraftLineup(options.lineup ?? DEFAULT_REDRAFT_LINEUP),
  };
}

export function createBestBallRoomConfig(
  options: CreateBestBallRoomOptions
): BestBallCompanionRoomConfig {
  if (!Object.prototype.hasOwnProperty.call(BEST_BALL_CONTESTS, options.contestId)) {
    throw new RangeError("contestId must name a supported best-ball contest preset.");
  }
  const preset = getContestPreset(options.contestId);
  const season = requireIntegerInRange(
    options.season,
    MINIMUM_SEASON,
    MAXIMUM_SEASON,
    "season"
  );
  const userTeam = requireIntegerInRange(
    options.userTeam ?? 1,
    1,
    preset.teams,
    "userTeam"
  );

  return {
    kind: "best-ball",
    season,
    contestId: preset.id,
    teams: preset.teams,
    rounds: preset.rounds,
    userTeam,
    draftOrder: "snake",
    scoring: preset.scoring,
  };
}

export function isFantasyCompanionRoomConfig(
  value: unknown
): value is FantasyCompanionRoomConfig {
  if (!isRecord(value) || !hasValidBaseRoomFields(value)) return false;

  if (value.kind === "redraft") {
    return (
      REDRAFT_SCORING_FORMATS.includes(value.scoring as ScoringFormat) &&
      isRedraftLineup(value.lineup)
    );
  }

  if (value.kind !== "best-ball" || typeof value.contestId !== "string") return false;

  try {
    const preset = getContestPreset(value.contestId);
    return (
      value.contestId === preset.id &&
      value.teams === preset.teams &&
      value.rounds === preset.rounds &&
      value.scoring === preset.scoring &&
      value.draftOrder === "snake"
    );
  } catch {
    return false;
  }
}

export function fantasyCompanionRoomConfigsEqual(
  left: FantasyCompanionRoomConfig,
  right: FantasyCompanionRoomConfig
): boolean {
  if (
    left.kind !== right.kind ||
    left.season !== right.season ||
    left.teams !== right.teams ||
    left.rounds !== right.rounds ||
    left.userTeam !== right.userTeam ||
    left.draftOrder !== right.draftOrder ||
    left.scoring !== right.scoring
  ) {
    return false;
  }

  if (left.kind === "best-ball" && right.kind === "best-ball") {
    return left.contestId === right.contestId;
  }
  if (left.kind !== "redraft" || right.kind !== "redraft") return false;

  return (
    left.lineup.QB === right.lineup.QB &&
    left.lineup.RB === right.lineup.RB &&
    left.lineup.WR === right.lineup.WR &&
    left.lineup.TE === right.lineup.TE &&
    left.lineup.FLEX === right.lineup.FLEX &&
    left.lineup.K === right.lineup.K &&
    left.lineup.DST === right.lineup.DST
  );
}
