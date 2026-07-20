import { calculateRentVsBuy, monthlyMortgagePayment } from "../engine";
import { createDefaultInput } from "../defaults";
import type { RentVsBuyInput } from "../types";

function input(overrides: Partial<RentVsBuyInput> = {}): RentVsBuyInput {
  return { ...createDefaultInput(), ...overrides };
}

describe("monthlyMortgagePayment", () => {
  it("matches the standard amortization formula", () => {
    // $360k at 6.8% over 30 years is ~$2,347/mo.
    expect(monthlyMortgagePayment(360_000, 6.8, 30)).toBeCloseTo(2346.9, 0);
  });

  it("splits principal evenly for a zero-rate loan", () => {
    expect(monthlyMortgagePayment(360_000, 0, 30)).toBeCloseTo(360_000 / 360, 6);
  });

  it("returns zero when there is no loan", () => {
    expect(monthlyMortgagePayment(0, 6, 30)).toBe(0);
  });
});

describe("calculateRentVsBuy", () => {
  it("produces one yearly snapshot per year of the horizon", () => {
    const result = calculateRentVsBuy(input({ yearsStaying: 10 }));
    expect(result.yearly).toHaveLength(10);
    expect(result.yearly.map((y) => y.year)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(result.horizonYears).toBe(10);
  });

  it("credits the renter the up-front cash as opportunity cost", () => {
    const result = calculateRentVsBuy(input());
    // down payment (20% of 450k) + 3% closing.
    expect(result.upfrontCash).toBeCloseTo(90_000 + 13_500, 6);
    // In year one the renter's invested cash still dominates the buyer's thin
    // early equity, so renting leads on net worth.
    expect(result.yearly[0].renterNetWorth).toBeGreaterThan(result.yearly[0].buyerNetWorth);
  });

  it("favors buying when rent is very high", () => {
    const result = calculateRentVsBuy(input({ monthlyRent: 5_000 }));
    expect(result.verdict).toBe("buying");
    expect(result.breakEvenYears).not.toBeNull();
    expect(result.breakEvenYears as number).toBeLessThan(result.horizonYears);
  });

  it("favors renting when rent is very cheap", () => {
    const result = calculateRentVsBuy(input({ monthlyRent: 900, yearsStaying: 10 }));
    expect(result.verdict).toBe("renting");
    expect(result.netWorthDeltaAtHorizon).toBeLessThan(0);
  });

  it("reports no break-even inside the horizon when renting always wins", () => {
    const result = calculateRentVsBuy(input({ monthlyRent: 700, yearsStaying: 5 }));
    expect(result.breakEvenYears).toBeNull();
  });

  it("strengthens the buyer's position when the home appreciates faster", () => {
    const slow = calculateRentVsBuy(input({ homeAppreciationPercent: 1 }));
    const fast = calculateRentVsBuy(input({ homeAppreciationPercent: 7 }));
    expect(fast.netWorthDeltaAtHorizon).toBeGreaterThan(slow.netWorthDeltaAtHorizon);
  });

  it("gives the buyer a tax benefit only when itemizing", () => {
    const noItemize = calculateRentVsBuy(input({ itemizes: false }));
    const itemize = calculateRentVsBuy(input({ itemizes: true }));
    // The deduction lowers the buyer's carrying cost, lifting net worth.
    expect(itemize.buyerNetWorthAtHorizon).toBeGreaterThan(noItemize.buyerNetWorthAtHorizon);
    expect(itemize.monthlyBuyingCostYear1).toBeLessThan(noItemize.monthlyBuyingCostYear1);
  });

  it("keeps every reported figure finite", () => {
    const result = calculateRentVsBuy(input({ yearsStaying: 30 }));
    for (const year of result.yearly) {
      expect(Number.isFinite(year.buyerNetWorth)).toBe(true);
      expect(Number.isFinite(year.renterNetWorth)).toBe(true);
      expect(year.loanBalance).toBeGreaterThanOrEqual(0);
    }
    expect(result.assumptions.verified).toBe(false);
  });

  it("pays the mortgage down to zero by the end of the term", () => {
    const result = calculateRentVsBuy(input({ loanTermYears: 15, yearsStaying: 15 }));
    expect(result.yearly[14].loanBalance).toBeCloseTo(0, 2);
  });
});
