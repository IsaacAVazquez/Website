import { renderHook, waitFor } from "@testing-library/react";
import {
  buildEnhanced,
  buildSummary,
  canPersistPortfolioSnapshot,
  upsertSnapshots,
  useInvestments,
} from "@/hooks/useInvestments";
import type { PortfolioSnapshot } from "@/components/investments/PortfolioPerformanceChart";
import type { PortfolioHolding, StockQuote } from "@/types/investment";

const originalFetch = global.fetch;

describe("useInvestments derived calculations", () => {
  afterEach(() => {
    window.localStorage.clear();
    global.fetch = originalFetch;
  });

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

  it("does not persist a portfolio snapshot when any holding falls back to cost basis", () => {
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

    expect(canPersistPortfolioSnapshot(holdings, quotes)).toBe(false);
  });

  it("names holdings that fall back to cost basis after quote placeholders", async () => {
    window.localStorage.setItem(
      "portfolio_holdings",
      JSON.stringify([
        { symbol: "AAPL", shares: 10, averageCost: 150 },
        { symbol: "MSFT", shares: 5, averageCost: 300 },
      ])
    );

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        allFailed: false,
        quotes: [
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
      }),
    });

    const { result } = renderHook(() => useInvestments());

    await waitFor(() => {
      expect(result.current.error).toBe(
        "Live prices are temporarily unavailable for MSFT. Portfolio totals are using your saved cost basis where needed."
      );
    });
  });

  it("replaces the current day snapshot instead of leaving it stale", () => {
    const existing: PortfolioSnapshot[] = [
      { date: "2026-04-16", totalValue: 1000, totalCost: 900, holdingCount: 2 },
      { date: "2026-04-17", totalValue: 1100, totalCost: 900, holdingCount: 2 },
    ];

    const updated = upsertSnapshots(existing, {
      date: "2026-04-17",
      totalValue: 1250,
      totalCost: 950,
      holdingCount: 3,
    });

    expect(updated).toHaveLength(2);
    expect(updated[1]).toEqual({
      date: "2026-04-17",
      totalValue: 1250,
      totalCost: 950,
      holdingCount: 3,
    });
  });
});
