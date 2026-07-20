// ============================================================
// Expected-points optimizer
//
// For every candidate scoreline, sum over the full comparison
// distribution weighting each possible actual result by the points
// the candidate would earn against it. Rank by expected points.
//
// This is where "a 1-1 can beat picking the favorite outright"
// falls out of the math instead of being special-cased: a draw
// pick collects the winner-and-difference tier on every draw, so
// in a tight game its expected points clear a narrow favorite even
// when the favorite is likelier to win.
// ============================================================

import { scorePickAgainstCell } from "./scoring";
import type {
  CandidateEvaluation,
  ComparisonDistribution,
  Scoreline,
  ScoringRules,
} from "./types";

/** Every scoreline in the grid is a candidate pick. */
export function candidateScorelines(maxGoals: number): Scoreline[] {
  const candidates: Scoreline[] = [];
  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) candidates.push({ home: h, away: a });
  }
  return candidates;
}

/** Evaluate one candidate against the comparison distribution. */
export function evaluateCandidate(
  candidate: Scoreline,
  comparison: ComparisonDistribution,
  rules: ScoringRules,
): CandidateEvaluation {
  let expected = 0;
  let expectedSquare = 0;
  let pExact = 0;
  let pDifference = 0;
  let pOutcomeOnly = 0;

  for (const cell of comparison.cells) {
    const { points, component } = scorePickAgainstCell(
      candidate,
      cell.score,
      cell.outcome,
      rules,
    );
    if (points > 0) {
      expected += cell.probability * points;
      expectedSquare += cell.probability * points * points;
    }
    if (component === "exact") pExact += cell.probability;
    else if (component === "difference") pDifference += cell.probability;
    else if (component === "outcome") pOutcomeOnly += cell.probability;
  }

  const variance = Math.max(0, expectedSquare - expected * expected);
  const pAnyPoints = pExact + pDifference + pOutcomeOnly;
  return {
    score: candidate,
    expectedPoints: expected,
    variance,
    standardDeviation: Math.sqrt(variance),
    pExact,
    pDifference,
    pOutcomeOnly,
    pAnyPoints,
    pZero: Math.max(0, 1 - pAnyPoints),
  };
}

/**
 * Evaluate every candidate and rank by expected points, best first.
 * Ties break toward the likelier exact score, then the lower-scoring line.
 */
export function evaluateCandidates(
  comparison: ComparisonDistribution,
  rules: ScoringRules,
  candidates?: Scoreline[],
): CandidateEvaluation[] {
  const maxGoals = comparison.cells.reduce(
    (max, cell) => Math.max(max, cell.score.home, cell.score.away),
    0,
  );
  const list = candidates ?? candidateScorelines(maxGoals);
  const evaluated = list.map((candidate) => evaluateCandidate(candidate, comparison, rules));
  evaluated.sort((a, b) => {
    if (b.expectedPoints !== a.expectedPoints) return b.expectedPoints - a.expectedPoints;
    if (b.pExact !== a.pExact) return b.pExact - a.pExact;
    return a.score.home + a.score.away - (b.score.home + b.score.away);
  });
  return evaluated;
}
