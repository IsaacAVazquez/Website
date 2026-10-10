import type { FilingStatus, RentVsBuyAssumptionsMeta, RentVsBuyInput } from "./types";

// Tax figures are for tax year 2026 and were read from the sources named beside
// each constant on 2026-09-27. They are a deliberately simplified snapshot,
// flagged verified:false because no independent review has happened, and
// disclosed on-page. The engine applies the SALT cap to property tax only and
// treats the itemized housing deductions as fully marginal (i.e. it assumes the
// buyer already itemizes past the standard deduction), which is the common
// calculator simplification. The output is educational and is never tax advice.
// "married" means married filing jointly throughout.

/** Tax year the figures below are for. Year 1 of a projection is treated as this tax year. */
export const TAX_YEAR = 2026;
/** Date the tax sources below were read. */
export const TAX_FIGURES_READ_ON = "2026-09-27";

// State and local tax (SALT) deduction cap, tax year 2026, single and married
// filing jointly. Source, read 2026-09-27:
// https://www.irs.gov/forms-pubs/correction-to-state-and-local-income-tax-deduction-amount-in-the-2026-form-1040-es
export const SALT_CAP = 40_400;

// Modified adjusted gross income above which the law reduces the 2026 cap, by
// 30 percent of the excess and never below $10,000. Same IRS source as SALT_CAP.
// The tool collects no income figure, so the engine does not model this
// reduction, and the constant exists for the on-page disclosure only.
export const SALT_PHASE_DOWN_THRESHOLD = 505_000;

// The cap by tax year under 26 USC 164(b)(7)(A), added by Public Law 119-21
// section 70120, enacted 2025-07-04. Sources, read 2026-09-27:
// https://www.congress.gov/119/plaws/publ21/PLAW-119publ21.htm
// https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section164&num=0&edition=prelim
// The statute states $40,000 for 2025, $40,400 for 2026, 101 percent of the
// prior year's amount for 2027 through 2029, and $10,000 for every tax year
// after 2029. The 2027 to 2029 amounts are that arithmetic, since the statute
// states no rounding rule and the IRS had not published those years when this
// was read. Replace each with the IRS figure once it is published.
const SALT_CAP_BY_TAX_YEAR: Record<number, number> = {
  2025: 40_000,
  2026: SALT_CAP,
  2027: 40_804, // 40,400 x 1.01
  2028: 41_212.04, // 40,804 x 1.01
  2029: 41_624.1604, // 41,212.04 x 1.01
};
const SALT_CAP_OUTSIDE_SCHEDULE = 10_000;

/**
 * SALT cap for a tax year. Returns $10,000 for any year outside 2025 to 2029,
 * which is the statute's figure for 2018 through 2024 and for every tax year
 * after 2029. The statute names no change after 2029, so the engine holds
 * $10,000 from 2030 on. Years before 2018 had no cap and are outside what this
 * tool models.
 */
export function saltCapForYear(taxYear: number): number {
  return SALT_CAP_BY_TAX_YEAR[taxYear] ?? SALT_CAP_OUTSIDE_SCHEDULE;
}

// Standard deduction, tax year 2026 (IR-2025-103). Source, read 2026-09-27:
// https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill
// The engine never reads this. It rides along in the assumptions meta as
// context, since the tax model does not compare itemizing with it.
export const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  single: 16_100,
  married: 32_200,
};

// Exclusion of gain on the sale of a main home. The amounts are set by statute
// and are not indexed, so they carry no tax year. Source, read 2026-09-27:
// https://www.irs.gov/taxtopics/tc701
export const CAPITAL_GAINS_EXCLUSION: Record<FilingStatus, number> = {
  single: 250_000,
  married: 500_000,
};

// Freddie Mac Primary Mortgage Market Survey, 30 year fixed rate average as of
// 2026-10-08. Source, read 2026-10-09: https://www.freddiemac.com/pmms
// The survey publishes every Thursday, so this default ages weekly.
export const DEFAULT_MORTGAGE_RATE_PERCENT = 7.4;
export const DEFAULT_MORTGAGE_RATE_AS_OF = "2026-10-08";

const dollars = (value: number) => `$${value.toLocaleString("en-US")}`;

export function createAssumptionsMeta(filingStatus: FilingStatus): RentVsBuyAssumptionsMeta {
  return {
    taxYear: TAX_YEAR,
    saltCap: SALT_CAP,
    standardDeduction: STANDARD_DEDUCTION[filingStatus],
    capitalGainsExclusion: CAPITAL_GAINS_EXCLUSION[filingStatus],
    asOf: TAX_FIGURES_READ_ON,
    defaultMortgageRatePercent: DEFAULT_MORTGAGE_RATE_PERCENT,
    mortgageRateAsOf: DEFAULT_MORTGAGE_RATE_AS_OF,
    verified: false,
    taxNote: `With Itemize deductions on, the tax benefit treats mortgage interest plus property tax (capped by SALT) as fully marginal at your rate, without comparing against the standard deduction. With it off, no tax benefit is modeled. Investment growth on both sides is untaxed, and sale gains are assumed to fall under the primary-residence exclusion, so no capital-gains tax is modeled. Year 1 of the projection is treated as tax year ${TAX_YEAR}. The cap on the state and local tax (SALT) deduction is ${dollars(SALT_CAP)} in ${TAX_YEAR}, rises 1% a year through 2029, and is ${dollars(SALT_CAP_OUTSIDE_SCHEDULE)} in 2030 and in every later year, which is the schedule in the tax law enacted on July 4, 2025 (Public Law 119-21). The tool applies the full cap every year and does not model the reduction the law makes when modified adjusted gross income is above ${dollars(SALT_PHASE_DOWN_THRESHOLD)} in ${TAX_YEAR}.`,
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
    mortgageRatePercent: DEFAULT_MORTGAGE_RATE_PERCENT,
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
