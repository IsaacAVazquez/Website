// ============================================================
// Sensible defaults (spec §6.3) — every advanced input has a defensible
// default so the tool produces a first number before the user touches a single
// assumption.
// ============================================================

import type { RetirementPlanInput, RetirementTaxRates } from "./types";

export const DEFAULT_SAFE_WITHDRAWAL_RATE = 0.04;

/**
 * Fixed-percent withdrawals never run the balance to zero (you only ever draw a
 * share of what remains), so a depletion-based success rate would be a
 * meaningless ~100%. Instead we treat a path as a *funding shortfall* once the
 * real annual portfolio draw falls below this fraction of the desired lifestyle
 * spend — i.e. the year the strategy stops actually paying for the target life.
 */
export const FIXED_PERCENT_SPEND_FLOOR = 0.8;

/**
 * Coarse effective tax rates by account type (spec §4.7, v1 flat-rate approach):
 *  - taxable: long-term cap gains (~15%) on roughly half the withdrawal (gains slice)
 *  - traditional: a blended effective ordinary-income rate in retirement
 *  - roth / hsa: tax-free
 */
export const DEFAULT_TAX_RATES: RetirementTaxRates = {
  taxable: 0.08,
  traditional: 0.18,
  roth: 0,
  hsa: 0,
};

export function createDefaultPlan(): RetirementPlanInput {
  return {
    currentAge: 35,
    retirementAge: 65,
    horizonAge: 95,
    filingStatus: "single",
    region: "",
    desiredAnnualSpend: 60000,
    preMedicareHealthcare: 0,
    accounts: [
      {
        id: "primary",
        type: "traditional",
        balance: 50000,
        annualContribution: 10000,
        employerMatch: 0,
      },
    ],
    allocation: { stocks: 80, bonds: 15, cash: 5, other: 0 },
    otherIncome: {
      socialSecurityAnnual: 24000,
      socialSecurityClaimAge: 67,
      socialSecurityCola: true,
      pensionAnnual: 0,
      pensionStartAge: 65,
      pensionCola: false,
      partTimeAnnual: 0,
      partTimeStartAge: 65,
      partTimeEndAge: 70,
    },
    lumpyExpenses: [],
    assumptions: {
      inflation: 0.025,
      healthcareInflation: 0.05,
      withdrawalStrategy: "fixed-real",
      withdrawalRateOverride: null,
      taxRates: { ...DEFAULT_TAX_RATES },
      simulations: 1000,
      seed: 20260608,
      successThreshold: 0.85,
    },
  };
}
