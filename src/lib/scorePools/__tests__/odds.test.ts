import { devig, devigMoneyline, devigTotals, overround, toDecimal } from "../index";

describe("odds format conversion", () => {
  it("passes decimal odds through", () => {
    expect(toDecimal(2.5, "decimal")).toBe(2.5);
    expect(toDecimal("1.91", "decimal")).toBeCloseTo(1.91, 10);
  });

  it("converts positive and negative American odds", () => {
    expect(toDecimal(150, "american")).toBeCloseTo(2.5, 10);
    expect(toDecimal(-200, "american")).toBeCloseTo(1.5, 10);
    expect(toDecimal(100, "american")).toBeCloseTo(2, 10);
    expect(toDecimal("-110", "american")).toBeCloseTo(1 + 100 / 110, 10);
  });

  it("converts fractional odds", () => {
    expect(toDecimal("5/2", "fractional")).toBeCloseTo(3.5, 10);
    expect(toDecimal("1/2", "fractional")).toBeCloseTo(1.5, 10);
    expect(toDecimal("10/11", "fractional")).toBeCloseTo(1 + 10 / 11, 10);
  });

  it("rejects prices that can't be real odds", () => {
    expect(() => toDecimal(1, "decimal")).toThrow();
    expect(() => toDecimal(0.9, "decimal")).toThrow();
    expect(() => toDecimal(50, "american")).toThrow();
    expect(() => toDecimal("five to two", "fractional")).toThrow();
    expect(() => toDecimal("5/0", "fractional")).toThrow();
  });
});

describe("de-vig", () => {
  it("reports the bookmaker margin", () => {
    // 1/2 + 1/3.5 + 1/4 = 1.0357142857…
    expect(overround([2, 3.5, 4])).toBeCloseTo(0.0357142857, 8);
  });

  it("strips the margin proportionally in a three-way market", () => {
    const { probabilities } = devig([2, 3.5, 4]);
    expect(probabilities[0]).toBeCloseTo(0.5 / 1.0357142857142858, 10);
    expect(probabilities[1]).toBeCloseTo(0.2857142857142857 / 1.0357142857142858, 10);
    expect(probabilities[2]).toBeCloseTo(0.25 / 1.0357142857142858, 10);
    expect(probabilities.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
  });

  it("handles two-way markets", () => {
    const { probabilities, overround: margin } = devig([1.91, 1.91]);
    expect(probabilities[0]).toBeCloseTo(0.5, 10);
    expect(probabilities[1]).toBeCloseTo(0.5, 10);
    expect(margin).toBeCloseTo(2 / 1.91 - 1, 10);
  });

  it("power method sums to one and shifts margin off the longshot", () => {
    const decimals = [1.3, 5.5, 9];
    const proportional = devig(decimals, "proportional").probabilities;
    const power = devig(decimals, "power").probabilities;
    expect(power.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 8);
    // Favorite-longshot bias: the power method takes more of the margin off
    // the longshot, leaving the favorite with a higher fair probability.
    expect(power[0]).toBeGreaterThan(proportional[0]);
    expect(power[2]).toBeLessThan(proportional[2]);
  });

  it("recovers exact probabilities from a proportionally-margined book", () => {
    // A book that adds 5% margin proportionally: odds = 1 / (p * 1.05).
    const fair = [0.5, 0.3, 0.2];
    const decimals = fair.map((p) => 1 / (p * 1.05));
    const { probabilities } = devig(decimals);
    fair.forEach((p, i) => expect(probabilities[i]).toBeCloseTo(p, 10));
  });

  it("labels three-way and two-way moneylines correctly", () => {
    const threeWay = devigMoneyline({ home: 2.5, draw: 3.2, away: 2.9 });
    expect(threeWay.probabilities.draw).toBeDefined();
    expect(
      threeWay.probabilities.home +
        (threeWay.probabilities.draw as number) +
        threeWay.probabilities.away,
    ).toBeCloseTo(1, 10);

    const twoWay = devigMoneyline({ home: 1.8, away: 2.1 });
    expect(twoWay.probabilities.draw).toBeUndefined();
    expect(twoWay.probabilities.home + twoWay.probabilities.away).toBeCloseTo(1, 10);
  });

  it("returns null totals when a price is missing", () => {
    expect(devigTotals(1.9, undefined)).toBeNull();
    expect(devigTotals(undefined, 1.9)).toBeNull();
    expect(devigTotals(2.2, 1.7)).toBeCloseTo(1 / 2.2 / (1 / 2.2 + 1 / 1.7), 10);
  });
});
