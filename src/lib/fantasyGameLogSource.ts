import { parseCsv } from "@/lib/nflData";
import type { ScoringFormat } from "@/types";

/**
 * Build-time reader for per-game fantasy scoring from nflverse's weekly player
 * stats release. The consensus board is a set of forward-looking ranks with no
 * scoring history attached, so the drawer's points-per-game panel needs its own
 * upstream. This module fetches it, keeps regular-season games only, and
 * reduces each player to the four figures the panel shows.
 *
 * The same nflverse release already backs the NFL dashboard
 * (`src/lib/nflData.ts`), and the CSV parser is shared with it.
 */

/** Weekly (not season-total) player stats, one row per player per game. */
const WEEKLY_STATS_URL_TEMPLATE =
  "https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_{season}.csv";

export const FANTASY_GAME_LOG_PROVIDER = "nflverse";
export const FANTASY_GAME_LOG_PROVIDER_URL =
  "https://github.com/nflverse/nflverse-data/releases/tag/stats_player";

/**
 * Games a player needs before the panel will show a spread. Below this, low
 * and high are two readings of a nearly empty sample and the meter would draw
 * a confident-looking range across noise.
 */
export const MIN_GAME_LOG_GAMES = 4;

/** Positions the redraft board ranks and this panel can describe. */
const SCORED_POSITIONS = new Set(["QB", "RB", "WR", "TE"]);

export interface FantasyGameLogEntry {
  name: string;
  team: string;
  position: string;
  /** Regular-season games with a recorded stat line. */
  games: number;
  low: number;
  median: number;
  average: number;
  high: number;
}

/**
 * Carries `status` and `headers` so `scripts/fetchRetry.ts` can tell a
 * transient 5xx from a 404. A 404 here is routine rather than broken: the
 * current season's file does not exist until that season kicks off.
 */
export class FantasyGameLogFetchError extends Error {
  readonly status: number;
  readonly headers: Headers;

  constructor(message: string, status: number, headers: Headers) {
    super(message);
    this.name = "FantasyGameLogFetchError";
    this.status = status;
    this.headers = headers;
  }
}

export interface FantasyGameLogBoard {
  entries: FantasyGameLogEntry[];
  season: number;
  seasonType: "REG";
  sourceUrl: string;
  /** Latest week present in the source, so a mid-season pull discloses its reach. */
  throughWeek: number | null;
}

function buildWeeklyStatsUrl(season: number): string {
  return WEEKLY_STATS_URL_TEMPLATE.replace("{season}", String(season));
}

function parseNumeric(value: string | undefined): number | null {
  if (value === undefined || value === "" || value === "NA") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Points for one game under one scoring format.
 *
 * nflverse publishes standard and full-PPR columns. Half PPR is exactly their
 * midpoint, because the two formats differ only by one point per reception, so
 * it is derived rather than guessed.
 */
export function gamePointsForFormat(
  standard: number | null,
  ppr: number | null,
  scoringFormat: ScoringFormat
): number | null {
  if (scoringFormat === "STANDARD") {
    return standard;
  }
  if (scoringFormat === "PPR") {
    return ppr;
  }
  if (standard === null || ppr === null) {
    return null;
  }
  return (standard + ppr) / 2;
}

function median(sortedAscending: number[]): number {
  const count = sortedAscending.length;
  if (count === 0) {
    return 0;
  }
  const middle = Math.floor(count / 2);
  return count % 2 === 1
    ? sortedAscending[middle]
    : (sortedAscending[middle - 1] + sortedAscending[middle]) / 2;
}

function round1(value: number): number {
  return Number(value.toFixed(1));
}

interface PlayerAccumulator {
  name: string;
  position: string;
  /** Team from the latest week seen, so an in-season trade reports the current club. */
  team: string;
  latestWeek: number;
  points: number[];
}

/**
 * Reduces parsed weekly rows to one entry per player for one scoring format.
 * Split out from the fetch so it can be tested without network access.
 */
export function summarizeWeeklyRows(
  rows: Record<string, string>[],
  scoringFormat: ScoringFormat,
  minGames: number = MIN_GAME_LOG_GAMES
): { entries: FantasyGameLogEntry[]; throughWeek: number | null } {
  const byPlayer = new Map<string, PlayerAccumulator>();
  let throughWeek: number | null = null;

  for (const row of rows) {
    if (row.season_type !== "REG") {
      continue;
    }
    const position = (row.position ?? "").toUpperCase();
    if (!SCORED_POSITIONS.has(position)) {
      continue;
    }
    const playerId = row.player_id ?? "";
    const name = row.player_display_name ?? "";
    if (!playerId || !name) {
      continue;
    }

    const points = gamePointsForFormat(
      parseNumeric(row.fantasy_points),
      parseNumeric(row.fantasy_points_ppr),
      scoringFormat
    );
    if (points === null) {
      continue;
    }

    const week = parseNumeric(row.week) ?? 0;
    if (throughWeek === null || week > throughWeek) {
      throughWeek = week;
    }

    const existing = byPlayer.get(playerId);
    if (existing) {
      existing.points.push(points);
      if (week >= existing.latestWeek) {
        existing.latestWeek = week;
        existing.team = row.team ?? existing.team;
      }
      continue;
    }
    byPlayer.set(playerId, {
      name,
      position,
      team: row.team ?? "",
      latestWeek: week,
      points: [points],
    });
  }

  const entries: FantasyGameLogEntry[] = [];
  for (const player of byPlayer.values()) {
    if (player.points.length < minGames) {
      continue;
    }
    const sorted = [...player.points].sort((a, b) => a - b);
    const total = sorted.reduce((sum, value) => sum + value, 0);
    entries.push({
      name: player.name,
      team: player.team,
      position: player.position,
      games: sorted.length,
      low: round1(sorted[0]),
      median: round1(median(sorted)),
      average: round1(total / sorted.length),
      high: round1(sorted[sorted.length - 1]),
    });
  }

  entries.sort((a, b) => b.average - a.average);
  return { entries, throughWeek: throughWeek === null ? null : Math.round(throughWeek) };
}

/**
 * Parsed rows per season, so building all three scoring formats pulls the
 * ~8 MB release once instead of three times. Build-time only, and the process
 * is short-lived, so there is nothing to invalidate.
 */
const rowCacheBySeason = new Map<number, Promise<Record<string, string>[]>>();

async function loadWeeklyRows(
  season: number,
  fetchImpl: typeof fetch
): Promise<Record<string, string>[]> {
  const cached = rowCacheBySeason.get(season);
  if (cached) {
    return cached;
  }

  const pending = (async () => {
    const sourceUrl = buildWeeklyStatsUrl(season);
    const response = await fetchImpl(sourceUrl, {
      headers: { Accept: "text/csv,text/plain;q=0.9,*/*;q=0.8" },
    });
    if (!response.ok) {
      throw new FantasyGameLogFetchError(
        `nflverse weekly stats ${season} responded ${response.status}`,
        response.status,
        response.headers
      );
    }
    return parseCsv(await response.text());
  })();

  // Cache the promise, not the result, so concurrent callers share one request.
  // A rejection is evicted so a later attempt can retry rather than replay it.
  rowCacheBySeason.set(season, pending);
  pending.catch(() => rowCacheBySeason.delete(season));
  return pending;
}

export async function fetchFantasyGameLogBoard(
  scoringFormat: ScoringFormat,
  season: number,
  fetchImpl: typeof fetch = fetch
): Promise<FantasyGameLogBoard> {
  const sourceUrl = buildWeeklyStatsUrl(season);
  const rows = await loadWeeklyRows(season, fetchImpl);
  const { entries, throughWeek } = summarizeWeeklyRows(rows, scoringFormat);

  return { entries, season, seasonType: "REG", sourceUrl, throughWeek };
}
