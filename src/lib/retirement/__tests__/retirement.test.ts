import {
  project,
  createDefaultPlan,
  computePortfolioAssumptions,
  expandAllocation,
  simulatePath,
  runDeterministic,
  socialSecurityClaimFactor,
  rmdDivisor,
  rmdStartAge,
  rmdStartAgeFromCurrent,
  type RetirementPlanInput,
} from "../index";

// Fixed reference year so RMD-age logic is deterministic across machines/dates.
const REF_YEAR = 2026;

function planWith(overrides: Partial<RetirementPlanInput>): RetirementPlanInput {
  return { ...createDefaultPlan(), ...overrides };
}

function noTaxRates() {
  return { taxable: 0, traditional: 0, roth: 0, hsa: 0 };
}

describe("allocation → expected return + volatility", () => {
  it("returns the cash CMA for an all-cash portfolio", () => {
    const { expectedReturn, volatility } = computePortfolioAssumptions({
      stocks: 0,
      bonds: 0,
      cash: 100,
      other: 0,
    });
    expect(expectedReturn).toBeCloseTo(0.037, 5);
    expect(volatility).toBeCloseTo(0.01, 5);
  });

  it("normalizes weights that don't sum to 100", () => {
    const weights = expandAllocation({ stocks: 50, bonds: 50, cash: 0, other: 0 });
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 6);
  });

  it("gives a stock-heavy portfolio a higher return and volatility than a bond-heavy one", () => {
    const stocky = computePortfolioAssumptions({ stocks: 90, bonds: 10, cash: 0, other: 0 });
    const bondy = computePortfolioAssumptions({ stocks: 10, bonds: 90, cash: 0, other: 0 });
    expect(stocky.expectedReturn).toBeGreaterThan(bondy.expectedReturn);
    expect(stocky.volatility).toBeGreaterThan(bondy.volatility);
  });
});

describe("Social Security claim mechanics", () => {
  it("is unchanged at full retirement age", () => {
    expect(socialSecurityClaimFactor(67)).toBeCloseTo(1, 6);
  });

  it("cuts the benefit ~30% at 62 and adds ~24% at 70", () => {
    expect(socialSecurityClaimFactor(62)).toBeCloseTo(0.7, 2);
    expect(socialSecurityClaimFactor(70)).toBeCloseTo(1.24, 2);
  });
});

describe("RMD schedule", () => {
  it("uses the IRS Uniform Lifetime Table divisors", () => {
    expect(rmdDivisor(73)).toBe(26.5);
    expect(rmdDivisor(75)).toBe(24.6);
    expect(rmdDivisor(90)).toBe(12.2);
  });

  it("applies SECURE 2.0 start ages by birth year", () => {
    expect(rmdStartAge(1949)).toBe(72);
    expect(rmdStartAge(1955)).toBe(73);
    expect(rmdStartAge(1965)).toBe(75);
    // Born 1956 → RMD age 73.
    expect(rmdStartAgeFromCurrent(70, REF_YEAR)).toBe(73);
  });
});

describe("4% rule on a 60/40 portfolio over 30 years", () => {
  const plan = planWith({
    currentAge: 65,
    retirementAge: 65,
    horizonAge: 95,
    desiredAnnualSpend: 40000,
    preMedicareHealthcare: 0,
    accounts: [
      { id: "a", type: "taxable", balance: 1_000_000, annualContribution: 0, employerMatch: 0 },
    ],
    allocation: { stocks: 60, bonds: 40, cash: 0, other: 0 },
    otherIncome: {
      socialSecurityAnnual: 0,
      socialSecurityClaimAge: 67,
      socialSecurityCola: true,
      pensionAnnual: 0,
      pensionStartAge: 65,
      pensionCola: false,
      partTimeAnnual: 0,
      partTimeStartAge: 65,
      partTimeEndAge: 70,
    },
    assumptions: { ...createDefaultPlan().assumptions, taxRates: noTaxRates() },
  });

  it("lands near established safe-withdrawal results (high but not certain success)", () => {
    const result = project(plan, REF_YEAR);
    // Trinity/Bengen: a 4% inflation-adjusted withdrawal funds 30 years with
    // high probability — but forward-looking CMAs keep it short of certainty.
    expect(result.monteCarlo.successRate).toBeGreaterThan(0.6);
    expect(result.monteCarlo.successRate).toBeLessThanOrEqual(1);
  });

  it("computes a target nest egg near 25× net spend", () => {
    const result = project(plan, REF_YEAR);
    // 40,000 / 0.04 = 1,000,000.
    expect(result.targetNestEgg).toBeCloseTo(1_000_000, 0);
  });
});

describe("edge cases — no divide by zero", () => {
  it("handles zero balances and zero contributions", () => {
    const plan = planWith({
      accounts: [],
      currentAge: 40,
      retirementAge: 65,
      horizonAge: 95,
    });
    const result = project(plan, REF_YEAR);
    expect(Number.isFinite(result.targetNestEgg)).toBe(true);
    result.deterministic.path.forEach((y) => {
      expect(Number.isFinite(y.nominalBalance)).toBe(true);
      expect(Number.isFinite(y.realBalance)).toBe(true);
    });
  });

  it("guards the target number when the withdrawal rate is zero", () => {
    const base = createDefaultPlan();
    const plan = planWith({
      assumptions: { ...base.assumptions, withdrawalRateOverride: 0 },
    });
    const result = project(plan, REF_YEAR);
    expect(Number.isFinite(result.targetNestEgg)).toBe(true);
    expect(result.targetNestEgg).toBe(0);
  });

  it("produces finite balances for a zero-return path", () => {
    const plan = planWith({
      currentAge: 60,
      retirementAge: 60,
      horizonAge: 62,
      accounts: [
        { id: "a", type: "taxable", balance: 100000, annualContribution: 0, employerMatch: 0 },
      ],
    });
    const years = plan.horizonAge - plan.currentAge;
    const path = simulatePath(plan, new Array(years + 1).fill(0), REF_YEAR);
    path.years.forEach((y) => expect(Number.isFinite(y.nominalBalance)).toBe(true));
  });
});

describe("inflation compounding", () => {
  it("matches a hand-calculated spending row", () => {
    const base = createDefaultPlan();
    const plan = planWith({
      currentAge: 60,
      retirementAge: 60,
      horizonAge: 63,
      desiredAnnualSpend: 50000,
      accounts: [
        { id: "a", type: "taxable", balance: 5_000_000, annualContribution: 0, employerMatch: 0 },
      ],
      otherIncome: { ...base.otherIncome, socialSecurityAnnual: 0 },
      assumptions: { ...base.assumptions, inflation: 0.03, taxRates: noTaxRates() },
    });
    const years = plan.horizonAge - plan.currentAge;
    const path = simulatePath(plan, new Array(years + 1).fill(0.03), REF_YEAR);
    expect(path.years[0].spending).toBeCloseTo(50000, 2);
    expect(path.years[1].spending).toBeCloseTo(51500, 2);
    expect(path.years[2].spending).toBeCloseTo(53045, 2);
  });
});

describe("Monte Carlo determinism", () => {
  it("returns identical success rates for a fixed seed", () => {
    const plan = createDefaultPlan();
    const a = project(plan, REF_YEAR);
    const b = project(plan, REF_YEAR);
    expect(a.monteCarlo.successRate).toBe(b.monteCarlo.successRate);
    expect(a.monteCarlo.bands).toEqual(b.monteCarlo.bands);
  });
});

describe("lumpy expense", () => {
  it("reduces the balance starting in the expense year only", () => {
    const base = createDefaultPlan();
    const common = {
      currentAge: 65,
      retirementAge: 65,
      horizonAge: 80,
      desiredAnnualSpend: 30000,
      accounts: [
        { id: "a", type: "taxable" as const, balance: 1_000_000, annualContribution: 0, employerMatch: 0 },
      ],
      otherIncome: { ...base.otherIncome, socialSecurityAnnual: 0 },
      assumptions: { ...base.assumptions, taxRates: noTaxRates() },
    };
    const without = planWith({ ...common, lumpyExpenses: [] });
    const withExpense = planWith({
      ...common,
      lumpyExpenses: [{ id: "x", label: "Roof", amount: 50000, age: 70 }],
    });

    const years = common.horizonAge - common.currentAge;
    const r = new Array(years + 1).fill(0.04);
    const pa = simulatePath(without, r, REF_YEAR);
    const pb = simulatePath(withExpense, r, REF_YEAR);

    const expenseIdx = 70 - common.currentAge;
    // Years before the expense are identical.
    for (let t = 0; t < expenseIdx; t++) {
      expect(pb.years[t].nominalBalance).toBeCloseTo(pa.years[t].nominalBalance, 2);
    }
    // The expense year spends the extra amount.
    expect(pb.years[expenseIdx].spending - pa.years[expenseIdx].spending).toBeCloseTo(
      50000 * Math.pow(1.025, expenseIdx),
      0,
    );
    // And the balance is lower from that year onward.
    expect(pb.years[expenseIdx].nominalBalance).toBeLessThan(pa.years[expenseIdx].nominalBalance);
  });
});

describe("RMDs force tax-deferred withdrawals", () => {
  it("draws the traditional balance starting at the RMD age", () => {
    const base = createDefaultPlan();
    const plan = planWith({
      currentAge: 70, // born 1956 → RMD age 73
      retirementAge: 70,
      horizonAge: 85,
      desiredAnnualSpend: 1000,
      preMedicareHealthcare: 0,
      accounts: [
        { id: "t", type: "traditional", balance: 1_000_000, annualContribution: 0, employerMatch: 0 },
      ],
      allocation: { stocks: 0, bonds: 0, cash: 100, other: 0 },
      otherIncome: { ...base.otherIncome, socialSecurityAnnual: 0 },
      assumptions: { ...base.assumptions, inflation: 0 },
    });
    const years = plan.horizonAge - plan.currentAge;
    const path = simulatePath(plan, new Array(years + 1).fill(0), REF_YEAR);

    const at72 = path.years.find((y) => y.age === 72)!;
    const at73 = path.years.find((y) => y.age === 73)!;
    // Pre-RMD: only the small discretionary need is withdrawn.
    expect(at72.withdrawal).toBeLessThan(5000);
    // RMD year: a forced distribution far exceeding the spending need.
    expect(at73.withdrawal).toBeGreaterThan(30000);
  });
});

describe("money-runs-out case", () => {
  it("reports the correct depletion age", () => {
    const base = createDefaultPlan();
    const plan = planWith({
      currentAge: 60,
      retirementAge: 60,
      horizonAge: 90,
      desiredAnnualSpend: 25000,
      accounts: [
        { id: "a", type: "taxable", balance: 100000, annualContribution: 0, employerMatch: 0 },
      ],
      otherIncome: { ...base.otherIncome, socialSecurityAnnual: 0 },
      assumptions: { ...base.assumptions, inflation: 0, taxRates: noTaxRates() },
    });
    const years = plan.horizonAge - plan.currentAge;
    // Zero return, zero tax, zero inflation: 100k / 25k = 4 years funded,
    // depletes in year 4 (age 64).
    const path = simulatePath(plan, new Array(years + 1).fill(0), REF_YEAR);
    expect(path.depletionAge).toBe(64);
  });
});

describe("fixed-percent funding shortfall", () => {
  const base = createDefaultPlan();
  const common = {
    currentAge: 65,
    retirementAge: 65,
    horizonAge: 80,
    desiredAnnualSpend: 40000,
    preMedicareHealthcare: 0,
    accounts: [
      { id: "a", type: "taxable" as const, balance: 1_000_000, annualContribution: 0, employerMatch: 0 },
    ],
    otherIncome: { ...base.otherIncome, socialSecurityAnnual: 0 },
  };
  const fixedPercent = {
    ...base.assumptions,
    withdrawalStrategy: "fixed-percent" as const,
    withdrawalRateOverride: 0.04,
    inflation: 0,
    taxRates: noTaxRates(),
  };

  it("flags the year the real draw drops below 80% of desired spend", () => {
    const plan = planWith({ ...common, assumptions: fixedPercent });
    const years = common.horizonAge - common.currentAge;
    // Zero return + a 4% draw shrinks the balance ~4%/yr, so the 4% draw (starts
    // at the desired 40k) crosses 80% of 40k = 32k in year 6 → age 71. Without
    // the shortfall rule a fixed-percent path would never deplete (depletionAge
    // null) and report a vacuous 100% success.
    const path = simulatePath(plan, new Array(years + 1).fill(0), REF_YEAR);
    expect(path.depletionAge).toBe(71);
  });

  it("reports no shortfall when growth keeps the draw above the floor", () => {
    const plan = planWith({ ...common, assumptions: fixedPercent });
    const years = common.horizonAge - common.currentAge;
    const path = simulatePath(plan, new Array(years + 1).fill(0.08), REF_YEAR);
    expect(path.depletionAge).toBeNull();
  });

  it("counts guaranteed income toward the lifestyle floor", () => {
    // Same shrinking portfolio as the flagged case, but Social Security covers
    // most of the draw, so the portfolio barely shrinks and the modeled real
    // lifestyle (max of the 4% draw and guaranteed income) stays above 80% of the
    // desired spend the whole horizon — no shortfall.
    const plan = planWith({
      ...common,
      otherIncome: {
        ...base.otherIncome,
        socialSecurityAnnual: 30000,
        socialSecurityClaimAge: 65,
        socialSecurityCola: true,
      },
      assumptions: fixedPercent,
    });
    const years = common.horizonAge - common.currentAge;
    const path = simulatePath(plan, new Array(years + 1).fill(0), REF_YEAR);
    expect(path.depletionAge).toBeNull();
  });

  it("flags a shortfall the old double-count masked (mid-range guaranteed income)", () => {
    // Regression for the guaranteed-income double-count. Social Security of 20k
    // sits between 40% and 80% of the 40k desired spend. As the 4% draw shrinks
    // the balance, the real lifestyle the plan actually funds — max(draw, SS) —
    // crosses 80% of 40k = 32k, even though draw + SS (the old buggy sum) never
    // would. The shortfall must be flagged; the old code reported none.
    const plan = planWith({
      ...common,
      otherIncome: {
        ...base.otherIncome,
        socialSecurityAnnual: 20000,
        socialSecurityClaimAge: 65,
        socialSecurityCola: true,
      },
      assumptions: fixedPercent,
    });
    const years = common.horizonAge - common.currentAge;
    const path = simulatePath(plan, new Array(years + 1).fill(0), REF_YEAR);
    // Flagged mid-horizon (the early-claim SS reduction decays the balance a bit
    // faster than the nominal 20k would); the old double-count reported null here.
    expect(path.depletionAge).toBe(76);
  });
});

describe("pre-retirement lumpy expenses", () => {
  it("draws down the portfolio when an expense lands before retirement", () => {
    const base = createDefaultPlan();
    const common = {
      currentAge: 50,
      retirementAge: 60,
      horizonAge: 70,
      desiredAnnualSpend: 0,
      preMedicareHealthcare: 0,
      accounts: [
        { id: "a", type: "taxable" as const, balance: 100_000, annualContribution: 0, employerMatch: 0 },
      ],
      otherIncome: { ...base.otherIncome, socialSecurityAnnual: 0 },
      assumptions: { ...base.assumptions, inflation: 0, taxRates: noTaxRates() },
    };
    const years = common.horizonAge - common.currentAge;

    const without = simulatePath(planWith(common), new Array(years + 1).fill(0), REF_YEAR);
    const withExpense = simulatePath(
      planWith({ ...common, lumpyExpenses: [{ id: "roof", label: "Roof", age: 55, amount: 40_000 }] }),
      new Array(years + 1).fill(0),
      REF_YEAR
    );

    expect(without.endingBalanceNominal).toBe(100_000);
    expect(withExpense.endingBalanceNominal).toBe(60_000);
  });
});

describe("deterministic projection shape", () => {
  it("returns a value at every age through the horizon", () => {
    const plan = createDefaultPlan();
    const det = runDeterministic(plan, 0.06, REF_YEAR);
    expect(det.path).toHaveLength(plan.horizonAge - plan.currentAge + 1);
    expect(det.path[0].age).toBe(plan.currentAge);
    expect(det.path[det.path.length - 1].age).toBe(plan.horizonAge);
  });
});
