import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type {
  MlbGame,
  MlbGameTeam,
  MlbFormSummary,
  MlbHittingLeaders,
  MlbLeader,
  MlbLeague,
  MlbPitchingLeaders,
  MlbSnapshot,
  MlbStandingsRow,
  MlbTeamOption,
  MlbTeamProfile,
  MlbTeamSnapshot,
} from "@/types/mlb";

const MLB_STATS_BASE_URL = "https://statsapi.mlb.com/api/v1";
const MLB_LOGO_BASE_URL = "https://www.mlbstatic.com/team-logos";
const SPORT_ID = 1;
const AL_LEAGUE_ID = 103;
const NL_LEAGUE_ID = 104;
const REQUEST_TIMEOUT_MS = 15_000;
const SUMMARY_REVALIDATE_SECONDS = 300;
const TEAM_REVALIDATE_SECONDS = 300;
const RECENT_GAME_LIMIT = 10;
const UPCOMING_GAME_LIMIT = 10;
const TEAM_GAME_LIMIT = 5;
const RECENT_WINDOW_DAYS = 10;
const UPCOMING_WINDOW_DAYS = 10;

interface MlbDataError extends Error {
  status: number;
}

function createMlbDataError(message: string, status: number): MlbDataError {
  return Object.assign(new Error(message), { status });
}

interface StatsApiTeam {
  id?: number | null;
  name?: string | null;
  teamName?: string | null;
  locationName?: string | null;
  shortName?: string | null;
  abbreviation?: string | null;
  league?: { id?: number | null; name?: string | null } | null;
  division?: { id?: number | null; name?: string | null } | null;
  venue?: { name?: string | null } | null;
  firstYearOfPlay?: string | null;
}

interface StatsApiTeamsResponse {
  teams?: StatsApiTeam[] | null;
}

interface StatsApiStandingsTeamRecord {
  team?: { id?: number | null; name?: string | null; abbreviation?: string | null } | null;
  divisionRank?: string | null;
  leagueRank?: string | null;
  wildCardRank?: string | null;
  divisionGamesBack?: string | null;
  wildCardGamesBack?: string | null;
  wins?: number | null;
  losses?: number | null;
  winningPercentage?: string | null;
  runsScored?: number | null;
  runsAllowed?: number | null;
  runDifferential?: number | null;
  streak?: { streakCode?: string | null } | null;
  records?: {
    splitRecords?: Array<{
      type?: string | null;
      wins?: number | null;
      losses?: number | null;
    }> | null;
  } | null;
}

interface StatsApiStandingsRecord {
  league?: { id?: number | null; name?: string | null } | null;
  division?: { id?: number | null; name?: string | null } | null;
  teamRecords?: StatsApiStandingsTeamRecord[] | null;
}

interface StatsApiStandingsResponse {
  records?: StatsApiStandingsRecord[] | null;
}

interface StatsApiScheduleGame {
  gamePk?: number | null;
  gameDate?: string | null;
  gameType?: string | null;
  status?: { abstractGameState?: string | null; detailedState?: string | null } | null;
  teams?: {
    home?: {
      team?: { id?: number | null; name?: string | null; abbreviation?: string | null } | null;
      score?: number | null;
      isWinner?: boolean | null;
    } | null;
    away?: {
      team?: { id?: number | null; name?: string | null; abbreviation?: string | null } | null;
      score?: number | null;
      isWinner?: boolean | null;
    } | null;
  } | null;
}

interface StatsApiScheduleResponse {
  dates?: Array<{ date?: string | null; games?: StatsApiScheduleGame[] | null }> | null;
}

interface StatsApiLeaderEntry {
  rank?: number | null;
  value?: string | null;
  person?: { id?: number | null; fullName?: string | null } | null;
  team?: { id?: number | null; name?: string | null; abbreviation?: string | null } | null;
  numGames?: number | null;
  gamesPlayed?: number | null;
}

interface StatsApiLeadersResponse {
  leagueLeaders?: Array<{
    leaderCategory?: string | null;
    statGroup?: string | null;
    season?: string | null;
    leaders?: StatsApiLeaderEntry[] | null;
  }> | null;
}

function getCurrentSeason(): string {
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();
  return month >= 11 ? String(year + 1) : String(year);
}

function buildLogoUrl(teamId: number | string): string {
  return `${MLB_LOGO_BASE_URL}/${teamId}.svg`;
}

function leagueFromId(id: number | null | undefined): MlbLeague | null {
  if (id === AL_LEAGUE_ID) return "AL";
  if (id === NL_LEAGUE_ID) return "NL";
  return null;
}

function shortDivisionName(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .replace(/^American League\s*/i, "AL ")
    .replace(/^National League\s*/i, "NL ")
    .trim();
}

function deriveTeamShortName(raw: StatsApiTeam): string {
  return (
    raw.teamName?.trim() ||
    raw.shortName?.trim() ||
    raw.name?.trim() ||
    raw.locationName?.trim() ||
    "Team"
  );
}

function normalizeTeamOption(raw: StatsApiTeam): MlbTeamOption | null {
  const id = raw.id;
  if (typeof id !== "number" || !Number.isFinite(id)) return null;
  const league = leagueFromId(raw.league?.id ?? null);
  if (!league) return null;
  return {
    id: String(id),
    name: raw.name?.trim() || `Team ${id}`,
    shortName: deriveTeamShortName(raw),
    abbreviation: raw.abbreviation?.trim() || String(id),
    league,
    division: shortDivisionName(raw.division?.name),
    venue: raw.venue?.name?.trim() || null,
    logo: buildLogoUrl(id),
  };
}

function normalizeTeamProfile(raw: StatsApiTeam): MlbTeamProfile | null {
  const option = normalizeTeamOption(raw);
  if (!option) return null;
  const founded = raw.firstYearOfPlay ? Number.parseInt(raw.firstYearOfPlay, 10) : NaN;
  return {
    ...option,
    founded: Number.isFinite(founded) ? founded : null,
    primaryColor: null,
  };
}

type StatsApiScheduleSides = NonNullable<StatsApiScheduleGame["teams"]>;

function normalizeGameTeam(
  raw: StatsApiScheduleGame["teams"] | null | undefined,
  side: keyof StatsApiScheduleSides,
  teamLookup: Map<string, MlbTeamOption>
): MlbGameTeam | null {
  const sideTeam = raw?.[side];
  const id = sideTeam?.team?.id;
  if (typeof id !== "number") return null;
  const known = teamLookup.get(String(id));
  return {
    id: String(id),
    name: known?.name ?? sideTeam?.team?.name?.trim() ?? `Team ${id}`,
    shortName: known?.shortName ?? sideTeam?.team?.name?.trim() ?? `Team ${id}`,
    abbreviation: known?.abbreviation ?? sideTeam?.team?.abbreviation?.trim() ?? String(id),
    crest: known?.logo ?? buildLogoUrl(id),
  };
}

function normalizeGame(raw: StatsApiScheduleGame, teamLookup: Map<string, MlbTeamOption>): MlbGame | null {
  const id = raw.gamePk;
  const utcDate = raw.gameDate?.trim();
  if (typeof id !== "number" || !utcDate) return null;
  const homeTeam = normalizeGameTeam(raw.teams ?? null, "home", teamLookup);
  const awayTeam = normalizeGameTeam(raw.teams ?? null, "away", teamLookup);
  if (!homeTeam || !awayTeam) return null;
  const detailed = raw.status?.detailedState?.trim() || raw.status?.abstractGameState?.trim() || "Scheduled";
  const isFinal = (raw.status?.abstractGameState ?? "").toLowerCase() === "final";
  const homeScore = typeof raw.teams?.home?.score === "number" ? raw.teams.home.score : null;
  const awayScore = typeof raw.teams?.away?.score === "number" ? raw.teams.away.score : null;
  let winner: MlbGame["score"]["winner"] = null;
  if (isFinal && homeScore !== null && awayScore !== null) {
    if (homeScore > awayScore) winner = "HOME_TEAM";
    else if (awayScore > homeScore) winner = "AWAY_TEAM";
  } else if (raw.teams?.home?.isWinner) {
    winner = "HOME_TEAM";
  } else if (raw.teams?.away?.isWinner) {
    winner = "AWAY_TEAM";
  }
  return {
    id: String(id),
    utcDate,
    status: isFinal ? "FINISHED" : detailed,
    matchday: null,
    stage: raw.gameType?.trim() || null,
    homeTeam,
    awayTeam,
    score: { winner, home: homeScore, away: awayScore },
  };
}

function parseGamesBack(value: string | null | undefined): number {
  if (!value) return 0;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "-" || trimmed === "—") return 0;
  const num = Number.parseFloat(trimmed);
  return Number.isFinite(num) ? num : 0;
}

function parseRank(value: string | null | undefined): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number.parseInt(trimmed, 10);
  return Number.isFinite(num) ? num : null;
}

function findLast10(record: StatsApiStandingsTeamRecord): string {
  const split = record.records?.splitRecords?.find((entry) => entry?.type === "lastTen");
  if (!split) return "0-0";
  return `${split.wins ?? 0}-${split.losses ?? 0}`;
}

function normalizeStanding(
  group: StatsApiStandingsRecord,
  record: StatsApiStandingsTeamRecord,
  teamLookup: Map<string, MlbTeamOption>
): MlbStandingsRow | null {
  const teamId = record.team?.id;
  if (typeof teamId !== "number") return null;
  const league = leagueFromId(group.league?.id ?? null);
  if (!league) return null;
  const known = teamLookup.get(String(teamId));
  const wins = record.wins ?? 0;
  const losses = record.losses ?? 0;
  const pct = Number.parseFloat(record.winningPercentage ?? "0");
  return {
    id: String(teamId),
    code: known?.abbreviation ?? record.team?.abbreviation?.trim() ?? String(teamId),
    name: known?.name ?? record.team?.name?.trim() ?? `Team ${teamId}`,
    shortName: known?.shortName ?? record.team?.name?.trim() ?? `Team ${teamId}`,
    league,
    division: known?.division ?? shortDivisionName(group.division?.name),
    divisionRank: parseRank(record.divisionRank) ?? 0,
    leagueRank: parseRank(record.leagueRank) ?? 0,
    wildCardRank: parseRank(record.wildCardRank),
    gamesBack: parseGamesBack(record.divisionGamesBack),
    wildCardGamesBack: record.wildCardGamesBack ? parseGamesBack(record.wildCardGamesBack) : null,
    wins,
    losses,
    pct: Number.isFinite(pct) ? pct : wins / Math.max(wins + losses, 1),
    runsScored: record.runsScored ?? 0,
    runsAllowed: record.runsAllowed ?? 0,
    runDifferential: record.runDifferential ?? 0,
    streak: record.streak?.streakCode?.trim() ?? "",
    last10: findLast10(record),
  };
}

function normalizeLeader(entry: StatsApiLeaderEntry, teamLookup: Map<string, MlbTeamOption>): MlbLeader | null {
  const name = entry.person?.fullName?.trim();
  const teamId = entry.team?.id;
  if (!name || typeof teamId !== "number") return null;
  const value = Number.parseFloat(entry.value ?? "0");
  const games = entry.numGames ?? entry.gamesPlayed ?? 0;
  const known = teamLookup.get(String(teamId));
  return {
    rank: entry.rank ?? 0,
    name,
    teamId: String(teamId),
    teamCode: known?.abbreviation ?? entry.team?.abbreviation?.trim() ?? String(teamId),
    total: Number.isFinite(value) ? value : 0,
    games,
    perGame: games > 0 && Number.isFinite(value) ? value / games : 0,
  };
}

function buildTeamFormSummary(teamId: string, games: MlbGame[]): MlbFormSummary {
  return games.reduce<MlbFormSummary>(
    (summary, game) => {
      const isHome = game.homeTeam.id === teamId;
      const isAway = game.awayTeam.id === teamId;
      if (!isHome && !isAway) return summary;
      const runsFor = isHome ? game.score.home ?? 0 : game.score.away ?? 0;
      const runsAgainst = isHome ? game.score.away ?? 0 : game.score.home ?? 0;
      if (
        (isHome && game.score.winner === "HOME_TEAM") ||
        (isAway && game.score.winner === "AWAY_TEAM")
      ) {
        summary.sequence.push("W");
        summary.wins += 1;
      } else if (game.score.winner) {
        summary.sequence.push("L");
        summary.losses += 1;
      }
      summary.runsFor += runsFor;
      summary.runsAgainst += runsAgainst;
      return summary;
    },
    { sequence: [], wins: 0, losses: 0, runsFor: 0, runsAgainst: 0 }
  );
}

function dateOffsetIso(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function fetchStatsApiJsonOnce<T>(path: string, revalidateSeconds: number): Promise<T> {
  const response = await fetch(`${MLB_STATS_BASE_URL}${path}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    next: { revalidate: revalidateSeconds },
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw createMlbDataError("Requested MLB resource was not found.", 404);
    }
    throw createMlbDataError(
      "Unable to load MLB data from the upstream provider.",
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
async function fetchStatsApiJson<T>(path: string, revalidateSeconds: number): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await fetchStatsApiJsonOnce<T>(path, revalidateSeconds);
    } catch (error) {
      lastError = error;
      if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        throw createMlbDataError("MLB data provider timed out.", 504);
      }
      const status = (error as MlbDataError).status;
      if (typeof status === "number" && status >= 400 && status < 500) throw error;
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

function buildQueryString(params: Record<string, string | number>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, String(value));
  }
  return searchParams.toString();
}

export function isValidMlbTeamId(teamId: string): boolean {
  return /^[1-9]\d*$/.test(teamId);
}

export function createEmptyMlbSnapshot(): MlbSnapshot {
  return {
    season: getCurrentSeason(),
    updatedAt: new Date().toISOString().slice(0, 10),
    sourceLabel: "MLB Stats API",
    sourceUrls: {
      standings: `${MLB_STATS_BASE_URL}/standings`,
      schedule: `${MLB_STATS_BASE_URL}/schedule`,
      leaders: `${MLB_STATS_BASE_URL}/stats/leaders`,
    },
    teams: [],
    standings: [],
    recentGames: [],
    upcomingGames: [],
    hittingLeaders: { homeRuns: [], runsBattedIn: [], battingAverage: [] },
    pitchingLeaders: { earnedRunAverage: [], wins: [], strikeouts: [] },
    teamSnapshots: {},
  };
}

async function getTeams(season: string): Promise<MlbTeamOption[]> {
  const response = await fetchStatsApiJson<StatsApiTeamsResponse>(
    `/teams?${buildQueryString({ sportId: SPORT_ID, season, activeStatus: "Y", hydrate: "venue" })}`,
    SUMMARY_REVALIDATE_SECONDS
  );
  return (response.teams ?? [])
    .map((team) => normalizeTeamOption(team))
    .filter((team): team is MlbTeamOption => team !== null)
    .sort((a, b) => a.shortName.localeCompare(b.shortName));
}

async function getStandings(season: string, teamLookup: Map<string, MlbTeamOption>): Promise<MlbStandingsRow[]> {
  const response = await fetchStatsApiJson<StatsApiStandingsResponse>(
    `/standings?${buildQueryString({
      leagueId: `${AL_LEAGUE_ID},${NL_LEAGUE_ID}`,
      season,
      standingsTypes: "regularSeason",
    })}`,
    SUMMARY_REVALIDATE_SECONDS
  );
  const rows: MlbStandingsRow[] = [];
  for (const group of response.records ?? []) {
    for (const record of group.teamRecords ?? []) {
      const row = normalizeStanding(group, record, teamLookup);
      if (row) rows.push(row);
    }
  }
  return rows.sort((a, b) => {
    if (a.league !== b.league) return a.league.localeCompare(b.league);
    if (a.division !== b.division) return a.division.localeCompare(b.division);
    return a.divisionRank - b.divisionRank;
  });
}

async function getRecentSchedule(teamLookup: Map<string, MlbTeamOption>): Promise<MlbGame[]> {
  const response = await fetchStatsApiJson<StatsApiScheduleResponse>(
    `/schedule?${buildQueryString({
      sportId: SPORT_ID,
      startDate: dateOffsetIso(-RECENT_WINDOW_DAYS),
      endDate: dateOffsetIso(-1),
    })}`,
    SUMMARY_REVALIDATE_SECONDS
  );
  const games: MlbGame[] = [];
  for (const date of response.dates ?? []) {
    for (const raw of date.games ?? []) {
      const game = normalizeGame(raw, teamLookup);
      if (game && game.status === "FINISHED") games.push(game);
    }
  }
  return games
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    .slice(0, RECENT_GAME_LIMIT);
}

async function getUpcomingSchedule(teamLookup: Map<string, MlbTeamOption>): Promise<MlbGame[]> {
  const response = await fetchStatsApiJson<StatsApiScheduleResponse>(
    `/schedule?${buildQueryString({
      sportId: SPORT_ID,
      startDate: dateOffsetIso(0),
      endDate: dateOffsetIso(UPCOMING_WINDOW_DAYS),
    })}`,
    SUMMARY_REVALIDATE_SECONDS
  );
  const games: MlbGame[] = [];
  for (const date of response.dates ?? []) {
    for (const raw of date.games ?? []) {
      const game = normalizeGame(raw, teamLookup);
      if (game && game.status !== "FINISHED") games.push(game);
    }
  }
  return games
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
    .slice(0, UPCOMING_GAME_LIMIT);
}

async function getLeaders(
  category: string,
  statGroup: "hitting" | "pitching",
  season: string,
  teamLookup: Map<string, MlbTeamOption>
): Promise<MlbLeader[]> {
  const response = await fetchStatsApiJson<StatsApiLeadersResponse>(
    `/stats/leaders?${buildQueryString({
      leaderCategories: category,
      season,
      sportId: SPORT_ID,
      statGroup,
      limit: 10,
    })}`,
    SUMMARY_REVALIDATE_SECONDS
  );
  const leaderGroup = response.leagueLeaders?.[0];
  return (leaderGroup?.leaders ?? [])
    .map((entry) => normalizeLeader(entry, teamLookup))
    .filter((leader): leader is MlbLeader => leader !== null)
    .slice(0, 10);
}

export async function getMlbSummary(): Promise<{
  season: string;
  teams: MlbTeamOption[];
  standings: MlbStandingsRow[];
  recentGames: MlbGame[];
  upcomingGames: MlbGame[];
  hittingLeaders: MlbHittingLeaders;
  pitchingLeaders: MlbPitchingLeaders;
  generatedAt: string;
}> {
  const season = getCurrentSeason();
  const teams = await getTeams(season);
  const teamLookup = new Map(teams.map((team) => [team.id, team]));

  const [
    standings,
    recentGames,
    upcomingGames,
    homeRuns,
    runsBattedIn,
    battingAverage,
    earnedRunAverage,
    wins,
    strikeouts,
  ] = await Promise.all([
    getStandings(season, teamLookup),
    getRecentSchedule(teamLookup),
    getUpcomingSchedule(teamLookup),
    getLeaders("homeRuns", "hitting", season, teamLookup),
    getLeaders("runsBattedIn", "hitting", season, teamLookup),
    getLeaders("battingAverage", "hitting", season, teamLookup),
    getLeaders("earnedRunAverage", "pitching", season, teamLookup),
    getLeaders("wins", "pitching", season, teamLookup),
    getLeaders("strikeouts", "pitching", season, teamLookup),
  ]);

  return {
    season,
    teams,
    standings,
    recentGames,
    upcomingGames,
    hittingLeaders: { homeRuns, runsBattedIn, battingAverage },
    pitchingLeaders: { earnedRunAverage, wins, strikeouts },
    generatedAt: new Date().toISOString(),
  };
}

export async function getMlbTeamSnapshot(teamId: string, teamLookup?: Map<string, MlbTeamOption>): Promise<MlbTeamSnapshot> {
  if (!isValidMlbTeamId(teamId)) {
    throw createMlbDataError("Invalid MLB team id.", 400);
  }

  const lookup = teamLookup ?? new Map((await getTeams(getCurrentSeason())).map((team) => [team.id, team]));

  const [profileResponse, recentResponse, upcomingResponse] = await Promise.all([
    fetchStatsApiJson<StatsApiTeamsResponse>(
      `/teams/${teamId}?${buildQueryString({ hydrate: "venue" })}`,
      TEAM_REVALIDATE_SECONDS
    ),
    fetchStatsApiJson<StatsApiScheduleResponse>(
      `/schedule?${buildQueryString({
        sportId: SPORT_ID,
        teamId,
        startDate: dateOffsetIso(-RECENT_WINDOW_DAYS - 5),
        endDate: dateOffsetIso(-1),
      })}`,
      TEAM_REVALIDATE_SECONDS
    ),
    fetchStatsApiJson<StatsApiScheduleResponse>(
      `/schedule?${buildQueryString({
        sportId: SPORT_ID,
        teamId,
        startDate: dateOffsetIso(0),
        endDate: dateOffsetIso(UPCOMING_WINDOW_DAYS + 5),
      })}`,
      TEAM_REVALIDATE_SECONDS
    ),
  ]);

  const profile = normalizeTeamProfile(profileResponse.teams?.[0] ?? {});
  const recentGames = (recentResponse.dates ?? [])
    .flatMap((d) => d.games ?? [])
    .map((game) => normalizeGame(game, lookup))
    .filter((g): g is MlbGame => g !== null && g.status === "FINISHED")
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    .slice(0, TEAM_GAME_LIMIT);
  const upcomingGames = (upcomingResponse.dates ?? [])
    .flatMap((d) => d.games ?? [])
    .map((game) => normalizeGame(game, lookup))
    .filter((g): g is MlbGame => g !== null && g.status !== "FINISHED")
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
    .slice(0, TEAM_GAME_LIMIT);

  return {
    team: profile,
    recentGames,
    upcomingGames,
    form: buildTeamFormSummary(teamId, recentGames),
    generatedAt: new Date().toISOString(),
  };
}

const TEAM_FETCH_DELAY_MS = 750;
const MLB_SNAPSHOT_PATH = "src/data/mlbSnapshot.ts";

function delay(ms: number) {
  return new Promise<void>((resolveFn) => setTimeout(resolveFn, ms));
}

function readExistingTeamSnapshots(filePath: string): Record<string, MlbTeamSnapshot> {
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

export async function buildMlbSnapshot(options?: { skipTeamSnapshots?: boolean }): Promise<MlbSnapshot> {
  const summary = await getMlbSummary();
  const teamLookup = new Map(summary.teams.map((team) => [team.id, team]));
  const generatedAt = new Date().toISOString();
  let teamSnapshots: Record<string, MlbTeamSnapshot> = {};

  if (options?.skipTeamSnapshots) {
    teamSnapshots = readExistingTeamSnapshots(MLB_SNAPSHOT_PATH);
    console.log(`  Preserved ${Object.keys(teamSnapshots).length} existing team snapshots.`);
  } else {
    // Start from the prior snapshots so a per-team failure preserves that
    // team's previous data instead of dropping it from the snapshot.
    teamSnapshots = { ...readExistingTeamSnapshots(MLB_SNAPSHOT_PATH) };
    for (const team of summary.teams) {
      await delay(TEAM_FETCH_DELAY_MS);
      try {
        const snap = await getMlbTeamSnapshot(team.id, teamLookup);
        teamSnapshots[team.id] = { ...snap, generatedAt };
      } catch (err) {
        console.warn(`  Skipping team ${team.id} (${team.shortName}): ${(err as Error).message} — keeping previous snapshot if any.`);
      }
    }
  }

  return {
    season: summary.season,
    updatedAt: generatedAt.slice(0, 10),
    sourceLabel: "MLB Stats API",
    sourceUrls: {
      standings: `${MLB_STATS_BASE_URL}/standings?leagueId=${AL_LEAGUE_ID},${NL_LEAGUE_ID}&season=${summary.season}`,
      schedule: `${MLB_STATS_BASE_URL}/schedule?sportId=${SPORT_ID}`,
      leaders: `${MLB_STATS_BASE_URL}/stats/leaders?sportId=${SPORT_ID}`,
    },
    teams: summary.teams,
    standings: summary.standings,
    recentGames: summary.recentGames,
    upcomingGames: summary.upcomingGames,
    hittingLeaders: summary.hittingLeaders,
    pitchingLeaders: summary.pitchingLeaders,
    teamSnapshots,
  };
}
