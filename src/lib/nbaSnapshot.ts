import { nbaSnapshot } from "@/data/nbaSnapshot";
import type { NbaSummarySnapshot, NbaTeamSnapshot } from "@/types/nba";

const SUMMARY_FIXTURE_LIMIT = 10;
const TEAM_FIXTURE_LIMIT = 5;

interface NbaSnapshotError extends Error {
  status: number;
}

function createNbaSnapshotError(message: string, status: number): NbaSnapshotError {
  return Object.assign(new Error(message), { status });
}

function limitFixtures<T>(fixtures: T[], limit: number): T[] {
  return fixtures.slice(0, limit);
}

function clampNbaSummarySnapshot(snapshot: typeof nbaSnapshot): NbaSummarySnapshot {
  const { teamSnapshots: _teamSnapshots, ...summarySnapshot } = snapshot;
  return {
    ...summarySnapshot,
    recentFixtures: limitFixtures(summarySnapshot.recentFixtures, SUMMARY_FIXTURE_LIMIT),
    upcomingFixtures: limitFixtures(summarySnapshot.upcomingFixtures, SUMMARY_FIXTURE_LIMIT),
  };
}

function clampNbaTeamSnapshot(snapshot: NbaTeamSnapshot): NbaTeamSnapshot {
  return {
    ...snapshot,
    recentFixtures: limitFixtures(snapshot.recentFixtures, TEAM_FIXTURE_LIMIT),
    upcomingFixtures: limitFixtures(snapshot.upcomingFixtures, TEAM_FIXTURE_LIMIT),
  };
}

export function createEmptyNbaSummarySnapshot(): NbaSummarySnapshot {
  return {
    season: nbaSnapshot.season,
    updatedAt: nbaSnapshot.updatedAt,
    sourceLabel: nbaSnapshot.sourceLabel,
    sourceUrls: nbaSnapshot.sourceUrls,
    teamsByConference: { east: [], west: [] },
    scorers: [],
    rebounders: [],
    assistLeaders: [],
    recentFixtures: [],
    upcomingFixtures: [],
    teams: [],
  };
}

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
  return clampNbaSummarySnapshot(nbaSnapshot);
}

export async function getNbaTeamSnapshot(teamId: string): Promise<NbaTeamSnapshot> {
  const snapshot = nbaSnapshot.teamSnapshots[teamId];
  if (!snapshot) {
    throw createNbaSnapshotError("NBA team snapshot was not found.", 404);
  }
  return clampNbaTeamSnapshot(snapshot);
}
