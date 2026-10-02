/**
 * football-data.org competition pipeline shared by the Premier League and La
 * Liga modules. Everything that depends only on the provider's wire shape
 * lives here, parameterized by a `FootballLeague`; the two league modules keep
 * the parts that genuinely differ (their standings row and summary shapes).
 */

import type {
  PremierLeagueFixture as Fixture,
  PremierLeagueFixtureTeam as FixtureTeam,
  PremierLeagueFormSummary as FormSummary,
  PremierLeagueMatchdayGoals as MatchdayGoals,
  PremierLeagueTeamOption as TeamOption,
  PremierLeagueTeamProfile as TeamProfile,
  PremierLeagueTeamSnapshot as TeamSnapshot,
} from "@/types/premier-league";
import {
  SUMMARY_REVALIDATE_SECONDS,
  TEAM_REVALIDATE_SECONDS,
  RECENT_FIXTURE_LIMIT,
  UPCOMING_FIXTURE_LIMIT,
  TEAM_FIXTURE_LIMIT,
  SEASON_FIXTURES_REVALIDATE_SECONDS,
  fetchFootballDataJson,
  pruneToTable,
  type FootballDataTeam,
  type FootballDataSeason,
  type FootballDataStandingEntry,
  type FootballDataCompetitionStandingsResponse,
  type FootballDataMatch,
  type FootballDataMatchesResponse,
  type FootballDataCompetitionTeamsResponse,
  type FootballDataScorerEntry,
  type FootballDataScorersResponse,
} from "@/lib/footballData";
import { HttpStatusError } from "@/lib/utils";
import { readExistingTeamSnapshots } from "@/lib/existingTeamSnapshots";

export interface FootballLeague<Row> {
  /** Display name used in error messages, e.g. "Premier League". */
  label: string;
  /** football-data.org competition code, e.g. "PL". */
  code: string;
  /** Committed snapshot file, relative to the project root. */
  snapshotPath: string;
  accentColor: (tla: string | null | undefined) => string | null;
  normalizeStandingRow: (raw: FootballDataStandingEntry | null | undefined) => Row | null;
  playedGames: (row: Row) => number;
}

/** The row-independent part of a league, enough for the per-team requests. */
type LeagueIdentity = Pick<FootballLeague<unknown>, "label" | "code" | "snapshotPath" | "accentColor">;

export function isValidTeamId(teamId: string): boolean {
  return /^[1-9]\d*$/.test(teamId);
}

export function seasonStartYear(startDate?: string | null): number | null {
  if (!startDate) return null;
  const year = new Date(startDate).getUTCFullYear();
  return Number.isFinite(year) ? year : null;
}

/**
 * True when the competition's current season hasn't actually started, so the
 * live endpoints return a placeholder. football-data.org rolls the season
 * pointer weeks ahead of kickoff: the Premier League table comes back zeroed,
 * and La Liga keeps last season's table under a future-dated label. Either
 * signal means we should pin to the completed prior season instead.
 */
export function seasonNotStarted(
  season: FootballDataSeason | null | undefined,
  playedGames: readonly number[],
  now: Date = new Date()
): boolean {
  if (playedGames.length > 0 && playedGames.every((played) => played === 0)) return true;
  const startMs = season?.startDate ? new Date(season.startDate).getTime() : NaN;
  return Number.isFinite(startMs) && startMs > now.getTime();
}

export function normalizeFixtureTeam(raw: FootballDataTeam | null | undefined): FixtureTeam | null {
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

export function normalizeTeamOption(
  raw: FootballDataTeam | null | undefined,
  accentColor: FootballLeague<unknown>["accentColor"]
): TeamOption | null {
  const team = normalizeFixtureTeam(raw);
  if (!team) return null;
  return {
    ...team,
    venue: raw?.venue?.trim() || null,
    accentColor: accentColor(team.tla),
  };
}

export function normalizeTeamProfile(
  raw: FootballDataTeam | null | undefined,
  accentColor: FootballLeague<unknown>["accentColor"]
): TeamProfile | null {
  const team = normalizeTeamOption(raw, accentColor);
  if (!team) return null;
  return {
    ...team,
    founded: typeof raw?.founded === "number" ? raw.founded : null,
    clubColors: raw?.clubColors?.trim() || null,
    website: raw?.website?.trim() || null,
    address: raw?.address?.trim() || null,
    // football-data.org's team-detail response doesn't always include a coach
    // (varies by tier/team); skip silently (null) when it's absent.
    manager: raw?.coach?.name?.trim() || null,
  };
}

export function normalizeFixture(raw: FootballDataMatch | null | undefined): Fixture | null {
  const matchId = raw?.id;
  const utcDate = raw?.utcDate?.trim();
  const homeTeam = normalizeFixtureTeam(raw?.homeTeam);
  const awayTeam = normalizeFixtureTeam(raw?.awayTeam);
  if (typeof matchId !== "number" || !utcDate || !homeTeam || !awayTeam) return null;
  const status = raw?.status?.trim() || "UNKNOWN";
  return {
    id: String(matchId),
    utcDate,
    status,
    // The provider keeps a match SCHEDULED at midnight UTC while it only has a
    // rough date, and moves it to TIMED once the kickoff is fixed.
    ...(status === "SCHEDULED" ? { startTimeTbd: true } : {}),
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

/** Normalized fixtures, newest first for "recent" and soonest first for "upcoming", capped. */
function fixturesFrom(
  matches: FootballDataMatch[] | null | undefined,
  order: "recent" | "upcoming",
  limit: number
): Fixture[] {
  const sign = order === "recent" ? -1 : 1;
  return (matches ?? [])
    .map((match) => normalizeFixture(match))
    .filter((match): match is Fixture => match !== null)
    .sort((a, b) => sign * (new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()))
    .slice(0, limit);
}

/**
 * Aggregates a season's worth of FINISHED matches into a matchday → total
 * league goals series. Operates on the raw upstream match shape since only
 * `matchday` and the final score are needed. Matches missing either are
 * skipped rather than dropping the whole series.
 */
export function buildGoalsPerMatchday(matches: FootballDataMatch[]): MatchdayGoals[] {
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

export function buildTeamFormSummary(teamId: string, fixtures: Fixture[]): FormSummary {
  return fixtures.reduce<FormSummary>(
    (summary, fixture) => {
      const isHome = fixture.homeTeam.id === teamId;
      const isAway = fixture.awayTeam.id === teamId;
      if (!isHome && !isAway) return summary;
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
    },
    { sequence: [], wins: 0, draws: 0, losses: 0, points: 0, goalsFor: 0, goalsAgainst: 0 }
  );
}

function pickStandingsTable(response: FootballDataCompetitionStandingsResponse) {
  const group =
    response.standings?.find((g) => g?.type === "TOTAL") ?? response.standings?.[0] ?? null;
  return group?.table ?? [];
}

function normalizeStandings<Row>(
  league: FootballLeague<Row>,
  response: FootballDataCompetitionStandingsResponse
): Row[] {
  return pickStandingsTable(response)
    .map((row) => league.normalizeStandingRow(row))
    .filter((row): row is Row => row !== null);
}

export interface LeagueSummaryFeeds<Row> {
  standingsResponse: FootballDataCompetitionStandingsResponse;
  standings: Row[];
  recentFixtures: Fixture[];
  upcomingFixtures: Fixture[];
  teams: TeamOption[];
  scorers: FootballDataScorerEntry[];
  goalsPerMatchday: MatchdayGoals[];
}

/**
 * The five competition requests behind a league summary, one at a time so the
 * rate headers on each response can hold the next request back. When the
 * current season has not started (see `seasonNotStarted`), re-fetches pinned
 * to the completed prior season, at most once, before the other requests run.
 */
export async function fetchLeagueSummary<Row>(
  league: FootballLeague<Row>,
  season?: number
): Promise<LeagueSummaryFeeds<Row>> {
  const fetchJson = <T>(path: string, revalidateSeconds: number) =>
    fetchFootballDataJson<T>(league.label, path, revalidateSeconds);
  const seasonQuery = season ? `?season=${season}` : "";
  const seasonParam = season ? `&season=${season}` : "";
  const competition = `/competitions/${league.code}`;

  const standingsResponse = await fetchJson<FootballDataCompetitionStandingsResponse>(
    `${competition}/standings${seasonQuery}`,
    SUMMARY_REVALIDATE_SECONDS
  );
  const standings = normalizeStandings(league, standingsResponse);

  if (
    season === undefined &&
    seasonNotStarted(standingsResponse.season, standings.map(league.playedGames))
  ) {
    const currentSeasonStart = seasonStartYear(standingsResponse.season?.startDate);
    if (currentSeasonStart !== null) {
      return fetchLeagueSummary(league, currentSeasonStart - 1);
    }
  }

  const finished = await fetchJson<FootballDataMatchesResponse>(
    `${competition}/matches?status=FINISHED${seasonParam}`,
    SEASON_FIXTURES_REVALIDATE_SECONDS
  );
  const upcoming = await fetchJson<FootballDataMatchesResponse>(
    `${competition}/matches?status=SCHEDULED&limit=${UPCOMING_FIXTURE_LIMIT}${seasonParam}`,
    SUMMARY_REVALIDATE_SECONDS
  );
  const teamsResponse = await fetchJson<FootballDataCompetitionTeamsResponse>(
    `${competition}/teams${seasonQuery}`,
    SUMMARY_REVALIDATE_SECONDS
  );
  const scorersResponse = await fetchJson<FootballDataScorersResponse>(
    `${competition}/scorers${seasonQuery}`,
    SUMMARY_REVALIDATE_SECONDS
  );

  return {
    standingsResponse,
    standings,
    recentFixtures: fixturesFrom(finished.matches, "recent", RECENT_FIXTURE_LIMIT),
    upcomingFixtures: fixturesFrom(upcoming.matches, "upcoming", UPCOMING_FIXTURE_LIMIT),
    teams: (teamsResponse.teams ?? [])
      .map((team) => normalizeTeamOption(team, league.accentColor))
      .filter((team): team is TeamOption => team !== null)
      .sort((a, b) => a.shortName.localeCompare(b.shortName)),
    scorers: scorersResponse.scorers ?? [],
    goalsPerMatchday: buildGoalsPerMatchday(finished.matches ?? []),
  };
}

export interface LiveSections<Row> {
  /** Null when the request failed or returned a zeroed rolled-over table. */
  standings: { rows: Row[]; response: FootballDataCompetitionStandingsResponse } | null;
  recentFixtures: Fixture[] | null;
  upcomingFixtures: Fixture[] | null;
}

/**
 * Request-time refresh of the standings and the recent/upcoming fixture lists
 * (3 upstream requests). A section that fails, comes back empty, or reflects
 * the rolled-over-but-unstarted season is null so the caller keeps the
 * committed value. Throws when no section refreshed, so the caller falls back
 * to the committed snapshot wholesale without caching the failure.
 */
export async function fetchLiveSections<Row>(league: FootballLeague<Row>): Promise<LiveSections<Row>> {
  const fetchJson = <T>(path: string) =>
    fetchFootballDataJson<T>(league.label, path, SUMMARY_REVALIDATE_SECONDS);
  const competition = `/competitions/${league.code}`;
  const [standingsResult, recentResult, upcomingResult] = await Promise.allSettled([
    fetchJson<FootballDataCompetitionStandingsResponse>(`${competition}/standings`),
    fetchJson<FootballDataMatchesResponse>(
      `${competition}/matches?status=FINISHED&limit=${RECENT_FIXTURE_LIMIT}`
    ),
    fetchJson<FootballDataMatchesResponse>(
      `${competition}/matches?status=SCHEDULED&limit=${UPCOMING_FIXTURE_LIMIT}`
    ),
  ]);

  const sections: LiveSections<Row> = { standings: null, recentFixtures: null, upcomingFixtures: null };

  if (standingsResult.status === "fulfilled") {
    const rows = normalizeStandings(league, standingsResult.value);
    // A zeroed rolled-over table (season pointer advanced, no games played)
    // would wipe the dashboard, so the committed table is kept instead.
    if (rows.length > 0 && !seasonNotStarted(standingsResult.value.season, rows.map(league.playedGames))) {
      sections.standings = { rows, response: standingsResult.value };
    }
  }
  if (recentResult.status === "fulfilled") {
    const fixtures = fixturesFrom(recentResult.value.matches, "recent", RECENT_FIXTURE_LIMIT);
    if (fixtures.length > 0) sections.recentFixtures = fixtures;
  }
  if (upcomingResult.status === "fulfilled") {
    const fixtures = fixturesFrom(upcomingResult.value.matches, "upcoming", UPCOMING_FIXTURE_LIMIT);
    if (fixtures.length > 0) sections.upcomingFixtures = fixtures;
  }

  if (!sections.standings && !sections.recentFixtures && !sections.upcomingFixtures) {
    throw new HttpStatusError(`${league.label} live refresh produced no usable sections.`, 503);
  }
  return sections;
}

export async function getLeagueTeamSnapshot(
  league: LeagueIdentity,
  teamId: string
): Promise<TeamSnapshot> {
  if (!isValidTeamId(teamId)) {
    throw new HttpStatusError(`Invalid ${league.label} team id.`, 400);
  }
  const fetchJson = <T>(path: string) =>
    fetchFootballDataJson<T>(league.label, path, TEAM_REVALIDATE_SECONDS);
  const matches = (status: string) =>
    `/teams/${teamId}/matches?competitions=${league.code}&status=${status}&limit=${TEAM_FIXTURE_LIMIT}`;

  const teamResponse = await fetchJson<FootballDataTeam>(`/teams/${teamId}`);
  const recent = await fetchJson<FootballDataMatchesResponse>(matches("FINISHED"));
  const upcoming = await fetchJson<FootballDataMatchesResponse>(matches("SCHEDULED"));

  const recentFixtures = fixturesFrom(recent.matches, "recent", TEAM_FIXTURE_LIMIT);
  return {
    team: normalizeTeamProfile(teamResponse, league.accentColor),
    recentFixtures,
    upcomingFixtures: fixturesFrom(upcoming.matches, "upcoming", TEAM_FIXTURE_LIMIT),
    form: buildTeamFormSummary(teamId, recentFixtures),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * The per-club half of a snapshot build. Starts from the committed snapshots so
 * a per-team failure keeps that team's previous data, keeps stored results when
 * the fresh list is empty (the club fetch has no season pin, so it returns
 * nothing between the rollover and the first match), and prunes clubs that
 * left the league once the table is full.
 */
export async function buildLeagueTeamSnapshots<
  T extends Pick<TeamSnapshot, "recentFixtures" | "form" | "generatedAt">,
>(
  league: LeagueIdentity,
  teams: readonly TeamOption[],
  tableIds: readonly string[],
  generatedAt: string,
  getTeamSnapshot: (teamId: string) => Promise<T>,
  options: { skipTeamSnapshots?: boolean; snapshotKey?: (team: TeamOption) => string } = {}
): Promise<Record<string, T>> {
  const teamSnapshots = { ...readExistingTeamSnapshots<T>(league.snapshotPath) };

  if (options.skipTeamSnapshots) {
    console.log(`  Preserved ${Object.keys(teamSnapshots).length} existing team snapshots.`);
  } else {
    for (const team of teams) {
      const key = options.snapshotKey?.(team) ?? team.id;
      try {
        const snapshot = await getTeamSnapshot(team.id);
        const stored = teamSnapshots[key];
        const keepStored = stored && snapshot.recentFixtures.length === 0;
        teamSnapshots[key] = {
          ...snapshot,
          ...(keepStored ? { recentFixtures: stored.recentFixtures, form: stored.form } : {}),
          generatedAt,
        };
      } catch (err) {
        console.warn(
          `  Skipping team ${key} (${team.shortName}): ${(err as Error).message} — keeping previous snapshot if any.`
        );
      }
    }
  }

  return pruneToTable(teamSnapshots, tableIds);
}

/**
 * The request-time live path behind a summary accessor: a 5-minute in-memory
 * TTL plus a single-flight guard, which bounds upstream traffic to roughly one
 * 3-request refresh per 5 minutes per instance, well inside the
 * football-data.org free tier of 10 requests per minute. Double-gated: the
 * caller must ask for it (`preferLive`) and FOOTBALL_DATA_API_TOKEN must be
 * set. The token is read per call, so an un-configured deploy never fetches.
 * A failed refresh serves the committed value and is NOT cached, so the next
 * request retries the live path.
 */
export function createLiveSummary<T>(committed: () => T, refresh: (base: T) => Promise<T>) {
  const TTL_MS = 5 * 60 * 1000;
  let cache: { summary: T; expiresAt: number } | null = null;
  let inflight: Promise<T> | null = null;

  return {
    get(preferLive?: boolean): Promise<T> {
      if (!preferLive || !process.env.FOOTBALL_DATA_API_TOKEN?.trim()) {
        return Promise.resolve(committed());
      }
      if (cache && cache.expiresAt > Date.now()) return Promise.resolve(cache.summary);
      if (inflight) return inflight;
      inflight = refresh(committed())
        .then((summary) => {
          cache = { summary, expiresAt: Date.now() + TTL_MS };
          return summary;
        })
        .catch(() => committed())
        .finally(() => {
          inflight = null;
        });
      return inflight;
    },
  };
}
