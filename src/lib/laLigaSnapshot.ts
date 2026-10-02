import { laLigaSnapshot } from "@/data/laLigaSnapshot";
import { buildLaLigaLiveSummary } from "@/lib/laLigaData";
import { createLiveSummary } from "@/lib/footballLeagueData";
import type { LaLigaSummarySnapshot, LaLigaTeamSnapshot } from "@/types/la-liga";
import { capFixtures, findTeamSnapshot } from "@/lib/teamSnapshots";

const SUMMARY_FIXTURE_LIMIT = 8;
const TEAM_FIXTURE_LIMIT = 5;

function committedLaLigaSummarySnapshot(): LaLigaSummarySnapshot {
  const { teamSnapshots: _teamSnapshots, ...summarySnapshot } = laLigaSnapshot;
  return summarySnapshot;
}

function clampLaLigaSummarySnapshot(
  summarySnapshot: LaLigaSummarySnapshot
): LaLigaSummarySnapshot {
  return {
    ...capFixtures(summarySnapshot, SUMMARY_FIXTURE_LIMIT),
    // Defaults for committed snapshots written before these fields existed.
    assists: summarySnapshot.assists ?? [],
    goalsPerMatchday: summarySnapshot.goalsPerMatchday ?? [],
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

interface LaLigaSummaryOptions {
  preferLive?: boolean;
}

// Request-time live refresh (football-data.org), gated and cached as
// `createLiveSummary` describes. No caller passes `preferLive` today.
const liveSummary = createLiveSummary(committedLaLigaSummarySnapshot, buildLaLigaLiveSummary);

export function resetLaLigaLiveSummaryCacheForTests(): void {
  liveSummary.reset();
}

export async function getLaLigaSummarySnapshot(
  options: LaLigaSummaryOptions = {}
): Promise<LaLigaSummarySnapshot> {
  return clampLaLigaSummarySnapshot(await liveSummary.get(options.preferLive));
}

export async function getLaLigaTeamSnapshot(teamId: string): Promise<LaLigaTeamSnapshot> {
  return capFixtures(findTeamSnapshot(laLigaSnapshot.teamSnapshots, teamId, "La Liga"), TEAM_FIXTURE_LIMIT);
}
