import { laLigaSnapshot } from "@/data/laLigaSnapshot";
import type { LaLigaTeamSnapshot } from "@/types/la-liga";

interface LaLigaSnapshotError extends Error {
  status: number;
}

function createLaLigaSnapshotError(message: string, status: number): LaLigaSnapshotError {
  return Object.assign(new Error(message), { status });
}

export function createEmptyLaLigaTeamSnapshot(): LaLigaTeamSnapshot {
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

export function isValidLaLigaTeamId(teamId: string): boolean {
  return teamId in laLigaSnapshot.teamSnapshots;
}

export async function getLaLigaTeamSnapshot(teamId: string): Promise<LaLigaTeamSnapshot> {
  const snapshot = laLigaSnapshot.teamSnapshots[teamId];
  if (!snapshot) {
    throw createLaLigaSnapshotError("La Liga team snapshot was not found.", 404);
  }
  return snapshot;
}
