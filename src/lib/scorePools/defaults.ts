// ============================================================
// Score-pool engine — default parameters
//
// Every number here is a tunable heuristic, not a fitted constant.
// The engine surfaces which of them shaped a recommendation so the
// output never looks sharper than the assumptions underneath it.
// ============================================================

import type {
  ContextParams,
  ExtraTimeConfig,
  FieldModelConfig,
  ModelConfig,
  PoolAnalysisConfig,
  RiskParams,
  ScoringRules,
  StandingContext,
} from "./types";

/** The 5 / 3 / 2 scheme most pools run, scored on the 90-minute result. */
export const DEFAULT_SCORING_RULES: ScoringRules = {
  exact: 5,
  correctDifference: 3,
  correctOutcome: 2,
  basis: "ninetyMinutes",
  penaltiesCountAsWin: false,
};

/**
 * Extra time runs 30 minutes at a somewhat lower tempo than regulation —
 * tired legs and fear of the mistake. 0.85 on the pro-rated rate is a
 * defensible middle; it is not fitted to data.
 */
export const DEFAULT_EXTRA_TIME: ExtraTimeConfig = {
  tempo: 0.85,
  maxGoalsPerSide: 4,
  penaltyHomeWinProbability: 0.5,
};

/**
 * Context-flag multipliers applied to the calibration targets before the
 * solve. Deliberately modest: the flags nudge a market that mostly has the
 * information priced in already.
 */
export const DEFAULT_CONTEXT_PARAMS: ContextParams = {
  drawSuitsBothDrawBoost: 1.25,
  drawSuitsBothTotalFactor: 0.92,
  deadRubberTotalFactor: 0.9,
  deadRubberGapFactor: 0.85,
  deadRubberDrawBoost: 1.05,
  mustWinTotalFactor: 1.05,
  mustWinDrawFactor: 0.92,
  mustWinSideBoost: 1.05,
  rotationSideFactor: 0.9,
  rotationTotalFactor: 0.97,
};

export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  maxGoals: 7,
  /** Typical fitted Dixon-Coles values sit around −0.05 to −0.15 for soccer. */
  defaultRho: -0.1,
  /** Long-run top-flight soccer average when no totals market exists. */
  defaultExpectedTotal: 2.6,
  extraTime: DEFAULT_EXTRA_TIME,
  context: DEFAULT_CONTEXT_PARAMS,
};

/**
 * The field mostly submits chalk: the favorite with a modal scoreline.
 * These shares are a heuristic model of pool behavior, not a measurement,
 * and known rival picks override them entirely.
 */
export const DEFAULT_FIELD_CONFIG: FieldModelConfig = {
  modalShare: 0.3,
  chalkShare: 0.65,
};

export const DEFAULT_RISK_PARAMS: RiskParams = {
  /** Against a scoring field, ~40% of the exact-score points is a realistic
   * per-game catch-up rate; 5-point exacts → about 2 points a game. */
  swingFactor: 0.4,
  kMax: 0.75,
  gamma: 0.8,
  forcedFloor: 0.3,
  midPackProtectWeight: 0.35,
  safetyEpWindow: 0.35,
  diffMaxFieldShare: 0.05,
  diffEpWindow: 0.5,
};

export const DEFAULT_STANDING: StandingContext = {
  myPoints: 0,
  nearestAbovePoints: null,
  nearestBelowPoints: null,
  poolSize: 10,
  gamesRemaining: 10,
  posture: "auto",
};

export function createDefaultPoolConfig(): PoolAnalysisConfig {
  return {
    rules: { ...DEFAULT_SCORING_RULES },
    standing: { ...DEFAULT_STANDING },
    field: { ...DEFAULT_FIELD_CONFIG },
    model: {
      ...DEFAULT_MODEL_CONFIG,
      extraTime: { ...DEFAULT_EXTRA_TIME },
      context: { ...DEFAULT_CONTEXT_PARAMS },
    },
    risk: { ...DEFAULT_RISK_PARAMS },
    devigMethod: "proportional",
    lockOffsetMinutes: 60,
    staleOddsMinutes: 12 * 60,
  };
}
