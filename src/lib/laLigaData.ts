import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type {
  LaLigaClub,
  LaLigaFixture,
  LaLigaFixtureTeam,
  LaLigaFormSummary,
  LaLigaLeader,
  LaLigaSnapshot,
  LaLigaTeamOption,
  LaLigaTeamProfile,
  LaLigaTeamSnapshot,
} from "@/types/la-liga";

const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";
const LA_LIGA_CODE = "PD";
const REQUEST_TIMEOUT_MS = 10_000;
const SUMMARY_REVALIDATE_SECONDS = 300;
const TEAM_REVALIDATE_SECONDS = 300;
const RECENT_FIXTURE_LIMIT = 8;
const UPCOMING_FIXTURE_LIMIT = 8;
const TEAM_FIXTURE_LIMIT = 5;

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
}

interface FootballDataCompetition {
  code?: string | null;
  name?: string | null;
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

interface FootballDataStandingsGroup {
  type?: string | null;
  table?: FootballDataStandingEntry[] | null;
}

interface FootballDataCompetitionStandingsResponse {
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

function createLaLigaDataError(message: string, status: number): FootballDataError {
  return Object.assign(new Error(message), { status });
}

function getFootballDataToken(): string {
  const token = process.env.FOOTBALL_DATA_API_TOKEN?.trim();
  if (!token) {
    throw createLaLigaDataError("La Liga data source is not configured.", 503);
  }
  return token;
}

function buildSeasonLabel(startDate?: string | null, endDate?: string | null): string {
  const startYear = startDate ? new Date(startDate).getUTCFullYear() : NaN;
  const endYear = endDate ? new Date(endDate).getUTCFullYear() : NaN;
  if (Number.isFinite(startYear) && Number.isFinite(endYear)) {
    return startYear === endYear ? `${startYear}` : `${startYear}/${String(endYear).slice(-2)}`;
  }
  return "Current season";
}

function normalizeFixtureTeam(raw: FootballDataTeam | null | undefined): LaLigaFixtureTeam | null {
  const id = raw?.id;
  if (typeof id !== "number" || !Number.isFinite(id)) return null;
  return {
    id: String(id),
    name: raw?.name?.trim() || `Club ${id}`,
    shortName: raw?.shortName?.trim() || raw?.name?.trim() || `Club ${id}`,
    tla: raw?.tla?.trim() || null,
    crest: raw?.crest?.trim() || raw?.crestUrl?.trim() || null,
  };
}

function normalizeTeamOption(raw: FootballDataTeam | null | undefined): LaLigaTeamOption | null {
  const team = normalizeFixtureTeam(raw);
  if (!team) return null;
  return { ...team, venue: raw?.venue?.trim() || null };
}

function normalizeTeamProfile(raw: FootballDataTeam | null | undefined): LaLigaTeamProfile | null {
  const team = normalizeTeamOption(raw);
  if (!team) return null;
  return {
    ...team,
    founded: typeof raw?.founded === "number" ? raw.founded : null,
    clubColors: raw?.clubColors?.trim() || null,
  };
}

function normalizeFixture(raw: FootballDataMatch | null | undefined): LaLigaFixture | null {
  const matchId = raw?.id;
  const utcDate = raw?.utcDate?.trim();
  const homeTeam = normalizeFixtureTeam(raw?.homeTeam);
  const awayTeam = normalizeFixtureTeam(raw?.awayTeam);
  if (typeof matchId !== "number" || !utcDate || !homeTeam || !awayTeam) return null;
  return {
    id: String(matchId),
    utcDate,
    status: raw?.status?.trim() || "UNKNOWN",
    matchday: raw?.matchday ?? null,
    stage: raw?.stage?.trim() || null,
    homeTeam,
    awayTeam,
    score: {
      winner: raw?.score?.winner ?? null,
      home: raw?.score?.fullTime?.home ?? null,
      away: raw?.score?.fullTime?.away ?? null,
    },
  };
}

function normalizeStandingRow(raw: FootballDataStandingEntry | null | undefined): LaLigaClub | null {
  const team = raw?.team;
  const id = team?.id;
  if (typeof id !== "number" || typeof raw?.position !== "number") return null;
  const shortName = team?.shortName?.trim() || team?.name?.trim() || `Club ${id}`;
  return {
    id: team?.tla?.toLowerCase() || String(id),
    code: team?.tla?.trim() || String(id),
    name: team?.name?.trim() || `Club ${id}`,
    shortName,
    position: raw.position,
    points: raw.points ?? 0,
    played: raw.playedGames ?? 0,
    won: raw.won ?? 0,
    drawn: raw.draw ?? 0,
    lost: raw.lost ?? 0,
    goalsFor: raw.goalsFor ?? 0,
    goalsAgainst: raw.goalsAgainst ?? 0,
    goalDifference: raw.goalDifference ?? 0,
  };
}

function normalizeScorer(entry: FootballDataScorerEntry | null | undefined, rank: number): LaLigaLeader | null {
  const name = entry?.player?.name?.trim();
  const teamId = entry?.team?.id;
  const teamTla = entry?.team?.tla?.trim();
  if (!name || typeof teamId !== "number") return null;
  return {
    rank,
    name,
    clubId: entry?.team?.tla?.toLowerCase() || String(teamId),
    clubCode: teamTla || String(teamId),
    total: entry?.goals ?? 0,
    appearances: entry?.playedMatches ?? 0,
    perMatch: entry?.playedMatches ? (entry.goals ?? 0) / entry.playedMatches : 0,
  };
}

function buildTeamFormSummary(teamId: string, fixtures: LaLigaFixture[]): LaLigaFormSummary {
  return fixtures.reduce<LaLigaFormSummary>(
    (summary, fixture) => {
      const isHome = fixture.homeTeam.id === teamId;
      const isAway = fixture.awayTeam.id === teamId;
      if (!isHome && !isAway) return summary;
      const goalsFor = isHome ? fixture.score.home ?? 0 : fixture.score.away ?? 0;
      const goalsAgainst = isHome ? fixture.score.away ?? 0 : fixture.score.home ?? 0;
      if (fixture.score.winner === "DRAW") {
        summary.sequence.push("D"); summary.draws += 1; summary.points += 1;
      } else if (
        (isHome && fixture.score.winner === "HOME_TEAM") ||
        (isAway && fixture.score.winner === "AWAY_TEAM")
      ) {
        summary.sequence.push("W"); summary.wins += 1; summary.points += 3;
      } else {
        summary.sequence.push("L"); summary.losses += 1;
      }
      summary.goalsFor += goalsFor;
      summary.goalsAgainst += goalsAgainst;
      return summary;
    },
    { sequence: [], wins: 0, draws: 0, losses: 0, points: 0, goalsFor: 0, goalsAgainst: 0 }
  );
}

async function fetchFootballDataJson<T>(path: string, revalidateSeconds: number): Promise<T> {
  const token = getFootballDataToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${FOOTBALL_DATA_BASE_URL}${path}`, {
      headers: { "X-Auth-Token": token },
      signal: controller.signal,
      next: { revalidate: revalidateSeconds },
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw createLaLigaDataError("La Liga data provider rejected the configured API token.", 503);
      }
      if (response.status === 404) {
        throw createLaLigaDataError("Requested La Liga resource was not found.", 404);
      }
      throw createLaLigaDataError(
        "Unable to load La Liga data from the upstream provider.",
        response.status >= 500 ? 503 : 502
      );
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw createLaLigaDataError("La Liga data provider timed out.", 504);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function buildQueryString(params: Record<string, string | number>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, String(value));
  }
  return searchParams.toString();
}

export function isValidLaLigaTeamId(teamId: string): boolean {
  return /^[1-9]\d*$/.test(teamId);
}

export function createEmptyLaLigaSnapshot(): LaLigaSnapshot {
  return {
    season: "2025/26",
    matchday: 0,
    updatedAt: new Date().toISOString().slice(0, 10),
    sourceLabel: "football-data.org",
    sourceUrls: { standings: "", scorers: "", assists: "" },
    clubs: [],
    scorers: [],
    assists: [],
    recentFixtures: [],
    upcomingFixtures: [],
    teams: [],
    teamSnapshots: {},
  };
}

export async function getLaLigaSummary(): Promise<{
  season: string;
  matchday: number;
  clubs: LaLigaClub[];
  scorers: LaLigaLeader[];
  recentFixtures: LaLigaFixture[];
  upcomingFixtures: LaLigaFixture[];
  teams: LaLigaTeamOption[];
  generatedAt: string;
}> {
  const [standingsResponse, recentRes, upcomingRes, teamsRes, scorersRes] = await Promise.all([
    fetchFootballDataJson<FootballDataCompetitionStandingsResponse>(
      `/competitions/${LA_LIGA_CODE}/standings`,
      SUMMARY_REVALIDATE_SECONDS
    ),
    fetchFootballDataJson<FootballDataMatchesResponse>(
      `/competitions/${LA_LIGA_CODE}/matches?${buildQueryString({ status: "FINISHED", limit: RECENT_FIXTURE_LIMIT })}`,
      SUMMARY_REVALIDATE_SECONDS
    ),
    fetchFootballDataJson<FootballDataMatchesResponse>(
      `/competitions/${LA_LIGA_CODE}/matches?${buildQueryString({ status: "SCHEDULED", limit: UPCOMING_FIXTURE_LIMIT })}`,
      SUMMARY_REVALIDATE_SECONDS
    ),
    fetchFootballDataJson<FootballDataCompetitionTeamsResponse>(
      `/competitions/${LA_LIGA_CODE}/teams`,
      SUMMARY_REVALIDATE_SECONDS
    ),
    fetchFootballDataJson<FootballDataScorersResponse>(
      `/competitions/${LA_LIGA_CODE}/scorers`,
      SUMMARY_REVALIDATE_SECONDS
    ),
  ]);

  const standingsGroup =
    standingsResponse.standings?.find((g) => g?.type === "TOTAL") ??
    standingsResponse.standings?.[0] ??
    null;

  const clubs = (standingsGroup?.table ?? [])
    .map((row) => normalizeStandingRow(row))
    .filter((c): c is LaLigaClub => c !== null);

  const scorers = (scorersRes.scorers ?? [])
    .map((entry, i) => normalizeScorer(entry, i + 1))
    .filter((s): s is LaLigaLeader => s !== null);

  const recentFixtures = (recentRes.matches ?? [])
    .map((m) => normalizeFixture(m))
    .filter((f): f is LaLigaFixture => f !== null)
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    .slice(0, RECENT_FIXTURE_LIMIT);

  const upcomingFixtures = (upcomingRes.matches ?? [])
    .map((m) => normalizeFixture(m))
    .filter((f): f is LaLigaFixture => f !== null)
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
    .slice(0, UPCOMING_FIXTURE_LIMIT);

  const teams = (teamsRes.teams ?? [])
    .map((t) => normalizeTeamOption(t))
    .filter((t): t is LaLigaTeamOption => t !== null)
    .sort((a, b) => a.shortName.localeCompare(b.shortName));

  const season = buildSeasonLabel(standingsResponse.season?.startDate, standingsResponse.season?.endDate);
  const matchday = standingsResponse.season?.currentMatchday ?? 0;

  return { season, matchday, clubs, scorers, recentFixtures, upcomingFixtures, teams, generatedAt: new Date().toISOString() };
}

export async function getLaLigaTeamSnapshot(teamId: string): Promise<LaLigaTeamSnapshot> {
  if (!isValidLaLigaTeamId(teamId)) {
    throw createLaLigaDataError("Invalid La Liga team id.", 400);
  }

  const [teamResponse, recentRes, upcomingRes] = await Promise.all([
    fetchFootballDataJson<FootballDataTeam>(`/teams/${teamId}`, TEAM_REVALIDATE_SECONDS),
    fetchFootballDataJson<FootballDataMatchesResponse>(
      `/teams/${teamId}/matches?${buildQueryString({ competitions: LA_LIGA_CODE, status: "FINISHED", limit: TEAM_FIXTURE_LIMIT })}`,
      TEAM_REVALIDATE_SECONDS
    ),
    fetchFootballDataJson<FootballDataMatchesResponse>(
      `/teams/${teamId}/matches?${buildQueryString({ competitions: LA_LIGA_CODE, status: "SCHEDULED", limit: TEAM_FIXTURE_LIMIT })}`,
      TEAM_REVALIDATE_SECONDS
    ),
  ]);

  const team = normalizeTeamProfile(teamResponse);
  const recentFixtures = (recentRes.matches ?? [])
    .map((m) => normalizeFixture(m))
    .filter((f): f is LaLigaFixture => f !== null)
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    .slice(0, TEAM_FIXTURE_LIMIT);
  const upcomingFixtures = (upcomingRes.matches ?? [])
    .map((m) => normalizeFixture(m))
    .filter((f): f is LaLigaFixture => f !== null)
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
    .slice(0, TEAM_FIXTURE_LIMIT);

  return {
    team,
    recentFixtures,
    upcomingFixtures,
    form: buildTeamFormSummary(teamId, recentFixtures),
    generatedAt: new Date().toISOString(),
  };
}

// football-data.org free tier: 10 req/min. Each team snapshot = 3 requests,
// so wait ~20 s between teams to stay safely under the limit.
const TEAM_FETCH_DELAY_MS = 20_000;
const LA_LIGA_SNAPSHOT_PATH = "src/data/laLigaSnapshot.ts";

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function readExistingTeamSnapshots(filePath: string): Record<string, LaLigaTeamSnapshot> {
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

export async function buildLaLigaSnapshot(options?: { skipTeamSnapshots?: boolean }): Promise<LaLigaSnapshot> {
  const summary = await getLaLigaSummary();
  const generatedAt = new Date().toISOString();
  let teamSnapshots: Record<string, LaLigaTeamSnapshot> = {};

  if (options?.skipTeamSnapshots) {
    teamSnapshots = readExistingTeamSnapshots(LA_LIGA_SNAPSHOT_PATH);
    console.log(`  Preserved ${Object.keys(teamSnapshots).length} existing team snapshots.`);
  } else {
    const entries: Array<[string, LaLigaTeamSnapshot]> = [];
    for (const team of summary.teams) {
      await delay(TEAM_FETCH_DELAY_MS);
      const snapKey = team.tla?.toLowerCase() || team.id;
      try {
        const snap = await getLaLigaTeamSnapshot(team.id);
        entries.push([snapKey, { ...snap, generatedAt }]);
      } catch (err) {
        console.warn(`  Skipping team ${snapKey} (${team.shortName}): ${(err as Error).message}`);
      }
    }
    teamSnapshots = Object.fromEntries(entries);
  }

  return {
    season: summary.season,
    matchday: summary.matchday,
    updatedAt: generatedAt.slice(0, 10),
    sourceLabel: "football-data.org",
    sourceUrls: {
      standings: `https://www.football-data.org/v4/competitions/${LA_LIGA_CODE}/standings`,
      scorers: `https://www.football-data.org/v4/competitions/${LA_LIGA_CODE}/scorers`,
      assists: `https://www.football-data.org/v4/competitions/${LA_LIGA_CODE}/scorers`,
    },
    clubs: summary.clubs,
    scorers: summary.scorers,
    assists: [],
    recentFixtures: summary.recentFixtures,
    upcomingFixtures: summary.upcomingFixtures,
    teams: summary.teams,
    teamSnapshots,
  };
}
