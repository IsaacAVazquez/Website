import type {
  PremierLeagueSnapshot,
  PremierLeagueCompetitionMeta,
  PremierLeagueScorer,
  PremierLeagueStandingRow,
  PremierLeagueSummary,
  PremierLeagueTeamSnapshot,
} from "@/types/premier-league";
import { getPremierLeagueClubAccentColor } from "@/data/clubColors";
import {
  buildSeasonLabel,
  type FootballDataCompetitionStandingsResponse,
  type FootballDataScorerEntry,
} from "@/lib/footballData";
import {
  buildLeagueTeamSnapshots,
  fetchLeagueSummary,
  fetchLiveSections,
  getLeagueTeamSnapshot,
  normalizeTeamOption,
  type FootballLeague,
} from "@/lib/footballLeagueData";

const PREMIER_LEAGUE: FootballLeague<PremierLeagueStandingRow> = {
  label: "Premier League",
  code: "PL",
  snapshotPath: "src/data/premierLeagueSnapshot.json",
  accentColor: getPremierLeagueClubAccentColor,
  normalizeStandingRow(raw) {
    const team = normalizeTeamOption(raw?.team, getPremierLeagueClubAccentColor);
    if (!team || typeof raw?.position !== "number") return null;
    return {
      position: raw.position,
      playedGames: raw.playedGames ?? 0,
      won: raw.won ?? 0,
      draw: raw.draw ?? 0,
      lost: raw.lost ?? 0,
      points: raw.points ?? 0,
      goalsFor: raw.goalsFor ?? 0,
      goalsAgainst: raw.goalsAgainst ?? 0,
      goalDifference: raw.goalDifference ?? 0,
      team,
    };
  },
  playedGames: (row) => row.playedGames,
};

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

function normalizeScorer(
  entry: FootballDataScorerEntry | null | undefined,
  rank: number
): PremierLeagueScorer | null {
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

function buildCompetitionMeta(
  standingsResponse: FootballDataCompetitionStandingsResponse
): PremierLeagueCompetitionMeta {
  return {
    code: standingsResponse.competition?.code?.trim() || PREMIER_LEAGUE.code,
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

export async function getPremierLeagueSummary(): Promise<PremierLeagueSummary> {
  const feeds = await fetchLeagueSummary(PREMIER_LEAGUE);
  return {
    competition: buildCompetitionMeta(feeds.standingsResponse),
    standings: feeds.standings,
    recentFixtures: feeds.recentFixtures,
    upcomingFixtures: feeds.upcomingFixtures,
    teams: feeds.teams,
    scorers: feeds.scorers
      .map((entry, i) => normalizeScorer(entry, i + 1))
      .filter((s): s is PremierLeagueScorer => s !== null),
    goalsPerMatchday: feeds.goalsPerMatchday,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Request-time refresh used by the summary accessor when a football-data.org
 * token is configured. Only the standings and the recent/upcoming fixture
 * lists are refreshed; every other section keeps the committed snapshot's
 * value. See `fetchLiveSections` for the per-section rules.
 */
export async function buildPremierLeagueLiveSummary(
  baseSummary: PremierLeagueSummary
): Promise<PremierLeagueSummary> {
  const live = await fetchLiveSections(PREMIER_LEAGUE);
  return {
    ...baseSummary,
    ...(live.standings
      ? { standings: live.standings.rows, competition: buildCompetitionMeta(live.standings.response) }
      : {}),
    ...(live.recentFixtures ? { recentFixtures: live.recentFixtures } : {}),
    ...(live.upcomingFixtures ? { upcomingFixtures: live.upcomingFixtures } : {}),
    generatedAt: new Date().toISOString(),
  };
}

export function getPremierLeagueTeamSnapshot(teamId: string): Promise<PremierLeagueTeamSnapshot> {
  return getLeagueTeamSnapshot(PREMIER_LEAGUE, teamId);
}

export async function buildPremierLeagueSnapshot(
  options?: { skipTeamSnapshots?: boolean }
): Promise<PremierLeagueSnapshot> {
  const summary = await getPremierLeagueSummary();
  const generatedAt = new Date().toISOString();
  const teamSnapshots = await buildLeagueTeamSnapshots(
    PREMIER_LEAGUE,
    summary.teams,
    summary.standings.map((row) => row.team.id),
    generatedAt,
    getPremierLeagueTeamSnapshot,
    options
  );

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
