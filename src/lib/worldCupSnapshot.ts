import { worldCupSnapshot } from "@/data/worldCupSnapshot";
import type {
  WorldCupSummarySnapshot,
  WorldCupTeamSnapshot,
} from "@/types/worldCup";

const SUMMARY_FIXTURE_LIMIT = 12;
const TEAM_FIXTURE_LIMIT = 5;

interface WorldCupSnapshotError extends Error {
  status: number;
}

function createWorldCupSnapshotError(
  message: string,
  status: number
): WorldCupSnapshotError {
  return Object.assign(new Error(message), { status });
}

function limitFixtures<T>(fixtures: T[], limit: number): T[] {
  return fixtures.slice(0, limit);
}

function clampSummarySnapshot(
  snapshot: typeof worldCupSnapshot
): WorldCupSummarySnapshot {
  const { teamSnapshots: _teamSnapshots, ...summarySnapshot } = snapshot;
  return {
    ...summarySnapshot,
    recentFixtures: limitFixtures(summarySnapshot.recentFixtures, SUMMARY_FIXTURE_LIMIT),
    upcomingFixtures: limitFixtures(
      summarySnapshot.upcomingFixtures,
      SUMMARY_FIXTURE_LIMIT
    ),
  };
}

function clampTeamSnapshot(snapshot: WorldCupTeamSnapshot): WorldCupTeamSnapshot {
  return {
    ...snapshot,
    recentFixtures: limitFixtures(snapshot.recentFixtures, TEAM_FIXTURE_LIMIT),
    upcomingFixtures: limitFixtures(snapshot.upcomingFixtures, TEAM_FIXTURE_LIMIT),
  };
}

export function createEmptyWorldCupSummarySnapshot(): WorldCupSummarySnapshot {
  return {
    tournament: worldCupSnapshot.tournament,
    groups: [],
    knockout: [],
    recentFixtures: [],
    upcomingFixtures: [],
    scorers: [],
    teamOptions: [],
  };
}

export function createEmptyWorldCupTeamSnapshot(): WorldCupTeamSnapshot {
  return {
    team: null,
    standing: null,
    recentFixtures: [],
    upcomingFixtures: [],
    form: {
      sequence: [],
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    },
    generatedAt: new Date().toISOString(),
  };
}

// Team snapshot keys are URL-safe slugs (e.g. "united-states", "brazil"). The
// shape check runs before membership so a malformed id is rejected as a 400 by
// the route handler without touching the snapshot dictionary.
const WORLD_CUP_TEAM_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/i;

export function isWorldCupTeamIdShape(teamId: string): boolean {
  return WORLD_CUP_TEAM_ID_PATTERN.test(teamId);
}

export function isValidWorldCupTeamId(teamId: string): boolean {
  return (
    WORLD_CUP_TEAM_ID_PATTERN.test(teamId) &&
    teamId in worldCupSnapshot.teamSnapshots
  );
}

export async function getWorldCupSummarySnapshot(): Promise<WorldCupSummarySnapshot> {
  return clampSummarySnapshot(worldCupSnapshot);
}

export async function getWorldCupTeamSnapshot(
  teamId: string
): Promise<WorldCupTeamSnapshot> {
  const snapshot = worldCupSnapshot.teamSnapshots[teamId];
  if (!snapshot) {
    throw createWorldCupSnapshotError(
      "World Cup team snapshot was not found.",
      404
    );
  }
  return clampTeamSnapshot(snapshot);
}
