import { mlbSnapshot } from "@/data/mlbSnapshot";
import type { MlbSummarySnapshot, MlbTeamSnapshot } from "@/types/mlb";

const SUMMARY_GAME_LIMIT = 10;
const TEAM_GAME_LIMIT = 5;

interface MlbSnapshotError extends Error {
  status: number;
}

function createMlbSnapshotError(message: string, status: number): MlbSnapshotError {
  return Object.assign(new Error(message), { status });
}

function limitItems<T>(items: T[], limit: number): T[] {
  return items.slice(0, limit);
}

function clampMlbSummarySnapshot(snapshot: typeof mlbSnapshot): MlbSummarySnapshot {
  const { teamSnapshots: _teamSnapshots, ...summarySnapshot } = snapshot;
  return {
    ...summarySnapshot,
    recentGames: limitItems(summarySnapshot.recentGames, SUMMARY_GAME_LIMIT),
    upcomingGames: limitItems(summarySnapshot.upcomingGames, SUMMARY_GAME_LIMIT),
  };
}

function clampMlbTeamSnapshot(snapshot: MlbTeamSnapshot): MlbTeamSnapshot {
  return {
    ...snapshot,
    recentGames: limitItems(snapshot.recentGames, TEAM_GAME_LIMIT),
    upcomingGames: limitItems(snapshot.upcomingGames, TEAM_GAME_LIMIT),
  };
}

export function createEmptyMlbSummarySnapshot(): MlbSummarySnapshot {
  return {
    season: mlbSnapshot.season,
    updatedAt: mlbSnapshot.updatedAt,
    sourceLabel: mlbSnapshot.sourceLabel,
    sourceUrls: mlbSnapshot.sourceUrls,
    teams: [],
    standings: [],
    recentGames: [],
    upcomingGames: [],
    hittingLeaders: { homeRuns: [], runsBattedIn: [], battingAverage: [] },
    pitchingLeaders: { earnedRunAverage: [], wins: [], strikeouts: [] },
  };
}

export function createEmptyMlbTeamSnapshot(): MlbTeamSnapshot {
  return {
    team: null,
    recentGames: [],
    upcomingGames: [],
    form: {
      sequence: [],
      wins: 0,
      losses: 0,
      runsFor: 0,
      runsAgainst: 0,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function isValidMlbTeamId(teamId: string): boolean {
  return teamId in mlbSnapshot.teamSnapshots;
}

export async function getMlbSummarySnapshot(): Promise<MlbSummarySnapshot> {
  return clampMlbSummarySnapshot(mlbSnapshot);
}

export async function getMlbTeamSnapshot(teamId: string): Promise<MlbTeamSnapshot> {
  const snapshot = mlbSnapshot.teamSnapshots[teamId];
  if (!snapshot) {
    throw createMlbSnapshotError("MLB team snapshot was not found.", 404);
  }
  return clampMlbTeamSnapshot(snapshot);
}
