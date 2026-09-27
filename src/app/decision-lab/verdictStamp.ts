import {
  DECISION_WEIGHTS,
  type DecisionAxis,
  type DecisionMetrics,
  type DecisionRecommendation,
} from "./decision-lab-data";

export interface VerdictStamp {
  word: "SHIP" | "TEST" | "HOLD";
}

const STAMP_WORDS: Record<DecisionRecommendation, VerdictStamp["word"]> = {
  ship: "SHIP",
  test: "TEST",
  hold: "HOLD",
};

/** The word the rubber stamp prints across the matrix for a given verdict. */
export function verdictStamp(recommendation: DecisionRecommendation): VerdictStamp {
  return { word: STAMP_WORDS[recommendation] };
}

export interface VerdictContribution {
  axis: DecisionAxis;
  label: string;
  weight: number;
  raw: number;
  contribution: number;
}

const CONTRIBUTION_ROWS: ReadonlyArray<{ axis: DecisionAxis; label: string }> = [
  { axis: "impact", label: "Impact" },
  { axis: "confidence", label: "Confidence" },
  { axis: "effort", label: "Effort (inverted)" },
  { axis: "reversibility", label: "Reversibility" },
];

/**
 * The "Why this verdict" rows, in the order the list prints them. `effort`
 * inverts to `100 - raw` since a lower build cost is the positive signal,
 * and the weights come from `DECISION_WEIGHTS` so this can't drift from
 * `evaluateDecision`'s score.
 */
export function verdictContributions(metrics: DecisionMetrics): VerdictContribution[] {
  return CONTRIBUTION_ROWS.map(({ axis, label }) => {
    const raw = axis === "effort" ? 100 - metrics.effort : metrics[axis];
    const weight = DECISION_WEIGHTS[axis];
    return { axis, label, weight, raw, contribution: raw * weight };
  });
}
