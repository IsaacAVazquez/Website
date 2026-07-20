// ============================================================
// Score pools — snapshot accessors
//
// Everything reads the committed snapshot; no external calls at
// request time. The engine input mapper lives here too, so the
// client and the tests build FixtureInput the exact same way.
// ============================================================

import { scorePoolsSnapshot } from "@/data/scorePoolsSnapshot";
import type { FixtureInput, MarketInputs } from "@/lib/scorePools";
import type {
  ScorePoolLeagueSnapshot,
  ScorePoolsSnapshot,
  SnapshotFixture,
  SnapshotOddsEntry,
} from "@/types/scorePools";

export interface ScorePoolLeagueSummary {
  key: string;
  name: string;
  sport: string;
  season: string | null;
  sample: boolean;
  generatedAt: string;
  sources: { fixtures: string; odds: string };
  notes: string[];
  fixtureCount: number;
  upcomingCount: number;
  finishedCount: number;
}

export interface ScorePoolsSummary {
  generatedAt: string;
  leagues: ScorePoolLeagueSummary[];
}

function createScorePoolsError(message: string, status: number): Error & { status: number } {
  return Object.assign(new Error(message), { status });
}

export function createEmptyScorePoolsSummary(): ScorePoolsSummary {
  return { generatedAt: scorePoolsSnapshot.generatedAt, leagues: [] };
}

export async function getScorePoolsSummary(): Promise<ScorePoolsSummary> {
  return {
    generatedAt: scorePoolsSnapshot.generatedAt,
    leagues: scorePoolsSnapshot.leagues.map((league) => ({
      key: league.key,
      name: league.name,
      sport: league.sport,
      season: league.season,
      sample: league.sample,
      generatedAt: league.generatedAt,
      sources: league.sources,
      notes: league.notes,
      fixtureCount: league.fixtures.length,
      upcomingCount: league.fixtures.filter((fixture) => fixture.status === "scheduled").length,
      finishedCount: league.fixtures.filter((fixture) => fixture.status === "finished").length,
    })),
  };
}

const LEAGUE_KEY_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;

export function isScorePoolLeagueKeyShape(key: string): boolean {
  return LEAGUE_KEY_PATTERN.test(key);
}

export function isValidScorePoolLeagueKey(key: string): boolean {
  return (
    isScorePoolLeagueKeyShape(key) &&
    scorePoolsSnapshot.leagues.some((league) => league.key === key)
  );
}

export async function getScorePoolLeague(key: string): Promise<ScorePoolLeagueSnapshot> {
  const league = scorePoolsSnapshot.leagues.find((entry) => entry.key === key);
  if (!league) {
    throw createScorePoolsError("Score-pool league was not found.", 404);
  }
  return league;
}

export function getScorePoolsSnapshotData(): ScorePoolsSnapshot {
  return scorePoolsSnapshot;
}

// ─── Engine input mapping ────────────────────────────────────────────────────

export function latestOddsEntry(fixture: SnapshotFixture): SnapshotOddsEntry | null {
  return fixture.odds.length > 0 ? fixture.odds[fixture.odds.length - 1] : null;
}

export function oddsEntryToMarkets(entry: SnapshotOddsEntry): MarketInputs {
  return {
    moneyline: {
      home: entry.moneyline.home,
      ...(entry.moneyline.draw !== null ? { draw: entry.moneyline.draw } : {}),
      away: entry.moneyline.away,
    },
    ...(entry.totals
      ? {
          totals: {
            line: entry.totals.line,
            ...(entry.totals.over !== null ? { over: entry.totals.over } : {}),
            ...(entry.totals.under !== null ? { under: entry.totals.under } : {}),
          },
        }
      : {}),
    fetchedAt: entry.fetchedAt,
    ...(entry.bookmaker !== null ? { bookmaker: entry.bookmaker } : {}),
    manual: entry.manual,
  };
}

/**
 * Map a snapshot fixture to the engine's input shape using its latest odds.
 * Returns null when the fixture has no odds at all — the engine needs a
 * moneyline to say anything, and pretending otherwise would be worse.
 */
export function toFixtureInput(fixture: SnapshotFixture): FixtureInput | null {
  const odds = latestOddsEntry(fixture);
  if (!odds) return null;
  return {
    id: fixture.id,
    kickoff: fixture.kickoff,
    homeTeam: fixture.homeTeam,
    awayTeam: fixture.awayTeam,
    stage: fixture.stage ?? fixture.round ?? undefined,
    knockout: fixture.knockout,
    markets: oddsEntryToMarkets(odds),
    ...(fixture.lineupsConfirmed !== null
      ? { lineupsConfirmed: fixture.lineupsConfirmed }
      : {}),
  };
}
