/**
 * Shared football-data.org v4 wire types and request constants.
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
// Full-season goals-per-matchday aggregation reads every FINISHED match, not
// just the most recent ones, so that call intentionally omits `limit`.
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

export interface FootballDataError extends Error {
  status: number;
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
