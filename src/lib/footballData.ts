import { HttpStatusError } from "@/lib/utils";
/**
 * Shared football-data.org v4 wire types, request constants, and the paced
 * fetch both leagues use.
 *
 * The Premier League and La Liga dashboards read the same API with different
 * competition codes, so the response schema lives here rather than being
 * declared twice and drifting. Every field is optional because the provider
 * omits sections depending on plan tier and season phase.
 */

export const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";
export const REQUEST_TIMEOUT_MS = 10_000;
export const SUMMARY_REVALIDATE_SECONDS = 300;
export const TEAM_REVALIDATE_SECONDS = 300;
export const RECENT_FIXTURE_LIMIT = 8;
export const UPCOMING_FIXTURE_LIMIT = 8;
export const TEAM_FIXTURE_LIMIT = 5;
// The provider ignores `limit` on competition matches, so one request returns
// every FINISHED match and feeds both the recent list and goals per matchday.
export const SEASON_FIXTURES_REVALIDATE_SECONDS = 300;

export interface FootballDataArea {
  name?: string | null;
}

export interface FootballDataTeam {
  id?: number | null;
  name?: string | null;
  shortName?: string | null;
  tla?: string | null;
  crest?: string | null;
  crestUrl?: string | null;
  venue?: string | null;
  founded?: number | null;
  clubColors?: string | null;
  website?: string | null;
  address?: string | null;
  // Only present on the single-team detail endpoint (`/teams/{id}`), not on
  // list endpoints or the team objects embedded in matches/scorers/standings.
  coach?: {
    name?: string | null;
  } | null;
}

export interface FootballDataSeason {
  startDate?: string | null;
  endDate?: string | null;
  currentMatchday?: number | null;
  winner?: {
    name?: string | null;
  } | null;
}

export interface FootballDataCompetition {
  code?: string | null;
  name?: string | null;
  emblem?: string | null;
  area?: FootballDataArea | null;
}

export interface FootballDataStandingsGroup {
  type?: string | null;
  table?: FootballDataStandingEntry[] | null;
}

export interface FootballDataStandingEntry {
  position?: number | null;
  playedGames?: number | null;
  won?: number | null;
  draw?: number | null;
  lost?: number | null;
  points?: number | null;
  goalsFor?: number | null;
  goalsAgainst?: number | null;
  goalDifference?: number | null;
  team?: FootballDataTeam | null;
}

export interface FootballDataCompetitionStandingsResponse {
  area?: FootballDataArea | null;
  competition?: FootballDataCompetition | null;
  season?: FootballDataSeason | null;
  standings?: FootballDataStandingsGroup[] | null;
}

export interface FootballDataScoreTime {
  home?: number | null;
  away?: number | null;
}

export interface FootballDataMatch {
  id?: number | null;
  utcDate?: string | null;
  status?: string | null;
  matchday?: number | null;
  stage?: string | null;
  homeTeam?: FootballDataTeam | null;
  awayTeam?: FootballDataTeam | null;
  score?: {
    winner?: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    fullTime?: FootballDataScoreTime | null;
  } | null;
}

export interface FootballDataMatchesResponse {
  matches?: FootballDataMatch[] | null;
}

export interface FootballDataCompetitionTeamsResponse {
  teams?: FootballDataTeam[] | null;
}

export interface FootballDataScorerEntry {
  player?: { name?: string | null } | null;
  team?: FootballDataTeam | null;
  goals?: number | null;
  assists?: number | null;
  playedMatches?: number | null;
}

export interface FootballDataScorersResponse {
  scorers?: FootballDataScorerEntry[] | null;
}

// Both leagues have 20 clubs. A shorter table is a partial response.
const FULL_TABLE_SIZE = 20;

// The free tier allows 10 requests a minute on one token that both leagues
// share. A run stops at 8 so a request made anywhere else does not push it over.
const RATE_WINDOW_MS = 61_000;
const MAX_REQUESTS_PER_WINDOW = 8;
const RATE_LIMIT_RESERVE = 2;
const MAX_RATE_LIMIT_WAIT_MS = 70_000;

let requestTimes: number[] = [];
let blockedUntil = 0;

export function resetFootballDataPacingForTests(): void {
  requestTimes = [];
  blockedUntil = 0;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function readHeaderNumber(headers: Headers, name: string): number | null {
  const raw = headers.get(name)?.trim();
  const value = raw ? Number(raw) : NaN;
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function blockUntilReset(headers: Headers): void {
  const seconds =
    readHeaderNumber(headers, "x-requestcounter-reset") ??
    readHeaderNumber(headers, "retry-after") ??
    60;
  const waitMs = Math.min((seconds + 1) * 1000, MAX_RATE_LIMIT_WAIT_MS);
  blockedUntil = Math.max(blockedUntil, Date.now() + waitMs);
}

async function waitForRequestSlot(): Promise<void> {
  for (;;) {
    const now = Date.now();
    requestTimes = requestTimes.filter((time) => now - time < RATE_WINDOW_MS);
    const windowWaitMs =
      requestTimes.length >= MAX_REQUESTS_PER_WINDOW ? requestTimes[0] + RATE_WINDOW_MS - now : 0;
    const waitMs = Math.max(windowWaitMs, blockedUntil - now);
    if (waitMs <= 0) {
      requestTimes.push(now);
      return;
    }
    await wait(waitMs);
  }
}

async function fetchFootballDataJsonOnce<T>(
  league: string,
  path: string,
  revalidateSeconds: number
): Promise<T> {
  const token = process.env.FOOTBALL_DATA_API_TOKEN?.trim();
  if (!token) {
    throw new HttpStatusError(`${league} data source is not configured.`, 503);
  }

  await waitForRequestSlot();
  // AbortSignal.timeout fires its own per-attempt timeout cleanly without us
  // having to manage a setTimeout / clearTimeout pair around every call.
  const response = await fetch(`${FOOTBALL_DATA_BASE_URL}${path}`, {
    headers: {
      "X-Auth-Token": token,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    next: {
      revalidate: revalidateSeconds,
    },
  });

  // The counter covers every run on the token, so it is the only view of what
  // another run has already used in this minute.
  const available = readHeaderNumber(response.headers, "x-requests-available-minute");
  if (response.status === 429 || (available !== null && available <= RATE_LIMIT_RESERVE)) {
    blockUntilReset(response.headers);
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new HttpStatusError(
        `${league} data provider rejected the configured API token.`,
        503
      );
    }

    if (response.status === 404) {
      throw new HttpStatusError(`Requested ${league} resource was not found.`, 404);
    }

    throw new HttpStatusError(
      `Unable to load ${league} data from the upstream provider (HTTP ${response.status}).`,
      response.status >= 500 ? 503 : 502
    );
  }

  return (await response.json()) as T;
}

/**
 * Wraps the per-attempt fetch in a 3-attempt retry with a short backoff. A 404
 * is not retried. A 429 is retried once the window the API reported has reset,
 * because the next attempt waits for its slot like any other request.
 * Mirrors the pattern in src/lib/nflData.ts (`fetchTextOnce` + `fetchText`).
 */
export async function fetchFootballDataJson<T>(
  league: string,
  path: string,
  revalidateSeconds: number
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await fetchFootballDataJsonOnce<T>(league, path, revalidateSeconds);
    } catch (error) {
      lastError = error;
      // Treat AbortError / TimeoutError as a network failure for retry purposes.
      if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
        if (attempt < 2) {
          await wait(1000 * (attempt + 1));
          continue;
        }
        throw new HttpStatusError(`${league} data provider timed out.`, 504);
      }
      const status = (error as HttpStatusError).status;
      if (typeof status === "number" && status >= 400 && status < 500) throw error;
      if (attempt < 2) {
        await wait(1000 * (attempt + 1));
      }
    }
  }
  throw lastError;
}

/**
 * Drops the snapshots of clubs that left the league. A table short of the full
 * 20 prunes nothing, so a partial response cannot delete a club.
 */
export function pruneToTable<T>(
  snapshots: Record<string, T>,
  tableIds: readonly string[]
): Record<string, T> {
  if (tableIds.length !== FULL_TABLE_SIZE) return snapshots;
  return Object.fromEntries(Object.entries(snapshots).filter(([id]) => tableIds.includes(id)));
}


/** "2025/26" for a split season, or "2025" when it starts and ends in one year. */
export function buildSeasonLabel(startDate?: string | null, endDate?: string | null): string {
  const startYear = startDate ? new Date(startDate).getUTCFullYear() : NaN;
  const endYear = endDate ? new Date(endDate).getUTCFullYear() : NaN;

  if (Number.isFinite(startYear) && Number.isFinite(endYear)) {
    if (startYear === endYear) {
      return `${startYear}`;
    }

    return `${startYear}/${String(endYear).slice(-2)}`;
  }

  return "Current season";
}
