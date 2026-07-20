import { createAssumptionsMeta, SALT_CAP } from "./defaults";
import type { RentVsBuyInput, RentVsBuyResult, RentVsBuyYear, Verdict } from "./types";

/** Convert an annual rate (as a decimal) into its monthly-compounded equivalent. */
function monthlyRate(annualDecimal: number): number {
  return Math.pow(1 + annualDecimal, 1 / 12) - 1;
}

/** Fixed monthly principal + interest for a fully amortizing loan. */
export function monthlyMortgagePayment(
  loanAmount: number,
  annualRatePercent: number,
  termYears: number,
): number {
  if (loanAmount <= 0 || termYears <= 0) return 0;
  const n = Math.round(termYears * 12);
  const r = annualRatePercent / 100 / 12;
  if (r === 0) return loanAmount / n;
  const factor = Math.pow(1 + r, n);
  return (loanAmount * r * factor) / (factor - 1);
}

function classifyVerdict(deltaAtHorizon: number, homePrice: number): Verdict {
  // A margin scaled to the purchase keeps small, assumption-sensitive gaps from
  // reading as a confident call. Roughly two percent of the price.
  const margin = Math.max(5_000, homePrice * 0.02);
  if (deltaAtHorizon > margin) return "buying";
  if (deltaAtHorizon < -margin) return "renting";
  return "close";
}

/**
 * Run the rent-vs-buy comparison. Everything is nominal dollars; the two paths
 * are kept comparable by seeding the renter with the buyer's up-front cash and
 * routing every month's cost difference into whichever side is spending less.
 */
export function calculateRentVsBuy(input: RentVsBuyInput): RentVsBuyResult {
  const horizonYears = Math.max(1, Math.round(input.yearsStaying));
  const totalMonths = horizonYears * 12;

  const downPayment = input.homePrice * (input.downPaymentPercent / 100);
  const closingCosts = input.homePrice * (input.closingCostPercent / 100);
  const upfrontCash = downPayment + closingCosts;
  const loanAmount = Math.max(0, input.homePrice - downPayment);

  const payment = monthlyMortgagePayment(
    loanAmount,
    input.mortgageRatePercent,
    input.loanTermYears,
  );
  const loanMonthlyRate = input.mortgageRatePercent / 100 / 12;

  const appreciationMonthly = monthlyRate(input.homeAppreciationPercent / 100);
  const investmentMonthly = monthlyRate(input.investmentReturnPercent / 100);
  const inflationMonthly = monthlyRate(input.generalInflationPercent / 100);
  const rentGrowthMonthly = monthlyRate(input.rentGrowthPercent / 100);

  const marginalRate = input.itemizes ? input.marginalTaxRatePercent / 100 : 0;
  const saltCapMonthly = SALT_CAP / 12;

  // Buyer sinks the up-front cash into the home; the renter invests the same
  // amount. Each side then accrues a side portfolio from monthly savings.
  let loanBalance = loanAmount;
  let homeValue = input.homePrice;
  let buyerSideFund = 0;
  let renterPortfolio = upfrontCash;

  let cumulativeBuyingCost = 0;
  let cumulativeRentingCost = 0;

  let year1BuyingCost = 0;
  let year1RentingCost = 0;

  const yearly: RentVsBuyYear[] = [];
  let breakEvenMonths: number | null = null;

  const buyerNetWorthNow = () => {
    const saleProceeds = homeValue * (1 - input.sellingCostPercent / 100) - loanBalance;
    return saleProceeds + buyerSideFund;
  };

  for (let month = 1; month <= totalMonths; month += 1) {
    // Mortgage amortization for this month.
    const interest = loanBalance * loanMonthlyRate;
    let principal = payment - interest;
    if (principal < 0) principal = 0; // rate-only edge; balance never grows
    if (principal > loanBalance) principal = loanBalance;
    const scheduledPayment = loanBalance > 0 ? interest + principal : 0;
    loanBalance = Math.max(0, loanBalance - principal);

    // Ownership carrying costs, most of which scale with the home's value.
    const propertyTax = (homeValue * (input.propertyTaxPercent / 100)) / 12;
    const maintenance = (homeValue * (input.maintenancePercent / 100)) / 12;
    const inflationFactor = Math.pow(1 + inflationMonthly, month - 1);
    const insurance = (input.homeInsuranceAnnual / 12) * inflationFactor;
    const hoa = input.hoaMonthly * inflationFactor;

    // Tax benefit: interest + capped property tax, at the marginal rate.
    const deductible = interest + Math.min(propertyTax, saltCapMonthly);
    const taxBenefit = deductible * marginalRate;

    const buyerCashOutlay = scheduledPayment + propertyTax + maintenance + insurance + hoa;
    const buyerNetCost = buyerCashOutlay - taxBenefit;

    // Rent and renter's insurance, each on their own growth track.
    const rent = input.monthlyRent * Math.pow(1 + rentGrowthMonthly, month - 1);
    const rentersInsurance = input.rentersInsuranceMonthly * inflationFactor;
    const renterCost = rent + rentersInsurance;

    cumulativeBuyingCost += buyerNetCost;
    cumulativeRentingCost += renterCost;
    if (month <= 12) {
      year1BuyingCost += buyerNetCost;
      year1RentingCost += renterCost;
    }

    // Grow both portfolios, then invest whichever side spent less this month.
    buyerSideFund *= 1 + investmentMonthly;
    renterPortfolio *= 1 + investmentMonthly;
    const diff = renterCost - buyerNetCost;
    if (diff > 0) {
      buyerSideFund += diff;
    } else if (diff < 0) {
      renterPortfolio += -diff;
    }

    // Appreciate the home for the end of the month.
    homeValue *= 1 + appreciationMonthly;

    if (breakEvenMonths === null && buyerNetWorthNow() >= renterPortfolio) {
      breakEvenMonths = month;
    }

    if (month % 12 === 0) {
      const equity = homeValue - loanBalance;
      yearly.push({
        year: month / 12,
        buyerNetWorth: buyerNetWorthNow(),
        renterNetWorth: renterPortfolio,
        homeValue,
        loanBalance,
        homeEquity: equity,
        cumulativeBuyingCost: cumulativeBuyingCost + upfrontCash,
        cumulativeRentingCost,
      });
    }
  }

  const finalYear = yearly[yearly.length - 1];
  const buyerNetWorthAtHorizon = finalYear.buyerNetWorth;
  const renterNetWorthAtHorizon = finalYear.renterNetWorth;
  const netWorthDeltaAtHorizon = buyerNetWorthAtHorizon - renterNetWorthAtHorizon;

  return {
    input,
    monthlyPaymentYear1: payment,
    monthlyBuyingCostYear1: year1BuyingCost / Math.min(12, totalMonths),
    monthlyRentingCostYear1: year1RentingCost / Math.min(12, totalMonths),
    upfrontCash,
    breakEvenYears: breakEvenMonths === null ? null : breakEvenMonths / 12,
    horizonYears,
    buyerNetWorthAtHorizon,
    renterNetWorthAtHorizon,
    netWorthDeltaAtHorizon,
    verdict: classifyVerdict(netWorthDeltaAtHorizon, input.homePrice),
    yearly,
    assumptions: createAssumptionsMeta(input.filingStatus),
  };
}
