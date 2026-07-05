import { recomputeDcf } from "../investmentDcf";

describe("recomputeDcf", () => {
  it("matches the server model's ramped-growth formula for a known input", () => {
    // Same shape as computeDcf() in investmentTransforms.ts: FCF grows from
    // gShort toward gTerminal linearly over 5 years, discounted at r, plus a
    // Gordon-growth terminal value discounted back 5 years.
    const result = recomputeDcf({
      baseFcf: 10,
      nearTermGrowthPct: 20,
      discountRatePct: 11,
      terminalGrowthPct: 3,
      years: 5,
    });

    expect(result).not.toBeNull();

    // Hand-computed reference using the identical loop.
    let fcf = 10;
    let pv = 0;
    for (let i = 1; i <= 5; i++) {
      const g = 0.2 + (0.03 - 0.2) * (i / 5);
      fcf *= 1 + g;
      pv += fcf / Math.pow(1.11, i);
    }
    const terminal = (fcf * 1.03) / (0.11 - 0.03) / Math.pow(1.11, 5);
    const expectedFairValue = pv + terminal;

    expect(result!.fairValue).toBeCloseTo(expectedFairValue, 6);
    expect(result!.pvProjected).toBeCloseTo(pv, 6);
    expect(result!.pvTerminal).toBeCloseTo(terminal, 6);
    expect(result!.terminalSharePct).toBeCloseTo((terminal / expectedFairValue) * 100, 6);
  });

  it("returns null when the discount rate does not clear the terminal growth rate", () => {
    expect(
      recomputeDcf({ baseFcf: 10, nearTermGrowthPct: 10, discountRatePct: 3, terminalGrowthPct: 3 })
    ).toBeNull();
    expect(
      recomputeDcf({ baseFcf: 10, nearTermGrowthPct: 10, discountRatePct: 2, terminalGrowthPct: 3 })
    ).toBeNull();
  });

  it("returns null for a non-positive or non-finite base cash flow", () => {
    expect(
      recomputeDcf({ baseFcf: 0, nearTermGrowthPct: 10, discountRatePct: 10, terminalGrowthPct: 3 })
    ).toBeNull();
    expect(
      recomputeDcf({ baseFcf: -5, nearTermGrowthPct: 10, discountRatePct: 10, terminalGrowthPct: 3 })
    ).toBeNull();
    expect(
      recomputeDcf({ baseFcf: NaN, nearTermGrowthPct: 10, discountRatePct: 10, terminalGrowthPct: 3 })
    ).toBeNull();
  });

  it("increases fair value when the near-term growth assumption increases", () => {
    const base = recomputeDcf({ baseFcf: 10, nearTermGrowthPct: 8, discountRatePct: 10, terminalGrowthPct: 3 });
    const higherGrowth = recomputeDcf({ baseFcf: 10, nearTermGrowthPct: 18, discountRatePct: 10, terminalGrowthPct: 3 });
    expect(base).not.toBeNull();
    expect(higherGrowth).not.toBeNull();
    expect(higherGrowth!.fairValue).toBeGreaterThan(base!.fairValue);
  });

  it("decreases fair value when the discount rate increases", () => {
    const base = recomputeDcf({ baseFcf: 10, nearTermGrowthPct: 10, discountRatePct: 9, terminalGrowthPct: 3 });
    const higherDiscount = recomputeDcf({ baseFcf: 10, nearTermGrowthPct: 10, discountRatePct: 14, terminalGrowthPct: 3 });
    expect(base).not.toBeNull();
    expect(higherDiscount).not.toBeNull();
    expect(higherDiscount!.fairValue).toBeLessThan(base!.fairValue);
  });

  it("defaults to a 5-year horizon when years is omitted", () => {
    const withDefault = recomputeDcf({ baseFcf: 10, nearTermGrowthPct: 10, discountRatePct: 10, terminalGrowthPct: 3 });
    const explicit5 = recomputeDcf({ baseFcf: 10, nearTermGrowthPct: 10, discountRatePct: 10, terminalGrowthPct: 3, years: 5 });
    expect(withDefault).not.toBeNull();
    expect(explicit5).not.toBeNull();
    expect(withDefault!.fairValue).toBeCloseTo(explicit5!.fairValue, 9);
  });
});
