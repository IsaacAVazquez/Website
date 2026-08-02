import type { Player } from "@/types";
import { normalizeAdpTeam } from "@/lib/fantasyAdpMatcher";

export const BEST_BALL_SNAPSHOT_SCHEMA_VERSION = 2;

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
