import { calculateRentVsBuy, monthlyMortgagePayment } from "../engine";
import { createAssumptionsMeta, createDefaultInput, saltCapForYear } from "../defaults";
import type { RentVsBuyInput } from "../types";

function input(overrides: Partial<RentVsBuyInput> = {}): RentVsBuyInput {
  return { ...createDefaultInput(), ...overrides };
}

describe("monthlyMortgagePayment", () => {
  it("matches the standard amortization formula", () => {
    // $360k at 6.8% over 30 years is ~$2,347/mo.
    expect(monthlyMortgagePayment(360_000, 6.8, 30)).toBeCloseTo(2346.9, 0);
  });

  it("prices the default loan at the default rate", () => {
    // Freddie Mac 30 year fixed average as of 2026-09-24. By hand: r = 0.0703 / 12,
    // (1 + r)^360 = 8.189447, and 360,000 x r x 8.189447 / 7.189447 = 2,402.35.
    expect(createDefaultInput().mortgageRatePercent).toBe(7.4);
    expect(monthlyMortgagePayment(360_000, 7.03, 30)).toBeCloseTo(2402.35, 2);
    // The default loan is $360,000 at the 7.40% Freddie Mac average of 2026-10-08.
    expect(calculateRentVsBuy(input()).monthlyPaymentYear1).toBeCloseTo(2492.57, 2);
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

describe("calculateRentVsBuy break-even", () => {
  it("drops the break-even when renting retakes the lead before the horizon", () => {
    // Buying leads from year 5 to 19 and falls behind again by year 20, so the
    // verdict favors renting and no break-even holds through the end of the stay.
    // The rate is pinned so the scenario does not move when the default rate is refreshed.
    const result = calculateRentVsBuy(
      input({
        mortgageRatePercent: 6.8,
        homeAppreciationPercent: 6,
        monthlyRent: 2_400,
        yearsStaying: 20,
        investmentReturnPercent: 10,
      }),
    );
    expect(result.verdict).toBe("renting");
    expect(result.breakEvenYears).toBeNull();
    const yearsAhead = result.yearly
      .filter((year) => year.buyerNetWorth >= year.renterNetWorth)
      .map((year) => year.year);
    expect(yearsAhead).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  });
});

describe("tax year figures", () => {
  it("pins the SALT cap to the schedule in 26 USC 164(b)(7)", () => {
    expect(saltCapForYear(2025)).toBe(40_000);
    expect(saltCapForYear(2026)).toBe(40_400);
    // 101 percent of the prior year: 40,400 + 404, then 40,804 + 408.04, then 41,212.04 + 412.1204.
    expect(saltCapForYear(2027)).toBe(40_804);
    expect(saltCapForYear(2028)).toBeCloseTo(41_212.04, 6);
    expect(saltCapForYear(2029)).toBeCloseTo(41_624.1604, 6);
    expect(saltCapForYear(2030)).toBe(10_000);
    expect(saltCapForYear(2055)).toBe(10_000);
  });

  it("raises the cap 1% a year from 2027 through 2029", () => {
    for (const year of [2027, 2028, 2029]) {
      expect(saltCapForYear(year)).toBeCloseTo(saltCapForYear(year - 1) * 1.01, 6);
    }
  });

  it("reports tax year 2026 figures with their read date", () => {
    const married = createAssumptionsMeta("married");
    const single = createAssumptionsMeta("single");
    expect(married.taxYear).toBe(2026);
    expect(married.saltCap).toBe(40_400);
    expect(married.standardDeduction).toBe(32_200);
    expect(single.standardDeduction).toBe(16_100);
    expect(married.capitalGainsExclusion).toBe(500_000);
    expect(single.capitalGainsExclusion).toBe(250_000);
    expect(married.asOf).toBe("2026-09-27");
    expect(married.defaultMortgageRatePercent).toBe(7.4);
    expect(married.mortgageRateAsOf).toBe("2026-10-08");
    expect(married.verified).toBe(false);
  });

  it("discloses the cap schedule and the reduction it does not model", () => {
    const { taxNote } = createAssumptionsMeta("married");
    expect(taxNote).toContain("tax year 2026");
    expect(taxNote).toContain("$40,400 in 2026");
    expect(taxNote).toContain("$10,000 in 2030");
    expect(taxNote).toContain("does not model the reduction");
    expect(taxNote).toContain("$505,000");
  });
});

describe("SALT cap by tax year in the projection", () => {
  // No loan and a flat home value, so the only deduction is property tax and it
  // is the same dollar amount every year. Any change by year is the cap.
  const flat = (homePrice: number): RentVsBuyInput =>
    input({
      homePrice,
      downPaymentPercent: 100,
      propertyTaxPercent: 2,
      homeAppreciationPercent: 0,
      marginalTaxRatePercent: 24,
      itemizes: true,
      yearsStaying: 10,
    });

  it("deducts less in year 5 than in year 1 of a 10 year comparison starting in 2026", () => {
    // $1.2M at 2% is $24,000 a year. That is under the 2026 cap of $40,400 and
    // over the 2030 cap of $10,000.
    const result = calculateRentVsBuy(flat(1_200_000), 2026);
    expect(result.yearly.map((year) => year.taxYear)).toEqual([
      2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035,
    ]);
    expect(result.yearly[0].saltCap).toBe(40_400);
    expect(result.yearly[0].taxDeduction).toBeCloseTo(24_000, 6);
    expect(result.yearly[3].taxDeduction).toBeCloseTo(24_000, 6);
    expect(result.yearly[4].saltCap).toBe(10_000);
    expect(result.yearly[4].taxDeduction).toBeCloseTo(10_000, 6);
    expect(result.yearly[9].taxDeduction).toBeCloseTo(10_000, 6);
    expect(result.yearly[4].taxDeduction).not.toBeCloseTo(result.yearly[0].taxDeduction, 0);
  });

  it("follows the cap year by year when property tax is over it", () => {
    // $2.4M at 2% is $48,000 a year, over the cap in every year.
    const result = calculateRentVsBuy(flat(2_400_000), 2026);
    const expected = [40_400, 40_804, 41_212.04, 41_624.1604, 10_000, 10_000, 10_000, 10_000, 10_000, 10_000];
    result.yearly.forEach((year, index) => {
      expect(year.taxDeduction).toBeCloseTo(expected[index], 6);
    });
  });

  it("turns the deduction into a tax benefit at the marginal rate", () => {
    // Deductions of 24,000 x 4 + 10,000 x 6 = 156,000, and 24% of that is 37,440.
    const itemizing = calculateRentVsBuy(flat(1_200_000), 2026);
    const standard = calculateRentVsBuy({ ...flat(1_200_000), itemizes: false }, 2026);
    const benefitThrough = (index: number) =>
      standard.yearly[index].cumulativeBuyingCost - itemizing.yearly[index].cumulativeBuyingCost;
    expect(benefitThrough(0)).toBeCloseTo(0.24 * 24_000, 6);
    expect(benefitThrough(4)).toBeCloseTo(0.24 * 106_000, 6);
    expect(benefitThrough(9)).toBeCloseTo(37_440, 6);
  });

  it("reports no deduction when itemizing is off", () => {
    const result = calculateRentVsBuy({ ...flat(1_200_000), itemizes: false }, 2026);
    expect(result.yearly.every((year) => year.taxDeduction === 0)).toBe(true);
  });

  it("starts the schedule at the start year it is given", () => {
    const from2029 = calculateRentVsBuy(flat(1_200_000), 2029);
    expect(from2029.yearly[0].taxDeduction).toBeCloseTo(24_000, 6);
    expect(from2029.yearly[1].taxDeduction).toBeCloseTo(10_000, 6);
    const from2030 = calculateRentVsBuy(flat(1_200_000), 2030);
    expect(from2030.yearly[0].taxYear).toBe(2030);
    expect(from2030.yearly[0].taxDeduction).toBeCloseTo(10_000, 6);
  });

  it("treats year 1 as tax year 2026 by default", () => {
    const result = calculateRentVsBuy(flat(1_200_000));
    expect(result.yearly[0].taxYear).toBe(2026);
    expect(result.yearly[4].taxYear).toBe(2030);
  });
});
