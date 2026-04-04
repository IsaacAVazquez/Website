import { premierLeagueSnapshot } from "@/data/premierLeagueSnapshot";
import type {
  PremierLeagueSummary,
  PremierLeagueTeamSnapshot,
} from "@/types/premier-league";

interface PremierLeagueSnapshotError extends Error {
  status: number;
}

function createPremierLeagueSnapshotError(
  message: string,
  status: number
): PremierLeagueSnapshotError {
  return Object.assign(new Error(message), { status });
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
  return premierLeagueSnapshot.summary;
}

export async function getPremierLeagueTeamSnapshot(
  teamId: string
): Promise<PremierLeagueTeamSnapshot> {
  const snapshot = premierLeagueSnapshot.teamSnapshots[teamId];
  if (!snapshot) {
    throw createPremierLeagueSnapshotError("Premier League team snapshot was not found.", 404);
  }

  return snapshot;
}
