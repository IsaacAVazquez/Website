import { buildEnhanced, buildSummary } from "@/hooks/useInvestments";
import type { PortfolioHolding, StockQuote } from "@/types/investment";

describe("useInvestments derived calculations", () => {
  it("falls back to average cost when a quote fetch returns an error placeholder", () => {
    const holdings: PortfolioHolding[] = [
      { symbol: "AAPL", shares: 10, averageCost: 150 },
      { symbol: "MSFT", shares: 5, averageCost: 300 },
    ];

    const quotes = new Map<string, StockQuote>([
      [
        "AAPL",
        {
          symbol: "AAPL",
          price: 175,
          change: 2,
          changePercent: 1.16,
          dayHigh: 176,
          dayLow: 172,
          open: 173,
          previousClose: 173,
          volume: 1000,
          marketCap: 0,
          name: "Apple Inc.",
        },
      ],
      [
        "MSFT",
        {
          symbol: "MSFT",
          price: 0,
          change: 0,
          changePercent: 0,
          dayHigh: 0,
          dayLow: 0,
          open: 0,
          previousClose: 0,
          volume: 0,
          marketCap: 0,
          name: "MSFT",
          error: "Failed to fetch",
        },
      ],
    ]);

    const enhanced = buildEnhanced(holdings, quotes, false);
    const summary = buildSummary(enhanced);

    expect(enhanced[0].currentValue).toBe(1750);
    expect(enhanced[1].currentValue).toBe(1500);
    expect(enhanced[1].gainLoss).toBe(0);
    expect(enhanced[1].dayChange).toBe(0);
    expect(summary.totalValue).toBe(3250);
    expect(summary.totalGainLoss).toBe(250);
    expect(summary.dayChange).toBe(20);
  });

  it("computes daily portfolio percent from the prior portfolio value", () => {
    const holdings: PortfolioHolding[] = [
      { symbol: "AAPL", shares: 10, averageCost: 100 },
    ];

    const quotes = new Map<string, StockQuote>([
      [
        "AAPL",
        {
          symbol: "AAPL",
          price: 110,
          change: 10,
          changePercent: 10,
          dayHigh: 110,
          dayLow: 100,
          open: 100,
          previousClose: 100,
          volume: 1000,
          marketCap: 0,
          name: "Apple Inc.",
        },
      ],
    ]);

    const enhanced = buildEnhanced(holdings, quotes, false);
    const rawSummary = buildSummary(enhanced);
    const previousValue = rawSummary.totalValue - rawSummary.dayChange;
    const dayChangePercent = previousValue > 0 ? (rawSummary.dayChange / previousValue) * 100 : 0;

    expect(rawSummary.totalValue).toBe(1100);
    expect(rawSummary.dayChange).toBe(100);
    expect(dayChangePercent).toBe(10);
  });
});
