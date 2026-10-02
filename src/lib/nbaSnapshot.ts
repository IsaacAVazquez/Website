import { nbaSnapshot } from "@/data/nbaSnapshot";
import type { NbaSummarySnapshot, NbaTeamSnapshot } from "@/types/nba";
import { capFixtures, findTeamSnapshot } from "@/lib/teamSnapshots";

const SUMMARY_FIXTURE_LIMIT = 10;
const TEAM_FIXTURE_LIMIT = 5;

export function createEmptyNbaTeamSnapshot(): NbaTeamSnapshot {
  return {
    team: null,
    recentFixtures: [],
    upcomingFixtures: [],
    form: { sequence: [], wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 },
    generatedAt: new Date().toISOString(),
  };
}

// NBA snapshot keys are lowercase 2-4 character abbreviations (e.g. "lal",
// "bos"). The regex check runs before membership so a malformed id can be
// rejected as a 400 by route handlers without touching the snapshot dict.
const NBA_TEAM_ID_PATTERN = /^[a-z0-9]{2,4}$/i;

export function isNbaTeamIdShape(teamId: string): boolean {
  return NBA_TEAM_ID_PATTERN.test(teamId);
}

export function isValidNbaTeamId(teamId: string): boolean {
  return NBA_TEAM_ID_PATTERN.test(teamId) && teamId in nbaSnapshot.teamSnapshots;
}

export async function getNbaSummarySnapshot(): Promise<NbaSummarySnapshot> {
  const { teamSnapshots: _teamSnapshots, ...summarySnapshot } = nbaSnapshot;
  return capFixtures(summarySnapshot, SUMMARY_FIXTURE_LIMIT);
}

export async function getNbaTeamSnapshot(teamId: string): Promise<NbaTeamSnapshot> {
  return capFixtures(findTeamSnapshot(nbaSnapshot.teamSnapshots, teamId, "NBA"), TEAM_FIXTURE_LIMIT);
}
