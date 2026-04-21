export const DECISION_PRESET_IDS = [
  "support-copilot",
  "onboarding-refresh",
  "pricing-experiment",
  "pipeline-hardening",
  "enterprise-permissions",
  "notification-rewrite",
] as const;

export type DecisionPresetId = (typeof DECISION_PRESET_IDS)[number];
export type DecisionRecommendation = "ship" | "test" | "hold";
export type DecisionAxis = "impact" | "confidence" | "effort" | "reversibility";

export interface DecisionMetrics {
  impact: number;
  confidence: number;
  effort: number;
  reversibility: number;
}

export interface DecisionPreset extends DecisionMetrics {
  id: DecisionPresetId;
  name: string;
  summary: string;
  outcomeHint: string;
}

interface DecisionAxisSignal {
  axis: DecisionAxis;
  score: number;
}

export interface DecisionEvaluation {
  weightedScore: number;
  recommendation: DecisionRecommendation;
  strongestPositiveAxis: DecisionAxis;
  strongestRiskAxis: DecisionAxis;
  rationale: string;
}

export const DEFAULT_DECISION_PRESET_ID: DecisionPresetId = "support-copilot";

export const DECISION_PRESETS: readonly DecisionPreset[] = [
  {
    id: "support-copilot",
    name: "Support copilot rollout",
    summary:
      "I would use this when a support assistant could remove repetitive work, but the operating model still needs proof.",
    outcomeHint: "High upside with thin proof and a meaningful implementation load.",
    impact: 82,
    confidence: 46,
    effort: 64,
    reversibility: 71,
  },
  {
    id: "onboarding-refresh",
    name: "Onboarding refresh",
    summary:
      "I would use this when activation is clearly leaking and the fix feels measurable instead of speculative.",
    outcomeHint: "Solid upside, stronger evidence, and a reversible surface.",
    impact: 76,
    confidence: 73,
    effort: 38,
    reversibility: 79,
  },
  {
    id: "pricing-experiment",
    name: "Pricing experiment",
    summary:
      "I would use this when revenue upside looks real, but the signal quality is still too soft to commit blind.",
    outcomeHint: "Meaningful upside with confidence risk and limited room for error.",
    impact: 88,
    confidence: 41,
    effort: 57,
    reversibility: 34,
  },
  {
    id: "pipeline-hardening",
    name: "Pipeline hardening",
    summary:
      "I would use this when reliability work will not headline the roadmap, but the evidence is too clear to ignore.",
    outcomeHint: "Less glamorous upside, but strong proof and a manageable build.",
    impact: 67,
    confidence: 81,
    effort: 49,
    reversibility: 52,
  },
  {
    id: "enterprise-permissions",
    name: "Enterprise permissions",
    summary:
      "I would use this when expansion depends on control surfaces, but the delivery cost could crowd out faster wins.",
    outcomeHint: "Good upside with enough proof to test, though the build is heavy.",
    impact: 71,
    confidence: 58,
    effort: 72,
    reversibility: 46,
  },
  {
    id: "notification-rewrite",
    name: "Notification rewrite",
    summary:
      "I would use this when the urge to clean up noisy systems is real, but the case still looks weaker than the cost.",
    outcomeHint: "Low upside, thin proof, and expensive execution.",
    impact: 44,
    confidence: 39,
    effort: 83,
    reversibility: 29,
  },
] as const;

const presetMap = new Map(DECISION_PRESETS.map((preset) => [preset.id, preset]));

const positiveAxisCopy: Record<DecisionAxis, string> = {
  impact: "The upside is strong enough that I would treat it as a real candidate for the roadmap.",
  confidence:
    "The evidence base is solid enough that this feels closer to execution than speculation.",
  effort: "The delivery cost stays manageable, which makes the bet easier to move on quickly.",
  reversibility:
    "The blast radius is contained, so the team still has room to learn without overcommitting.",
};

const riskAxisCopy: Record<DecisionAxis, string> = {
  impact: "The expected upside still looks too shallow for the amount of attention it would need.",
  confidence: "The evidence base is still thin, so I would not trust a full commitment yet.",
  effort: "The delivery cost is still heavy for the likely return, which pushes me toward caution.",
  reversibility:
    "The move is still hard to unwind if it lands poorly, which raises the cost of being wrong.",
};

function selectStrongestSignal(signals: readonly DecisionAxisSignal[]): DecisionAxis {
  return signals.reduce((winner, signal) => (signal.score > winner.score ? signal : winner)).axis;
}

export function isDecisionPresetId(value: string | null | undefined): value is DecisionPresetId {
  return Boolean(value && presetMap.has(value as DecisionPresetId));
}

export function getDecisionPreset(presetId: DecisionPresetId): DecisionPreset {
  return presetMap.get(presetId) ?? presetMap.get(DEFAULT_DECISION_PRESET_ID)!;
}

export function getDecisionPresetMetrics(presetId: DecisionPresetId): DecisionMetrics {
  const preset = getDecisionPreset(presetId);
  return {
    impact: preset.impact,
    confidence: preset.confidence,
    effort: preset.effort,
    reversibility: preset.reversibility,
  };
}

export function evaluateDecision(metrics: DecisionMetrics): DecisionEvaluation {
  const weightedScore = Number(
    (
      metrics.impact * 0.35 +
      metrics.confidence * 0.25 +
      (100 - metrics.effort) * 0.25 +
      metrics.reversibility * 0.15
    ).toFixed(1)
  );

  let recommendation: DecisionRecommendation = "hold";
  if (weightedScore >= 68 && metrics.impact >= 65 && metrics.confidence >= 60) {
    recommendation = "ship";
  } else if (metrics.impact >= 60 || weightedScore >= 50) {
    recommendation = "test";
  }

  const strongestPositiveAxis = selectStrongestSignal([
    { axis: "impact", score: metrics.impact },
    { axis: "confidence", score: metrics.confidence },
    { axis: "effort", score: 100 - metrics.effort },
    { axis: "reversibility", score: metrics.reversibility },
  ]);

  const strongestRiskAxis = selectStrongestSignal([
    { axis: "impact", score: 100 - metrics.impact },
    { axis: "confidence", score: 100 - metrics.confidence },
    { axis: "effort", score: metrics.effort },
    { axis: "reversibility", score: 100 - metrics.reversibility },
  ]);

  const opening =
    recommendation === "ship"
      ? "I would ship this."
      : recommendation === "test"
        ? "I would test this before I commit fully."
        : "I would hold this for now.";

  return {
    weightedScore,
    recommendation,
    strongestPositiveAxis,
    strongestRiskAxis,
    rationale: `${opening} ${positiveAxisCopy[strongestPositiveAxis]} ${riskAxisCopy[strongestRiskAxis]}`,
  };
}
