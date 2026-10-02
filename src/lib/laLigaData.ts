import type {
  LaLigaClub,
  LaLigaLeader,
  LaLigaSnapshot,
  LaLigaSummarySnapshot,
  LaLigaTeamSnapshot,
} from "@/types/la-liga";
import { getLaLigaClubAccentColor } from "@/data/clubColors";
import { buildSeasonLabel, type FootballDataScorerEntry } from "@/lib/footballData";
import {
  buildLeagueTeamSnapshots,
  fetchLeagueSummary,
  fetchLiveSections,
  getLeagueTeamSnapshot,
  isValidTeamId,
  type FootballLeague,
} from "@/lib/footballLeagueData";

const LA_LIGA: FootballLeague<LaLigaClub> = {
  label: "La Liga",
  code: "PD",
  snapshotPath: "src/data/laLigaSnapshot.json",
  accentColor: getLaLigaClubAccentColor,
  normalizeStandingRow(raw) {
    const team = raw?.team;
    const id = team?.id;
    if (typeof id !== "number" || typeof raw?.position !== "number") return null;
    return {
      id: team?.tla?.toLowerCase() || String(id),
      code: team?.tla?.trim() || String(id),
      name: team?.name?.trim() || `Club ${id}`,
      shortName: team?.shortName?.trim() || team?.name?.trim() || `Club ${id}`,
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
  },
  playedGames: (club) => club.played,
};

export const isValidLaLigaTeamId = isValidTeamId;

/** One leaderboard row; `total` is the goals or assists count being ranked. */
function normalizeLeader(
  entry: FootballDataScorerEntry | null | undefined,
  rank: number,
  total: number
): LaLigaLeader | null {
  const name = entry?.player?.name?.trim();
  const teamId = entry?.team?.id;
  if (!name || typeof teamId !== "number") return null;
  return {
    rank,
    name,
    clubId: entry?.team?.tla?.toLowerCase() || String(teamId),
    clubCode: entry?.team?.tla?.trim() || String(teamId),
    total,
    appearances: entry?.playedMatches ?? 0,
    perMatch: entry?.playedMatches ? total / entry.playedMatches : 0,
  };
}

type LaLigaSummary = Required<
  Pick<
    LaLigaSnapshot,
    | "season"
    | "matchday"
    | "clubs"
    | "scorers"
    | "assists"
    | "goalsPerMatchday"
    | "recentFixtures"
    | "upcomingFixtures"
    | "teams"
    | "generatedAt"
  >
>;

export async function getLaLigaSummary(): Promise<LaLigaSummary> {
  const feeds = await fetchLeagueSummary(LA_LIGA);

  // The assists leaderboard re-ranks the same `/scorers` entries by assists
  // descending; the field is present on every entry.
  const assists = feeds.scorers
    .filter((entry) => typeof entry?.assists === "number" && entry.assists > 0)
    .sort((a, b) => (b.assists ?? 0) - (a.assists ?? 0))
    .map((entry, i) => normalizeLeader(entry, i + 1, entry.assists ?? 0))
    .filter((a): a is LaLigaLeader => a !== null);

  return {
    season: buildSeasonLabel(feeds.standingsResponse.season?.startDate, feeds.standingsResponse.season?.endDate),
    matchday: feeds.standingsResponse.season?.currentMatchday ?? 0,
    clubs: feeds.standings,
    scorers: feeds.scorers
      .map((entry, i) => normalizeLeader(entry, i + 1, entry?.goals ?? 0))
      .filter((s): s is LaLigaLeader => s !== null),
    assists,
    goalsPerMatchday: feeds.goalsPerMatchday,
    recentFixtures: feeds.recentFixtures,
    upcomingFixtures: feeds.upcomingFixtures,
    teams: feeds.teams,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Request-time refresh used by the summary accessor when a football-data.org
 * token is configured. Only the standings (clubs plus the season label and
 * matchday from the same response) and the recent/upcoming fixture lists are
 * refreshed; every other section keeps the committed snapshot's value. See
 * `fetchLiveSections` for the per-section rules.
 */
export async function buildLaLigaLiveSummary(
  baseSummary: LaLigaSummarySnapshot
): Promise<LaLigaSummarySnapshot> {
  const live = await fetchLiveSections(LA_LIGA);
  const generatedAt = new Date().toISOString();
  return {
    ...baseSummary,
    ...(live.standings
      ? {
          clubs: live.standings.rows,
          season: buildSeasonLabel(
            live.standings.response.season?.startDate,
            live.standings.response.season?.endDate
          ),
          matchday: live.standings.response.season?.currentMatchday ?? baseSummary.matchday,
        }
      : {}),
    ...(live.recentFixtures ? { recentFixtures: live.recentFixtures } : {}),
    ...(live.upcomingFixtures ? { upcomingFixtures: live.upcomingFixtures } : {}),
    generatedAt,
    updatedAt: generatedAt.slice(0, 10),
  };
}

export async function getLaLigaTeamSnapshot(teamId: string): Promise<LaLigaTeamSnapshot> {
  const snapshot = await getLeagueTeamSnapshot(LA_LIGA, teamId);
  if (!snapshot.team) return snapshot;
  // La Liga profiles never carried the website and address fields.
  const { website: _website, address: _address, ...team } = snapshot.team;
  return { ...snapshot, team };
}

export async function buildLaLigaSnapshot(options?: { skipTeamSnapshots?: boolean }): Promise<LaLigaSnapshot> {
  const summary = await getLaLigaSummary();
  const generatedAt = new Date().toISOString();
  const teamSnapshots = await buildLeagueTeamSnapshots(
    LA_LIGA,
    summary.teams,
    summary.clubs.map((club) => club.id),
    generatedAt,
    getLaLigaTeamSnapshot,
    { ...options, snapshotKey: (team) => team.tla?.toLowerCase() || team.id }
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
