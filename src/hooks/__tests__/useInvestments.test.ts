import { act, renderHook, waitFor } from "@testing-library/react";
import {
  buildEnhanced,
  buildSummary,
  canPersistPortfolioSnapshot,
  upsertSnapshots,
  useInvestments,
} from "@/hooks/useInvestments";
import type { PortfolioSnapshot } from "@/components/investments/PortfolioPerformanceChart";
import type { PortfolioHolding, StockQuote } from "@/types/investment";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";

const originalFetch = global.fetch;

function validQuote(symbol: string, price = 100): StockQuote {
  return {
    symbol,
    price,
    change: 1,
    changePercent: 1,
    dayHigh: price + 1,
    dayLow: price - 1,
    open: price - 0.5,
    previousClose: price - 1,
    volume: 1000,
    marketCap: 0,
    name: symbol,
  };
}

function errorQuote(symbol: string, error: string): StockQuote {
  return { ...validQuote(symbol, 0), error };
}

describe("useInvestments derived calculations", () => {
  beforeEach(() => {
    resetBrowserStorageMemory();
    window.localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
    resetBrowserStorageMemory();
    window.localStorage.clear();
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
    const cache = JSON.parse(
      window.localStorage.getItem("portfolio_quotes_cache") ?? "null",
    ) as { quotes?: StockQuote[] } | null;
    expect(cache?.quotes).toEqual([expect.objectContaining({ symbol: "AAPL", price: 175 })]);
  });

  it("persists the quote cache and lastUpdated when one symbol keeps failing", async () => {
    window.localStorage.setItem(
      "portfolio_holdings",
      JSON.stringify([
        { symbol: "AAPL", shares: 10, averageCost: 150 },
        { symbol: "MSFT", shares: 5, averageCost: 300 },
      ]),
    );
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        allFailed: false,
        quotes: [validQuote("AAPL", 175), errorQuote("MSFT", "Failed to fetch quote")],
      }),
    });

    const { result } = renderHook(() => useInvestments());

    await waitFor(() => expect(result.current.lastUpdated).not.toBeNull());
    const cache = JSON.parse(
      window.localStorage.getItem("portfolio_quotes_cache") ?? "null",
    ) as { quotes?: StockQuote[] } | null;
    expect(cache?.quotes).toEqual([expect.objectContaining({ symbol: "AAPL", price: 175 })]);
    // MSFT has no usable quote anywhere (fresh or last-good), so the daily
    // performance snapshot is still withheld.
    expect(result.current.snapshots).toHaveLength(0);
  });

  it("treats a structured all-failed 503 as a graceful fallback without retrying", async () => {
    window.localStorage.setItem(
      "portfolio_holdings",
      JSON.stringify([{ symbol: "AAPL", shares: 1, averageCost: 90 }]),
    );
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({
        quotes: [
          errorQuote(
            "AAPL",
            "Live price is temporarily unavailable right now. Try again in a few minutes.",
          ),
        ],
        rateLimited: true,
        allFailed: true,
      }),
    });

    const { result } = renderHook(() => useInvestments());

    await waitFor(
      () => {
        expect(result.current.error).toBe(
          "Live prices are temporarily unavailable. Portfolio totals are using your saved cost basis.",
        );
      },
      { timeout: 4000 },
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.current.enhancedHoldings[0]?.currentPrice).toBe(90);
  }, 10000);

  it("surfaces the cost-basis fallback when no symbols are eligible for live pricing", async () => {
    window.localStorage.setItem(
      "portfolio_holdings",
      JSON.stringify([{ symbol: "ZZZZ", shares: 2, averageCost: 40 }]),
    );
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: "This symbol is not eligible for live pricing.",
        quotes: [errorQuote("ZZZZ", "This symbol is not eligible for live pricing.")],
        rateLimited: false,
        allFailed: false,
      }),
    });

    const { result } = renderHook(() => useInvestments());

    await waitFor(() => {
      expect(result.current.error).toBe(
        "Live prices are temporarily unavailable for ZZZZ. Portfolio totals are using your saved cost basis where needed.",
      );
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.current.enhancedHoldings[0]?.currentPrice).toBe(40);
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

  it("filters malformed persisted holdings at hydration", async () => {
    window.localStorage.setItem(
      "portfolio_holdings",
      JSON.stringify([
        { symbol: " aapl ", shares: 2, averageCost: 150, purchaseDate: "2026-02-30" },
        { symbol: "MSFT", shares: "five", averageCost: 300 },
        null,
      ]),
    );
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({
        quotes: [errorQuote("AAPL", "Failed to fetch quote")],
        rateLimited: false,
        allFailed: true,
      }),
    });

    const { result } = renderHook(() => useInvestments());

    await waitFor(() => expect(result.current.holdings).toHaveLength(1));
    expect(result.current.holdings[0]).toEqual({ symbol: "AAPL", shares: 2, averageCost: 150 });
  });

  it("keeps portfolio edits in memory and surfaces a failed durable write", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({
        quotes: [errorQuote("AAPL", "Failed to fetch quote")],
        rateLimited: false,
        allFailed: true,
      }),
    });
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "QuotaExceededError");
    });

    const first = renderHook(() => useInvestments());
    act(() => {
      first.result.current.addHolding({ symbol: "AAPL", shares: 1, averageCost: 100 });
    });

    expect(first.result.current.holdings).toEqual([
      { symbol: "AAPL", shares: 1, averageCost: 100 },
    ]);
    await waitFor(() => expect(first.result.current.persistenceStatus).toBe("memory-only"));
    first.unmount();

    const second = renderHook(() => useInvestments());
    await waitFor(() => expect(second.result.current.holdings).toHaveLength(1));
    expect(second.result.current.holdings[0].symbol).toBe("AAPL");
  });

  it("does not let cached error placeholders suppress a fresh request", async () => {
    window.localStorage.setItem(
      "portfolio_holdings",
      JSON.stringify([{ symbol: "AAPL", shares: 1, averageCost: 90 }]),
    );
    window.localStorage.setItem(
      "portfolio_quotes_cache",
      JSON.stringify({
        timestamp: Date.now(),
        quotes: [{ ...validQuote("AAPL", 0), error: "temporarily unavailable" }],
      }),
    );
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ quotes: [validQuote("AAPL", 110)], allFailed: false }),
    });

    const { result } = renderHook(() => useInvestments());

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.enhancedHoldings[0]?.currentPrice).toBe(110));
    const cache = JSON.parse(
      window.localStorage.getItem("portfolio_quotes_cache") ?? "{}",
    ) as { quotes?: StockQuote[] };
    expect(cache.quotes).toEqual([expect.objectContaining({ symbol: "AAPL", price: 110 })]);
    expect(cache.quotes?.some((quote) => quote.error)).toBe(false);
  });

  it("preserves a last-good price when a later response fails for that symbol", async () => {
    window.localStorage.setItem(
      "portfolio_holdings",
      JSON.stringify([
        { symbol: "AAPL", shares: 1, averageCost: 90 },
        { symbol: "MSFT", shares: 1, averageCost: 250 },
      ]),
    );
    const cachedPayload = {
      timestamp: Date.now(),
      quotes: [validQuote("AAPL", 100), validQuote("MSFT", 300)],
    };
    window.localStorage.setItem("portfolio_quotes_cache", JSON.stringify(cachedPayload));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        allFailed: false,
        quotes: [
          validQuote("AAPL", 105),
          { ...validQuote("MSFT", 0), error: "temporarily unavailable" },
        ],
      }),
    });

    const { result } = renderHook(() => useInvestments());
    await waitFor(() => expect(result.current.holdings).toHaveLength(2));

    act(() => result.current.refetch());

    await waitFor(() =>
      expect(result.current.error).toContain("showing the last saved live price"),
    );
    expect(result.current.enhancedHoldings.find((holding) => holding.symbol === "AAPL")?.currentPrice)
      .toBe(105);
    expect(result.current.enhancedHoldings.find((holding) => holding.symbol === "MSFT")?.currentPrice)
      .toBe(300);
    // The fresh AAPL quote refreshes the cache; MSFT carries its last-good price.
    const cache = JSON.parse(
      window.localStorage.getItem("portfolio_quotes_cache") ?? "null",
    ) as { quotes?: StockQuote[] } | null;
    expect(cache?.quotes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ symbol: "AAPL", price: 105 }),
        expect.objectContaining({ symbol: "MSFT", price: 300 }),
      ]),
    );
    // Every holding has a usable quote in the merged map, so the daily
    // snapshot is still recorded.
    expect(result.current.snapshots).toEqual([
      expect.objectContaining({ totalValue: 405, totalCost: 340, holdingCount: 2 }),
    ]);
  });

  it("batches portfolios larger than the 25-symbol route limit", async () => {
    const holdings = Array.from({ length: 26 }, (_, index) => ({
      symbol: `T${String(index).padStart(2, "0")}`,
      shares: 1,
      averageCost: 50,
    }));
    window.localStorage.setItem("portfolio_holdings", JSON.stringify(holdings));
    global.fetch = jest.fn().mockImplementation(async (input: string) => {
      const url = new URL(input, "http://localhost");
      const symbols = url.searchParams.get("symbols")?.split(",") ?? [];
      return {
        ok: true,
        status: 200,
        json: async () => ({
          allFailed: false,
          quotes: symbols.map((symbol) => validQuote(symbol, 75)),
        }),
      };
    });

    const { result } = renderHook(() => useInvestments());

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    const requestedBatchSizes = (global.fetch as jest.Mock).mock.calls
      .map(([input]: [string]) =>
        new URL(input, "http://localhost").searchParams.get("symbols")?.split(",").length ?? 0,
      )
      .sort((a, b) => a - b);
    expect(requestedBatchSizes).toEqual([1, 25]);
    await waitFor(() => expect(result.current.enhancedHoldings).toHaveLength(26));
    expect(result.current.error).toBeNull();
  });
});
