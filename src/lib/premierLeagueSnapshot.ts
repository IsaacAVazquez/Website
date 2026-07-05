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
    // Defaults for committed snapshots written before this field existed.
    goalsPerMatchday: summary.goalsPerMatchday ?? [],
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
    goalsPerMatchday: [],
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

// Regex shape check (PL ids are positive integers, max 5 digits) runs before
// membership so a malformed id can be rejected as a 400 by route handlers
// without touching the snapshot dictionary.
const PL_TEAM_ID_PATTERN = /^[1-9]\d{0,4}$/;

export function isPremierLeagueTeamIdShape(teamId: string): boolean {
  return PL_TEAM_ID_PATTERN.test(teamId);
}

export function isValidPremierLeagueTeamId(teamId: string): boolean {
  return PL_TEAM_ID_PATTERN.test(teamId) && teamId in premierLeagueSnapshot.teamSnapshots;
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
