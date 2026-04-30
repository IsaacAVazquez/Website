import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type {
  NbaConference,
  NbaFixture,
  NbaFixtureTeam,
  NbaFormSummary,
  NbaLeader,
  NbaSnapshot,
  NbaTeam,
  NbaTeamOption,
  NbaTeamProfile,
  NbaTeamSnapshot,
} from "@/types/nba";

const ESPN_BASE_URL = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";
const ESPN_STANDINGS_URL = "https://site.api.espn.com/apis/v2/sports/basketball/nba/standings";
// ESPN's old `/leaders` endpoint returns 404 as of 2026-04. The replacement
// `byathlete` endpoint returns ~227 athletes in a single page (limit=500) with
// all three stat categories, so one call covers points, rebounds, and assists.
const ESPN_BYATHLETE_URL =
  "https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/statistics/byathlete?category=offensive&limit=500";
const REQUEST_TIMEOUT_MS = 15_000;
const SUMMARY_REVALIDATE_SECONDS = 300;
const TEAM_REVALIDATE_SECONDS = 300;
const RECENT_FIXTURE_LIMIT = 10;
const UPCOMING_FIXTURE_LIMIT = 10;
const TEAM_FIXTURE_LIMIT = 5;

interface EspnLogo {
  href?: string | null;
}

interface EspnTeam {
  id?: string | number | null;
  uid?: string | null;
  abbreviation?: string | null;
  displayName?: string | null;
  shortDisplayName?: string | null;
  name?: string | null;
  location?: string | null;
  color?: string | null;
  logo?: string | null;
  logos?: EspnLogo[] | null;
  venue?: { fullName?: string | null } | null;
  groups?: { id?: string | null; parent?: { id?: string | null } | null } | null;
}

interface EspnStat {
  name?: string | null;
  type?: string | null;
  value?: number | string | null;
  displayValue?: string | null;
}

interface EspnStandingsEntry {
  team?: EspnTeam | null;
  stats?: EspnStat[] | null;
}

interface EspnStandingsGroup {
  name?: string | null;
  abbreviation?: string | null;
  standings?: { entries?: EspnStandingsEntry[] | null } | null;
}

interface EspnStandingsResponse {
  season?: { year?: number | null; displayName?: string | null } | null;
  children?: EspnStandingsGroup[] | null;
}

interface EspnEventCompetitor {
  homeAway?: "home" | "away" | string | null;
  team?: EspnTeam | null;
  score?: string | null;
  winner?: boolean | null;
}

interface EspnEventCompetition {
  competitors?: EspnEventCompetitor[] | null;
  status?: { type?: { name?: string | null; completed?: boolean | null } | null } | null;
}

interface EspnEvent {
  id?: string | null;
  date?: string | null;
  status?: { type?: { name?: string | null; completed?: boolean | null } | null } | null;
  competitions?: EspnEventCompetition[] | null;
  season?: { type?: number | null } | null;
}

interface EspnScoreboardResponse {
  events?: EspnEvent[] | null;
  season?: { year?: number | null; type?: number | null } | null;
}

interface EspnByAthleteCategoryGlossary {
  name?: string | null;
  displayName?: string | null;
  names?: string[] | null;
}

interface EspnByAthleteCategory {
  name?: string | null;
  values?: number[] | null;
}

interface EspnByAthleteAthlete {
  id?: string | null;
  displayName?: string | null;
  teamId?: string | null;
  teamShortName?: string | null;
}

interface EspnByAthleteEntry {
  athlete?: EspnByAthleteAthlete | null;
  categories?: EspnByAthleteCategory[] | null;
}

interface EspnByAthleteResponse {
  athletes?: EspnByAthleteEntry[] | null;
  // Top-level glossary mapping each category's column index → stat name.
  categories?: EspnByAthleteCategoryGlossary[] | null;
  // Note: byathlete does not echo a season object the way `/leaders` did, so the
  // season label is sourced from the standings response instead.
}

interface EspnTeamsListItem {
  team?: EspnTeam | null;
}

interface EspnTeamsResponse {
  sports?: Array<{
    leagues?: Array<{
      teams?: EspnTeamsListItem[] | null;
    }> | null;
  }> | null;
}

interface EspnTeamScheduleResponse {
  team?: EspnTeam | null;
  events?: EspnEvent[] | null;
  season?: { year?: number | null } | null;
}

interface EspnTeamDetailResponse {
  team?: EspnTeam & { groups?: { id?: string | null } | null } | null;
}

interface NbaDataError extends Error {
  status: number;
}

function createNbaDataError(message: string, status: number): NbaDataError {
  return Object.assign(new Error(message), { status });
}

function pickStat(stats: EspnStat[] | null | undefined, ...names: string[]): EspnStat | null {
  if (!stats) return null;
  for (const name of names) {
    const lower = name.toLowerCase();
    const match = stats.find((stat) => {
      const candidates = [stat.name, stat.type].filter(Boolean) as string[];
      return candidates.some((candidate) => candidate.toLowerCase() === lower);
    });
    if (match) return match;
  }
  return null;
}

function statNumber(stat: EspnStat | null, fallback = 0): number {
  if (!stat) return fallback;
  if (typeof stat.value === "number" && Number.isFinite(stat.value)) return stat.value;
  if (typeof stat.value === "string" && stat.value.trim() !== "") {
    const parsed = Number(stat.value);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (stat.displayValue) {
    const parsed = Number(stat.displayValue);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function statString(stat: EspnStat | null): string | null {
  if (!stat) return null;
  if (typeof stat.displayValue === "string" && stat.displayValue.trim() !== "") {
    return stat.displayValue.trim();
  }
  if (typeof stat.value === "string" && stat.value.trim() !== "") return stat.value.trim();
  if (typeof stat.value === "number") return String(stat.value);
  return null;
}

function pickTeamLogo(team: EspnTeam | null | undefined): string | null {
  if (!team) return null;
  if (typeof team.logo === "string" && team.logo.trim() !== "") return team.logo.trim();
  const fromArray = team.logos?.find((l) => typeof l?.href === "string" && l.href.trim() !== "");
  return fromArray?.href?.trim() || null;
}

function teamId(team: EspnTeam | null | undefined): string | null {
  if (!team) return null;
  const abbr = team.abbreviation?.trim();
  if (abbr) return abbr.toLowerCase();
  if (team.id !== null && team.id !== undefined) return String(team.id);
  return null;
}

function teamShortName(team: EspnTeam | null | undefined, fallback = "Team"): string {
  return (
    team?.shortDisplayName?.trim() ||
    team?.name?.trim() ||
    team?.displayName?.trim() ||
    team?.location?.trim() ||
    fallback
  );
}

function teamFullName(team: EspnTeam | null | undefined, fallback = "Team"): string {
  return team?.displayName?.trim() || teamShortName(team, fallback);
}

function normalizeFixtureTeam(competitor: EspnEventCompetitor | null | undefined): NbaFixtureTeam | null {
  const team = competitor?.team;
  const id = teamId(team);
  if (!id) return null;
  return {
    id,
    name: teamFullName(team),
    shortName: teamShortName(team),
    abbreviation: team?.abbreviation?.trim() || null,
    crest: pickTeamLogo(team),
  };
}

function normalizeFixture(event: EspnEvent | null | undefined): NbaFixture | null {
  const id = event?.id;
  const utcDate = event?.date?.trim();
  const competition = event?.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  const homeRaw = competitors.find((c) => c?.homeAway === "home");
  const awayRaw = competitors.find((c) => c?.homeAway === "away");
  const homeTeam = normalizeFixtureTeam(homeRaw);
  const awayTeam = normalizeFixtureTeam(awayRaw);
  if (!id || !utcDate || !homeTeam || !awayTeam) return null;

  const statusName =
    event?.status?.type?.name?.trim() ||
    competition?.status?.type?.name?.trim() ||
    "STATUS_SCHEDULED";
  const isFinished = Boolean(
    event?.status?.type?.completed ?? competition?.status?.type?.completed
  );
  const homeScore = parseScore(homeRaw?.score);
  const awayScore = parseScore(awayRaw?.score);
  let winner: "HOME_TEAM" | "AWAY_TEAM" | null = null;
  if (isFinished) {
    if (homeRaw?.winner === true) winner = "HOME_TEAM";
    else if (awayRaw?.winner === true) winner = "AWAY_TEAM";
    else if (homeScore !== null && awayScore !== null) {
      winner = homeScore > awayScore ? "HOME_TEAM" : "AWAY_TEAM";
    }
  }

  return {
    id: String(id),
    utcDate,
    status: isFinished ? "FINISHED" : statusName,
    matchday: null,
    stage: event?.season?.type === 3 ? "Playoffs" : event?.season?.type === 2 ? "Regular Season" : null,
    homeTeam,
    awayTeam,
    score: { winner, home: homeScore, away: awayScore },
  };
}

function parseScore(score: string | null | undefined): number | null {
  if (typeof score !== "string" || score.trim() === "") return null;
  const parsed = Number(score);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildTeamFormSummary(teamIdValue: string, fixtures: NbaFixture[]): NbaFormSummary {
  return fixtures.reduce<NbaFormSummary>(
    (summary, fixture) => {
      const isHome = fixture.homeTeam.id === teamIdValue;
      const isAway = fixture.awayTeam.id === teamIdValue;
      if (!isHome && !isAway) return summary;
      const pointsFor = isHome ? fixture.score.home ?? 0 : fixture.score.away ?? 0;
      const pointsAgainst = isHome ? fixture.score.away ?? 0 : fixture.score.home ?? 0;
      const won =
        (isHome && fixture.score.winner === "HOME_TEAM") ||
        (isAway && fixture.score.winner === "AWAY_TEAM");
      summary.sequence.push(won ? "W" : "L");
      if (won) summary.wins += 1;
      else summary.losses += 1;
      summary.pointsFor += pointsFor;
      summary.pointsAgainst += pointsAgainst;
      return summary;
    },
    { sequence: [], wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 }
  );
}

async function fetchEspnJson<T>(url: string, revalidateSeconds: number): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: revalidateSeconds },
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw createNbaDataError("Requested NBA resource was not found.", 404);
      }
      throw createNbaDataError(
        "Unable to load NBA data from the upstream provider.",
        response.status >= 500 ? 503 : 502
      );
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw createNbaDataError("NBA data provider timed out.", 504);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function inferConference(group: EspnStandingsGroup): NbaConference {
  const candidates = [group.name, group.abbreviation].filter(Boolean) as string[];
  const haystack = candidates.join(" ").toLowerCase();
  if (haystack.includes("east")) return "east";
  if (haystack.includes("west")) return "west";
  return "east";
}

function normalizeStandingEntry(
  entry: EspnStandingsEntry,
  conference: NbaConference,
  position: number
): NbaTeam | null {
  const team = entry.team;
  const id = teamId(team);
  if (!id || !team) return null;
  const wins = statNumber(pickStat(entry.stats, "wins"));
  const losses = statNumber(pickStat(entry.stats, "losses"));
  const winPercent = statNumber(pickStat(entry.stats, "winPercent", "winpercent"));
  const gamesBack = statNumber(pickStat(entry.stats, "gamesBehind", "gamesback"));
  const pointsFor = statNumber(pickStat(entry.stats, "pointsFor", "avgPointsFor"));
  const pointsAgainst = statNumber(pickStat(entry.stats, "pointsAgainst", "avgPointsAgainst"));
  const pointDiff = statNumber(pickStat(entry.stats, "pointDifferential", "differential"));
  const conferenceSeed = statNumber(
    pickStat(entry.stats, "playoffSeed", "conferenceRank", "rank"),
    position
  );
  const games = wins + losses;

  return {
    id,
    abbreviation: team.abbreviation?.trim() || id.toUpperCase(),
    name: teamFullName(team),
    shortName: teamShortName(team),
    conference,
    division: null,
    conferenceSeed: Math.max(1, Math.round(conferenceSeed)),
    position,
    wins,
    losses,
    winPercent,
    gamesBack,
    gamesPlayed: games,
    pointsFor,
    pointsAgainst,
    pointDifferential: pointDiff,
    streak: statString(pickStat(entry.stats, "streak")),
    homeRecord: statString(pickStat(entry.stats, "home")),
    awayRecord: statString(pickStat(entry.stats, "road", "away")),
    lastTen: statString(pickStat(entry.stats, "lastTenGames", "lasttengames")),
  };
}

function normalizeTeamOption(team: EspnTeam | null | undefined, conference: NbaConference): NbaTeamOption | null {
  const id = teamId(team);
  if (!id || !team) return null;
  return {
    id,
    name: teamFullName(team),
    shortName: teamShortName(team),
    abbreviation: team.abbreviation?.trim() || null,
    logo: pickTeamLogo(team),
    conference,
    division: null,
    venue: team.venue?.fullName?.trim() || null,
  };
}

function normalizeTeamProfile(team: EspnTeam | null | undefined, conference: NbaConference): NbaTeamProfile | null {
  const option = normalizeTeamOption(team, conference);
  if (!option) return null;
  return {
    ...option,
    founded: null,
    primaryColor: team?.color?.trim() || null,
  };
}

const LEADER_LIMIT = 10;

/**
 * The byathlete endpoint encodes per-athlete stats as positional arrays inside
 * `athlete.categories[].values`. The column order for each category is given
 * once at the top level under `response.categories[].names`. This builds a
 * (categoryName -> Map<statName, columnIndex>) lookup so callers can read a
 * stat by its semantic name without baking column positions into the code.
 */
function buildByAthleteStatIndex(
  glossary: EspnByAthleteCategoryGlossary[] | null | undefined,
): Map<string, Map<string, number>> {
  const result = new Map<string, Map<string, number>>();
  for (const category of glossary ?? []) {
    if (!category.name) continue;
    const inner = new Map<string, number>();
    (category.names ?? []).forEach((name, index) => inner.set(name, index));
    result.set(category.name, inner);
  }
  return result;
}

function readByAthleteStat(
  entry: EspnByAthleteEntry,
  categoryName: string,
  statName: string,
  index: Map<string, Map<string, number>>,
): number {
  const columnIndex = index.get(categoryName)?.get(statName);
  if (columnIndex === undefined) return 0;
  const category = entry.categories?.find((c) => c.name === categoryName);
  const value = category?.values?.[columnIndex];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function topByAthletes(
  entries: EspnByAthleteEntry[],
  categoryName: string,
  perGameStat: string,
  totalStat: string,
  index: Map<string, Map<string, number>>,
  limit: number,
): NbaLeader[] {
  const ranked: NbaLeader[] = [];
  for (const entry of entries) {
    const name = entry.athlete?.displayName?.trim();
    const teamAbbrRaw = entry.athlete?.teamShortName?.trim();
    if (!name || !teamAbbrRaw) continue;
    const perGame = readByAthleteStat(entry, categoryName, perGameStat, index);
    if (perGame <= 0) continue;
    const total = readByAthleteStat(entry, categoryName, totalStat, index);
    const games = readByAthleteStat(entry, "general", "gamesPlayed", index);
    ranked.push({
      rank: 0,
      name,
      teamId: teamAbbrRaw.toLowerCase(),
      teamAbbreviation: teamAbbrRaw.toUpperCase(),
      total,
      appearances: games,
      perGame,
    });
  }
  return ranked
    .sort((a, b) => b.perGame - a.perGame)
    .slice(0, limit)
    .map((leader, i) => ({ ...leader, rank: i + 1 }));
}

function buildSeasonLabel(season: { year?: number | null; displayName?: string | null } | null | undefined): string {
  if (season?.displayName) return season.displayName;
  const year = season?.year ?? null;
  if (year) {
    const next = String(year + 1).slice(-2);
    return `${year}/${next}`;
  }
  return "Current season";
}

export function isValidNbaTeamId(teamId: string): boolean {
  return /^[a-z0-9]{2,4}$/i.test(teamId);
}

export function createEmptyNbaSnapshot(): NbaSnapshot {
  return {
    season: "Current season",
    updatedAt: new Date().toISOString().slice(0, 10),
    sourceLabel: "ESPN",
    sourceUrls: {
      standings: "https://www.espn.com/nba/standings",
      leaders: "https://www.espn.com/nba/statistics",
      scoreboard: "https://www.espn.com/nba/scoreboard",
    },
    teamsByConference: { east: [], west: [] },
    scorers: [],
    rebounders: [],
    assistLeaders: [],
    recentFixtures: [],
    upcomingFixtures: [],
    teams: [],
    teamSnapshots: {},
  };
}

export async function getNbaSummary(): Promise<{
  season: string;
  teamsByConference: { east: NbaTeam[]; west: NbaTeam[] };
  scorers: NbaLeader[];
  rebounders: NbaLeader[];
  assistLeaders: NbaLeader[];
  recentFixtures: NbaFixture[];
  upcomingFixtures: NbaFixture[];
  teams: NbaTeamOption[];
  generatedAt: string;
}> {
  // `level=2` returns conferences with 15 entries each. The previous query
  // (`level=3&group=conference`) returns 400 as of 2026-04 — `&group=conference`
  // is rejected, and `level=3` alone splits down to divisions, leaving the
  // conference children with empty `entries` arrays.
  const standingsUrl = `${ESPN_STANDINGS_URL}?level=2`;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setUTCDate(today.getUTCDate() - 7);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(today.getUTCDate() + 7);
  const dateRange = `${formatEspnDate(yesterday)}-${formatEspnDate(tomorrow)}`;
  const scoreboardUrl = `${ESPN_BASE_URL}/scoreboard?dates=${dateRange}&limit=200`;
  const leadersUrl = ESPN_BYATHLETE_URL;
  const teamsUrl = `${ESPN_BASE_URL}/teams?limit=40`;

  const [standingsResponse, scoreboardResponse, leadersResponse, teamsResponse] = await Promise.all([
    fetchEspnJson<EspnStandingsResponse>(standingsUrl, SUMMARY_REVALIDATE_SECONDS),
    fetchEspnJson<EspnScoreboardResponse>(scoreboardUrl, SUMMARY_REVALIDATE_SECONDS),
    fetchEspnJson<EspnByAthleteResponse>(leadersUrl, SUMMARY_REVALIDATE_SECONDS),
    fetchEspnJson<EspnTeamsResponse>(teamsUrl, SUMMARY_REVALIDATE_SECONDS),
  ]);

  const teamsByConference: { east: NbaTeam[]; west: NbaTeam[] } = { east: [], west: [] };
  for (const group of standingsResponse.children ?? []) {
    const conference = inferConference(group);
    const entries = group.standings?.entries ?? [];
    const teams = entries
      .map((entry, index) => normalizeStandingEntry(entry, conference, index + 1))
      .filter((team): team is NbaTeam => team !== null)
      .sort((a, b) => b.winPercent - a.winPercent || b.wins - a.wins)
      .map((team, index) => ({ ...team, position: index + 1, conferenceSeed: index + 1 }));
    teamsByConference[conference] = teams;
  }

  const fixtures = (scoreboardResponse.events ?? [])
    .map((event) => normalizeFixture(event))
    .filter((fixture): fixture is NbaFixture => fixture !== null);

  const recentFixtures = fixtures
    .filter((fixture) => fixture.status === "FINISHED")
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    .slice(0, RECENT_FIXTURE_LIMIT);

  const upcomingFixtures = fixtures
    .filter((fixture) => fixture.status !== "FINISHED")
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
    .slice(0, UPCOMING_FIXTURE_LIMIT);

  const statIndex = buildByAthleteStatIndex(leadersResponse.categories);
  const allAthletes = leadersResponse.athletes ?? [];

  const scorers = topByAthletes(
    allAthletes,
    "offensive",
    "avgPoints",
    "points",
    statIndex,
    LEADER_LIMIT,
  );
  const rebounders = topByAthletes(
    allAthletes,
    "general",
    "avgRebounds",
    "rebounds",
    statIndex,
    LEADER_LIMIT,
  );
  const assistLeaders = topByAthletes(
    allAthletes,
    "offensive",
    "avgAssists",
    "assists",
    statIndex,
    LEADER_LIMIT,
  );

  const conferenceById = new Map<string, NbaConference>();
  for (const team of [...teamsByConference.east, ...teamsByConference.west]) {
    conferenceById.set(team.id, team.conference);
  }

  const teams = (teamsResponse.sports?.[0]?.leagues?.[0]?.teams ?? [])
    .map((wrapper) => {
      const id = teamId(wrapper.team);
      const conference: NbaConference = (id && conferenceById.get(id)) || "east";
      return normalizeTeamOption(wrapper.team, conference);
    })
    .filter((team): team is NbaTeamOption => team !== null)
    .sort((a, b) => a.shortName.localeCompare(b.shortName));

  return {
    season: buildSeasonLabel(standingsResponse.season),
    teamsByConference,
    scorers,
    rebounders,
    assistLeaders,
    recentFixtures,
    upcomingFixtures,
    teams,
    generatedAt: new Date().toISOString(),
  };
}

function formatEspnDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export async function getNbaTeamSnapshot(
  teamId: string,
  conference: NbaConference = "east"
): Promise<NbaTeamSnapshot> {
  if (!isValidNbaTeamId(teamId)) {
    throw createNbaDataError("Invalid NBA team id.", 400);
  }
  const scheduleUrl = `${ESPN_BASE_URL}/teams/${encodeURIComponent(teamId)}/schedule`;
  const detailUrl = `${ESPN_BASE_URL}/teams/${encodeURIComponent(teamId)}`;

  const [scheduleResponse, detailResponse] = await Promise.all([
    fetchEspnJson<EspnTeamScheduleResponse>(scheduleUrl, TEAM_REVALIDATE_SECONDS),
    fetchEspnJson<EspnTeamDetailResponse>(detailUrl, TEAM_REVALIDATE_SECONDS).catch(() => ({} as EspnTeamDetailResponse)),
  ]);

  const profileTeam = detailResponse.team ?? scheduleResponse.team ?? null;
  const team = normalizeTeamProfile(profileTeam, conference);
  const fixtures = (scheduleResponse.events ?? [])
    .map((event) => normalizeFixture(event))
    .filter((fixture): fixture is NbaFixture => fixture !== null);
  const teamCanonicalId = team?.id ?? teamId.toLowerCase();

  const recentFixtures = fixtures
    .filter((fixture) => fixture.status === "FINISHED")
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    .slice(0, TEAM_FIXTURE_LIMIT);
  const upcomingFixtures = fixtures
    .filter((fixture) => fixture.status !== "FINISHED")
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
    .slice(0, TEAM_FIXTURE_LIMIT);

  return {
    team,
    recentFixtures,
    upcomingFixtures,
    form: buildTeamFormSummary(teamCanonicalId, recentFixtures),
    generatedAt: new Date().toISOString(),
  };
}

// ESPN's hidden API has no documented rate limit, but stay polite.
const TEAM_FETCH_DELAY_MS = 1_500;
const NBA_SNAPSHOT_PATH = "src/data/nbaSnapshot.ts";

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function readExistingTeamSnapshots(filePath: string): Record<string, NbaTeamSnapshot> {
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

export async function buildNbaSnapshot(options?: { skipTeamSnapshots?: boolean }): Promise<NbaSnapshot> {
  const summary = await getNbaSummary();
  const generatedAt = new Date().toISOString();
  let teamSnapshots: Record<string, NbaTeamSnapshot> = {};

  if (options?.skipTeamSnapshots) {
    teamSnapshots = readExistingTeamSnapshots(NBA_SNAPSHOT_PATH);
    console.log(`  Preserved ${Object.keys(teamSnapshots).length} existing team snapshots.`);
  } else {
    const conferenceById = new Map<string, NbaConference>();
    for (const team of [...summary.teamsByConference.east, ...summary.teamsByConference.west]) {
      conferenceById.set(team.id, team.conference);
    }
    const entries: Array<[string, NbaTeamSnapshot]> = [];
    for (const team of summary.teams) {
      await delay(TEAM_FETCH_DELAY_MS);
      const conference = conferenceById.get(team.id) ?? "east";
      try {
        const snap = await getNbaTeamSnapshot(team.id, conference);
        entries.push([team.id, { ...snap, generatedAt }]);
      } catch (err) {
        console.warn(`  Skipping team ${team.id} (${team.shortName}): ${(err as Error).message}`);
      }
    }
    teamSnapshots = Object.fromEntries(entries);
  }

  return {
    season: summary.season,
    updatedAt: generatedAt.slice(0, 10),
    sourceLabel: "ESPN",
    sourceUrls: {
      standings: "https://www.espn.com/nba/standings",
      leaders: "https://www.espn.com/nba/statistics",
      scoreboard: "https://www.espn.com/nba/scoreboard",
    },
    teamsByConference: summary.teamsByConference,
    scorers: summary.scorers,
    rebounders: summary.rebounders,
    assistLeaders: summary.assistLeaders,
    recentFixtures: summary.recentFixtures,
    upcomingFixtures: summary.upcomingFixtures,
    teams: summary.teams,
    teamSnapshots,
  };
}
