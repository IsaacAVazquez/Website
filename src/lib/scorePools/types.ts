// ============================================================
// Score-pool prediction engine — shared types
//
// The engine is sport-agnostic and pure: markets in, a calibrated
// scoreline distribution out, then expected points and a
// standing-aware recommendation. Data adapters, scoring rules,
// the field model, and the leaderboard layer are all swappable —
// nothing in here knows about a provider or a UI.
// ============================================================

// ─── Odds ────────────────────────────────────────────────────────────────────

export type OddsFormat = "decimal" | "american" | "fractional";

/** How the bookmaker margin gets stripped. Proportional is the default. */
export type DevigMethod = "proportional" | "power";

/** A single price as entered or fetched, before normalization. */
export interface RawPrice {
  value: number | string;
  format: OddsFormat;
}

/** Moneyline in decimal odds. `draw` present only for three-way markets. */
export interface MoneylineOdds {
  home: number;
  draw?: number;
  away: number;
}

/** Totals (over/under) in decimal odds. Prices optional — a bare line works. */
export interface TotalsOdds {
  line: number;
  over?: number;
  under?: number;
}

/** De-vigged outcome probabilities. Sums to 1. `draw` only for three-way. */
export interface OutcomeProbabilities {
  home: number;
  draw?: number;
  away: number;
}

export interface DevigResult {
  probabilities: number[];
  /** Bookmaker margin: sum of raw implied probabilities minus 1. */
  overround: number;
  method: DevigMethod;
}

/** One timestamped odds snapshot for a fixture. */
export interface MarketInputs {
  moneyline: MoneylineOdds;
  totals?: TotalsOdds;
  /** ISO timestamp of when these prices were captured. */
  fetchedAt?: string;
  bookmaker?: string;
  /** True when the odds were hand-entered rather than fetched. */
  manual?: boolean;
}

// ─── Scorelines and distributions ────────────────────────────────────────────

export interface Scoreline {
  home: number;
  away: number;
}

export type MatchOutcome = "home" | "draw" | "away";

export interface CalibrationDiagnostics {
  converged: boolean;
  /** Signed target-minus-model residuals after calibration. */
  residuals: {
    home: number;
    draw: number | null;
    away: number;
    total: number | null;
  };
  /** The low-score correlation the solver landed on. */
  rho: number;
  /** True when the draw target wanted a rho outside the valid Dixon-Coles range. */
  rhoClamped: boolean;
  totalsMode: "quantile" | "mean" | "default";
  /** Plain-language notes about approximations and compromises. */
  notes: string[];
}

/** The calibrated 90-minute scoreline distribution. */
export interface ScorelineDistribution {
  maxGoals: number;
  /** grid[home][away], normalized to sum to 1. */
  grid: number[][];
  lambdaHome: number;
  lambdaAway: number;
  rho: number;
  outcome: { home: number; draw: number; away: number };
  expectedTotal: number;
  diagnostics: CalibrationDiagnostics;
}

/**
 * A cell of the distribution the pool actually scores against. Under
 * 90-minute rules this is just the 90-minute grid. Under final-result rules
 * in a knockout, draws extend through extra time, and a still-level score can
 * carry a win outcome when the pool counts the shootout winner as the winner.
 */
export interface ComparisonCell {
  score: Scoreline;
  probability: number;
  /** Outcome used for outcome points. Differs from the score's own outcome
   * only for level knockout scores decided on penalties when
   * `penaltiesCountAsWin` is set. */
  outcome: MatchOutcome;
}

export interface ComparisonDistribution {
  basis: ScoringBasis;
  cells: ComparisonCell[];
  outcome: { home: number; draw: number; away: number };
  /** Probability the game is level after 90 (knockouts only, else 0). */
  pExtraTime: number;
  /** Probability it is still level after extra time (knockouts only). */
  pPenalties: number;
}

// ─── Calibration targets ─────────────────────────────────────────────────────

export interface TotalsTarget {
  line: number;
  /** De-vigged over probability. Omitted means assume a fair 50/50 line. */
  pOver?: number;
}

export interface CalibrationTargets {
  /** De-vigged outcome probabilities, normalized. `draw` absent for two-way sports. */
  outcome: OutcomeProbabilities;
  totals?: TotalsTarget;
  /** Direct expected-total target. Takes precedence over `totals`. */
  expectedTotalOverride?: number;
}

// ─── Scoring rules ───────────────────────────────────────────────────────────

/**
 * Whether the pool scores the 90-minute result or the final result after
 * extra time. Under `ninetyMinutes`, a knockout that finishes 1-1 and is won
 * on penalties scores as a 1-1 draw. Under `finalResult` the pick is compared
 * to the score after extra time.
 */
export type ScoringBasis = "ninetyMinutes" | "finalResult";

export interface ScoringRules {
  /** Points for nailing the exact score. */
  exact: number;
  /** Points for the correct winner and goal difference without the exact score.
   * A draw pick collects this on every draw. */
  correctDifference: number;
  /** Points for the correct outcome alone. */
  correctOutcome: number;
  basis: ScoringBasis;
  /**
   * Only used with `finalResult` in knockouts: when true, a game decided on
   * penalties counts the shootout winner as the winner for outcome points,
   * while exact-score points still compare against the after-extra-time score.
   */
  penaltiesCountAsWin: boolean;
}

export type PointsComponent = "exact" | "difference" | "outcome" | "none";

export interface PickScore {
  points: number;
  component: PointsComponent;
}

/** An actual result as it comes back from a results feed or manual entry. */
export interface MatchResultInput {
  ninetyMinutes: Scoreline;
  /** Score after 120 minutes, set only when extra time was played. */
  afterExtraTime?: Scoreline;
  /** Set only when the game was decided on penalties. */
  penaltyWinner?: "home" | "away";
}

// ─── Context flags ───────────────────────────────────────────────────────────

export interface ContextFlags {
  /** Nothing riding on it for either side; expect rotation and lower tempo. */
  deadRubber?: boolean;
  /** A draw advances or suits both sides. */
  drawSuitsBoth?: boolean;
  mustWinHome?: boolean;
  mustWinAway?: boolean;
  rotationRiskHome?: boolean;
  rotationRiskAway?: boolean;
}

export type ContextFlagKey = keyof ContextFlags;

/** A flag the engine derived from standings, offered for the user to confirm. */
export interface SuggestedFlag {
  flag: ContextFlagKey;
  reason: string;
  source: "standings";
}

/** Minimal standings row the flag-derivation logic needs. */
export interface StandingsTeam {
  team: string;
  position?: number;
  played?: number;
  points?: number;
  /** Explicit qualification state when the feed provides it. */
  qualified?: boolean | null;
  eliminated?: boolean | null;
}

// ─── Candidate evaluation ────────────────────────────────────────────────────

export interface CandidateEvaluation {
  score: Scoreline;
  expectedPoints: number;
  /** Variance of this pick's own points across the distribution. */
  variance: number;
  standardDeviation: number;
  pExact: number;
  pDifference: number;
  pOutcomeOnly: number;
  /** Probability of banking anything at all — the pick's floor. */
  pAnyPoints: number;
  pZero: number;
}

// ─── Field model ─────────────────────────────────────────────────────────────

export interface FieldPick {
  score: Scoreline;
  /** Share of the pool expected on this pick. Shares sum to 1. */
  share: number;
}

export interface FieldModelConfig {
  /** Share of the pool on the single modal chalk pick. */
  modalShare: number;
  /** Total share on the chalk set, including the modal pick. */
  chalkShare: number;
  /** Known rival picks that replace the heuristic wholesale when present. */
  overrides?: FieldPick[];
}

// ─── Standing and posture ────────────────────────────────────────────────────

export type Posture = "auto" | "protect" | "chase" | "neutral";

export interface StandingContext {
  myPoints: number;
  /** Points of whoever sits nearest above me. Null when I lead. */
  nearestAbovePoints: number | null;
  /** Points of whoever sits nearest below me. Null when I'm last. */
  nearestBelowPoints: number | null;
  poolSize: number;
  gamesRemaining: number;
  posture: Posture;
}

export interface RiskProfile {
  /** Variance appetite: positive chases variance, negative avoids it. */
  k: number;
  derivedPosture: "protect" | "chase" | "neutral";
  chaseNeed: number;
  protectUrgency: number;
  explanation: string;
}

// ─── Recommendation ──────────────────────────────────────────────────────────

export interface RelativeToField {
  /** E[my points − reference rival points] on this game. The reference is
   * the known rival picks when provided, else the field's modal chalk pick —
   * the single opponent a protect or chase race actually runs against. */
  expected: number;
  /** SD of that gap — exactly zero when mirroring the reference rival. */
  standardDeviation: number;
}

export interface RankedPick extends CandidateEvaluation {
  utility: number;
  relative: RelativeToField;
  fieldShare: number;
}

export type ConfidenceLevel = "high" | "medium" | "low";

export interface ConfidenceReport {
  level: ConfidenceLevel;
  /** Modal scoreline probability of the scored distribution. */
  concentration: number;
  /** Strongest outcome mass — how one-sided the game is. */
  outcomeConcentration: number;
  /** Recommended pick's expected points minus the field's expected points. */
  epLead: number;
}

export interface PickRecommendation {
  recommended: RankedPick;
  /** Higher-floor alternative near the top expected points. */
  safest: RankedPick;
  /** Best low-ownership pick for catching up, when a decent one exists. */
  differentiator: RankedPick | null;
  /** All candidates ranked by utility, best first. */
  candidates: RankedPick[];
  risk: RiskProfile;
  confidence: ConfidenceReport;
  fieldPicks: FieldPick[];
  fieldExpectedPoints: number;
  reason: string;
}

// ─── Engine input/output ─────────────────────────────────────────────────────

export interface FixtureInput {
  id: string;
  kickoff: string;
  homeTeam: string;
  awayTeam: string;
  stage?: string;
  /** True when the game can go to extra time and penalties. */
  knockout: boolean;
  markets: MarketInputs;
  flags?: ContextFlags;
  suggestedFlags?: SuggestedFlag[];
  /** True once the starting lineups are confirmed by the data feed. */
  lineupsConfirmed?: boolean;
}

export interface ModelConfig {
  /** Per-side goal cap for the scoreline grid. */
  maxGoals: number;
  /** Dixon-Coles low-score correlation used when no draw target pins it down. */
  defaultRho: number;
  /** Fallback expected total when no totals market exists. */
  defaultExpectedTotal: number;
  extraTime: ExtraTimeConfig;
  context: ContextParams;
}

export interface ExtraTimeConfig {
  /** Scoring-rate multiplier on the pro-rated 30-minute lambdas. */
  tempo: number;
  /** Per-side cap on extra-time goals. */
  maxGoalsPerSide: number;
  /** P(home wins a shootout). Shootouts are close to a coin flip. */
  penaltyHomeWinProbability: number;
}

/** Multipliers the context flags apply to the calibration targets. */
export interface ContextParams {
  drawSuitsBothDrawBoost: number;
  drawSuitsBothTotalFactor: number;
  deadRubberTotalFactor: number;
  deadRubberGapFactor: number;
  deadRubberDrawBoost: number;
  mustWinTotalFactor: number;
  mustWinDrawFactor: number;
  mustWinSideBoost: number;
  rotationSideFactor: number;
  rotationTotalFactor: number;
}

export interface RiskParams {
  /** Realistic catchable points per game, as a fraction of the exact-score points. */
  swingFactor: number;
  /** Cap on the variance-appetite coefficient. */
  kMax: number;
  /** Curvature of urgency: below 1 makes moderate gaps matter sooner. */
  gamma: number;
  /** Floor on urgency when a posture is forced rather than derived. */
  forcedFloor: number;
  /**
   * How much defending a mid-pack position weighs against chasing, relative
   * to defending an outright lead. Position races below the top matter, but
   * not as much as the pool win.
   */
  midPackProtectWeight: number;
  /** How far below the top expected points the safest pick may sit. */
  safetyEpWindow: number;
  /** A differentiator must sit at or below this expected field share. */
  diffMaxFieldShare: number;
  /** How far below the top expected points a differentiator may sit. */
  diffEpWindow: number;
}

export interface PoolAnalysisConfig {
  rules: ScoringRules;
  standing: StandingContext;
  field: FieldModelConfig;
  model: ModelConfig;
  risk: RiskParams;
  devigMethod: DevigMethod;
  /** Minutes before kickoff when the pool locks. */
  lockOffsetMinutes: number;
  /** Odds older than this many minutes get a recheck warning. */
  staleOddsMinutes: number;
}

export interface FixtureAnalysis {
  fixtureId: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  /** ISO time the pool locks for this game. */
  locksAt: string;
  knockout: boolean;
  stage?: string;
  market: {
    probabilities: OutcomeProbabilities;
    overround: number;
    totalsLine: number | null;
    fetchedAt: string | null;
    bookmaker: string | null;
    manual: boolean;
  };
  appliedFlags: ContextFlagKey[];
  contextAudit: string[];
  suggestedFlags: SuggestedFlag[];
  distribution: ScorelineDistribution;
  comparison: ComparisonDistribution;
  recommendation: PickRecommendation;
  /** Things worth rechecking before lock: stale odds, missing markets, open questions. */
  recheck: string[];
  /** When this analysis was computed. */
  asOf: string;
}

// ─── Line movement ───────────────────────────────────────────────────────────

export interface MovementSummary {
  from: string;
  to: string;
  snapshots: number;
  /** Change in de-vigged outcome probabilities, latest minus earliest. */
  outcomeDelta: { home: number; draw: number | null; away: number };
  totalLineDelta: number | null;
}
