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
  ScorePoolsSnapshot,
  SnapshotFixture,
  SnapshotOddsEntry,
} from "@/types/scorePools";

export function getScorePoolsSnapshotData(): ScorePoolsSnapshot {
  return scorePoolsSnapshot;
}

export function hasLiveScorePoolsData(
  snapshot: ScorePoolsSnapshot = scorePoolsSnapshot
): boolean {
  return snapshot.leagues.some(
    (league) =>
      !league.sample &&
      league.fixtures.length > 0 &&
      league.fixtures.some((fixture) =>
        fixture.odds.some((odds) => !odds.manual)
      )
  );
}

// ─── Engine input mapping ────────────────────────────────────────────────────

function latestOddsEntry(fixture: SnapshotFixture): SnapshotOddsEntry | null {
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
