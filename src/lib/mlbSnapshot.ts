import { mlbSnapshot } from "@/data/mlbSnapshot";
import { buildMlbLiveSummaryData } from "@/lib/mlbData";
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

interface MlbSummaryOptions {
  preferLive?: boolean;
}

const LIVE_CACHE_TTL_MS = 60_000;
let liveSummaryCache:
  | { summary: MlbSummarySnapshot; expiresAt: number }
  | null = null;
let liveSummaryInflight: Promise<MlbSummarySnapshot> | null = null;

export function resetMlbLiveCacheForTests(): void {
  liveSummaryCache = null;
  liveSummaryInflight = null;
}

export async function getMlbSummarySnapshot(
  options: MlbSummaryOptions = {}
): Promise<MlbSummarySnapshot> {
  if (!options.preferLive) return clampMlbSummarySnapshot(mlbSnapshot);
  if (liveSummaryCache && liveSummaryCache.expiresAt > Date.now()) {
    return liveSummaryCache.summary;
  }
  if (liveSummaryInflight) return liveSummaryInflight;

  liveSummaryInflight = buildMlbLiveSummaryData(clampMlbSummarySnapshot(mlbSnapshot))
    .then((summary) => {
      liveSummaryCache = {
        summary,
        expiresAt: Date.now() + LIVE_CACHE_TTL_MS,
      };
      return summary;
    })
    // The committed snapshot is the last-known-good fallback when statsapi is
    // unavailable. Failures are never cached, so the next request retries.
    .catch(() => clampMlbSummarySnapshot(mlbSnapshot))
    .finally(() => {
      liveSummaryInflight = null;
    });

  return liveSummaryInflight;
}

export async function getMlbTeamSnapshot(teamId: string): Promise<MlbTeamSnapshot> {
  const snapshot = mlbSnapshot.teamSnapshots[teamId];
  if (!snapshot) {
    throw createMlbSnapshotError("MLB team snapshot was not found.", 404);
  }
  return clampMlbTeamSnapshot(snapshot);
}
