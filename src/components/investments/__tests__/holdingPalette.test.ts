import { holdingColor } from "../holdingPalette";

describe("holdingColor", () => {
  it("gives the first four holdings of a portfolio four different steps that read apart", () => {
    const portfolio = ["MSFT", "V", "AAPL", "NVDA"];
    const colours = portfolio.map((symbol) => holdingColor(symbol, portfolio));
    expect(new Set(colours).size).toBe(4);
    for (const colour of colours) {
      expect(["var(--c97-chart-1)", "var(--c97-chart-2)", "var(--c97-chart-3)", "var(--c97-chart-6)"]).toContain(colour);
    }
  });

  it("keeps one holding on one colour whatever order or filter a component passes", () => {
    const portfolio = ["V", "AAPL", "MSFT"];
    expect(holdingColor("MSFT", portfolio)).toBe(holdingColor("MSFT", ["MSFT", "AAPL", "V"]));
  });

  it("gives six holdings six different steps", () => {
    const portfolio = ["A", "B", "C", "D", "E", "F"];
    expect(new Set(portfolio.map((symbol) => holdingColor(symbol, portfolio))).size).toBe(6);
  });

  it("falls back to a stable colour for a symbol outside the portfolio", () => {
    expect(holdingColor("SHOP")).toBe(holdingColor("SHOP", ["AAPL"]));
    expect(holdingColor("SHOP")).toMatch(/^var\(--c97-chart-[1-6]\)$/);
  });
});
