// ============================================================
// Retirement planning engine — public entry point.
//
//   project(input) -> { deterministic, monteCarlo, levers, verdict, … }
//
// Pure and framework-free so it's unit-testable and reusable server-side
// (spec §8). The UI never does math; it calls project() and renders.
// ============================================================

import type { RetirementPlanInput, RetirementResult, Verdict } from "./types";
import { computePortfolioAssumptions } from "./assumptions";
import { runDeterministic } from "./projection";
import { runMonteCarlo } from "./monteCarlo";
import { computeLevers } from "./levers";
import { socialSecurityClaimFactor } from "./socialSecurity";
import { rmdStartAgeFromCurrent } from "./tax";
import { DEFAULT_SAFE_WITHDRAWAL_RATE } from "./defaults";
import {
  CMA_AS_OF,
  CMA_SOURCE,
  CMA_VERIFIED,
} from "./capitalMarketAssumptions";

function verdictFor(successRate: number, threshold: number): Verdict {
  // Tie the verdict to the user's own on-track threshold so the badge, gauge
  // tone, and the "you're meeting it" copy always agree. A fixed 0.9/0.8 ladder
  // would label an 0.82 success "Looking good" even when the user set a 0.95
  // target (and conversely call it a miss when their bar is only 0.70).
  if (successRate >= threshold) return "on-track";
  if (successRate >= threshold - 0.1) return "good";
  if (successRate >= threshold - 0.25) return "fair";
  return "at-risk";
}

/**
 * Real-dollar nest egg needed at retirement: the spend the portfolio must
 * cover (after guaranteed income) divided by the safe withdrawal rate.
 */
function computeTargetNestEgg(input: RetirementPlanInput, swr: number): number {
  const ss =
    input.otherIncome.socialSecurityAnnual *
    socialSecurityClaimFactor(input.otherIncome.socialSecurityClaimAge);
  const guaranteed = ss + input.otherIncome.pensionAnnual;
  const netSpend = Math.max(0, input.desiredAnnualSpend - guaranteed);
  return swr > 0 ? netSpend / swr : 0;
}

/** Everything except the (heavier) lever sensitivity analysis. */
export type RetirementCore = Omit<RetirementResult, "levers">;

/**
 * Fast path: deterministic projection + headline Monte Carlo + target/verdict.
 * Excludes the lever solver so the UI can paint the verdict and chart instantly
 * and compute levers off the critical path.
 */
export function projectCore(input: RetirementPlanInput, referenceYear?: number): RetirementCore {
  const { expectedReturn, volatility } = computePortfolioAssumptions(input.allocation);
  const swr = input.assumptions.withdrawalRateOverride ?? DEFAULT_SAFE_WITHDRAWAL_RATE;

  const deterministic = runDeterministic(input, expectedReturn, referenceYear);
  const monteCarlo = runMonteCarlo(input, { expectedReturn, volatility, referenceYear });

  return {
    input,
    expectedReturn,
    volatility,
    targetNestEgg: computeTargetNestEgg(input, swr),
    safeWithdrawalRate: swr,
    deterministic,
    monteCarlo,
    verdict: verdictFor(monteCarlo.successRate, input.assumptions.successThreshold),
    assumptions: {
      cmaSource: CMA_SOURCE,
      cmaAsOf: CMA_AS_OF,
      cmaVerified: CMA_VERIFIED,
      expectedReturn,
      volatility,
      inflation: input.assumptions.inflation,
      successThreshold: input.assumptions.successThreshold,
      rmdStartAge: rmdStartAgeFromCurrent(input.currentAge, referenceYear),
    },
  };
}

/** Full projection including the lever sensitivity analysis. */
export function project(input: RetirementPlanInput, referenceYear?: number): RetirementResult {
  return { ...projectCore(input, referenceYear), levers: computeLevers(input, referenceYear) };
}

// Re-exports for consumers (hook, UI, tests).
export * from "./types";
export { createDefaultPlan, DEFAULT_TAX_RATES, DEFAULT_SAFE_WITHDRAWAL_RATE } from "./defaults";
export { computePortfolioAssumptions, expandAllocation } from "./assumptions";
export { simulatePath, runDeterministic } from "./projection";
export { runMonteCarlo } from "./monteCarlo";
export { computeLevers } from "./levers";
export {
  socialSecurityClaimFactor,
  otherIncomeRealAtAge,
  FULL_RETIREMENT_AGE,
} from "./socialSecurity";
export {
  rmdDivisor,
  rmdStartAge,
  rmdStartAgeFromCurrent,
  withdrawForYear,
  DEFAULT_REFERENCE_YEAR,
} from "./tax";
export {
  CAPITAL_MARKET_ASSUMPTIONS,
  CMA_SOURCE,
  CMA_AS_OF,
  CMA_VERIFIED,
  type AssetClassId,
} from "./capitalMarketAssumptions";
export {
  formatCurrency,
  formatCompactCurrency,
  formatPercent,
  formatScenarioCount,
} from "./format";
