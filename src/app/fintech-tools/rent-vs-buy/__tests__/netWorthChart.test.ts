import { netWorthChart } from "../netWorthChart";
import type { NetWorthSeriesInput } from "../netWorthChart";

function yearly(
  count: number,
  buyerAt: (year: number) => number,
  renterAt: (year: number) => number,
): NetWorthSeriesInput["yearly"] {
  return Array.from({ length: count }, (_, i) => {
    const year = i + 1;
    return { year, buyerNetWorth: buyerAt(year), renterNetWorth: renterAt(year) };
  });
}

describe("netWorthChart", () => {
  it("places the break-even marker at its fractional year, between the two whole years", () => {
    const input: NetWorthSeriesInput = {
      horizonYears: 10,
      upfrontCash: 50_000,
      breakEvenYears: 4.5,
      yearly: yearly(10, (y) => y * 10_000 - 40_000, (y) => y * 5_000),
    };
    const chart = netWorthChart(input);
    expect(chart.breakEvenX).not.toBeNull();
    const x4 = chart.xForYear(4);
    const x5 = chart.xForYear(5);
    expect(chart.breakEvenX as number).toBeGreaterThan(x4);
    expect(chart.breakEvenX as number).toBeLessThan(x5);
  });

  it("returns no marker when buying never pulls ahead within the horizon", () => {
    const input: NetWorthSeriesInput = {
      horizonYears: 2,
      upfrontCash: 90_000,
      breakEvenYears: null,
      yearly: yearly(2, (y) => y * 1_000, (y) => y * 20_000),
    };
    const chart = netWorthChart(input);
    expect(chart.breakEvenX).toBeNull();
  });

  it("draws the zero line when every value stays negative", () => {
    const input: NetWorthSeriesInput = {
      horizonYears: 5,
      upfrontCash: 30_000,
      breakEvenYears: null,
      yearly: yearly(5, (y) => -y * 1_000, (y) => -y * 500),
    };
    const chart = netWorthChart(input);
    expect(chart.zeroY).not.toBeNull();
  });

  it("draws the zero line when the series crosses zero", () => {
    const input: NetWorthSeriesInput = {
      horizonYears: 6,
      upfrontCash: 40_000,
      breakEvenYears: 3,
      yearly: yearly(6, (y) => y * 5_000 - 15_000, (y) => y * 6_000),
    };
    const chart = netWorthChart(input);
    expect(chart.zeroY).not.toBeNull();
  });

  it("omits the zero line when nothing dips below it", () => {
    const input: NetWorthSeriesInput = {
      horizonYears: 4,
      upfrontCash: 20_000,
      breakEvenYears: null,
      yearly: yearly(4, (y) => y * 1_000, (y) => y * 2_000 + 20_000),
    };
    const chart = netWorthChart(input);
    expect(chart.zeroY).toBeNull();
  });

  it("stays finite over a one-year horizon", () => {
    const input: NetWorthSeriesInput = {
      horizonYears: 1,
      upfrontCash: 25_000,
      breakEvenYears: 0.5,
      yearly: [{ year: 1, buyerNetWorth: 2_000, renterNetWorth: 1_000 }],
    };
    const chart = netWorthChart(input);
    expect(Number.isFinite(chart.xForYear(0))).toBe(true);
    expect(Number.isFinite(chart.xForYear(1))).toBe(true);
    expect(chart.xForYear(1)).toBeGreaterThan(chart.xForYear(0));
    expect(Number.isFinite(chart.buyerEndX)).toBe(true);
    expect(Number.isFinite(chart.buyerEndY)).toBe(true);
    expect(Number.isFinite(chart.renterEndX)).toBe(true);
    expect(Number.isFinite(chart.renterEndY)).toBe(true);
    expect(chart.breakEvenX).not.toBeNull();
    expect(Number.isFinite(chart.breakEvenX as number)).toBe(true);
  });

  it("returns y ticks inside the plot height, ascending", () => {
    const input: NetWorthSeriesInput = {
      horizonYears: 7,
      upfrontCash: 45_000,
      breakEvenYears: 3.2,
      yearly: yearly(7, (y) => y * 20_000 - 45_000, (y) => y * 10_000 + 45_000),
    };
    const chart = netWorthChart(input);
    expect(chart.yTicks.length).toBeGreaterThan(0);
    for (const tick of chart.yTicks) {
      expect(tick.y).toBeGreaterThanOrEqual(0);
      expect(tick.y).toBeLessThanOrEqual(chart.height);
    }
    const values = chart.yTicks.map((t) => t.value);
    expect([...values].sort((a, b) => a - b)).toEqual(values);
  });
});
