import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type {
  PremierLeagueSnapshot,
  PremierLeagueCompetitionMeta,
  PremierLeagueFixture,
  PremierLeagueFixtureTeam,
  PremierLeagueFormSummary,
  PremierLeagueMatchdayGoals,
  PremierLeagueStandingRow,
  PremierLeagueSummary,
  PremierLeagueTeamOption,
  PremierLeagueTeamProfile,
  PremierLeagueTeamSnapshot,
} from "@/types/premier-league";
import { getPremierLeagueClubAccentColor } from "@/data/clubColors";

const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";
const PREMIER_LEAGUE_CODE = "PL";
const REQUEST_TIMEOUT_MS = 10_000;
const SUMMARY_REVALIDATE_SECONDS = 300;
const TEAM_REVALIDATE_SECONDS = 300;
const RECENT_FIXTURE_LIMIT = 8;
const UPCOMING_FIXTURE_LIMIT = 8;
const TEAM_FIXTURE_LIMIT = 5;
// Full-season goals-per-matchday aggregation reads every FINISHED match, not
// just the most recent ones — this call intentionally omits `limit`.
const SEASON_FIXTURES_REVALIDATE_SECONDS = 300;

interface FootballDataArea {
  name?: string | null;
}

interface FootballDataTeam {
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

interface FootballDataSeason {
  startDate?: string | null;
  endDate?: string | null;
  currentMatchday?: number | null;
  winner?: {
    name?: string | null;
  } | null;
}

interface FootballDataCompetition {
  code?: string | null;
  name?: string | null;
  emblem?: string | null;
  area?: FootballDataArea | null;
}

interface FootballDataStandingsGroup {
  type?: string | null;
  table?: FootballDataStandingEntry[] | null;
}

interface FootballDataStandingEntry {
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

interface FootballDataCompetitionStandingsResponse {
  area?: FootballDataArea | null;
  competition?: FootballDataCompetition | null;
  season?: FootballDataSeason | null;
  standings?: FootballDataStandingsGroup[] | null;
}

interface FootballDataScoreTime {
  home?: number | null;
  away?: number | null;
}

interface FootballDataMatch {
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

interface FootballDataMatchesResponse {
  matches?: FootballDataMatch[] | null;
}

interface FootballDataCompetitionTeamsResponse {
  teams?: FootballDataTeam[] | null;
}

interface FootballDataScorerEntry {
  player?: { name?: string | null } | null;
  team?: FootballDataTeam | null;
  goals?: number | null;
  assists?: number | null;
  playedMatches?: number | null;
}

interface FootballDataScorersResponse {
  scorers?: FootballDataScorerEntry[] | null;
}

interface FootballDataError extends Error {
  status: number;
}

function createPremierLeagueDataError(message: string, status: number): FootballDataError {
  return Object.assign(new Error(message), { status });
}

function getFootballDataToken(): string {
  const token = process.env.FOOTBALL_DATA_API_TOKEN?.trim();
  if (!token) {
    throw createPremierLeagueDataError(
      "Premier League data source is not configured.",
      503
    );
  }

  return token;
}

function buildSeasonLabel(startDate?: string | null, endDate?: string | null): string {
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

function isPositiveIntegerString(value: string): boolean {
  return /^[1-9]\d*$/.test(value);
}

/**
 * Total games played across a standings table. A completed or in-progress
 * season is > 0; a freshly rolled-over season that hasn't kicked off yet is 0
 * (football-data.org returns a zeroed 20-row placeholder in that window).
 */
export function sumPlayedGames(
  standings: readonly Pick<PremierLeagueStandingRow, "playedGames">[]
): number {
  return standings.reduce((total, row) => total + (row.playedGames ?? 0), 0);
}

function seasonStartYear(startDate?: string | null): number | null {
  if (!startDate) return null;
  const year = new Date(startDate).getUTCFullYear();
  return Number.isFinite(year) ? year : null;
}

/**
 * True when the competition's current season hasn't actually started, so the
 * live endpoints return a placeholder. football-data.org rolls the season
 * pointer weeks ahead of kickoff: the Premier League table comes back zeroed,
 * and (as with La Liga) the season's start date is still in the future. Either
 * signal means we should pin to the completed prior season instead.
 */
function seasonNotStarted(
  season: FootballDataSeason | null | undefined,
  standings: readonly Pick<PremierLeagueStandingRow, "playedGames">[],
  now: Date = new Date()
): boolean {
  if (standings.length > 0 && sumPlayedGames(standings) === 0) return true;
  const startMs = season?.startDate ? new Date(season.startDate).getTime() : NaN;
  return Number.isFinite(startMs) && startMs > now.getTime();
}

function normalizeFixtureTeam(rawTeam: FootballDataTeam | null | undefined): PremierLeagueFixtureTeam | null {
  const id = rawTeam?.id;
  if (typeof id !== "number" || !Number.isFinite(id)) {
    return null;
  }

  return {
    id: String(id),
    name: rawTeam?.name?.trim() || `Club ${id}`,
    shortName: rawTeam?.shortName?.trim() || rawTeam?.name?.trim() || `Club ${id}`,
    tla: rawTeam?.tla?.trim() || null,
    crest: rawTeam?.crest?.trim() || rawTeam?.crestUrl?.trim() || null,
  };
}

function normalizeTeamOption(rawTeam: FootballDataTeam | null | undefined): PremierLeagueTeamOption | null {
  const team = normalizeFixtureTeam(rawTeam);
  if (!team) {
    return null;
  }

  return {
    ...team,
    venue: rawTeam?.venue?.trim() || null,
    accentColor: getPremierLeagueClubAccentColor(team.tla),
  };
}

function normalizeTeamProfile(rawTeam: FootballDataTeam | null | undefined): PremierLeagueTeamProfile | null {
  const team = normalizeTeamOption(rawTeam);
  if (!team) {
    return null;
  }

  return {
    ...team,
    founded: typeof rawTeam?.founded === "number" ? rawTeam.founded : null,
    clubColors: rawTeam?.clubColors?.trim() || null,
    website: rawTeam?.website?.trim() || null,
    address: rawTeam?.address?.trim() || null,
    // football-data.org's team-detail response doesn't always include a coach
    // (varies by tier/team); skip silently (null) when it's absent.
    manager: rawTeam?.coach?.name?.trim() || null,
  };
}

function normalizeStandingRow(rawRow: FootballDataStandingEntry | null | undefined): PremierLeagueStandingRow | null {
  const team = normalizeTeamOption(rawRow?.team);
  if (!team || typeof rawRow?.position !== "number") {
    return null;
  }

  return {
    position: rawRow.position,
    playedGames: rawRow.playedGames ?? 0,
    won: rawRow.won ?? 0,
    draw: rawRow.draw ?? 0,
    lost: rawRow.lost ?? 0,
    points: rawRow.points ?? 0,
    goalsFor: rawRow.goalsFor ?? 0,
    goalsAgainst: rawRow.goalsAgainst ?? 0,
    goalDifference: rawRow.goalDifference ?? 0,
    team,
  };
}

function normalizeFixture(rawMatch: FootballDataMatch | null | undefined): PremierLeagueFixture | null {
  const matchId = rawMatch?.id;
  const utcDate = rawMatch?.utcDate?.trim();
  const homeTeam = normalizeFixtureTeam(rawMatch?.homeTeam);
  const awayTeam = normalizeFixtureTeam(rawMatch?.awayTeam);

  if (
    typeof matchId !== "number" ||
    !utcDate ||
    !homeTeam ||
    !awayTeam
  ) {
    return null;
  }

  return {
    id: String(matchId),
    utcDate,
    status: rawMatch?.status?.trim() || "UNKNOWN",
    matchday: rawMatch?.matchday ?? null,
    stage: rawMatch?.stage?.trim() || null,
    homeTeam,
    awayTeam,
    score: {
      winner: rawMatch?.score?.winner ?? null,
      home: rawMatch?.score?.fullTime?.home ?? null,
      away: rawMatch?.score?.fullTime?.away ?? null,
    },
  };
}

function normalizeScorer(
  entry: FootballDataScorerEntry | null | undefined,
  rank: number
): import("@/types/premier-league").PremierLeagueScorer | null {
  const name = entry?.player?.name?.trim();
  const teamId = entry?.team?.id;
  const teamName = entry?.team?.shortName?.trim() || entry?.team?.name?.trim();
  if (!name || typeof teamId !== "number" || !teamName) return null;
  return {
    rank,
    name,
    teamId: String(teamId),
    teamName,
    goals: entry?.goals ?? 0,
    assists: entry?.assists ?? 0,
    appearances: entry?.playedMatches ?? 0,
  };
}

/**
 * Aggregates a season's worth of FINISHED matches into a matchday → total
 * league goals series. Operates on the raw upstream match shape (not the
 * normalized `PremierLeagueFixture`) since only `matchday` and the final score
 * are needed. Matches missing either are skipped rather than dropping the
 * whole series.
 */
function buildGoalsPerMatchday(matches: FootballDataMatch[]): PremierLeagueMatchdayGoals[] {
  const totals = new Map<number, number>();

  for (const match of matches) {
    const matchday = match?.matchday;
    const home = match?.score?.fullTime?.home;
    const away = match?.score?.fullTime?.away;

    if (
      typeof matchday !== "number" ||
      !Number.isFinite(matchday) ||
      typeof home !== "number" ||
      typeof away !== "number"
    ) {
      continue;
    }

    totals.set(matchday, (totals.get(matchday) ?? 0) + home + away);
  }

  return Array.from(totals.entries())
    .map(([matchday, totalGoals]) => ({ matchday, totalGoals }))
    .sort((a, b) => a.matchday - b.matchday);
}

function sortFixturesDescending(left: PremierLeagueFixture, right: PremierLeagueFixture) {
  return new Date(right.utcDate).getTime() - new Date(left.utcDate).getTime();
}

function sortFixturesAscending(left: PremierLeagueFixture, right: PremierLeagueFixture) {
  return new Date(left.utcDate).getTime() - new Date(right.utcDate).getTime();
}

function createDefaultFormSummary(): PremierLeagueFormSummary {
  return {
    sequence: [],
    wins: 0,
    draws: 0,
    losses: 0,
    points: 0,
    goalsFor: 0,
    goalsAgainst: 0,
  };
}

function buildTeamFormSummary(
  teamId: string,
  fixtures: PremierLeagueFixture[]
): PremierLeagueFormSummary {
  return fixtures.reduce<PremierLeagueFormSummary>((summary, fixture) => {
    const isHome = fixture.homeTeam.id === teamId;
    const isAway = fixture.awayTeam.id === teamId;

    if (!isHome && !isAway) {
      return summary;
    }

    const goalsFor = isHome ? fixture.score.home ?? 0 : fixture.score.away ?? 0;
    const goalsAgainst = isHome ? fixture.score.away ?? 0 : fixture.score.home ?? 0;

    if (fixture.score.winner === "DRAW") {
      summary.sequence.push("D");
      summary.draws += 1;
      summary.points += 1;
    } else if (
      (isHome && fixture.score.winner === "HOME_TEAM") ||
      (isAway && fixture.score.winner === "AWAY_TEAM")
    ) {
      summary.sequence.push("W");
      summary.wins += 1;
      summary.points += 3;
    } else {
      summary.sequence.push("L");
      summary.losses += 1;
    }

    summary.goalsFor += goalsFor;
    summary.goalsAgainst += goalsAgainst;
    return summary;
  }, createDefaultFormSummary());
}

async function fetchFootballDataJsonOnce<T>(
  path: string,
  revalidateSeconds: number
): Promise<T> {
  const token = getFootballDataToken();
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

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw createPremierLeagueDataError(
        "Premier League data provider rejected the configured API token.",
        503
      );
    }

    if (response.status === 404) {
      throw createPremierLeagueDataError(
        "Requested Premier League resource was not found.",
        404
      );
    }

    throw createPremierLeagueDataError(
      "Unable to load Premier League data from the upstream provider.",
      response.status >= 500 ? 503 : 502
    );
  }

  return (await response.json()) as T;
}

/**
 * Wraps the per-attempt fetch in a 3-attempt retry. Backs off on 5xx and on
 * network/timeout errors, but NOT on 4xx (client-side errors won't recover).
 * Mirrors the pattern in src/lib/nflData.ts (`fetchTextOnce` + `fetchText`).
 */
async function fetchFootballDataJson<T>(
  path: string,
  revalidateSeconds: number
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await fetchFootballDataJsonOnce<T>(path, revalidateSeconds);
    } catch (error) {
      lastError = error;
      // Treat AbortError / TimeoutError as a network failure for retry purposes.
      if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        throw createPremierLeagueDataError(
          "Premier League data provider timed out.",
          504
        );
      }
      const status = (error as FootballDataError).status;
      // Don't retry 4xx (auth, not found, malformed) — they won't get better.
      if (typeof status === "number" && status >= 400 && status < 500) throw error;
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

function buildCompetitionMeta(
  standingsResponse: FootballDataCompetitionStandingsResponse
): PremierLeagueCompetitionMeta {
  return {
    code: standingsResponse.competition?.code?.trim() || PREMIER_LEAGUE_CODE,
    name: standingsResponse.competition?.name?.trim() || "Premier League",
    areaName:
      standingsResponse.area?.name?.trim() ||
      standingsResponse.competition?.area?.name?.trim() ||
      null,
    emblem: standingsResponse.competition?.emblem?.trim() || null,
    seasonLabel: buildSeasonLabel(
      standingsResponse.season?.startDate,
      standingsResponse.season?.endDate
    ),
    currentMatchday: standingsResponse.season?.currentMatchday ?? null,
    winner: standingsResponse.season?.winner?.name?.trim() || null,
  };
}

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    searchParams.set(key, String(value));
  }

  return searchParams.toString();
}

export function isValidPremierLeagueTeamId(teamId: string): boolean {
  return isPositiveIntegerString(teamId);
}

export function createEmptyPremierLeagueSummary(): PremierLeagueSummary {
  return {
    competition: null,
    standings: [],
    scorers: [],
    recentFixtures: [],
    upcomingFixtures: [],
    teams: [],
    goalsPerMatchday: [],
    generatedAt: new Date().toISOString(),
  };
}

export function createEmptyPremierLeagueTeamSnapshot(): PremierLeagueTeamSnapshot {
  return {
    team: null,
    recentFixtures: [],
    upcomingFixtures: [],
    form: createDefaultFormSummary(),
    generatedAt: new Date().toISOString(),
  };
}

export async function getPremierLeagueSummary(
  options?: { season?: number }
): Promise<PremierLeagueSummary> {
  // When a season is pinned, thread it onto every competition-scoped request so
  // standings, fixtures, teams, and scorers all describe the same season.
  const seasonParams = options?.season ? { season: options.season } : {};
  const seasonQuery = options?.season
    ? `?${buildQueryString({ season: options.season })}`
    : "";

  const standingsPromise = fetchFootballDataJson<FootballDataCompetitionStandingsResponse>(
    `/competitions/${PREMIER_LEAGUE_CODE}/standings${seasonQuery}`,
    SUMMARY_REVALIDATE_SECONDS
  );
  const recentFixturesPromise = fetchFootballDataJson<FootballDataMatchesResponse>(
    `/competitions/${PREMIER_LEAGUE_CODE}/matches?${buildQueryString({
      status: "FINISHED",
      limit: RECENT_FIXTURE_LIMIT,
      ...seasonParams,
    })}`,
    SUMMARY_REVALIDATE_SECONDS
  );
  const upcomingFixturesPromise = fetchFootballDataJson<FootballDataMatchesResponse>(
    `/competitions/${PREMIER_LEAGUE_CODE}/matches?${buildQueryString({
      status: "SCHEDULED",
      limit: UPCOMING_FIXTURE_LIMIT,
      ...seasonParams,
    })}`,
    SUMMARY_REVALIDATE_SECONDS
  );
  const teamsPromise = fetchFootballDataJson<FootballDataCompetitionTeamsResponse>(
    `/competitions/${PREMIER_LEAGUE_CODE}/teams${seasonQuery}`,
    SUMMARY_REVALIDATE_SECONDS
  );
  const scorersPromise = fetchFootballDataJson<FootballDataScorersResponse>(
    `/competitions/${PREMIER_LEAGUE_CODE}/scorers${seasonQuery}`,
    SUMMARY_REVALIDATE_SECONDS
  );
  // Season-long fixture log for the goals-per-matchday pulse — every FINISHED
  // match, no `limit`, distinct from the 8-most-recent `recentFixturesPromise`.
  const seasonFixturesPromise = fetchFootballDataJson<FootballDataMatchesResponse>(
    `/competitions/${PREMIER_LEAGUE_CODE}/matches?${buildQueryString({
      status: "FINISHED",
      ...seasonParams,
    })}`,
    SEASON_FIXTURES_REVALIDATE_SECONDS
  );

  const [
    standingsResponse,
    recentFixturesResponse,
    upcomingFixturesResponse,
    teamsResponse,
    scorersResponse,
    seasonFixturesResponse,
  ] = await Promise.all([
    standingsPromise,
    recentFixturesPromise,
    upcomingFixturesPromise,
    teamsPromise,
    scorersPromise,
    seasonFixturesPromise,
  ]);

  const standingsGroup =
    standingsResponse.standings?.find((group) => group?.type === "TOTAL") ??
    standingsResponse.standings?.[0] ??
    null;

  const standings = (standingsGroup?.table ?? [])
    .map((row) => normalizeStandingRow(row))
    .filter((row): row is PremierLeagueStandingRow => row !== null);

  // Off-season rollover guard. football-data.org advances the competition
  // pointer to the new season (e.g. 2026/27) weeks before it kicks off and
  // returns a zeroed 20-row table (every club position-ordered on 0 points, 0
  // played) — surfacing that wipes the dashboard. When the standings have rows
  // but zero games played and the caller hasn't already pinned a season,
  // re-fetch pinned to the completed prior season so the page shows a real
  // final table. Re-pins at most once (the recursive call passes a season).
  if (options?.season === undefined && seasonNotStarted(standingsResponse.season, standings)) {
    const currentSeasonStart = seasonStartYear(standingsResponse.season?.startDate);
    if (currentSeasonStart !== null) {
      return getPremierLeagueSummary({ season: currentSeasonStart - 1 });
    }
  }

  const recentFixtures = (recentFixturesResponse.matches ?? [])
    .map((match) => normalizeFixture(match))
    .filter((match): match is PremierLeagueFixture => match !== null)
    .sort(sortFixturesDescending)
    .slice(0, RECENT_FIXTURE_LIMIT);

  const upcomingFixtures = (upcomingFixturesResponse.matches ?? [])
    .map((match) => normalizeFixture(match))
    .filter((match): match is PremierLeagueFixture => match !== null)
    .sort(sortFixturesAscending)
    .slice(0, UPCOMING_FIXTURE_LIMIT);

  const teams = (teamsResponse.teams ?? [])
    .map((team) => normalizeTeamOption(team))
    .filter((team): team is PremierLeagueTeamOption => team !== null)
    .sort((left, right) => left.shortName.localeCompare(right.shortName));

  const scorers = (scorersResponse.scorers ?? [])
    .map((entry, i) => normalizeScorer(entry, i + 1))
    .filter((s): s is import("@/types/premier-league").PremierLeagueScorer => s !== null);

  const goalsPerMatchday = buildGoalsPerMatchday(seasonFixturesResponse.matches ?? []);

  return {
    competition: buildCompetitionMeta(standingsResponse),
    standings,
    recentFixtures,
    upcomingFixtures,
    teams,
    scorers,
    goalsPerMatchday,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Request-time refresh used by the summary accessor when a football-data.org
 * token is configured. Only the standings and the recent/upcoming fixture
 * lists are refreshed (3 upstream requests); every other section keeps the
 * committed snapshot's value. A section that fails, comes back empty, or
 * reflects the rolled-over-but-unstarted season keeps the committed value.
 * If no section refreshes, this throws so the caller falls back to the
 * committed snapshot wholesale without caching the failure.
 */
export async function buildPremierLeagueLiveSummary(
  baseSummary: PremierLeagueSummary
): Promise<PremierLeagueSummary> {
  const [standingsResult, recentResult, upcomingResult] = await Promise.allSettled([
    fetchFootballDataJson<FootballDataCompetitionStandingsResponse>(
      `/competitions/${PREMIER_LEAGUE_CODE}/standings`,
      SUMMARY_REVALIDATE_SECONDS
    ),
    fetchFootballDataJson<FootballDataMatchesResponse>(
      `/competitions/${PREMIER_LEAGUE_CODE}/matches?${buildQueryString({
        status: "FINISHED",
        limit: RECENT_FIXTURE_LIMIT,
      })}`,
      SUMMARY_REVALIDATE_SECONDS
    ),
    fetchFootballDataJson<FootballDataMatchesResponse>(
      `/competitions/${PREMIER_LEAGUE_CODE}/matches?${buildQueryString({
        status: "SCHEDULED",
        limit: UPCOMING_FIXTURE_LIMIT,
      })}`,
      SUMMARY_REVALIDATE_SECONDS
    ),
  ]);

  const summary: PremierLeagueSummary = { ...baseSummary };
  let refreshedSections = 0;

  if (standingsResult.status === "fulfilled") {
    const standingsGroup =
      standingsResult.value.standings?.find((group) => group?.type === "TOTAL") ??
      standingsResult.value.standings?.[0] ??
      null;
    const standings = (standingsGroup?.table ?? [])
      .map((row) => normalizeStandingRow(row))
      .filter((row): row is PremierLeagueStandingRow => row !== null);

    // A zeroed rolled-over table (season pointer advanced, no games played)
    // would wipe the dashboard, so the committed table is kept instead.
    if (standings.length > 0 && !seasonNotStarted(standingsResult.value.season, standings)) {
      summary.standings = standings;
      summary.competition = buildCompetitionMeta(standingsResult.value);
      refreshedSections += 1;
    }
  }

  if (recentResult.status === "fulfilled") {
    const recentFixtures = (recentResult.value.matches ?? [])
      .map((match) => normalizeFixture(match))
      .filter((match): match is PremierLeagueFixture => match !== null)
      .sort(sortFixturesDescending)
      .slice(0, RECENT_FIXTURE_LIMIT);

    if (recentFixtures.length > 0) {
      summary.recentFixtures = recentFixtures;
      refreshedSections += 1;
    }
  }

  if (upcomingResult.status === "fulfilled") {
    const upcomingFixtures = (upcomingResult.value.matches ?? [])
      .map((match) => normalizeFixture(match))
      .filter((match): match is PremierLeagueFixture => match !== null)
      .sort(sortFixturesAscending)
      .slice(0, UPCOMING_FIXTURE_LIMIT);

    if (upcomingFixtures.length > 0) {
      summary.upcomingFixtures = upcomingFixtures;
      refreshedSections += 1;
    }
  }

  if (refreshedSections === 0) {
    throw createPremierLeagueDataError(
      "Premier League live refresh produced no usable sections.",
      503
    );
  }

  return { ...summary, generatedAt: new Date().toISOString() };
}

export async function getPremierLeagueTeamSnapshot(
  teamId: string
): Promise<PremierLeagueTeamSnapshot> {
  if (!isValidPremierLeagueTeamId(teamId)) {
    throw createPremierLeagueDataError("Invalid Premier League team id.", 400);
  }

  const teamPromise = fetchFootballDataJson<FootballDataTeam>(
    `/teams/${teamId}`,
    TEAM_REVALIDATE_SECONDS
  );
  const recentFixturesPromise = fetchFootballDataJson<FootballDataMatchesResponse>(
    `/teams/${teamId}/matches?${buildQueryString({
      competitions: PREMIER_LEAGUE_CODE,
      status: "FINISHED",
      limit: TEAM_FIXTURE_LIMIT,
    })}`,
    TEAM_REVALIDATE_SECONDS
  );
  const upcomingFixturesPromise = fetchFootballDataJson<FootballDataMatchesResponse>(
    `/teams/${teamId}/matches?${buildQueryString({
      competitions: PREMIER_LEAGUE_CODE,
      status: "SCHEDULED",
      limit: TEAM_FIXTURE_LIMIT,
    })}`,
    TEAM_REVALIDATE_SECONDS
  );

  const [teamResponse, recentFixturesResponse, upcomingFixturesResponse] =
    await Promise.all([
      teamPromise,
      recentFixturesPromise,
      upcomingFixturesPromise,
    ]);

  const team = normalizeTeamProfile(teamResponse);
  const recentFixtures = (recentFixturesResponse.matches ?? [])
    .map((match) => normalizeFixture(match))
    .filter((match): match is PremierLeagueFixture => match !== null)
    .sort(sortFixturesDescending)
    .slice(0, TEAM_FIXTURE_LIMIT);
  const upcomingFixtures = (upcomingFixturesResponse.matches ?? [])
    .map((match) => normalizeFixture(match))
    .filter((match): match is PremierLeagueFixture => match !== null)
    .sort(sortFixturesAscending)
    .slice(0, TEAM_FIXTURE_LIMIT);

  return {
    team,
    recentFixtures,
    upcomingFixtures,
    form: buildTeamFormSummary(teamId, recentFixtures),
    generatedAt: new Date().toISOString(),
  };
}

const TEAM_FETCH_DELAY_MS = 20_000;
const PL_SNAPSHOT_PATH = "src/data/premierLeagueSnapshot.ts";

function readExistingPLTeamSnapshots(filePath: string): Record<string, PremierLeagueTeamSnapshot> {
  try {
    const fullPath = resolve(process.cwd(), filePath);
    const content = readFileSync(fullPath, "utf8");
    const match = content.match(/=\s*(\{[\s\S]*\})\s*;?\s*$/);
    if (!match) return {};
    const parsed = JSON.parse(match[1]);
    return parsed.teamSnapshots ?? {};
  } catch {
    return {};
  }
}

export async function buildPremierLeagueSnapshot(options?: { skipTeamSnapshots?: boolean; season?: number }): Promise<PremierLeagueSnapshot> {
  const summary = await getPremierLeagueSummary(
    options?.season ? { season: options.season } : undefined
  );
  const generatedAt = new Date().toISOString();
  let teamSnapshots: Record<string, PremierLeagueTeamSnapshot>;

  if (options?.skipTeamSnapshots) {
    teamSnapshots = readExistingPLTeamSnapshots(PL_SNAPSHOT_PATH);
    console.log(`  Preserved ${Object.keys(teamSnapshots).length} existing team snapshots.`);
  } else {
    // Start from the prior snapshots so a per-team failure preserves that
    // team's previous data instead of dropping it from the snapshot.
    teamSnapshots = { ...readExistingPLTeamSnapshots(PL_SNAPSHOT_PATH) };
    for (const team of summary.teams) {
      await new Promise<void>((resolve) => setTimeout(resolve, TEAM_FETCH_DELAY_MS));
      try {
        const teamSnapshot = await getPremierLeagueTeamSnapshot(team.id);
        teamSnapshots[team.id] = { ...teamSnapshot, generatedAt };
      } catch (err) {
        console.warn(`  Skipping team ${team.id} (${team.shortName}): ${(err as Error).message} — keeping previous snapshot if any.`);
      }
    }
  }

  return {
    sourceLabel: "football-data.org snapshot",
    sourceUrls: {
      provider: "https://www.football-data.org/",
      standings: "https://www.football-data.org/documentation/api#_standings",
      fixtures: "https://www.football-data.org/documentation/api#_matches",
      teams: "https://www.football-data.org/documentation/api#_teams",
    },
    summary: {
      ...summary,
      generatedAt,
    },
    teamSnapshots,
  };
}
