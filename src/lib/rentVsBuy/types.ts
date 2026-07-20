// ============================================================
// Rent vs. buy — shared types
//
// The engine runs a month-by-month comparison of two scenarios over
// a holding period and finds the break-even year: the first point at
// which the buyer's net worth catches and passes the renter's. The
// renter is credited the opportunity cost of the cash the buyer sinks
// into the down payment and closing costs, plus every month's cost
// difference, so the two paths stay apples to apples. See engine.ts.
// ============================================================

export type FilingStatus = "single" | "married";

export interface RentVsBuyInput {
  // ── Buying ────────────────────────────────────────────────
  /** Purchase price, today's dollars. */
  homePrice: number;
  /** Down payment as a percent of the price (0..100). */
  downPaymentPercent: number;
  /** Fixed mortgage rate, annual percent. */
  mortgageRatePercent: number;
  /** Loan term in years (typically 30 or 15). */
  loanTermYears: number;
  /** Annual property tax as a percent of the home's current value. */
  propertyTaxPercent: number;
  /** Homeowner's insurance, dollars per year (grows with inflation). */
  homeInsuranceAnnual: number;
  /** Annual maintenance/upkeep as a percent of the home's current value. */
  maintenancePercent: number;
  /** HOA / condo dues, dollars per month (grows with inflation). */
  hoaMonthly: number;
  /** Purchase closing costs as a percent of the price, paid up front. */
  closingCostPercent: number;
  /** Selling costs as a percent of the sale price (agent + fees), paid at sale. */
  sellingCostPercent: number;
  /** Expected home appreciation, annual percent. */
  homeAppreciationPercent: number;

  // ── Renting ───────────────────────────────────────────────
  /** Starting rent, dollars per month. */
  monthlyRent: number;
  /** Annual rent growth, percent. */
  rentGrowthPercent: number;
  /** Renter's insurance, dollars per month (grows with inflation). */
  rentersInsuranceMonthly: number;

  // ── Shared / financial ────────────────────────────────────
  /** Return on invested cash — the renter's opportunity cost, annual percent. */
  investmentReturnPercent: number;
  /** General inflation applied to fixed costs (insurance, HOA), annual percent. */
  generalInflationPercent: number;
  /** Marginal tax rate for the mortgage-interest + property-tax deduction, percent. */
  marginalTaxRatePercent: number;
  filingStatus: FilingStatus;
  /**
   * Whether the buyer itemizes. When true the tax model treats mortgage
   * interest and (capped) property tax as fully marginal deductions; when
   * false there is no tax benefit. See assumptions note in defaults.ts.
   */
  itemizes: boolean;
  /** Holding period — how many years before selling / moving. */
  yearsStaying: number;
}

export interface RentVsBuyYear {
  /** Year number, 1..yearsStaying. */
  year: number;
  /** Buyer net worth if they sold at the end of this year (real of sale). */
  buyerNetWorth: number;
  /** Renter net worth (invested portfolio value). */
  renterNetWorth: number;
  /** Home value at year end. */
  homeValue: number;
  /** Remaining mortgage balance at year end. */
  loanBalance: number;
  /** Home equity before selling costs (value − balance). */
  homeEquity: number;
  /** Cumulative cash spent buying, net of the tax benefit, through this year. */
  cumulativeBuyingCost: number;
  /** Cumulative cash spent renting through this year. */
  cumulativeRentingCost: number;
}

export type Verdict = "buying" | "renting" | "close";

export interface RentVsBuyAssumptionsMeta {
  /** SALT cap applied to deductible property tax, dollars. */
  saltCap: number;
  /** Standard deduction for the filing status, dollars (context only). */
  standardDeduction: number;
  /** Primary-residence capital-gains exclusion, dollars (context only). */
  capitalGainsExclusion: number;
  /** As-of date for the tax figures. */
  asOf: string;
  /** Whether the shipped tax figures have been re-pinned to a primary source. */
  verified: boolean;
  /** Plain-language description of the tax simplifications. */
  taxNote: string;
}

export interface RentVsBuyResult {
  input: RentVsBuyInput;
  /** Principal + interest, dollars per month (fixed for the life of the loan). */
  monthlyPaymentYear1: number;
  /** All-in average monthly buying cost in year one, net of the tax benefit. */
  monthlyBuyingCostYear1: number;
  /** All-in average monthly renting cost in year one. */
  monthlyRentingCostYear1: number;
  /** Down payment + closing costs — the cash the renter gets to invest instead. */
  upfrontCash: number;
  /** Years until buying beats renting on net worth, or null if never within horizon. */
  breakEvenYears: number | null;
  /** Holding period actually modeled. */
  horizonYears: number;
  buyerNetWorthAtHorizon: number;
  renterNetWorthAtHorizon: number;
  /** Buyer minus renter net worth at the horizon. Positive favors buying. */
  netWorthDeltaAtHorizon: number;
  verdict: Verdict;
  /** Year-by-year snapshots for charting. */
  yearly: RentVsBuyYear[];
  assumptions: RentVsBuyAssumptionsMeta;
}
