// ============================================================
// Scoring rules — the pool's points logic
//
// Three tiers, all configurable: exact score, correct winner and
// goal difference without the exact score, correct outcome alone.
// The basis flag genuinely changes the scoring path: under
// 90-minute rules a knockout that finishes 1-1 and is decided on
// penalties scores as a 1-1 draw, so a favorite pick earns nothing
// while a draw pick banks. Under final-result rules the pick is
// compared to the score after extra time instead.
// ============================================================

import { outcomeOfScore } from "./scorelineModel";
import type {
  MatchOutcome,
  MatchResultInput,
  PickScore,
  Scoreline,
  ScoringRules,
} from "./types";

export function goalDifference(score: Scoreline): number {
  return score.home - score.away;
}

export function sameScoreline(a: Scoreline, b: Scoreline): boolean {
  return a.home === b.home && a.away === b.away;
}

/**
 * The score and outcome a result reduces to under the configured basis.
 * `outcome` can differ from the score's own outcome only when the pool
 * counts a shootout winner as the winner of a level final score.
 */
export function comparisonForResult(
  result: MatchResultInput,
  rules: ScoringRules,
): { score: Scoreline; outcome: MatchOutcome } {
  if (rules.basis === "ninetyMinutes") {
    const score = result.ninetyMinutes;
    return { score, outcome: outcomeOfScore(score) };
  }
  const score = result.afterExtraTime ?? result.ninetyMinutes;
  if (rules.penaltiesCountAsWin && result.penaltyWinner) {
    return { score, outcome: result.penaltyWinner };
  }
  return { score, outcome: outcomeOfScore(score) };
}

/**
 * Score a pick against a single (score, outcome) cell. Used both for real
 * results and, inside the optimizer, for every cell of the distribution.
 */
export function scorePickAgainstCell(
  pick: Scoreline,
  cellScore: Scoreline,
  cellOutcome: MatchOutcome,
  rules: ScoringRules,
): PickScore {
  if (sameScoreline(pick, cellScore)) {
    return { points: rules.exact, component: "exact" };
  }
  const pickOutcome = outcomeOfScore(pick);
  if (pickOutcome === cellOutcome) {
    if (goalDifference(pick) === goalDifference(cellScore)) {
      // For draws both differences are zero, which is exactly why a draw
      // pick collects this tier on every draw and not only the exact one.
      return { points: rules.correctDifference, component: "difference" };
    }
    return { points: rules.correctOutcome, component: "outcome" };
  }
  return { points: 0, component: "none" };
}

/** Score a submitted pick against an actual result under the pool's rules. */
export function scorePick(
  pick: Scoreline,
  result: MatchResultInput,
  rules: ScoringRules,
): PickScore {
  const comparison = comparisonForResult(result, rules);
  return scorePickAgainstCell(pick, comparison.score, comparison.outcome, rules);
}
