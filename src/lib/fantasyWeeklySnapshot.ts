import { FANTASY_SCORING_LABELS, type FantasyRouteScoring } from "@/lib/fantasy";
import type { Position } from "@/types";

/**
 * The in-season weekly board. Every other board on /fantasy-football is a
 * draft board and stops describing anything real once the season opens, so
 * this is the one snapshot that keeps the surface useful after kickoff.
 *
 * FantasyPros publishes no single overall board in season, so each scoring
 * format carries two boards with independent rank spaces: FLEX, which is the
 * RB/WR/TE start-or-sit board, and QB. They are kept apart deliberately.
 * A flex rank of 12 and a quarterback rank of 12 are not comparable, and
 * merging them would manufacture a cross-position ordering the source never
 * published.
 */
export const FANTASY_WEEKLY_SNAPSHOT_SCHEMA_VERSION = 1;

/** Ownership at or above this reads as rostered everywhere, so it is not a waiver add. */
export const FANTASY_WEEKLY_WIDELY_ROSTERED_PERCENT = 60;

/** A waiver candidate needs at least this rank-versus-rostered gap to be listed. */
export const FANTASY_WEEKLY_MIN_WAIVER_GAP = 20;

/**
 * How deep each board stays startable in a 12-team league, which is what makes
 * a low-owned player a waiver target rather than merely an obscure one.
 *
 * Twelve teams starting roughly two backs, two receivers, a tight end and a
 * flex use about 84 flex-eligible starters a week, so 120 leaves real bench
 * and bye-week room without reaching players nobody would start. Quarterbacks
 * are one per team, so 24 is the same idea with one spare round.
 *
 * Without this the widest gaps are all deep bench players: the largest gap in
 * the first board built here belonged to a receiver ranked 142nd of 284 owned
 * by 2.9 percent, which is a real discrepancy and not a start.
 */
export const FANTASY_WEEKLY_STARTABLE_DEPTH = { flex: 120, quarterback: 24 } as const;

export interface FantasyWeeklyBoardSource {
  provider: string;
  url: string;
  asOf: string;
  expertCount: number;
  playerCount: number;
}

export interface FantasyWeeklyPlayer {
  id: string;
  name: string;
  team: string;
  position: Position;
  /** Consensus rank within this board only. Flex and quarterback ranks do not compare. */
  rank: number;
  positionRank?: number;
  standardDeviation?: number;
  minRank?: number;
  maxRank?: number;
  /** As FantasyPros labels it, for example "vs. TB" or "at NYG". */
  opponent?: string;
  /** Average percentage of leagues rostering the player, 0 to 100. */
  ownership?: number;
}

export interface FantasyWeeklyBoard {
  flex: FantasyWeeklyPlayer[];
  quarterbacks: FantasyWeeklyPlayer[];
  flexSource: FantasyWeeklyBoardSource;
  quarterbackSource: FantasyWeeklyBoardSource;
}

export interface FantasyWeeklySnapshot {
  schemaVersion: number;
  season: number;
  week: number;
  generatedAt: string;
  boards: Record<FantasyRouteScoring, FantasyWeeklyBoard>;
}

export interface FantasyWeeklyWaiverCandidate {
  player: FantasyWeeklyPlayer;
  board: "flex" | "quarterback";
  /** 0 to 100, where 100 is the top of the board. */
  rankPercentile: number;
  ownership: number;
  /** rankPercentile minus ownership. Higher means more useful than widely held. */
  gap: number;
}

function asPositiveInteger(value: unknown, label: string): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Weekly fantasy snapshot has an invalid ${label}.`);
  }
  return parsed;
}

function normalizePlayer(raw: unknown, label: string): FantasyWeeklyPlayer {
  if (typeof raw !== "object" || raw === null) {
    throw new Error(`Weekly fantasy snapshot ${label} is not an object.`);
  }
  const record = raw as Record<string, unknown>;
  const id = typeof record.id === "string" ? record.id.trim() : "";
  const name = typeof record.name === "string" ? record.name.trim() : "";
  const rank = typeof record.rank === "number" ? record.rank : Number(record.rank);
  if (!id || !name || !Number.isFinite(rank) || rank <= 0) {
    throw new Error(`Weekly fantasy snapshot ${label} is missing an id, name, or rank.`);
  }

  const optionalNumber = (key: string): number | undefined => {
    const value = record[key];
    if (value === undefined || value === null) return undefined;
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const ownership = optionalNumber("ownership");
  const opponent = typeof record.opponent === "string" ? record.opponent.trim() : "";

  return {
    id,
    name,
    team: typeof record.team === "string" && record.team.trim() ? record.team.trim() : "FA",
    position: String(record.position ?? "").toUpperCase() as Position,
    rank,
    ...(optionalNumber("positionRank") !== undefined
      ? { positionRank: optionalNumber("positionRank") }
      : {}),
    ...(optionalNumber("standardDeviation") !== undefined
      ? { standardDeviation: optionalNumber("standardDeviation") }
      : {}),
    ...(optionalNumber("minRank") !== undefined ? { minRank: optionalNumber("minRank") } : {}),
    ...(optionalNumber("maxRank") !== undefined ? { maxRank: optionalNumber("maxRank") } : {}),
    ...(opponent ? { opponent } : {}),
    ...(ownership !== undefined && ownership >= 0 && ownership <= 100 ? { ownership } : {}),
  };
}

function normalizeSource(raw: unknown, label: string): FantasyWeeklyBoardSource {
  if (typeof raw !== "object" || raw === null) {
    throw new Error(`Weekly fantasy snapshot ${label} source is missing.`);
  }
  const record = raw as Record<string, unknown>;
  const url = typeof record.url === "string" ? record.url.trim() : "";
  const asOf = typeof record.asOf === "string" ? record.asOf.trim() : "";
  if (!url || !asOf || Number.isNaN(new Date(asOf).getTime())) {
    throw new Error(`Weekly fantasy snapshot ${label} source has no usable url or asOf.`);
  }
  return {
    provider:
      typeof record.provider === "string" && record.provider.trim()
        ? record.provider.trim()
        : "FantasyPros",
    url,
    asOf,
    expertCount: Number(record.expertCount) || 0,
    playerCount: Number(record.playerCount) || 0,
  };
}

export function normalizeFantasyWeeklySnapshot(raw: unknown): FantasyWeeklySnapshot {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Weekly fantasy snapshot is incomplete.");
  }
  const record = raw as Record<string, unknown>;
  const boardsRaw = record.boards;
  if (typeof boardsRaw !== "object" || boardsRaw === null) {
    throw new Error("Weekly fantasy snapshot is missing its boards.");
  }
  const boardRecord = boardsRaw as Record<string, unknown>;

  const week = Number(record.week);
  if (!Number.isInteger(week) || week < 1 || week > 18) {
    throw new Error("Weekly fantasy snapshot has an invalid week.");
  }

  const boards = {} as Record<FantasyRouteScoring, FantasyWeeklyBoard>;
  for (const scoring of Object.keys(FANTASY_SCORING_LABELS) as FantasyRouteScoring[]) {
    const board = boardRecord[scoring];
    if (typeof board !== "object" || board === null) {
      throw new Error(`Weekly fantasy snapshot is missing the ${scoring} board.`);
    }
    const boardFields = board as Record<string, unknown>;
    const flex = Array.isArray(boardFields.flex) ? boardFields.flex : [];
    const quarterbacks = Array.isArray(boardFields.quarterbacks)
      ? boardFields.quarterbacks
      : [];
    if (flex.length === 0 || quarterbacks.length === 0) {
      throw new Error(`Weekly fantasy snapshot ${scoring} board has no players.`);
    }
    boards[scoring] = {
      flex: flex.map((player, index) => normalizePlayer(player, `${scoring}.flex[${index}]`)),
      quarterbacks: quarterbacks.map((player, index) =>
        normalizePlayer(player, `${scoring}.quarterbacks[${index}]`)
      ),
      flexSource: normalizeSource(boardFields.flexSource, `${scoring}.flex`),
      quarterbackSource: normalizeSource(boardFields.quarterbackSource, `${scoring}.quarterback`),
    };
  }

  return {
    schemaVersion: asPositiveInteger(record.schemaVersion, "schemaVersion"),
    season: asPositiveInteger(record.season, "season"),
    week,
    generatedAt:
      typeof record.generatedAt === "string" && !Number.isNaN(new Date(record.generatedAt).getTime())
        ? record.generatedAt
        : new Date(0).toISOString(),
    boards,
  };
}

/**
 * Ranks a board's players by how much more useful the experts think they are
 * than the rostering rate implies. The gap is a percentile minus a percentage,
 * both already published, so a reader can reproduce any row from the two
 * numbers shown beside it. Nothing here models a bid, a projection, or a
 * points total, because the source carries none of those.
 */
export function getFantasyWeeklyWaiverCandidates(
  board: FantasyWeeklyBoard,
  limit = 20
): FantasyWeeklyWaiverCandidate[] {
  const candidates: FantasyWeeklyWaiverCandidate[] = [];

  const scan = (players: FantasyWeeklyPlayer[], label: "flex" | "quarterback") => {
    const total = players.length;
    if (total === 0) return;
    const startableDepth = FANTASY_WEEKLY_STARTABLE_DEPTH[label];
    players.forEach((player, index) => {
      if (index >= startableDepth) return;
      const ownership = player.ownership;
      if (ownership === undefined || ownership >= FANTASY_WEEKLY_WIDELY_ROSTERED_PERCENT) return;
      const rankPercentile = ((total - index) / total) * 100;
      const gap = rankPercentile - ownership;
      if (gap < FANTASY_WEEKLY_MIN_WAIVER_GAP) return;
      candidates.push({
        player,
        board: label,
        rankPercentile: Math.round(rankPercentile * 10) / 10,
        ownership,
        gap: Math.round(gap * 10) / 10,
      });
    });
  };

  scan(board.flex, "flex");
  scan(board.quarterbacks, "quarterback");

  return candidates.sort((a, b) => b.gap - a.gap).slice(0, limit);
}
