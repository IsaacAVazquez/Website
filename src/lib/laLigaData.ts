import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type {
  LaLigaClub,
  LaLigaFixture,
  LaLigaFixtureTeam,
  LaLigaFormSummary,
  LaLigaLeader,
  LaLigaMatchdayGoals,
  LaLigaSnapshot,
  LaLigaSummarySnapshot,
  LaLigaTeamOption,
  LaLigaTeamProfile,
  LaLigaTeamSnapshot,
} from "@/types/la-liga";
import { getLaLigaClubAccentColor } from "@/data/clubColors";

import {
  SUMMARY_REVALIDATE_SECONDS,
  TEAM_REVALIDATE_SECONDS,
  RECENT_FIXTURE_LIMIT,
  UPCOMING_FIXTURE_LIMIT,
  TEAM_FIXTURE_LIMIT,
  SEASON_FIXTURES_REVALIDATE_SECONDS,
  buildSeasonLabel,
  fetchFootballDataJson as fetchLeagueJson,
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
  type FootballDataError,
} from "@/lib/footballData";
const LA_LIGA_CODE = "PD";
function createLaLigaDataError(message: string, status: number): FootballDataError {
  return Object.assign(new Error(message), { status });
}

function fetchFootballDataJson<T>(path: string, revalidateSeconds: number): Promise<T> {
  return fetchLeagueJson<T>("La Liga", path, revalidateSeconds);
}

function seasonStartYear(startDate?: string | null): number | null {
  if (!startDate) return null;
  const year = new Date(startDate).getUTCFullYear();
  return Number.isFinite(year) ? year : null;
}

/**
 * True when the competition's current season hasn't actually started, so the
 * live endpoints return a placeholder. football-data.org rolls the season
 * pointer weeks ahead of kickoff: for La Liga the standings keep last season's
 * completed table under a future-dated label with empty scorers/matches, and
 * for the Premier League the table is zeroed outright. Either signal — rows
 * with zero games played, or a season whose start date is still in the future —
 * means we should pin to the completed prior season instead.
 */
function seasonNotStarted(
  season: FootballDataSeason | null | undefined,
  clubs: readonly LaLigaClub[],
  now: Date = new Date()
): boolean {
  if (clubs.length > 0 && clubs.every((club) => club.played === 0)) return true;
  const startMs = season?.startDate ? new Date(season.startDate).getTime() : NaN;
  return Number.isFinite(startMs) && startMs > now.getTime();
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
  return {
    ...team,
    venue: raw?.venue?.trim() || null,
    accentColor: getLaLigaClubAccentColor(team.tla),
  };
}

function normalizeTeamProfile(raw: FootballDataTeam | null | undefined): LaLigaTeamProfile | null {
  const team = normalizeTeamOption(raw);
  if (!team) return null;
  return {
    ...team,
    founded: typeof raw?.founded === "number" ? raw.founded : null,
    clubColors: raw?.clubColors?.trim() || null,
    // football-data.org's team-detail response doesn't always include a coach
    // (varies by tier/team); skip silently (null) when it's absent.
    manager: raw?.coach?.name?.trim() || null,
  };
}

function normalizeFixture(raw: FootballDataMatch | null | undefined): LaLigaFixture | null {
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
    accentColor: getLaLigaClubAccentColor(team?.tla),
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

/**
 * Builds the assists leaderboard from the same `/scorers` response used for
 * the goals leaderboard — football-data.org's scorer entries already carry an
 * `assists` count per player, it was just never selected into its own sorted
 * list. Re-ranks by assists descending rather than reusing the goals-based
 * rank order.
 */
function normalizeAssister(entry: FootballDataScorerEntry | null | undefined, rank: number): LaLigaLeader | null {
  const name = entry?.player?.name?.trim();
  const teamId = entry?.team?.id;
  const teamTla = entry?.team?.tla?.trim();
  if (!name || typeof teamId !== "number") return null;
  const assists = entry?.assists ?? 0;
  return {
    rank,
    name,
    clubId: entry?.team?.tla?.toLowerCase() || String(teamId),
    clubCode: teamTla || String(teamId),
    total: assists,
    appearances: entry?.playedMatches ?? 0,
    perMatch: entry?.playedMatches ? assists / entry.playedMatches : 0,
  };
}

/**
 * Aggregates a season's worth of FINISHED matches into a matchday → total
 * league goals series. Operates on the raw upstream match shape (not the
 * normalized `LaLigaFixture`) since only `matchday` and the final score are
 * needed. Matches missing either are skipped rather than dropping the whole
 * series.
 */
function buildGoalsPerMatchday(matches: FootballDataMatch[]): LaLigaMatchdayGoals[] {
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

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    searchParams.set(key, String(value));
  }
  return searchParams.toString();
}

export function isValidLaLigaTeamId(teamId: string): boolean {
  return /^[1-9]\d*$/.test(teamId);
}

export async function getLaLigaSummary(options?: { season?: number }): Promise<{
  season: string;
  matchday: number;
  clubs: LaLigaClub[];
  scorers: LaLigaLeader[];
  assists: LaLigaLeader[];
  goalsPerMatchday: LaLigaMatchdayGoals[];
  recentFixtures: LaLigaFixture[];
  upcomingFixtures: LaLigaFixture[];
  teams: LaLigaTeamOption[];
  generatedAt: string;
}> {
  // When a season is pinned, thread it onto every competition-scoped request so
  // standings, fixtures, teams, and scorers all describe the same season.
  const seasonParams = options?.season ? { season: options.season } : {};
  const seasonQuery = options?.season
    ? `?${buildQueryString({ season: options.season })}`
    : "";

  // One request at a time, so the rate headers on each response can hold
  // the next request back.
  const standingsResponse = await fetchFootballDataJson<FootballDataCompetitionStandingsResponse>(
    `/competitions/${LA_LIGA_CODE}/standings${seasonQuery}`,
    SUMMARY_REVALIDATE_SECONDS
  );

  const standingsGroup =
    standingsResponse.standings?.find((g) => g?.type === "TOTAL") ??
    standingsResponse.standings?.[0] ??
    null;

  const clubs = (standingsGroup?.table ?? [])
    .map((row) => normalizeStandingRow(row))
    .filter((c): c is LaLigaClub => c !== null);

  // Off-season rollover guard: if the current season hasn't started, re-fetch
  // pinned to the completed prior season so the page shows a real final table
  // with a correct label and populated scorers instead of an empty/stale one.
  // Re-pins at most once (the recursive call passes a season). This runs
  // before the other requests so the re-pin does not repeat them.
  if (options?.season === undefined && seasonNotStarted(standingsResponse.season, clubs)) {
    const currentSeasonStart = seasonStartYear(standingsResponse.season?.startDate);
    if (currentSeasonStart !== null) {
      return getLaLigaSummary({ season: currentSeasonStart - 1 });
    }
  }

  const finishedRes = await fetchFootballDataJson<FootballDataMatchesResponse>(
    `/competitions/${LA_LIGA_CODE}/matches?${buildQueryString({ status: "FINISHED", ...seasonParams })}`,
    SEASON_FIXTURES_REVALIDATE_SECONDS
  );
  const upcomingRes = await fetchFootballDataJson<FootballDataMatchesResponse>(
    `/competitions/${LA_LIGA_CODE}/matches?${buildQueryString({ status: "SCHEDULED", limit: UPCOMING_FIXTURE_LIMIT, ...seasonParams })}`,
    SUMMARY_REVALIDATE_SECONDS
  );
  const teamsRes = await fetchFootballDataJson<FootballDataCompetitionTeamsResponse>(
    `/competitions/${LA_LIGA_CODE}/teams${seasonQuery}`,
    SUMMARY_REVALIDATE_SECONDS
  );
  const scorersRes = await fetchFootballDataJson<FootballDataScorersResponse>(
    `/competitions/${LA_LIGA_CODE}/scorers${seasonQuery}`,
    SUMMARY_REVALIDATE_SECONDS
  );

  const scorers = (scorersRes.scorers ?? [])
    .map((entry, i) => normalizeScorer(entry, i + 1))
    .filter((s): s is LaLigaLeader => s !== null);

  // Assists leaderboard: re-sort the same `/scorers` entries by assists count
  // (descending) rather than leaving `assists` hardcoded to `[]` — the field
  // is already present on every entry, it was just never selected out.
  const assists = (scorersRes.scorers ?? [])
    .filter(
      (entry): entry is FootballDataScorerEntry =>
        typeof entry?.assists === "number" && entry.assists > 0
    )
    .sort((a, b) => (b.assists ?? 0) - (a.assists ?? 0))
    .map((entry, i) => normalizeAssister(entry, i + 1))
    .filter((a): a is LaLigaLeader => a !== null);

  const goalsPerMatchday = buildGoalsPerMatchday(finishedRes.matches ?? []);

  const recentFixtures = (finishedRes.matches ?? [])
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

  return {
    season,
    matchday,
    clubs,
    scorers,
    assists,
    goalsPerMatchday,
    recentFixtures,
    upcomingFixtures,
    teams,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Request-time refresh used by the summary accessor when a football-data.org
 * token is configured. Only the standings (clubs plus the season label and
 * matchday from the same response) and the recent/upcoming fixture lists are
 * refreshed (3 upstream requests); every other section keeps the committed
 * snapshot's value. A section that fails, comes back empty, or reflects the
 * rolled-over-but-unstarted season keeps the committed value. If no section
 * refreshes, this throws so the caller falls back to the committed snapshot
 * wholesale without caching the failure.
 */
export async function buildLaLigaLiveSummary(
  baseSummary: LaLigaSummarySnapshot
): Promise<LaLigaSummarySnapshot> {
  const [standingsResult, recentResult, upcomingResult] = await Promise.allSettled([
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
  ]);

  const summary: LaLigaSummarySnapshot = { ...baseSummary };
  let refreshedSections = 0;

  if (standingsResult.status === "fulfilled") {
    const standingsGroup =
      standingsResult.value.standings?.find((g) => g?.type === "TOTAL") ??
      standingsResult.value.standings?.[0] ??
      null;
    const clubs = (standingsGroup?.table ?? [])
      .map((row) => normalizeStandingRow(row))
      .filter((c): c is LaLigaClub => c !== null);

    // A zeroed rolled-over table (season pointer advanced, no games played)
    // would wipe the dashboard, so the committed table is kept instead.
    if (clubs.length > 0 && !seasonNotStarted(standingsResult.value.season, clubs)) {
      summary.clubs = clubs;
      summary.season = buildSeasonLabel(
        standingsResult.value.season?.startDate,
        standingsResult.value.season?.endDate
      );
      summary.matchday = standingsResult.value.season?.currentMatchday ?? summary.matchday;
      refreshedSections += 1;
    }
  }

  if (recentResult.status === "fulfilled") {
    const recentFixtures = (recentResult.value.matches ?? [])
      .map((m) => normalizeFixture(m))
      .filter((f): f is LaLigaFixture => f !== null)
      .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
      .slice(0, RECENT_FIXTURE_LIMIT);

    if (recentFixtures.length > 0) {
      summary.recentFixtures = recentFixtures;
      refreshedSections += 1;
    }
  }

  if (upcomingResult.status === "fulfilled") {
    const upcomingFixtures = (upcomingResult.value.matches ?? [])
      .map((m) => normalizeFixture(m))
      .filter((f): f is LaLigaFixture => f !== null)
      .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
      .slice(0, UPCOMING_FIXTURE_LIMIT);

    if (upcomingFixtures.length > 0) {
      summary.upcomingFixtures = upcomingFixtures;
      refreshedSections += 1;
    }
  }

  if (refreshedSections === 0) {
    throw createLaLigaDataError("La Liga live refresh produced no usable sections.", 503);
  }

  const generatedAt = new Date().toISOString();
  return {
    ...summary,
    generatedAt,
    updatedAt: generatedAt.slice(0, 10),
  };
}

export async function getLaLigaTeamSnapshot(teamId: string): Promise<LaLigaTeamSnapshot> {
  if (!isValidLaLigaTeamId(teamId)) {
    throw createLaLigaDataError("Invalid La Liga team id.", 400);
  }

  const teamResponse = await fetchFootballDataJson<FootballDataTeam>(`/teams/${teamId}`, TEAM_REVALIDATE_SECONDS);
  const recentRes = await fetchFootballDataJson<FootballDataMatchesResponse>(
    `/teams/${teamId}/matches?${buildQueryString({ competitions: LA_LIGA_CODE, status: "FINISHED", limit: TEAM_FIXTURE_LIMIT })}`,
    TEAM_REVALIDATE_SECONDS
  );
  const upcomingRes = await fetchFootballDataJson<FootballDataMatchesResponse>(
    `/teams/${teamId}/matches?${buildQueryString({ competitions: LA_LIGA_CODE, status: "SCHEDULED", limit: TEAM_FIXTURE_LIMIT })}`,
    TEAM_REVALIDATE_SECONDS
  );

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

const LA_LIGA_SNAPSHOT_PATH = "src/data/laLigaSnapshot.ts";

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

export async function buildLaLigaSnapshot(options?: { skipTeamSnapshots?: boolean; season?: number }): Promise<LaLigaSnapshot> {
  const summary = await getLaLigaSummary(
    options?.season ? { season: options.season } : undefined
  );
  const generatedAt = new Date().toISOString();
  let teamSnapshots: Record<string, LaLigaTeamSnapshot>;

  if (options?.skipTeamSnapshots) {
    teamSnapshots = readExistingTeamSnapshots(LA_LIGA_SNAPSHOT_PATH);
    console.log(`  Preserved ${Object.keys(teamSnapshots).length} existing team snapshots.`);
  } else {
    // Start from the prior snapshots so a per-team failure preserves that
    // team's previous data instead of dropping it from the snapshot.
    teamSnapshots = { ...readExistingTeamSnapshots(LA_LIGA_SNAPSHOT_PATH) };
    for (const team of summary.teams) {
      const snapKey = team.tla?.toLowerCase() || team.id;
      try {
        const snap = await getLaLigaTeamSnapshot(team.id);
        const stored = teamSnapshots[snapKey];
        // The club fetch has no season pin, so it returns no results between
        // the season rollover and the first match. The stored ones stay.
        const keepStored = stored && snap.recentFixtures.length === 0;
        teamSnapshots[snapKey] = {
          ...snap,
          ...(keepStored ? { recentFixtures: stored.recentFixtures, form: stored.form } : {}),
          generatedAt,
        };
      } catch (err) {
        console.warn(`  Skipping team ${snapKey} (${team.shortName}): ${(err as Error).message} — keeping previous snapshot if any.`);
      }
    }
  }

  teamSnapshots = pruneToTable(
    teamSnapshots,
    summary.clubs.map((club) => club.id)
  );

  return {
    season: summary.season,
    matchday: summary.matchday,
    generatedAt,
    updatedAt: generatedAt.slice(0, 10),
    sourceLabel: "football-data.org",
    sourceUrls: {
      standings: "https://www.football-data.org/documentation/api",
      scorers: "https://www.football-data.org/documentation/api",
      assists: "https://www.football-data.org/documentation/api",
    },
    clubs: summary.clubs,
    scorers: summary.scorers,
    assists: summary.assists,
    goalsPerMatchday: summary.goalsPerMatchday,
    recentFixtures: summary.recentFixtures,
    upcomingFixtures: summary.upcomingFixtures,
    teams: summary.teams,
    teamSnapshots,
  };
}
