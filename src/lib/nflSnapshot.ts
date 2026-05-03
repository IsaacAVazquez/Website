import { nflSnapshot } from "@/data/nflSnapshot";
import type { NFLSummarySnapshot, NFLTeamSnapshot } from "@/types/nfl";

const SUMMARY_FIXTURE_LIMIT = 8;
const TEAM_FIXTURE_LIMIT = 5;

interface NflSnapshotError extends Error {
  status: number;
}

function createNflSnapshotError(message: string, status: number): NflSnapshotError {
  return Object.assign(new Error(message), { status });
}

function limitFixtures<T>(fixtures: T[], limit: number): T[] {
  return fixtures.slice(0, limit);
}

function clampNflSummarySnapshot(snapshot: typeof nflSnapshot): NFLSummarySnapshot {
  const { teamSnapshots: _teamSnapshots, ...summarySnapshot } = snapshot;
  return {
    ...summarySnapshot,
    recentFixtures: limitFixtures(summarySnapshot.recentFixtures, SUMMARY_FIXTURE_LIMIT),
    upcomingFixtures: limitFixtures(summarySnapshot.upcomingFixtures, SUMMARY_FIXTURE_LIMIT),
  };
}

function clampNflTeamSnapshot(snapshot: NFLTeamSnapshot): NFLTeamSnapshot {
  return {
    ...snapshot,
    recentFixtures: limitFixtures(snapshot.recentFixtures, TEAM_FIXTURE_LIMIT),
    upcomingFixtures: limitFixtures(snapshot.upcomingFixtures, TEAM_FIXTURE_LIMIT),
  };
}

export function createEmptyNflSummarySnapshot(): NFLSummarySnapshot {
  return {
    season: nflSnapshot.season,
    week: 0,
    updatedAt: nflSnapshot.updatedAt,
    sourceLabel: nflSnapshot.sourceLabel,
    sourceUrls: nflSnapshot.sourceUrls,
    teams: [],
    leaders: { passing: [], rushing: [], receiving: [], sacks: [] },
    recentFixtures: [],
    upcomingFixtures: [],
    teamOptions: [],
  };
}

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
  return clampNflSummarySnapshot(nflSnapshot);
}

export async function getNflTeamSnapshot(teamId: string): Promise<NFLTeamSnapshot> {
  const snapshot = nflSnapshot.teamSnapshots[teamId];
  if (!snapshot) {
    throw createNflSnapshotError("NFL team snapshot was not found.", 404);
  }
  return clampNflTeamSnapshot(snapshot);
}
