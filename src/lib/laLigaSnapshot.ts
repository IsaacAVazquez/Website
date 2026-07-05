import { laLigaSnapshot } from "@/data/laLigaSnapshot";
import type { LaLigaSummarySnapshot, LaLigaTeamSnapshot } from "@/types/la-liga";

const SUMMARY_FIXTURE_LIMIT = 8;
const TEAM_FIXTURE_LIMIT = 5;

interface LaLigaSnapshotError extends Error {
  status: number;
}

function createLaLigaSnapshotError(message: string, status: number): LaLigaSnapshotError {
  return Object.assign(new Error(message), { status });
}

function limitFixtures<T>(fixtures: T[], limit: number): T[] {
  return fixtures.slice(0, limit);
}

function clampLaLigaSummarySnapshot(snapshot: typeof laLigaSnapshot): LaLigaSummarySnapshot {
  const { teamSnapshots: _teamSnapshots, ...summarySnapshot } = snapshot;
  return {
    ...summarySnapshot,
    recentFixtures: limitFixtures(summarySnapshot.recentFixtures, SUMMARY_FIXTURE_LIMIT),
    upcomingFixtures: limitFixtures(summarySnapshot.upcomingFixtures, SUMMARY_FIXTURE_LIMIT),
    // Defaults for committed snapshots written before these fields existed.
    assists: summarySnapshot.assists ?? [],
    goalsPerMatchday: summarySnapshot.goalsPerMatchday ?? [],
  };
}

function clampLaLigaTeamSnapshot(snapshot: LaLigaTeamSnapshot): LaLigaTeamSnapshot {
  return {
    ...snapshot,
    recentFixtures: limitFixtures(snapshot.recentFixtures, TEAM_FIXTURE_LIMIT),
    upcomingFixtures: limitFixtures(snapshot.upcomingFixtures, TEAM_FIXTURE_LIMIT),
  };
}

export function createEmptyLaLigaSummarySnapshot(): LaLigaSummarySnapshot {
  return {
    season: laLigaSnapshot.season,
    matchday: 0,
    updatedAt: laLigaSnapshot.updatedAt,
    sourceLabel: laLigaSnapshot.sourceLabel,
    sourceUrls: laLigaSnapshot.sourceUrls,
    clubs: [],
    scorers: [],
    assists: [],
    goalsPerMatchday: [],
    recentFixtures: [],
    upcomingFixtures: [],
    teams: [],
  };
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

// La Liga snapshot keys are mostly TLAs (lowercase 3-letter codes) with a
// numeric fallback; either form passes the shape check below. The regex
// gates malformed input before we look it up in the snapshot dictionary so
// route handlers can return 400 (bad input) vs 404 (unknown id).
const LA_LIGA_TEAM_ID_PATTERN = /^([1-9]\d{0,4}|[a-z0-9]{2,4})$/i;

export function isLaLigaTeamIdShape(teamId: string): boolean {
  return LA_LIGA_TEAM_ID_PATTERN.test(teamId);
}

export function isValidLaLigaTeamId(teamId: string): boolean {
  return LA_LIGA_TEAM_ID_PATTERN.test(teamId) && teamId in laLigaSnapshot.teamSnapshots;
}

export async function getLaLigaSummarySnapshot(): Promise<LaLigaSummarySnapshot> {
  return clampLaLigaSummarySnapshot(laLigaSnapshot);
}

export async function getLaLigaTeamSnapshot(teamId: string): Promise<LaLigaTeamSnapshot> {
  const snapshot = laLigaSnapshot.teamSnapshots[teamId];
  if (!snapshot) {
    throw createLaLigaSnapshotError("La Liga team snapshot was not found.", 404);
  }
  return clampLaLigaTeamSnapshot(snapshot);
}
