import { premierLeagueSnapshot } from "@/data/premierLeagueSnapshot";
import { buildPremierLeagueLiveSummary } from "@/lib/premierLeagueData";
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

interface PremierLeagueSummaryOptions {
  preferLive?: boolean;
}

// Request-time live refresh (football-data.org) is double-gated: the caller
// must ask for it (`preferLive`) and FOOTBALL_DATA_API_TOKEN must be set in
// the environment. The token is read per call, so an un-configured deploy
// never fetches and keeps returning the committed snapshot unchanged. The
// live path mirrors the bay-area-transit accessor: a 5-minute in-memory TTL
// plus a single-flight guard, which bounds upstream traffic to roughly one
// 3-request refresh per 5 minutes per instance, well inside the
// football-data.org free tier of 10 requests per minute.
const LIVE_SUMMARY_TTL_MS = 5 * 60 * 1000;
let liveSummaryCache:
  | { summary: PremierLeagueSummary; expiresAt: number }
  | null = null;
let liveSummaryInflight: Promise<PremierLeagueSummary> | null = null;

export function resetPremierLeagueLiveSummaryCacheForTests(): void {
  liveSummaryCache = null;
  liveSummaryInflight = null;
}

function hasFootballDataToken(): boolean {
  return Boolean(process.env.FOOTBALL_DATA_API_TOKEN?.trim());
}

async function getPremierLeagueSummarySource(
  options: PremierLeagueSummaryOptions
): Promise<PremierLeagueSummary> {
  if (!options.preferLive || !hasFootballDataToken()) {
    return premierLeagueSnapshot.summary;
  }
  if (liveSummaryCache && liveSummaryCache.expiresAt > Date.now()) {
    return liveSummaryCache.summary;
  }
  if (liveSummaryInflight) return liveSummaryInflight;

  liveSummaryInflight = buildPremierLeagueLiveSummary(premierLeagueSnapshot.summary)
    .then((summary) => {
      liveSummaryCache = {
        summary,
        expiresAt: Date.now() + LIVE_SUMMARY_TTL_MS,
      };
      return summary;
    })
    // A failed refresh serves the committed snapshot and is NOT cached, so
    // the next request retries the live path.
    .catch(() => premierLeagueSnapshot.summary)
    .finally(() => {
      liveSummaryInflight = null;
    });

  return liveSummaryInflight;
}

export async function getPremierLeagueSummary(
  options: PremierLeagueSummaryOptions = {}
): Promise<PremierLeagueSummary> {
  return clampPremierLeagueSummary(await getPremierLeagueSummarySource(options));
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
