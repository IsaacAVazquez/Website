import { premierLeagueSnapshot } from "@/data/premierLeagueSnapshot";
import { buildPremierLeagueLiveSummary } from "@/lib/premierLeagueData";
import { createLiveSummary } from "@/lib/footballLeagueData";
import type {
  PremierLeagueSummary,
  PremierLeagueTeamSnapshot,
} from "@/types/premier-league";
import { capFixtures, findTeamSnapshot } from "@/lib/teamSnapshots";

const SUMMARY_FIXTURE_LIMIT = 8;
const TEAM_FIXTURE_LIMIT = 5;

function clampPremierLeagueSummary(summary: PremierLeagueSummary): PremierLeagueSummary {
  return {
    ...capFixtures(summary, SUMMARY_FIXTURE_LIMIT),
    // Defaults for committed snapshots written before this field existed.
    goalsPerMatchday: summary.goalsPerMatchday ?? [],
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

// Request-time live refresh (football-data.org), gated and cached as
// `createLiveSummary` describes. No caller passes `preferLive` today.
const liveSummary = createLiveSummary(
  () => premierLeagueSnapshot.summary,
  buildPremierLeagueLiveSummary
);

export function resetPremierLeagueLiveSummaryCacheForTests(): void {
  liveSummary.reset();
}

export async function getPremierLeagueSummary(
  options: PremierLeagueSummaryOptions = {}
): Promise<PremierLeagueSummary> {
  return clampPremierLeagueSummary(await liveSummary.get(options.preferLive));
}

export async function getPremierLeagueTeamSnapshot(
  teamId: string
): Promise<PremierLeagueTeamSnapshot> {
  return capFixtures(
    findTeamSnapshot(premierLeagueSnapshot.teamSnapshots, teamId, "Premier League"),
    TEAM_FIXTURE_LIMIT
  );
}
