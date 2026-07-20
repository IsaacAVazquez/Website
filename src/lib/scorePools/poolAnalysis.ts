// ============================================================
// Pool analysis glue — snapshot fixture + stored pool → engine run
//
// The one place that decides which odds feed the engine (hand-entered
// overrides beat the snapshot's latest), merges stored context flags,
// and scores submissions against results. The pick sheet, the detail
// drawer, and the tracker all go through here so they can't drift.
// ============================================================

import { analyzeFixture, type AnalyzeOptions } from "./engine";
import { scorePick } from "./scoring";
import { toPoolAnalysisConfig, type StoredManualOdds, type StoredPool } from "./persistence";
import type {
  FixtureAnalysis,
  FixtureInput,
  MarketInputs,
  MatchResultInput,
  PickScore,
  Scoreline,
} from "./types";
import { toFixtureInput } from "@/lib/scorePoolsSnapshot";
import type {
  ScorePoolLeagueSnapshot,
  SnapshotFixture,
  SnapshotStandingsRow,
} from "@/types/scorePools";

function manualOddsToMarkets(odds: StoredManualOdds): MarketInputs {
  return {
    moneyline: {
      home: odds.home,
      ...(odds.draw !== null ? { draw: odds.draw } : {}),
      away: odds.away,
    },
    ...(odds.line !== null
      ? {
          totals: {
            line: odds.line,
            ...(odds.over !== null ? { over: odds.over } : {}),
            ...(odds.under !== null ? { under: odds.under } : {}),
          },
        }
      : {}),
    fetchedAt: odds.enteredAt || undefined,
    manual: true,
  };
}

/**
 * Build the engine input for a fixture under a pool: hand-entered odds win,
 * else the snapshot's latest. Null when neither exists.
 */
export function buildPoolFixtureInput(
  fixture: SnapshotFixture,
  pool: StoredPool,
): FixtureInput | null {
  const manual = pool.manualOdds[fixture.id];
  if (manual) {
    return {
      id: fixture.id,
      kickoff: fixture.kickoff,
      homeTeam: fixture.homeTeam,
      awayTeam: fixture.awayTeam,
      stage: fixture.stage ?? fixture.round ?? undefined,
      knockout: fixture.knockout,
      markets: manualOddsToMarkets(manual),
      ...(fixture.lineupsConfirmed !== null
        ? { lineupsConfirmed: fixture.lineupsConfirmed }
        : {}),
    };
  }
  return toFixtureInput(fixture);
}

export interface PoolFixtureAnalysis {
  fixture: SnapshotFixture;
  analysis: FixtureAnalysis;
}

export interface PoolRoundAnalysis {
  analyzed: PoolFixtureAnalysis[];
  /** Fixtures the engine can't price because no odds exist anywhere. */
  missingOdds: SnapshotFixture[];
}

function standingsRows(league: ScorePoolLeagueSnapshot): SnapshotStandingsRow[] {
  return league.standings.flatMap((group) => group.rows);
}

/** Analyze a set of fixtures under a stored pool's configuration. */
export function analyzePoolFixtures(
  fixtures: SnapshotFixture[],
  league: ScorePoolLeagueSnapshot,
  pool: StoredPool,
  now: string,
): PoolRoundAnalysis {
  const config = toPoolAnalysisConfig(pool);
  const options: AnalyzeOptions = { now, standings: standingsRows(league) };
  const analyzed: PoolFixtureAnalysis[] = [];
  const missingOdds: SnapshotFixture[] = [];
  for (const fixture of fixtures) {
    const input = buildPoolFixtureInput(fixture, pool);
    if (!input) {
      missingOdds.push(fixture);
      continue;
    }
    const flags = pool.flags[fixture.id];
    analyzed.push({
      fixture,
      analysis: analyzeFixture({ ...input, ...(flags ? { flags } : {}) }, config, options),
    });
  }
  return { analyzed, missingOdds };
}

// ─── Scoring submissions against results ─────────────────────────────────────

/** The result a pool scores for a fixture: snapshot first, manual override second. */
export function effectiveResult(
  fixture: SnapshotFixture,
  pool: StoredPool,
): MatchResultInput | null {
  if (fixture.result) {
    return {
      ninetyMinutes: fixture.result.ninetyMinutes,
      ...(fixture.result.afterExtraTime
        ? { afterExtraTime: fixture.result.afterExtraTime }
        : {}),
      ...(fixture.result.penaltyWinner
        ? { penaltyWinner: fixture.result.penaltyWinner }
        : {}),
    };
  }
  const manual = pool.manualResults[fixture.id];
  if (manual) {
    return {
      ninetyMinutes: manual.ninetyMinutes,
      ...(manual.afterExtraTime ? { afterExtraTime: manual.afterExtraTime } : {}),
      ...(manual.penaltyWinner ? { penaltyWinner: manual.penaltyWinner } : {}),
    };
  }
  return null;
}

export interface ScoredPick {
  fixture: SnapshotFixture;
  pick: Scoreline;
  result: MatchResultInput | null;
  score: PickScore | null;
}

/** Score one participant's picks (mine or a rival's) across a league. */
export function scoreParticipantPicks(
  league: ScorePoolLeagueSnapshot,
  pool: StoredPool,
  picks: Record<string, Scoreline>,
): { rows: ScoredPick[]; total: number } {
  const rows: ScoredPick[] = [];
  let total = 0;
  for (const fixture of league.fixtures) {
    const pick = picks[fixture.id];
    if (!pick) continue;
    const result = effectiveResult(fixture, pool);
    const score = result ? scorePick(pick, result, pool.rules) : null;
    if (score) total += score.points;
    rows.push({ fixture, pick, result, score });
  }
  rows.sort((a, b) => a.fixture.kickoff.localeCompare(b.fixture.kickoff));
  return { rows, total };
}
