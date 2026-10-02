import {
  analyzeBuy,
  correlationPhrase,
  describeBuy,
  formatDay,
  formatReturn,
  type SymbolHistory,
} from "@/lib/beforeYouBuy";

const DATES = ["2026-01-02", "2026-01-05", "2026-01-06", "2026-01-07", "2026-01-08", "2026-01-09"];
const series = (closes: number[], dates = DATES) => closes.map((close, i) => ({ date: dates[i], close }));
const SPY_CLOSES = [100, 101, 99, 102, 97, 98];

const history: Record<string, SymbolHistory> = {
  SPY: { prices: series(SPY_CLOSES) },
  // The same daily returns as SPY at twice the price.
  AAA: { prices: series(SPY_CLOSES.map((close) => close * 2)), sector: "Technology" },
  BBB: { prices: series([50, 50.5, 50.25, 50.5, 51, 50.75]), sector: "Energy" },
};

describe("analyzeBuy", () => {
  it("weights the mix before and after, merging a buy of something already held", () => {
    const result = analyzeBuy(
      [{ symbol: "AAA", value: 600 }, { symbol: "SPY", value: 400 }],
      { symbol: "AAA", value: 400 },
      history,
      "SPY"
    );

    expect(result.before.total).toBe(1000);
    expect(result.before.sectors).toEqual([
      { sector: "Technology", weight: 0.6 },
      { sector: "Index fund", weight: 0.4 },
    ]);
    expect(result.after.total).toBe(1400);
    expect(result.after.holdings.map((h) => h.symbol)).toEqual(["AAA", "SPY"]);
    expect(result.after.holdings[0].weight).toBeCloseTo(1000 / 1400, 10);
    expect(result.buySector).toBe("Technology");
  });

  it("measures beta and correlation over the shared window", () => {
    const sameAsMarket = analyzeBuy([{ symbol: "SPY", value: 1000 }], { symbol: "AAA", value: 1000 }, history, "SPY");
    expect(sameAsMarket.before.beta).toBeCloseTo(1, 10);
    expect(sameAsMarket.after.beta).toBeCloseTo(1, 10);
    expect(sameAsMarket.correlation).toBeCloseTo(1, 10);

    const steadier = analyzeBuy([{ symbol: "SPY", value: 1000 }], { symbol: "BBB", value: 1000 }, history, "SPY");
    expect(steadier.after.beta!).toBeLessThan(steadier.before.beta!);
    expect(steadier.correlation!).toBeLessThan(1);
  });

  it("lists the benchmark's worst days, worst first, with both mixes", () => {
    const result = analyzeBuy([{ symbol: "SPY", value: 1000 }], { symbol: "BBB", value: 1000 }, history, "SPY");

    expect(result.window).toEqual({ from: "2026-01-02", to: "2026-01-09", days: 5 });
    expect(result.worstDays).toHaveLength(5);
    const [worst] = result.worstDays;
    expect(worst.date).toBe("2026-01-08");
    expect(worst.benchmark).toBeCloseTo(97 / 102 - 1, 10);
    expect(worst.before).toBeCloseTo(97 / 102 - 1, 10);
    // Half the market's drop and half BBB's rise that day.
    expect(worst.after).toBeCloseTo(0.5 * (97 / 102 - 1) + 0.5 * (51 / 50.5 - 1), 10);
    expect(result.worstDays.map((day) => day.benchmark)).toEqual(
      [...result.worstDays.map((day) => day.benchmark)].sort((a, b) => a - b)
    );
  });

  it("drops any day one of the symbols didn't trade", () => {
    const gappy = {
      ...history,
      BBB: { ...history.BBB, prices: history.BBB.prices.filter((row) => row.date !== "2026-01-07") },
    };
    const result = analyzeBuy([{ symbol: "SPY", value: 1000 }], { symbol: "BBB", value: 500 }, gappy, "SPY");

    expect(result.window).toEqual({ from: "2026-01-02", to: "2026-01-09", days: 4 });
  });
});

describe("describeBuy", () => {
  it("names a sector the portfolio didn't hold and a new largest holding", () => {
    const result = analyzeBuy(
      [{ symbol: "AAA", value: 600 }, { symbol: "SPY", value: 400 }],
      { symbol: "BBB", value: 1000 },
      history,
      "SPY"
    );

    const text = describeBuy(result, "BBB Corp (BBB)");
    expect(text).toContain(
      "Adding $1,000 of BBB Corp (BBB) to this $1,000 portfolio puts 50% of the portfolio in Energy, where it held nothing before, and BBB becomes the largest holding at 50% of the total."
    );
    expect(text).toMatch(/Over the past year it .+ what you already hold \(a correlation of -?\d\.\d\d\)/);
    expect(text).toMatch(/On the S&P 500's five worst days of that year, your current mix averaged -\d\.\d% and the new one would have averaged [+-]\d\.\d%\./);
  });

  it("describes adding to a sector and a beta that doesn't move", () => {
    const result = analyzeBuy(
      [{ symbol: "AAA", value: 600 }, { symbol: "SPY", value: 400 }],
      { symbol: "AAA", value: 400 },
      history,
      "SPY"
    );

    const text = describeBuy(result, "AAA Inc (AAA)");
    expect(text).toContain("takes Technology from 60% to 71% of the portfolio, and AAA comes to 71% of the total.");
    expect(text).toContain("it moved closely with what you already hold (a correlation of 1.00), and the portfolio's beta stays at 1.00.");
  });

  it("handles an empty portfolio", () => {
    const result = analyzeBuy([], { symbol: "AAA", value: 500 }, history, "SPY");

    expect(result.before.beta).toBeNull();
    expect(result.correlation).toBeNull();
    expect(describeBuy(result, "AAA")).toBe("Adding $500 of AAA to an empty portfolio makes it the whole portfolio.");
  });
});

describe("formatting", () => {
  it("formats returns, days, and correlation phrases", () => {
    expect(formatReturn(-0.049)).toBe("-4.9%");
    expect(formatReturn(0.0125)).toBe("+1.3%");
    expect(formatDay("2026-09-30")).toBe("Sep 30, 2026");
    // A correlation near zero reads as no relationship, never as an opposite one.
    expect([0.85, 0.5, -0.07, -0.27, -0.45].map(correlationPhrase)).toEqual([
      "moved closely with",
      "moved somewhat with",
      "moved mostly independently of",
      "moved mostly independently of",
      "tended to move against",
    ]);
  });
});
