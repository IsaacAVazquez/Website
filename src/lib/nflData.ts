import type {
  NFLConference,
  NFLDivision,
  NFLFixture,
  NFLFixtureTeam,
  NFLFormSummary,
  NFLLeader,
  NFLLeaderboards,
  NFLSnapshot,
  NFLTeamOption,
  NFLTeamProfile,
  NFLTeamSnapshot,
  NFLTeamStanding,
} from "@/types/nfl";

const STANDINGS_URL =
  "https://github.com/nflverse/nfldata/raw/master/data/standings.csv";
const GAMES_URL =
  "https://github.com/nflverse/nfldata/raw/master/data/games.csv";
const TEAMS_LOGOS_URL =
  "https://github.com/nflverse/nflfastR-data/raw/master/teams_colors_logos.csv";

const REQUEST_TIMEOUT_MS = 30_000;
const RECENT_FIXTURE_LIMIT = 8;
const UPCOMING_FIXTURE_LIMIT = 8;
const TEAM_FIXTURE_LIMIT = 5;
const LEADER_LIMIT = 10;

interface NFLDataError extends Error {
  status: number;
}

function createNFLDataError(message: string, status: number): NFLDataError {
  return Object.assign(new Error(message), { status });
}

async function fetchTextOnce(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw createNFLDataError(
        `Unable to load NFL data from ${url} (HTTP ${response.status}).`,
        response.status >= 500 ? 503 : 502
      );
    }
    return await response.text();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw createNFLDataError(`NFL data source timed out: ${url}`, 504);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchText(url: string): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await fetchTextOnce(url);
    } catch (error) {
      lastError = error;
      const status = (error as NFLDataError).status;
      if (status === 404 || status === 400) throw error;
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

function parseCsvRow(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length === 0) {
    return [];
  }
  const headers = parseCsvRow(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvRow(line);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] ?? "").trim();
    });
    return row;
  });
}

function parseNumber(value: string | undefined): number | null {
  if (value === undefined || value === "" || value === "NA") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function parseInteger(value: string | undefined): number | null {
  const num = parseNumber(value);
  return num === null ? null : Math.trunc(num);
}

interface TeamMeta {
  abbr: string;
  name: string;
  nickname: string;
  location: string;
  shortName: string;
  conference: NFLConference;
  division: NFLDivision;
  primaryColor: string | null;
  secondaryColor: string | null;
  logo: string | null;
  wordmark: string | null;
}

const TEAM_ABBR_ALIASES: Record<string, string> = {
  LA: "LA",
  STL: "LA",
  SD: "LAC",
  OAK: "LV",
  WSH: "WAS",
  JAC: "JAX",
};

function canonicalizeTeamAbbr(abbr: string | undefined | null): string {
  if (!abbr) return "";
  const upper = abbr.trim().toUpperCase();
  return TEAM_ABBR_ALIASES[upper] ?? upper;
}

function isConference(value: string): value is NFLConference {
  return value === "AFC" || value === "NFC";
}

const ALLOWED_DIVISIONS: NFLDivision[] = [
  "AFC East",
  "AFC North",
  "AFC South",
  "AFC West",
  "NFC East",
  "NFC North",
  "NFC South",
  "NFC West",
];

function isDivision(value: string): value is NFLDivision {
  return (ALLOWED_DIVISIONS as string[]).includes(value);
}

async function loadTeamMeta(): Promise<Map<string, TeamMeta>> {
  const csv = await fetchText(TEAMS_LOGOS_URL);
  const rows = parseCsv(csv);
  const out = new Map<string, TeamMeta>();
  for (const row of rows) {
    const abbr = canonicalizeTeamAbbr(row.team_abbr);
    if (!abbr) continue;
    const conference = row.team_conf;
    const division = row.team_division;
    if (!isConference(conference) || !isDivision(division)) continue;
    const fullName = row.team_name?.trim() || abbr;
    const nickname = row.team_nick?.trim() || fullName;
    const location = fullName.endsWith(nickname)
      ? fullName.slice(0, fullName.length - nickname.length).trim()
      : fullName;
    out.set(abbr, {
      abbr,
      name: fullName,
      nickname,
      location: location || fullName,
      shortName: nickname || abbr,
      conference,
      division,
      primaryColor: row.team_color?.trim() || null,
      secondaryColor: row.team_color2?.trim() || null,
      logo: row.team_logo_espn?.trim() || row.team_logo_wikipedia?.trim() || null,
      wordmark: row.team_wordmark?.trim() || null,
    });
  }
  return out;
}

interface RawStanding {
  abbr: string;
  conference: NFLConference;
  division: NFLDivision;
  divisionRank: number;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
  seed: number | null;
  playoffResult: string | null;
}

function selectLatestSeason(rows: Record<string, string>[]): {
  season: string;
  rows: Record<string, string>[];
} {
  const totalsBySeason = new Map<number, number>();
  for (const row of rows) {
    const season = parseInteger(row.season);
    if (season === null) continue;
    const games =
      (parseInteger(row.wins) ?? 0) +
      (parseInteger(row.losses) ?? 0) +
      (parseInteger(row.ties) ?? 0);
    totalsBySeason.set(season, (totalsBySeason.get(season) ?? 0) + games);
  }
  let latest = 0;
  Array.from(totalsBySeason.entries()).forEach(([season, totalGames]) => {
    if (totalGames > 0 && season > latest) {
      latest = season;
    }
  });
  if (latest === 0) {
    throw createNFLDataError(
      "No standings rows with games played found in NFLverse standings CSV.",
      502
    );
  }
  const seasonStr = String(latest);
  return {
    season: seasonStr,
    rows: rows.filter((row) => row.season === seasonStr),
  };
}

async function loadStandings(): Promise<{
  season: string;
  standings: RawStanding[];
}> {
  const csv = await fetchText(STANDINGS_URL);
  const rows = parseCsv(csv);
  const { season, rows: seasonRows } = selectLatestSeason(rows);
  const out: RawStanding[] = [];
  for (const row of seasonRows) {
    const abbr = canonicalizeTeamAbbr(row.team);
    const conference = row.conf;
    const division = row.division;
    if (!abbr || !isConference(conference) || !isDivision(division)) continue;
    out.push({
      abbr,
      conference,
      division,
      divisionRank: parseInteger(row.div_rank) ?? 0,
      wins: parseInteger(row.wins) ?? 0,
      losses: parseInteger(row.losses) ?? 0,
      ties: parseInteger(row.ties) ?? 0,
      winPct: parseNumber(row.pct) ?? 0,
      pointsFor: parseInteger(row.scored) ?? 0,
      pointsAgainst: parseInteger(row.allowed) ?? 0,
      pointDifferential: parseInteger(row.net) ?? 0,
      seed: parseInteger(row.seed),
      playoffResult: row.playoff?.trim() || null,
    });
  }
  return { season, standings: out };
}

function buildStandings(
  raw: RawStanding[],
  teamMeta: Map<string, TeamMeta>
): NFLTeamStanding[] {
  const enriched = raw
    .map((row) => {
      const meta = teamMeta.get(row.abbr);
      if (!meta) return null;
      return { row, meta };
    })
    .filter((entry): entry is { row: RawStanding; meta: TeamMeta } => entry !== null);

  const conferenceRank = new Map<string, number>();
  for (const conference of ["AFC", "NFC"] as const) {
    const inConference = enriched.filter((entry) => entry.meta.conference === conference);
    inConference.sort((a, b) => {
      if (a.row.seed !== null && b.row.seed !== null) {
        return a.row.seed - b.row.seed;
      }
      if (a.row.seed !== null) return -1;
      if (b.row.seed !== null) return 1;
      if (b.row.winPct !== a.row.winPct) return b.row.winPct - a.row.winPct;
      return b.row.pointDifferential - a.row.pointDifferential;
    });
    inConference.forEach((entry, index) => {
      conferenceRank.set(entry.meta.abbr, index + 1);
    });
  }

  return enriched
    .map(({ row, meta }) => ({
      id: row.abbr.toLowerCase(),
      abbr: row.abbr,
      name: meta.name,
      shortName: meta.shortName,
      conference: row.conference,
      division: row.division,
      divisionRank: row.divisionRank,
      conferenceRank: conferenceRank.get(meta.abbr) ?? 0,
      wins: row.wins,
      losses: row.losses,
      ties: row.ties,
      winPct: row.winPct,
      pointsFor: row.pointsFor,
      pointsAgainst: row.pointsAgainst,
      pointDifferential: row.pointDifferential,
      seed: row.seed,
      playoffResult: row.playoffResult,
    }))
    .sort((a, b) => {
      if (a.conference !== b.conference) {
        return a.conference === "AFC" ? -1 : 1;
      }
      return a.conferenceRank - b.conferenceRank;
    });
}

function buildTeamOptions(
  standings: NFLTeamStanding[],
  teamMeta: Map<string, TeamMeta>
): NFLTeamOption[] {
  return standings
    .map((standing) => {
      const meta = teamMeta.get(standing.abbr);
      if (!meta) return null;
      return {
        id: standing.id,
        abbr: standing.abbr,
        name: meta.name,
        shortName: meta.shortName,
        location: meta.location,
        nickname: meta.nickname,
        conference: standing.conference,
        division: standing.division,
        primaryColor: meta.primaryColor,
        secondaryColor: meta.secondaryColor,
        logo: meta.logo,
      } satisfies NFLTeamOption;
    })
    .filter((entry): entry is NFLTeamOption => entry !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildTeamProfile(
  standing: NFLTeamStanding,
  teamMeta: Map<string, TeamMeta>
): NFLTeamProfile | null {
  const meta = teamMeta.get(standing.abbr);
  if (!meta) return null;
  return {
    id: standing.id,
    abbr: standing.abbr,
    name: meta.name,
    shortName: meta.shortName,
    location: meta.location,
    nickname: meta.nickname,
    conference: standing.conference,
    division: standing.division,
    primaryColor: meta.primaryColor,
    secondaryColor: meta.secondaryColor,
    logo: meta.logo,
    wordmark: meta.wordmark,
  };
}

function makeFixtureTeam(
  abbr: string,
  teamMeta: Map<string, TeamMeta>
): NFLFixtureTeam | null {
  const canon = canonicalizeTeamAbbr(abbr);
  if (!canon) return null;
  const meta = teamMeta.get(canon);
  return {
    id: canon.toLowerCase(),
    abbr: canon,
    shortName: meta?.shortName ?? canon,
    crest: meta?.logo ?? null,
  };
}

/**
 * Offset (in ms) of `America/New_York` at a given instant. Positive means the
 * zone is ahead of UTC, negative means behind (ET is always behind: -5h in
 * winter EST, -4h in summer EDT). We derive it from `Intl.DateTimeFormat`
 * rather than hardcoding an offset: format the instant in the zone, read the
 * wall-clock parts back, interpret them as UTC, and the delta from the original
 * instant is the zone's offset for that date.
 */
function newYorkOffsetMs(instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const lookup: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== "literal") lookup[part.type] = Number(part.value);
  }
  const asUtc = Date.UTC(
    lookup.year,
    lookup.month - 1,
    lookup.day,
    lookup.hour,
    lookup.minute,
    lookup.second
  );
  return asUtc - instant.getTime();
}

/**
 * NFLverse `games.csv` stores `gameday` (YYYY-MM-DD) and `gametime` (HH:MM, 24h)
 * as US/Eastern *wall-clock* time, not UTC. Appending a naive `Z` (as the old
 * code did) stamped every kickoff 4-5 hours early. This converts the ET
 * wall-clock time to the correct UTC ISO string, honoring EST vs EDT by date.
 */
export function etToUtcIso(gameday: string, gametime: string): string {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(gameday.trim());
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(gametime.trim());
  if (!dateMatch || !timeMatch) {
    // Preserve the previous (loose) behavior for unexpected shapes rather than
    // dropping the fixture; real NFLverse rows always match the patterns above.
    return `${gameday}T${gametime}:00Z`;
  }
  const [, year, month, day] = dateMatch;
  const [, hour, minute] = timeMatch;
  // Interpret the ET wall-clock components as if they were UTC, then subtract
  // the zone's offset at that instant to land on the true UTC instant. NFL
  // kickoffs never fall in the 2 a.m. DST-transition hour, so a single-pass
  // offset lookup is exact for every real value.
  const naiveUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    0
  );
  const offsetMs = newYorkOffsetMs(new Date(naiveUtc));
  return new Date(naiveUtc - offsetMs).toISOString().replace(/\.000Z$/, "Z");
}

function buildFixtures(
  rows: Record<string, string>[],
  season: string,
  teamMeta: Map<string, TeamMeta>
): NFLFixture[] {
  const fixtures: NFLFixture[] = [];
  for (const row of rows) {
    if (row.season !== season) continue;
    const homeAbbr = row.home_team;
    const awayAbbr = row.away_team;
    const homeTeam = makeFixtureTeam(homeAbbr, teamMeta);
    const awayTeam = makeFixtureTeam(awayAbbr, teamMeta);
    if (!homeTeam || !awayTeam) continue;
    const week = parseInteger(row.week);
    const gameType = row.game_type?.trim() || null;
    const homeScore = parseInteger(row.home_score);
    const awayScore = parseInteger(row.away_score);
    const isFinished = homeScore !== null && awayScore !== null;
    let winner: NFLFixture["score"]["winner"] = null;
    if (isFinished) {
      if (homeScore === awayScore) winner = "TIE";
      else if (homeScore > awayScore) winner = "HOME_TEAM";
      else winner = "AWAY_TEAM";
    }
    const gameday = row.gameday?.trim();
    const gametime = row.gametime?.trim();
    const isoDate = gameday
      ? gametime
        ? etToUtcIso(gameday, gametime)
        : `${gameday}T17:00:00Z`
      : "";
    if (!isoDate) continue;
    fixtures.push({
      id: row.game_id?.trim() || `${season}-w${week}-${awayAbbr}-${homeAbbr}`,
      utcDate: isoDate,
      status: isFinished ? "FINISHED" : "SCHEDULED",
      week,
      matchday: week,
      gameType,
      homeTeam,
      awayTeam,
      score: {
        winner,
        home: homeScore,
        away: awayScore,
      },
    });
  }
  return fixtures;
}

function getCurrentWeek(fixtures: NFLFixture[]): number {
  const finishedRegular = fixtures.filter(
    (f) => f.status === "FINISHED" && f.gameType === "REG" && f.week !== null
  );
  if (finishedRegular.length === 0) return 0;
  return Math.max(...finishedRegular.map((f) => f.week ?? 0));
}

function buildFormSummary(teamId: string, fixtures: NFLFixture[]): NFLFormSummary {
  return fixtures.reduce<NFLFormSummary>(
    (summary, fixture) => {
      const isHome = fixture.homeTeam.id === teamId;
      const isAway = fixture.awayTeam.id === teamId;
      if (!isHome && !isAway) return summary;
      const pointsFor = (isHome ? fixture.score.home : fixture.score.away) ?? 0;
      const pointsAgainst = (isHome ? fixture.score.away : fixture.score.home) ?? 0;
      if (fixture.score.winner === "TIE") {
        summary.sequence.push("T");
        summary.ties += 1;
      } else if (
        (isHome && fixture.score.winner === "HOME_TEAM") ||
        (isAway && fixture.score.winner === "AWAY_TEAM")
      ) {
        summary.sequence.push("W");
        summary.wins += 1;
      } else {
        summary.sequence.push("L");
        summary.losses += 1;
      }
      summary.pointsFor += pointsFor;
      summary.pointsAgainst += pointsAgainst;
      return summary;
    },
    { sequence: [], wins: 0, ties: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 }
  );
}

function buildTeamSnapshot(
  standing: NFLTeamStanding,
  fixtures: NFLFixture[],
  teamMeta: Map<string, TeamMeta>,
  generatedAt: string
): NFLTeamSnapshot {
  const teamFixtures = fixtures
    .filter(
      (f) => f.homeTeam.id === standing.id || f.awayTeam.id === standing.id
    )
    .filter((f) => f.gameType === "REG" || f.gameType === "POST");
  const recentFixtures = teamFixtures
    .filter((f) => f.status === "FINISHED")
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    .slice(0, TEAM_FIXTURE_LIMIT);
  const upcomingFixtures = teamFixtures
    .filter((f) => f.status !== "FINISHED")
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
    .slice(0, TEAM_FIXTURE_LIMIT);
  return {
    team: buildTeamProfile(standing, teamMeta),
    recentFixtures,
    upcomingFixtures,
    form: buildFormSummary(standing.id, recentFixtures),
    generatedAt,
  };
}

interface PlayerStatRow {
  name: string;
  team: string;
  position: string;
  games: number;
  passingYards: number;
  rushingYards: number;
  receivingYards: number;
  defSacks: number;
}

async function loadPlayerStats(season: string): Promise<PlayerStatRow[]> {
  const url = `https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_reg_${season}.csv`;
  let csv: string;
  try {
    csv = await fetchText(url);
  } catch (err) {
    console.warn(
      `🏈 Unable to load NFL player stats for ${season}: ${(err as Error).message}`
    );
    return [];
  }
  const rows = parseCsv(csv);
  return rows.map((row) => ({
    name: row.player_display_name?.trim() || row.player_name?.trim() || "Unknown",
    team: canonicalizeTeamAbbr(row.recent_team),
    position: row.position?.trim() || "",
    games: parseInteger(row.games) ?? 0,
    passingYards: parseInteger(row.passing_yards) ?? 0,
    rushingYards: parseInteger(row.rushing_yards) ?? 0,
    receivingYards: parseInteger(row.receiving_yards) ?? 0,
    defSacks: parseNumber(row.def_sacks) ?? 0,
  }));
}

function topLeaders(
  rows: PlayerStatRow[],
  pick: (row: PlayerStatRow) => number,
  positionFilter?: (position: string) => boolean
): NFLLeader[] {
  const filtered = rows
    .filter((row) => row.team)
    .filter((row) => (positionFilter ? positionFilter(row.position) : true))
    .filter((row) => row.games > 0 && pick(row) > 0)
    .map((row) => ({ row, total: pick(row) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, LEADER_LIMIT);
  return filtered.map((entry, index) => ({
    rank: index + 1,
    name: entry.row.name,
    teamId: entry.row.team.toLowerCase(),
    teamCode: entry.row.team,
    position: entry.row.position,
    total: entry.total,
    games: entry.row.games,
    perGame: entry.row.games ? entry.total / entry.row.games : 0,
  }));
}

function buildLeaderboards(rows: PlayerStatRow[]): NFLLeaderboards {
  return {
    passing: topLeaders(rows, (r) => r.passingYards, (pos) => pos === "QB"),
    rushing: topLeaders(rows, (r) => r.rushingYards),
    receiving: topLeaders(rows, (r) => r.receivingYards),
    sacks: topLeaders(rows, (r) => r.defSacks),
  };
}

export function isValidNflTeamId(teamId: string): boolean {
  return /^[a-z]{2,4}$/i.test(teamId);
}

/**
 * The NFL season starts in early September. Once we cross into the new
 * calendar year (Jan–Aug) we're still talking about the previous fall's
 * season, so this returns last calendar year for those months. Mirrors the
 * MLB `getCurrentSeason()` shape (which inverts: MLB rolls forward in Nov).
 */
function getCurrentSeason(): string {
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();
  return month < 9 ? String(year - 1) : String(year);
}

export function createEmptyNflSnapshot(): NFLSnapshot {
  return {
    season: getCurrentSeason(),
    week: 0,
    updatedAt: new Date().toISOString().slice(0, 10),
    sourceLabel: "NFLverse",
    sourceUrls: {
      standings: STANDINGS_URL,
      games: GAMES_URL,
      teams: TEAMS_LOGOS_URL,
      leaders: "",
    },
    teams: [],
    leaders: { passing: [], rushing: [], receiving: [], sacks: [] },
    recentFixtures: [],
    upcomingFixtures: [],
    teamOptions: [],
    teamSnapshots: {},
  };
}

export interface BuildNflSnapshotOptions {
  skipPlayerLeaders?: boolean;
  skipTeamSnapshots?: boolean;
}

export async function buildNflSnapshot(
  options: BuildNflSnapshotOptions = {}
): Promise<NFLSnapshot> {
  const generatedAt = new Date().toISOString();

  const teamMeta = await loadTeamMeta();
  const { season, standings: rawStandings } = await loadStandings();
  const standings = buildStandings(rawStandings, teamMeta);
  const teamOptions = buildTeamOptions(standings, teamMeta);

  const gamesCsv = await fetchText(GAMES_URL);
  const allFixtures = buildFixtures(parseCsv(gamesCsv), season, teamMeta);
  const week = getCurrentWeek(allFixtures);

  const regularFixtures = allFixtures.filter(
    (f) => f.gameType === "REG" || f.gameType === "POST"
  );

  const recentFixtures = regularFixtures
    .filter((f) => f.status === "FINISHED")
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    .slice(0, RECENT_FIXTURE_LIMIT);

  const upcomingFixtures = regularFixtures
    .filter((f) => f.status !== "FINISHED")
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
    .slice(0, UPCOMING_FIXTURE_LIMIT);

  let leaders: NFLLeaderboards = { passing: [], rushing: [], receiving: [], sacks: [] };
  if (!options.skipPlayerLeaders) {
    const stats = await loadPlayerStats(season);
    leaders = buildLeaderboards(stats);
  }

  let teamSnapshots: Record<string, NFLTeamSnapshot> = {};
  if (!options.skipTeamSnapshots) {
    teamSnapshots = Object.fromEntries(
      standings.map((standing) => [
        standing.id,
        buildTeamSnapshot(standing, regularFixtures, teamMeta, generatedAt),
      ])
    );
  }

  return {
    season,
    week,
    updatedAt: generatedAt.slice(0, 10),
    sourceLabel: "NFLverse",
    sourceUrls: {
      standings: STANDINGS_URL,
      games: GAMES_URL,
      teams: TEAMS_LOGOS_URL,
      leaders: `https://github.com/nflverse/nflverse-data/releases/tag/stats_player`,
    },
    teams: standings,
    leaders,
    recentFixtures,
    upcomingFixtures,
    teamOptions,
    teamSnapshots,
  };
}
