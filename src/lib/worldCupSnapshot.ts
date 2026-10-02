import { worldCupSnapshot } from "@/data/worldCupSnapshot";
import type {
  WorldCupSummarySnapshot,
  WorldCupTeamSnapshot,
} from "@/types/worldCup";
import { capFixtures, findTeamSnapshot } from "@/lib/teamSnapshots";

const SUMMARY_FIXTURE_LIMIT = 12;
const TEAM_FIXTURE_LIMIT = 5;

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
  // Use hasOwn (not `in`) so prototype keys like "constructor"/"toString" — which
  // pass the case-insensitive shape regex — don't resolve through the prototype
  // chain and turn a 404 into a cacheable 200 serializing a built-in.
  return (
    WORLD_CUP_TEAM_ID_PATTERN.test(teamId) &&
    Object.hasOwn(worldCupSnapshot.teamSnapshots, teamId)
  );
}

export async function getWorldCupSummarySnapshot(): Promise<WorldCupSummarySnapshot> {
  const { teamSnapshots: _teamSnapshots, ...summarySnapshot } = worldCupSnapshot;
  return capFixtures(summarySnapshot, SUMMARY_FIXTURE_LIMIT);
}

export async function getWorldCupTeamSnapshot(
  teamId: string
): Promise<WorldCupTeamSnapshot> {
  return capFixtures(
    findTeamSnapshot(worldCupSnapshot.teamSnapshots, teamId, "World Cup"),
    TEAM_FIXTURE_LIMIT
  );
}
