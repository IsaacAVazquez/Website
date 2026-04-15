import { premierLeagueSnapshot } from "@/data/premierLeagueSnapshot";
import type {
  PremierLeagueSummary,
  PremierLeagueTeamSnapshot,
} from "@/types/premier-league";

const SUMMARY_FIXTURE_LIMIT = 8;
const TEAM_FIXTURE_LIMIT = 5;

interface PremierLeagueSnapshotError extends Error {
  status: number;
}

function createPremierLeagueSnapshotError(
  message: string,
  status: number
): PremierLeagueSnapshotError {
  return Object.assign(new Error(message), { status });
}

function limitFixtures<T>(fixtures: T[], limit: number): T[] {
  return fixtures.slice(0, limit);
}

function clampPremierLeagueSummary(summary: PremierLeagueSummary): PremierLeagueSummary {
  return {
    ...summary,
    recentFixtures: limitFixtures(summary.recentFixtures, SUMMARY_FIXTURE_LIMIT),
    upcomingFixtures: limitFixtures(summary.upcomingFixtures, SUMMARY_FIXTURE_LIMIT),
  };
}

function clampPremierLeagueTeamSnapshot(
  snapshot: PremierLeagueTeamSnapshot
): PremierLeagueTeamSnapshot {
  return {
    ...snapshot,
    recentFixtures: limitFixtures(snapshot.recentFixtures, TEAM_FIXTURE_LIMIT),
    upcomingFixtures: limitFixtures(snapshot.upcomingFixtures, TEAM_FIXTURE_LIMIT),
  };
}

export function createEmptyPremierLeagueSummary(): PremierLeagueSummary {
  return {
    competition: null,
    standings: [],
    recentFixtures: [],
    upcomingFixtures: [],
    teams: [],
    scorers: [],
    generatedAt: new Date().toISOString(),
  };
}

export function createEmptyPremierLeagueTeamSnapshot(): PremierLeagueTeamSnapshot {
  return {
    team: null,
    recentFixtures: [],
    upcomingFixtures: [],
    form: {
      sequence: [],
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function isValidPremierLeagueTeamId(teamId: string): boolean {
  return teamId in premierLeagueSnapshot.teamSnapshots;
}

export async function getPremierLeagueSummary(): Promise<PremierLeagueSummary> {
  return clampPremierLeagueSummary(premierLeagueSnapshot.summary);
}

export async function getPremierLeagueTeamSnapshot(
  teamId: string
): Promise<PremierLeagueTeamSnapshot> {
  const snapshot = premierLeagueSnapshot.teamSnapshots[teamId];
  if (!snapshot) {
    throw createPremierLeagueSnapshotError("Premier League team snapshot was not found.", 404);
  }

  return clampPremierLeagueTeamSnapshot(snapshot);
}
