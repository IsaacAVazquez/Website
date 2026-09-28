import { breakevenScale, feeStatement } from "../feeStatement";

const row = (id: string, monthlyFee: number, model: "Flat Rate" | "Interchange+" = "Flat Rate") => ({
  id,
  name: id,
  model,
  monthlyFee,
  effectiveRate: 0,
  txCount: 0,
  perTxAvg: 0,
  note: "",
});

describe("feeStatement", () => {
  it("returns an empty statement for an empty result set", () => {
    expect(feeStatement([])).toEqual([]);
  });

  it("scales every fee against the most expensive and marks the cheapest once", () => {
    const rows = feeStatement([row("a", 100), row("b", 200), row("c", 50)]);

    expect(rows.map((r) => r.fraction)).toEqual([0.5, 1, 0.25]);
    expect(rows.filter((r) => r.isCheapest)).toHaveLength(1);
    expect(rows.find((r) => r.isCheapest)?.id).toBe("c");
  });

  it("handles an all-zero result set without dividing by zero", () => {
    const rows = feeStatement([row("a", 0), row("b", 0)]);
    expect(rows.every((r) => r.fraction === 0)).toBe(true);
    expect(rows.every((r) => Number.isFinite(r.fraction))).toBe(true);
  });

  it("marks every processor tied for cheapest, not just the first", () => {
    const rows = feeStatement([row("a", 40), row("b", 40), row("c", 90)]);
    expect(rows.filter((r) => r.isCheapest).map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("treats fees within a cent as tied rather than comparing floats exactly", () => {
    const rows = feeStatement([row("a", 40), row("b", 40.004), row("c", 90)]);
    expect(rows.filter((r) => r.isCheapest).map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("keeps a 50x outlier's cheapest fee visible on the shared scale", () => {
    const rows = feeStatement([row("cheap", 10), row("outlier", 500)]);
    const cheap = rows.find((r) => r.id === "cheap")!;
    expect(cheap.fraction).toBeGreaterThan(0);
    expect(cheap.fraction).toBeCloseTo(0.04, 5);
  });
});

describe("breakevenScale", () => {
  it("places a ticket inside the domain proportionally", () => {
    const scale = breakevenScale(252.5, null);
    expect(scale.ticketFraction).toBeCloseTo(0.5, 5);
    expect(scale.breakevenFraction).toBeNull();
  });

  it("clamps a ticket below the domain to the low end", () => {
    expect(breakevenScale(0, null).ticketFraction).toBe(0);
  });

  it("clamps a ticket above the domain to the high end", () => {
    expect(breakevenScale(10_000, null).ticketFraction).toBe(1);
  });

  it("places the breakeven ticket on the same scale when one exists", () => {
    const scale = breakevenScale(85, 130);
    expect(scale.breakevenFraction).toBeCloseTo((130 - 5) / 495, 5);
  });
});
