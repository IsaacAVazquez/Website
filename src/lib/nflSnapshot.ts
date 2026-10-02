import { nflSnapshot } from "@/data/nflSnapshot";
import type { NFLSummarySnapshot, NFLTeamSnapshot } from "@/types/nfl";
import { capFixtures, findTeamSnapshot } from "@/lib/teamSnapshots";

const SUMMARY_FIXTURE_LIMIT = 8;
const TEAM_FIXTURE_LIMIT = 5;

export function createEmptyNflTeamSnapshot(): NFLTeamSnapshot {
  return {
    team: null,
    recentFixtures: [],
    upcomingFixtures: [],
    form: {
      sequence: [],
      wins: 0,
      ties: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
    },
    generatedAt: new Date().toISOString(),
  };
}

// NFL snapshot keys are lowercase 2-4 letter abbreviations (e.g. "kc",
// "buf"). The regex check runs before membership so a malformed id can be
// rejected as a 400 by route handlers without touching the snapshot dict.
const NFL_TEAM_ID_PATTERN = /^[a-z]{2,4}$/i;

export function isNflTeamIdShape(teamId: string): boolean {
  return NFL_TEAM_ID_PATTERN.test(teamId);
}

export function isValidNflTeamId(teamId: string): boolean {
  return NFL_TEAM_ID_PATTERN.test(teamId) && teamId in nflSnapshot.teamSnapshots;
}

export async function getNflSummarySnapshot(): Promise<NFLSummarySnapshot> {
  const { teamSnapshots: _teamSnapshots, ...summarySnapshot } = nflSnapshot;
  return capFixtures(summarySnapshot, SUMMARY_FIXTURE_LIMIT);
}

export async function getNflTeamSnapshot(teamId: string): Promise<NFLTeamSnapshot> {
  return capFixtures(findTeamSnapshot(nflSnapshot.teamSnapshots, teamId, "NFL"), TEAM_FIXTURE_LIMIT);
}
