import type { FilingStatus, RentVsBuyAssumptionsMeta, RentVsBuyInput } from "./types";

// Tax figures are a dated, deliberately simplified snapshot. They are flagged
// verified:false and disclosed on-page. The engine applies the SALT cap to
// property tax only and treats the itemized housing deductions as fully
// marginal (i.e. it assumes the buyer already itemizes past the standard
// deduction), which is the common calculator simplification. Re-pin these to a
// primary source before treating any output as tax advice.
export const SALT_CAP = 40_000;
export const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  single: 15_000,
  married: 30_000,
};
export const CAPITAL_GAINS_EXCLUSION: Record<FilingStatus, number> = {
  single: 250_000,
  married: 500_000,
};

export function createAssumptionsMeta(filingStatus: FilingStatus): RentVsBuyAssumptionsMeta {
  return {
    saltCap: SALT_CAP,
    standardDeduction: STANDARD_DEDUCTION[filingStatus],
    capitalGainsExclusion: CAPITAL_GAINS_EXCLUSION[filingStatus],
    asOf: "2026-07",
    verified: false,
    taxNote:
      "The tax benefit assumes you itemize and treats mortgage interest plus property tax (capped by SALT) as fully marginal. Sale gains are assumed to fall under the primary-residence exclusion, so no capital-gains tax is modeled.",
  };
}

/**
 * A middle-of-the-road national starting point: a mid-priced home, a 20% down
 * conventional loan at prevailing rates, and rent that lands close to the
 * monthly cost of owning so the break-even math is genuinely a toss-up out of
 * the box rather than pre-decided.
 */
export function createDefaultInput(): RentVsBuyInput {
  return {
    homePrice: 450_000,
    downPaymentPercent: 20,
    mortgageRatePercent: 6.8,
    loanTermYears: 30,
    propertyTaxPercent: 1.1,
    homeInsuranceAnnual: 1_800,
    maintenancePercent: 1,
    hoaMonthly: 0,
    closingCostPercent: 3,
    sellingCostPercent: 6,
    homeAppreciationPercent: 3.5,

    monthlyRent: 2_400,
    rentGrowthPercent: 3.5,
    rentersInsuranceMonthly: 15,

    investmentReturnPercent: 6.5,
    generalInflationPercent: 3,
    marginalTaxRatePercent: 24,
    filingStatus: "married",
    itemizes: false,
    yearsStaying: 7,
  };
}
