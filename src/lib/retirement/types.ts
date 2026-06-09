// ============================================================
// Retirement planning — shared types
//
// The engine computes internally in NOMINAL dollars and exposes
// REAL (today's-dollar) figures for display. See projection.ts.
// ============================================================

export type FilingStatus = "single" | "married";

/** Tax treatment of an account drives how withdrawals are taxed. */
export type AccountType = "taxable" | "traditional" | "roth" | "hsa";

/**
 * Withdrawal / decumulation strategies.
 * - fixed-real:    spend a fixed real amount (4%-rule mental model). Default.
 * - fixed-percent: spend a fixed % of the *current* balance each year (never
 *                  depletes, income swings with the market).
 * - guardrails:    Guyton-Klinger — inflation rule + capital-preservation and
 *                  prosperity guardrails. The "smart" alternative.
 */
export type WithdrawalStrategy = "fixed-real" | "fixed-percent" | "guardrails";

export interface RetirementAccountInput {
  id: string;
  type: AccountType;
  /** Current balance, today's dollars. */
  balance: number;
  /** Annual contribution, today's dollars (accumulation phase only). */
  annualContribution: number;
  /** Employer match added to the contribution, today's dollars. */
  employerMatch: number;
  /** Contribution growth rate (decimal). Defaults to inflation when omitted. */
  contributionGrowth?: number;
}

/**
 * High-level allocation buckets collected from the UI. Expanded into the
 * finer capital-market-assumption asset classes by assumptions.ts so we get
 * defensible per-class returns without forcing the user through a 6-field form.
 */
export interface AllocationInput {
  stocks: number;
  bonds: number;
  cash: number;
  other: number;
}

export interface LumpyExpense {
  id: string;
  label: string;
  /** Today's dollars. */
  amount: number;
  /** Age at which the expense occurs. */
  age: number;
}

export interface OtherIncomeInput {
  /** Social Security, today's dollars/yr (user-supplied estimate). */
  socialSecurityAnnual: number;
  socialSecurityClaimAge: number;
  /** Whether Social Security receives an annual cost-of-living adjustment. */
  socialSecurityCola: boolean;
  pensionAnnual: number;
  pensionStartAge: number;
  pensionCola: boolean;
  partTimeAnnual: number;
  partTimeStartAge: number;
  partTimeEndAge: number;
}

export interface RetirementTaxRates {
  /** Effective tax on a taxable-account withdrawal (cap-gains on the gains slice). */
  taxable: number;
  /** Effective ordinary-income rate on traditional / tax-deferred withdrawals. */
  traditional: number;
  /** Roth withdrawals are tax-free. */
  roth: number;
  /** HSA qualified withdrawals are tax-free. */
  hsa: number;
}

export interface RetirementAssumptions {
  /** Long-run CPI (decimal). */
  inflation: number;
  /** Healthcare inflation (decimal) — runs hotter than CPI; applied to the pre-Medicare gap. */
  healthcareInflation: number;
  withdrawalStrategy: WithdrawalStrategy;
  /** Optional safe-withdrawal-rate override (decimal). Pins the target-number math. */
  withdrawalRateOverride: number | null;
  taxRates: RetirementTaxRates;
  /** Monte Carlo trial count. 1,000 is the industry norm. */
  simulations: number;
  /** RNG seed — fixed so results are stable per inputs and unit-testable. */
  seed: number;
  /** "On track" probability threshold (decimal). Default 0.85. */
  successThreshold: number;
}

export interface RetirementPlanInput {
  currentAge: number;
  retirementAge: number;
  /** Planning horizon / life expectancy. Plan to a conservative age. */
  horizonAge: number;
  filingStatus: FilingStatus;
  region?: string;
  /** Desired annual spend in retirement, today's dollars. */
  desiredAnnualSpend: number;
  /** Extra annual healthcare spend before Medicare (age < 65), today's dollars. */
  preMedicareHealthcare: number;
  accounts: RetirementAccountInput[];
  allocation: AllocationInput;
  otherIncome: OtherIncomeInput;
  lumpyExpenses: LumpyExpense[];
  assumptions: RetirementAssumptions;
}

// ─── Outputs ─────────────────────────────────────────────────────────────────

export type Phase = "accumulation" | "decumulation";

export interface YearProjection {
  age: number;
  /** Years from today (t). */
  yearIndex: number;
  phase: Phase;
  /** Nominal end-of-year balance. */
  nominalBalance: number;
  /** Real (today's-dollar) end-of-year balance. */
  realBalance: number;
  /** Nominal contribution added this year (accumulation). */
  contribution: number;
  /** Nominal gross withdrawal from the portfolio this year (decumulation). */
  withdrawal: number;
  /** Nominal gross spending this year. */
  spending: number;
  /** Nominal taxes paid on withdrawals this year. */
  taxes: number;
  /** Nominal other income (Social Security, pension, part-time) this year. */
  otherIncome: number;
}

export interface DeterministicResult {
  path: YearProjection[];
  balanceAtRetirement: MoneyPair;
  endingBalance: MoneyPair;
  /** Age at which the portfolio is exhausted, or null if it lasts. */
  depletionAge: number | null;
}

export interface MoneyPair {
  nominal: number;
  real: number;
}

export interface PercentileBand {
  age: number;
  yearIndex: number;
  // Real (today's) dollars for display.
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface PercentileTriple {
  p10: number;
  p50: number;
  p90: number;
}

export interface MonteCarloResult {
  simulations: number;
  /** Fraction of paths funded through the horizon (0..1). */
  successRate: number;
  /** Per-year balance bands, real dollars. */
  bands: PercentileBand[];
  /** Real-dollar balance at retirement across paths. */
  balanceAtRetirement: PercentileTriple;
  /** Real-dollar ending balance across paths. */
  endingBalance: PercentileTriple;
  /** Median depletion age among paths that ran out, or null if none did. */
  medianDepletionAge: number | null;
}

export type LeverId = "save-more" | "retire-later" | "spend-less" | "more-stocks";

export interface LeverEffect {
  id: LeverId;
  label: string;
  description: string;
  /** Human-readable size of the nudge, e.g. "+$5,000/yr". */
  changeLabel: string;
  newSuccessRate: number;
  /** newSuccessRate − baseline success rate. */
  delta: number;
  /** The magnitude of this lever needed to reach the success threshold, if solvable. */
  toReachTarget: { label: string; value: string } | null;
}

export type Verdict = "on-track" | "good" | "fair" | "at-risk";

export interface AssumptionsMeta {
  cmaSource: string;
  cmaAsOf: string;
  /** Whether the shipped CMA figures have been re-pinned to a primary source. */
  cmaVerified: boolean;
  expectedReturn: number;
  volatility: number;
  inflation: number;
  successThreshold: number;
  rmdStartAge: number;
}

export interface RetirementResult {
  input: RetirementPlanInput;
  /** Annualized nominal expected return derived from the allocation. */
  expectedReturn: number;
  /** Annualized return volatility (std dev) derived from the allocation. */
  volatility: number;
  /** Real-dollar nest egg needed at retirement: netSpend / safe-withdrawal-rate. */
  targetNestEgg: number;
  /** Safe withdrawal rate used for the target number (decimal). */
  safeWithdrawalRate: number;
  deterministic: DeterministicResult;
  monteCarlo: MonteCarloResult;
  levers: LeverEffect[];
  verdict: Verdict;
  assumptions: AssumptionsMeta;
}
