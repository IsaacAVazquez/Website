import { mlbSnapshot } from "@/data/mlbSnapshot";
import type { MlbSummarySnapshot, MlbTeamSnapshot } from "@/types/mlb";
import { findTeamSnapshot } from "@/lib/teamSnapshots";

const SUMMARY_GAME_LIMIT = 10;
const TEAM_GAME_LIMIT = 5;

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

// Regex shape check (MLB ids are positive integers, max 5 digits) runs before
// membership so a malformed id can be rejected as a 400 by route handlers
// without touching the snapshot dictionary.
const MLB_TEAM_ID_PATTERN = /^[1-9]\d{0,4}$/;

export function isMlbTeamIdShape(teamId: string): boolean {
  return MLB_TEAM_ID_PATTERN.test(teamId);
}

export function isValidMlbTeamId(teamId: string): boolean {
  return MLB_TEAM_ID_PATTERN.test(teamId) && teamId in mlbSnapshot.teamSnapshots;
}

export async function getMlbSummarySnapshot(): Promise<MlbSummarySnapshot> {
  const { teamSnapshots: _teamSnapshots, ...summarySnapshot } = mlbSnapshot;
  return {
    ...summarySnapshot,
    recentGames: summarySnapshot.recentGames.slice(0, SUMMARY_GAME_LIMIT),
    upcomingGames: summarySnapshot.upcomingGames.slice(0, SUMMARY_GAME_LIMIT),
  };
}

export async function getMlbTeamSnapshot(teamId: string): Promise<MlbTeamSnapshot> {
  const snapshot = findTeamSnapshot(mlbSnapshot.teamSnapshots, teamId, "MLB");
  return {
    ...snapshot,
    recentGames: snapshot.recentGames.slice(0, TEAM_GAME_LIMIT),
    upcomingGames: snapshot.upcomingGames.slice(0, TEAM_GAME_LIMIT),
  };
}
