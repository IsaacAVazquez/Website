// ============================================================
// Score-pool prediction engine — public entry point
//
// Import from here (or `@/lib/scorePools`) rather than reaching
// into the individual modules; the internals are free to move.
// ============================================================

export * from "./types";
export {
  DEFAULT_SCORING_RULES,
  DEFAULT_EXTRA_TIME,
  DEFAULT_CONTEXT_PARAMS,
  DEFAULT_MODEL_CONFIG,
  DEFAULT_FIELD_CONFIG,
  DEFAULT_RISK_PARAMS,
  DEFAULT_STANDING,
  createDefaultPoolConfig,
} from "./defaults";
export {
  toDecimal,
  rawPriceToDecimal,
  impliedProbability,
  overround,
  devig,
  devigMoneyline,
  devigTotals,
} from "./odds";
export { poissonPmf, poissonRow } from "./poisson";
export {
  buildGrid,
  rhoBounds,
  outcomeMasses,
  expectedTotalOfGrid,
  pOverLine,
  calibrateDistribution,
  buildComparisonDistribution,
  outcomeOfScore,
  type CalibrationConfig,
} from "./scorelineModel";
export {
  applyContextAdjustments,
  suggestContextFlags,
  type ContextAdjustmentResult,
} from "./context";
export {
  goalDifference,
  sameScoreline,
  comparisonForResult,
  scorePickAgainstCell,
  scorePick,
} from "./scoring";
export {
  candidateScorelines,
  evaluateCandidate,
  evaluateCandidates,
} from "./optimizer";
export {
  buildFieldPicks,
  fieldPointsByCell,
  fieldExpectedPoints,
  fieldShareOf,
} from "./field";
export {
  deriveRiskProfile,
  recommendPick,
  assessConfidence,
} from "./leaderboard";
export {
  analyzeFixture,
  analyzeRound,
  summarizeLineMovement,
  type AnalyzeOptions,
} from "./engine";
