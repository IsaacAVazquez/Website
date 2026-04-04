import type {
  PremierLeagueSnapshot,
  PremierLeagueCompetitionMeta,
  PremierLeagueFixture,
  PremierLeagueFixtureTeam,
  PremierLeagueFormSummary,
  PremierLeagueStandingRow,
  PremierLeagueSummary,
  PremierLeagueTeamOption,
  PremierLeagueTeamProfile,
  PremierLeagueTeamSnapshot,
} from "@/types/premier-league";

const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";
const PREMIER_LEAGUE_CODE = "PL";
const REQUEST_TIMEOUT_MS = 10_000;
const SUMMARY_REVALIDATE_SECONDS = 300;
const TEAM_REVALIDATE_SECONDS = 300;
const RECENT_FIXTURE_LIMIT = 8;
const UPCOMING_FIXTURE_LIMIT = 8;
const TEAM_FIXTURE_LIMIT = 5;

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

async function fetchFootballDataJson<T>(
  path: string,
  revalidateSeconds: number
): Promise<T> {
  const token = getFootballDataToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${FOOTBALL_DATA_BASE_URL}${path}`, {
      headers: {
        "X-Auth-Token": token,
      },
      signal: controller.signal,
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
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw createPremierLeagueDataError(
        "Premier League data provider timed out.",
        504
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
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

function buildQueryString(params: Record<string, string | number>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
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
    recentFixtures: [],
    upcomingFixtures: [],
    teams: [],
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

export async function getPremierLeagueSummary(): Promise<PremierLeagueSummary> {
  const standingsPromise = fetchFootballDataJson<FootballDataCompetitionStandingsResponse>(
    `/competitions/${PREMIER_LEAGUE_CODE}/standings`,
    SUMMARY_REVALIDATE_SECONDS
  );
  const recentFixturesPromise = fetchFootballDataJson<FootballDataMatchesResponse>(
    `/competitions/${PREMIER_LEAGUE_CODE}/matches?${buildQueryString({
      status: "FINISHED",
      limit: RECENT_FIXTURE_LIMIT,
    })}`,
    SUMMARY_REVALIDATE_SECONDS
  );
  const upcomingFixturesPromise = fetchFootballDataJson<FootballDataMatchesResponse>(
    `/competitions/${PREMIER_LEAGUE_CODE}/matches?${buildQueryString({
      status: "SCHEDULED",
      limit: UPCOMING_FIXTURE_LIMIT,
    })}`,
    SUMMARY_REVALIDATE_SECONDS
  );
  const teamsPromise = fetchFootballDataJson<FootballDataCompetitionTeamsResponse>(
    `/competitions/${PREMIER_LEAGUE_CODE}/teams`,
    SUMMARY_REVALIDATE_SECONDS
  );

  const [
    standingsResponse,
    recentFixturesResponse,
    upcomingFixturesResponse,
    teamsResponse,
  ] = await Promise.all([
    standingsPromise,
    recentFixturesPromise,
    upcomingFixturesPromise,
    teamsPromise,
  ]);

  const standingsGroup =
    standingsResponse.standings?.find((group) => group?.type === "TOTAL") ??
    standingsResponse.standings?.[0] ??
    null;

  const standings = (standingsGroup?.table ?? [])
    .map((row) => normalizeStandingRow(row))
    .filter((row): row is PremierLeagueStandingRow => row !== null);

  const recentFixtures = (recentFixturesResponse.matches ?? [])
    .map((match) => normalizeFixture(match))
    .filter((match): match is PremierLeagueFixture => match !== null)
    .sort(sortFixturesDescending);

  const upcomingFixtures = (upcomingFixturesResponse.matches ?? [])
    .map((match) => normalizeFixture(match))
    .filter((match): match is PremierLeagueFixture => match !== null)
    .sort(sortFixturesAscending);

  const teams = (teamsResponse.teams ?? [])
    .map((team) => normalizeTeamOption(team))
    .filter((team): team is PremierLeagueTeamOption => team !== null)
    .sort((left, right) => left.shortName.localeCompare(right.shortName));

  return {
    competition: buildCompetitionMeta(standingsResponse),
    standings,
    recentFixtures,
    upcomingFixtures,
    teams,
    generatedAt: new Date().toISOString(),
  };
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
    .sort(sortFixturesDescending);
  const upcomingFixtures = (upcomingFixturesResponse.matches ?? [])
    .map((match) => normalizeFixture(match))
    .filter((match): match is PremierLeagueFixture => match !== null)
    .sort(sortFixturesAscending);

  return {
    team,
    recentFixtures,
    upcomingFixtures,
    form: buildTeamFormSummary(teamId, recentFixtures),
    generatedAt: new Date().toISOString(),
  };
}

export async function buildPremierLeagueSnapshot(): Promise<PremierLeagueSnapshot> {
  const summary = await getPremierLeagueSummary();
  const generatedAt = new Date().toISOString();
  const teamSnapshotsEntries: Array<[string, PremierLeagueTeamSnapshot]> = [];

  for (const team of summary.teams) {
    const teamSnapshot = await getPremierLeagueTeamSnapshot(team.id);
    teamSnapshotsEntries.push([
      team.id,
      {
        ...teamSnapshot,
        generatedAt,
      },
    ]);
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
    teamSnapshots: Object.fromEntries(teamSnapshotsEntries),
  };
}
