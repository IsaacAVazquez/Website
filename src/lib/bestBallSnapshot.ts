import type { Player } from "@/types";
import { normalizeAdpTeam } from "@/lib/fantasyAdpMatcher";

export const BEST_BALL_SNAPSHOT_SCHEMA_VERSION = 2;
export const BEST_BALL_MIN_RANKING_PLAYERS = 250;
export const BEST_BALL_RANKING_TOP_BOARD_SIZE = 150;
export const BEST_BALL_MIN_RANKING_RELATIVE_COVERAGE = 0.8;
export const BEST_BALL_MIN_SUPERFLEX_MATCHES = 150;
export const BEST_BALL_MIN_SUPERFLEX_COVERAGE = 0.9;
export const BEST_BALL_SUPERFLEX_TOP_BOARD_SIZE = 150;
export const BEST_BALL_MIN_SUPERFLEX_TOP_BOARD_COVERAGE = 0.95;
export const BEST_BALL_MIN_SUPERFLEX_QB_COVERAGE = 1;
export const BEST_BALL_MIN_ADP_MATCHES = 150;
export const BEST_BALL_MIN_ADP_RELATIVE_COVERAGE = 0.8;

export function assertBestBallRankingCoverage({
  players,
  previousPlayers,
  previousTopPlayers,
  retainedTopPlayers,
}: {
  players: number;
  previousPlayers: number;
  previousTopPlayers: number;
  retainedTopPlayers: number;
}): void {
  const requiredPlayers = Math.max(
    BEST_BALL_MIN_RANKING_PLAYERS,
    Math.ceil(previousPlayers * BEST_BALL_MIN_RANKING_RELATIVE_COVERAGE)
  );
  const requiredTopPlayers = Math.ceil(
    previousTopPlayers * BEST_BALL_MIN_RANKING_RELATIVE_COVERAGE
  );
  if (players < requiredPlayers || retainedTopPlayers < requiredTopPlayers) {
    throw new Error(
      `Best ball rankings returned ${players} players versus ${previousPlayers} previously, and retained ${retainedTopPlayers} of ${previousTopPlayers} prior top-board players.`
    );
  }
}

export function assertBestBallAdpCoverage({
  freshSourceReceived,
  matches,
  previousMatches,
  previousTopPlayers,
  retainedTopPlayers,
}: {
  freshSourceReceived: boolean;
  matches: number;
  previousMatches: number;
  previousTopPlayers: number;
  retainedTopPlayers: number;
}): void {
  if (!freshSourceReceived) return;
  const requiredMatches = Math.max(
    BEST_BALL_MIN_ADP_MATCHES,
    Math.ceil(previousMatches * BEST_BALL_MIN_ADP_RELATIVE_COVERAGE)
  );
  const requiredTopPlayers = Math.ceil(
    previousTopPlayers * BEST_BALL_MIN_ADP_RELATIVE_COVERAGE
  );
  if (matches < requiredMatches || retainedTopPlayers < requiredTopPlayers) {
    throw new Error(
      `Best ball snapshot matched ADP for ${matches} players versus ${previousMatches} previously, and retained ${retainedTopPlayers} of ${previousTopPlayers} prior top-board prices.`
    );
  }
}

export function assertBestBallSuperflexCoverage({
  freshSourceReceived,
  totalPlayers,
  rankMatches,
  tierMatches,
  topBoardPlayers,
  topBoardRankMatches,
  topBoardTierMatches,
  quarterbackPlayers,
  quarterbackRankMatches,
  quarterbackTierMatches,
  hasPreviousSource,
}: {
  freshSourceReceived: boolean;
  totalPlayers: number;
  rankMatches: number;
  tierMatches: number;
  topBoardPlayers: number;
  topBoardRankMatches: number;
  topBoardTierMatches: number;
  quarterbackPlayers: number;
  quarterbackRankMatches: number;
  quarterbackTierMatches: number;
  hasPreviousSource: boolean;
}): void {
  const requiredOverallMatches = Math.max(
    BEST_BALL_MIN_SUPERFLEX_MATCHES,
    Math.ceil(totalPlayers * BEST_BALL_MIN_SUPERFLEX_COVERAGE)
  );
  const requiredTopBoardMatches = Math.ceil(
    topBoardPlayers * BEST_BALL_MIN_SUPERFLEX_TOP_BOARD_COVERAGE
  );
  const requiredQuarterbackMatches = Math.ceil(
    quarterbackPlayers * BEST_BALL_MIN_SUPERFLEX_QB_COVERAGE
  );
  if (
    freshSourceReceived &&
    (rankMatches < requiredOverallMatches ||
      tierMatches < requiredOverallMatches ||
      topBoardRankMatches < requiredTopBoardMatches ||
      topBoardTierMatches < requiredTopBoardMatches ||
      quarterbackRankMatches < requiredQuarterbackMatches ||
      quarterbackTierMatches < requiredQuarterbackMatches)
  ) {
    throw new Error(
      `Best ball snapshot matched Superflex ranks for ${rankMatches} of ${totalPlayers} players and tiers for ${tierMatches}. The top ${topBoardPlayers} matched ${topBoardRankMatches} ranks and ${topBoardTierMatches} tiers. Quarterbacks matched ${quarterbackRankMatches} ranks and ${quarterbackTierMatches} tiers out of ${quarterbackPlayers}.`
    );
  }
  if (!freshSourceReceived && !hasPreviousSource) {
    throw new Error("Best ball snapshot has no usable Superflex rankings source.");
  }
}

export interface BestBallSourceMetadata {
  provider: string;
  url: string;
  asOf: string | null;
  matchedCount?: number;
}

export interface BestBallSnapshot {
  schemaVersion: number;
  season: number;
  generatedAt: string;
  players: Player[];
  rankingSource: BestBallSourceMetadata;
  superflexSource: BestBallSourceMetadata | null;
  adpSource: BestBallSourceMetadata | null;
  scheduleSource: BestBallSourceMetadata | null;
  week17Opponents: Record<string, string>;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeSource(value: unknown): BestBallSourceMetadata | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<BestBallSourceMetadata>;
  if (typeof source.provider !== "string" || typeof source.url !== "string") return null;

  return {
    provider: source.provider.trim(),
    url: source.url.trim(),
    asOf:
      typeof source.asOf === "string" && !Number.isNaN(Date.parse(source.asOf))
        ? new Date(source.asOf).toISOString()
        : null,
    ...(isFiniteNumber(source.matchedCount)
      ? { matchedCount: Math.max(0, Math.floor(source.matchedCount)) }
      : {}),
  };
}

function normalizePlayer(value: unknown): Player | null {
  if (!value || typeof value !== "object") return null;
  const player = value as Partial<Player>;
  if (
    typeof player.id !== "string" ||
    typeof player.name !== "string" ||
    typeof player.team !== "string" ||
    !["QB", "RB", "WR", "TE"].includes(String(player.position)) ||
    !isFiniteNumber(player.averageRank) ||
    !isFiniteNumber(player.standardDeviation)
  ) {
    return null;
  }

  return {
    ...player,
    id: player.id.trim(),
    name: player.name.trim(),
    team: normalizeAdpTeam(player.team) || "FA",
    position: player.position as Player["position"],
    averageRank: player.averageRank,
    standardDeviation: player.standardDeviation,
  } as Player;
}

function normalizeOpponents(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const opponents: Record<string, string> = {};
  for (const [team, opponent] of Object.entries(value)) {
    if (typeof opponent !== "string") continue;
    const normalizedTeam = normalizeAdpTeam(team);
    const normalizedOpponent = normalizeAdpTeam(opponent);
    if (!normalizedTeam || !normalizedOpponent || normalizedTeam === normalizedOpponent) continue;
    opponents[normalizedTeam] = normalizedOpponent;
  }
  return opponents;
}

export function normalizeBestBallSnapshot(value: unknown): BestBallSnapshot {
  if (!value || typeof value !== "object") {
    throw new Error("Best ball rankings snapshot is invalid.");
  }

  const snapshot = value as Partial<BestBallSnapshot>;
  const rankingSource = normalizeSource(snapshot.rankingSource);
  const players = Array.isArray(snapshot.players)
    ? snapshot.players.map(normalizePlayer).filter((player): player is Player => player !== null)
    : [];

  if (
    snapshot.schemaVersion !== BEST_BALL_SNAPSHOT_SCHEMA_VERSION ||
    !isFiniteNumber(snapshot.season) ||
    typeof snapshot.generatedAt !== "string" ||
    Number.isNaN(Date.parse(snapshot.generatedAt)) ||
    !rankingSource ||
    players.length === 0
  ) {
    throw new Error("Best ball rankings snapshot is incomplete.");
  }

  return {
    schemaVersion: BEST_BALL_SNAPSHOT_SCHEMA_VERSION,
    season: Math.floor(snapshot.season),
    generatedAt: new Date(snapshot.generatedAt).toISOString(),
    players,
    rankingSource,
    superflexSource: normalizeSource(snapshot.superflexSource),
    adpSource: normalizeSource(snapshot.adpSource),
    scheduleSource: normalizeSource(snapshot.scheduleSource),
    week17Opponents: normalizeOpponents(snapshot.week17Opponents),
  };
}
