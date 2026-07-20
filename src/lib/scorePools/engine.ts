// ============================================================
// Engine orchestration — markets in, an explained pick out
//
// analyzeFixture runs the full chain: de-vig → context shading →
// market-calibrated scoreline distribution → the comparison
// distribution the pool actually scores → expected points for every
// candidate → the standing-aware recommendation, with a
// plain-language reason and a recheck list. Pure and synchronous,
// so it runs the same in tests, on the server, and in the browser.
// ============================================================

import { applyContextAdjustments, suggestContextFlags } from "./context";
import { buildFieldPicks } from "./field";
import { recommendPick } from "./leaderboard";
import { devigMoneyline, devigTotals } from "./odds";
import { evaluateCandidates } from "./optimizer";
import {
  buildComparisonDistribution,
  calibrateDistribution,
} from "./scorelineModel";
import type {
  CalibrationTargets,
  ContextFlagKey,
  FixtureAnalysis,
  FixtureInput,
  MarketInputs,
  MovementSummary,
  PickRecommendation,
  PoolAnalysisConfig,
  RankedPick,
  ScorelineDistribution,
  StandingsTeam,
} from "./types";

// ─── Fixture analysis ────────────────────────────────────────────────────────

export interface AnalyzeOptions {
  /** ISO timestamp treated as "now" for staleness and lock checks. */
  now?: string;
  /** Standings rows for deriving suggested flags when the caller has them. */
  standings?: StandingsTeam[];
}

export function analyzeFixture(
  fixture: FixtureInput,
  pool: PoolAnalysisConfig,
  options: AnalyzeOptions = {},
): FixtureAnalysis {
  const now = options.now ?? new Date().toISOString();
  const { markets } = fixture;

  // 1. De-vig the moneyline (and totals when priced).
  const { probabilities, overround } = devigMoneyline(markets.moneyline, pool.devigMethod);
  const pOver = markets.totals
    ? devigTotals(markets.totals.over, markets.totals.under, pool.devigMethod)
    : null;

  // 2. Context flags shade the calibration targets, not the finished grid.
  const baseTargets: CalibrationTargets = {
    outcome: probabilities,
    ...(markets.totals
      ? { totals: { line: markets.totals.line, ...(pOver !== null ? { pOver } : {}) } }
      : {}),
  };
  const suggested =
    fixture.suggestedFlags ??
    suggestContextFlags(fixture.homeTeam, fixture.awayTeam, options.standings);
  const context = applyContextAdjustments(
    baseTargets,
    fixture.flags,
    pool.model.context,
  );

  // 3. Calibrate. When flags want the total moved but the totals anchor is a
  //    priced market, calibrate to the market first and rescale that total.
  const calibrationConfig = {
    maxGoals: pool.model.maxGoals,
    defaultRho: pool.model.defaultRho,
    defaultExpectedTotal: pool.model.defaultExpectedTotal,
  };
  let distribution: ScorelineDistribution;
  if (context.totalFactor !== 1) {
    const marketCalibrated = calibrateDistribution(context.targets, calibrationConfig);
    distribution = calibrateDistribution(
      {
        ...context.targets,
        totals: undefined,
        expectedTotalOverride: marketCalibrated.expectedTotal * context.totalFactor,
      },
      calibrationConfig,
    );
    distribution.diagnostics.notes.push(
      `Context flags moved the expected total from ${marketCalibrated.expectedTotal.toFixed(2)} to ${distribution.expectedTotal.toFixed(2)}.`,
    );
  } else {
    distribution = calibrateDistribution(context.targets, calibrationConfig);
  }

  // 4. The distribution the pool scores, per the basis flag.
  const comparison = buildComparisonDistribution(distribution, {
    basis: pool.rules.basis,
    knockout: fixture.knockout,
    penaltiesCountAsWin: pool.rules.penaltiesCountAsWin,
    extraTime: pool.model.extraTime,
  });

  // 5. Expected points for every candidate, then the standing-aware pick.
  const candidates = evaluateCandidates(comparison, pool.rules);
  const fieldPicks = buildFieldPicks(distribution, pool.field);
  const recommendation = recommendPick(
    candidates,
    fieldPicks,
    comparison,
    pool.rules,
    pool.standing,
    pool.risk,
    // Known rival picks are the actual opponent; the heuristic field only
    // stands in when no real picks are configured.
    pool.field.overrides && pool.field.overrides.length > 0 ? fieldPicks : undefined,
  );
  recommendation.reason = buildReason(fixture, pool, distribution, recommendation, context.applied);

  const locksAt = new Date(
    new Date(fixture.kickoff).getTime() - pool.lockOffsetMinutes * 60_000,
  ).toISOString();

  return {
    fixtureId: fixture.id,
    homeTeam: fixture.homeTeam,
    awayTeam: fixture.awayTeam,
    kickoff: fixture.kickoff,
    locksAt,
    knockout: fixture.knockout,
    stage: fixture.stage,
    market: {
      probabilities,
      overround,
      totalsLine: markets.totals?.line ?? null,
      fetchedAt: markets.fetchedAt ?? null,
      bookmaker: markets.bookmaker ?? null,
      manual: markets.manual ?? false,
    },
    appliedFlags: context.applied,
    contextAudit: context.audit,
    suggestedFlags: suggested,
    distribution,
    comparison,
    recommendation,
    recheck: buildRecheckList(fixture, pool, distribution, suggested, now),
    asOf: now,
  };
}

/** Analyze a set of fixtures (a round or matchday), sorted by kickoff. */
export function analyzeRound(
  fixtures: FixtureInput[],
  pool: PoolAnalysisConfig,
  options: AnalyzeOptions = {},
): FixtureAnalysis[] {
  return fixtures
    .map((fixture) => analyzeFixture(fixture, pool, options))
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff));
}

// ─── Reasons and recheck lists ───────────────────────────────────────────────

function formatScore(pick: RankedPick): string {
  return `${pick.score.home}-${pick.score.away}`;
}

function buildReason(
  fixture: FixtureInput,
  pool: PoolAnalysisConfig,
  distribution: ScorelineDistribution,
  recommendation: PickRecommendation,
  appliedFlags: ContextFlagKey[],
): string {
  const { recommended, risk, fieldPicks, candidates } = recommendation;
  const pickIsDraw = recommended.score.home === recommended.score.away;
  const fieldModal = fieldPicks[0];
  const matchesField =
    fieldModal &&
    fieldModal.score.home === recommended.score.home &&
    fieldModal.score.away === recommended.score.away;
  const epTop = candidates.reduce(
    (best, pick) => (pick.expectedPoints > best.expectedPoints ? pick : best),
    candidates[0],
  );
  const favorite =
    distribution.outcome.home >= distribution.outcome.away ? fixture.homeTeam : fixture.awayTeam;
  const parts: string[] = [];

  const epTopIsRecommended =
    epTop.score.home === recommended.score.home && epTop.score.away === recommended.score.away;

  if (pickIsDraw && pool.rules.basis === "ninetyMinutes" && fixture.knockout) {
    parts.push(
      `This looks tight, and under 90-minute scoring a knockout that stays level through 90 pays the draw pick even when it's settled on penalties, so ${formatScore(recommended)} collects on every level scoreline.`,
    );
  } else if (pickIsDraw) {
    parts.push(
      `The market has this close and the expected total is ${distribution.expectedTotal < 2.45 ? "low" : "moderate"}, so ${formatScore(recommended)} banks the difference points on every draw and edges the narrow ${favorite} picks on expected points.`,
    );
  } else if (risk.derivedPosture === "protect" && !epTopIsRecommended) {
    parts.push(
      `Expected points has ${formatScore(epTop)} ahead, but you're protecting a lead, so staying with the field on ${formatScore(recommended)} keeps the gap variance down and lets the shared result cancel.`,
    );
  } else if (matchesField) {
    parts.push(
      `The math lands where the room will land. ${formatScore(recommended)} for ${favorite} is the modal score and the best expected points, so there's nothing to gain by diverging.`,
    );
  } else if (risk.derivedPosture === "chase" && recommended.fieldShare <= 0.05) {
    parts.push(
      `You need to make ground and the field will mostly sit on ${fieldModal ? `${fieldModal.score.home}-${fieldModal.score.away}` : "the favorite"}, so ${formatScore(recommended)} is the quality differentiator since the model has it competitive on expected points with almost nobody on it.`,
    );
  } else {
    parts.push(
      `${formatScore(recommended)} comes out on top of the expected-points table against the whole scoreline distribution, not just the most likely single result.`,
    );
  }

  if (appliedFlags.length > 0) {
    const flagWords: Record<ContextFlagKey, string> = {
      deadRubber: "a dead rubber",
      drawSuitsBoth: "a draw suiting both sides",
      mustWinHome: `a must-win for ${fixture.homeTeam}`,
      mustWinAway: `a must-win for ${fixture.awayTeam}`,
      rotationRiskHome: `rotation risk for ${fixture.homeTeam}`,
      rotationRiskAway: `rotation risk for ${fixture.awayTeam}`,
    };
    parts.push(
      `The numbers are shaded for ${appliedFlags.map((flag) => flagWords[flag]).join(" and ")}.`,
    );
  }

  if (recommendation.confidence.level === "low") {
    parts.push("It's a genuine coin flip, so treat the edge here as thin.");
  }
  return parts.join(" ");
}

function buildRecheckList(
  fixture: FixtureInput,
  pool: PoolAnalysisConfig,
  distribution: ScorelineDistribution,
  suggested: FixtureAnalysis["suggestedFlags"],
  now: string,
): string[] {
  const recheck: string[] = [];
  const { markets } = fixture;

  if (markets.fetchedAt) {
    const ageMinutes = (new Date(now).getTime() - new Date(markets.fetchedAt).getTime()) / 60_000;
    if (ageMinutes > pool.staleOddsMinutes) {
      const hours = Math.round(ageMinutes / 60);
      recheck.push(
        `The odds are about ${hours} hours old, so check for line movement before you lock.`,
      );
    }
  } else {
    recheck.push("The odds carry no timestamp, so treat them as possibly stale.");
  }
  if (markets.manual) {
    recheck.push("These odds were entered by hand; re-check them against a live book if you can.");
  }
  if (!markets.totals) {
    recheck.push(
      `No totals market was available, so the expected total leans on a default of ${pool.model.defaultExpectedTotal} goals.`,
    );
  }
  if (fixture.lineupsConfirmed === false) {
    recheck.push("Lineups aren't confirmed yet; rotation would change the totals side of this.");
  }
  const applied = new Set(Object.entries(fixture.flags ?? {}).filter(([, v]) => v).map(([k]) => k));
  const pendingSuggestions = suggested.filter((s) => !applied.has(s.flag));
  for (const suggestion of pendingSuggestions) {
    recheck.push(`Standings suggest ${suggestion.flag}: ${suggestion.reason}`);
  }
  if (!distribution.diagnostics.converged) {
    recheck.push(
      "Calibration couldn't match every market number exactly; the diagnostics show what gave.",
    );
  }
  return recheck;
}

// ─── Line movement ───────────────────────────────────────────────────────────

/**
 * Compare the earliest and latest odds snapshots for a fixture. Every
 * snapshot is kept rather than overwritten precisely so this stays queryable.
 */
export function summarizeLineMovement(
  history: MarketInputs[],
  devigMethod: PoolAnalysisConfig["devigMethod"] = "proportional",
): MovementSummary | null {
  const dated = history
    .filter((entry) => entry.fetchedAt)
    .sort((a, b) => (a.fetchedAt as string).localeCompare(b.fetchedAt as string));
  if (dated.length < 2) return null;
  const first = dated[0];
  const last = dated[dated.length - 1];
  const firstProbs = devigMoneyline(first.moneyline, devigMethod).probabilities;
  const lastProbs = devigMoneyline(last.moneyline, devigMethod).probabilities;
  return {
    from: first.fetchedAt as string,
    to: last.fetchedAt as string,
    snapshots: dated.length,
    outcomeDelta: {
      home: lastProbs.home - firstProbs.home,
      draw:
        lastProbs.draw !== undefined && firstProbs.draw !== undefined
          ? lastProbs.draw - firstProbs.draw
          : null,
      away: lastProbs.away - firstProbs.away,
    },
    totalLineDelta:
      last.totals && first.totals ? last.totals.line - first.totals.line : null,
  };
}
