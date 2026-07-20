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
    asOf: new Date().toISOString(),
    source: "finnhub",
  };
}

function errorQuote(symbol: string, error: string): StockQuote {
  return { ...validQuote(symbol, 0), error };
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

interface StoredQuoteCache {
  version?: number;
  entries?: Array<{ fetchedAt: number; quote: StockQuote }>;
  quotes?: StockQuote[];
}

function readStoredQuoteCache(): StoredQuoteCache {
  return JSON.parse(
    window.localStorage.getItem("portfolio_quotes_cache") ?? "{}",
  ) as StoredQuoteCache;
}

function readStoredQuotes(): StockQuote[] {
  const cache = readStoredQuoteCache();
  return cache.entries?.map((entry) => entry.quote) ?? cache.quotes ?? [];
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
          asOf: new Date().toISOString(),
          source: "finnhub",
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
          asOf: new Date().toISOString(),
          source: "finnhub",
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

  it("uses a saved quote for value without carrying its old day move", () => {
    const holdings: PortfolioHolding[] = [
      { symbol: "AAPL", shares: 10, averageCost: 100 },
    ];
    const quotes = new Map<string, StockQuote>([
      ["AAPL", { ...validQuote("AAPL", 110), change: 10, changePercent: 10, isFallback: true }],
    ]);

    const [holding] = buildEnhanced(holdings, quotes, false);

    expect(holding.priceSource).toBe("saved");
    expect(holding.currentValue).toBe(1100);
    expect(holding.dayChange).toBe(0);
    expect(holding.dayChangePercent).toBe(0);
  });

  it("does not treat an old provider quote as current market data", () => {
    const holdings: PortfolioHolding[] = [
      { symbol: "AAPL", shares: 10, averageCost: 100 },
    ];
    const oldAsOf = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const quotes = new Map<string, StockQuote>([
      [
        "AAPL",
        {
          ...validQuote("AAPL", 110),
          source: "finnhub",
          asOf: oldAsOf,
        },
      ],
    ]);

    const [holding] = buildEnhanced(holdings, quotes, false);
    expect(holding.priceSource).toBe("saved");
    expect(holding.dayChange).toBe(0);
    expect(canPersistPortfolioSnapshot(holdings, quotes)).toBe(false);
  });

  it("does not treat a source-less quote as current even with a recent timestamp", () => {
    const holdings: PortfolioHolding[] = [
      { symbol: "AAPL", shares: 1, averageCost: 100 },
    ];
    const sourceLess = validQuote("AAPL", 110);
    delete sourceLess.source;
    const quotes = new Map([["AAPL", sourceLess]]);

    expect(buildEnhanced(holdings, quotes, false)[0].priceSource).toBe("saved");
    expect(canPersistPortfolioSnapshot(holdings, quotes)).toBe(false);
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

  it("does not persist a mixed-session portfolio valuation", () => {
    const holdings: PortfolioHolding[] = [
      { symbol: "AAPL", shares: 1, averageCost: 100 },
      { symbol: "MSFT", shares: 1, averageCost: 200 },
    ];
    const quotes = new Map<string, StockQuote>([
      ["AAPL", { ...validQuote("AAPL", 110), asOf: "2026-07-10T20:00:00.000Z" }],
      ["MSFT", { ...validQuote("MSFT", 210), asOf: "2026-07-11T20:00:00.000Z" }],
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
            asOf: new Date().toISOString(),
            source: "finnhub",
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
        "Market quotes are temporarily unavailable for MSFT. Portfolio totals are using your saved cost basis where needed."
      );
    });
    expect(readStoredQuotes()).toEqual([
      expect.objectContaining({ symbol: "AAPL", price: 175 }),
    ]);
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
    expect(readStoredQuotes()).toEqual([
      expect.objectContaining({ symbol: "AAPL", price: 175 }),
    ]);
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
          "Market quotes are temporarily unavailable for AAPL. Portfolio totals are using your saved cost basis where needed.",
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
        "Market quotes are temporarily unavailable for ZZZZ. Portfolio totals are using your saved cost basis where needed.",
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
    expect(readStoredQuotes()).toEqual([
      expect.objectContaining({ symbol: "AAPL", price: 110 }),
    ]);
    expect(readStoredQuotes().some((quote) => quote.error)).toBe(false);
  });

  it("paints cached quotes as saved values, then refreshes them in the background", async () => {
    const asOf = new Date(Date.now() - 60_000).toISOString();
    window.localStorage.setItem(
      "portfolio_holdings",
      JSON.stringify([{ symbol: "AAPL", shares: 2, averageCost: 90 }]),
    );
    window.localStorage.setItem(
      "portfolio_quotes_cache",
      JSON.stringify({
        timestamp: Date.now(),
        quotes: [{ ...validQuote("AAPL", 110), asOf }],
      }),
    );
    const response = createDeferred<{
      ok: boolean;
      status: number;
      json: () => Promise<unknown>;
    }>();
    global.fetch = jest.fn().mockReturnValue(response.promise);

    const { result } = renderHook(() => useInvestments());

    await waitFor(() => expect(result.current.enhancedHoldings).toHaveLength(1));
    expect(result.current.enhancedHoldings[0]).toMatchObject({
      currentPrice: 110,
      priceSource: "saved",
      dayChange: 0,
      dayChangePercent: 0,
    });
    expect(result.current.lastUpdated?.toISOString()).toBe(asOf);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    response.resolve({
      ok: true,
      status: 200,
      json: async () => ({ quotes: [validQuote("AAPL", 115)], allFailed: false }),
    });
    await waitFor(() =>
      expect(result.current.enhancedHoldings[0]).toMatchObject({
        currentPrice: 115,
        priceSource: "live",
      }),
    );
  });

  it("revalidates a visible long-lived tab once per cache window", async () => {
    window.localStorage.setItem(
      "portfolio_holdings",
      JSON.stringify([{ symbol: "AAPL", shares: 1, averageCost: 90 }]),
    );
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ quotes: [validQuote("AAPL", 110)], allFailed: false }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ quotes: [validQuote("AAPL", 115)], allFailed: false }),
      });

    const { result } = renderHook(() => useInvestments());
    await waitFor(() => expect(result.current.enhancedHoldings[0]?.currentPrice).toBe(110));

    const baseNow = Date.now();
    jest.spyOn(Date, "now").mockReturnValue(baseNow + 5 * 60 * 1000 + 1);
    act(() => window.dispatchEvent(new Event("focus")));

    await waitFor(() => expect(result.current.enhancedHoldings[0]?.currentPrice).toBe(115));
    expect(global.fetch).toHaveBeenCalledTimes(2);

    act(() => window.dispatchEvent(new Event("focus")));
    await act(async () => Promise.resolve());
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("describes a structured all-failed refresh as a saved-quote fallback", async () => {
    window.localStorage.setItem(
      "portfolio_holdings",
      JSON.stringify([{ symbol: "AAPL", shares: 1, averageCost: 90 }]),
    );
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ quotes: [validQuote("AAPL", 110)], allFailed: false }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({
          quotes: [errorQuote("AAPL", "Live price is temporarily unavailable.")],
          allFailed: true,
        }),
      });

    const { result } = renderHook(() => useInvestments());
    await waitFor(() => expect(result.current.enhancedHoldings[0]?.priceSource).toBe("live"));

    act(() => result.current.refetch());
    await waitFor(() => expect(result.current.enhancedHoldings[0]?.priceSource).toBe("saved"));
    expect(result.current.error).toBe(
      "Market quotes are temporarily unavailable for AAPL. Portfolio totals are showing the last saved quote for those holdings.",
    );
  });

  it("preserves a last-good price when a later response fails for that symbol", async () => {
    window.localStorage.setItem(
      "portfolio_holdings",
      JSON.stringify([
        { symbol: "AAPL", shares: 1, averageCost: 90 },
        { symbol: "MSFT", shares: 1, averageCost: 250 },
      ]),
    );
    const cachedAt = Date.now() - 1_000;
    const cachedPayload = {
      timestamp: cachedAt,
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
      expect(result.current.error).toContain("showing the last saved quote"),
    );
    expect(result.current.enhancedHoldings.find((holding) => holding.symbol === "AAPL")?.currentPrice)
      .toBe(105);
    expect(result.current.enhancedHoldings.find((holding) => holding.symbol === "MSFT")?.currentPrice)
      .toBe(300);
    expect(result.current.enhancedHoldings.find((holding) => holding.symbol === "MSFT")?.priceSource)
      .toBe("saved");
    // The prior usable MSFT quote remains cached under its original per-symbol
    // timestamp; AAPL's successful response advances only AAPL.
    const cache = readStoredQuoteCache();
    expect(cache.version).toBe(2);
    expect(readStoredQuotes()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ symbol: "AAPL", price: 105 }),
        expect.objectContaining({ symbol: "MSFT", price: 300 }),
      ]),
    );
    expect(
      cache.entries?.find((entry) => entry.quote.symbol === "MSFT")?.fetchedAt,
    ).toBe(cachedAt);
    // A cached fallback stays visible but cannot be written into today's
    // performance history as though it came from the current response.
    expect(result.current.snapshots).toEqual([]);
  });

  it("ignores an older overlapping response after the holdings set changes", async () => {
    window.localStorage.setItem(
      "portfolio_holdings",
      JSON.stringify([{ symbol: "AAPL", shares: 1, averageCost: 90 }]),
    );
    const first = createDeferred<{ ok: boolean; status: number; json: () => Promise<unknown> }>();
    const second = createDeferred<{ ok: boolean; status: number; json: () => Promise<unknown> }>();
    global.fetch = jest.fn().mockImplementation((input: string) => {
      const symbols = new URL(input, "http://localhost").searchParams.get("symbols");
      return symbols === "AAPL,MSFT" ? second.promise : first.promise;
    });

    const { result } = renderHook(() => useInvestments());
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.addHolding({ symbol: "MSFT", shares: 1, averageCost: 250 });
    });
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

    second.resolve({
      ok: true,
      status: 200,
      json: async () => ({
        allFailed: false,
        quotes: [validQuote("AAPL", 105), validQuote("MSFT", 305)],
      }),
    });
    await waitFor(() =>
      expect(result.current.enhancedHoldings.find((holding) => holding.symbol === "MSFT")?.currentPrice)
        .toBe(305),
    );

    first.resolve({
      ok: true,
      status: 200,
      json: async () => ({ allFailed: false, quotes: [validQuote("AAPL", 95)] }),
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.enhancedHoldings.find((holding) => holding.symbol === "AAPL")?.currentPrice)
      .toBe(105);
    expect(result.current.enhancedHoldings.find((holding) => holding.symbol === "MSFT")?.currentPrice)
      .toBe(305);
  });

  it("downgrades prior quotes to saved values after a thrown refresh failure", async () => {
    window.localStorage.setItem(
      "portfolio_holdings",
      JSON.stringify([{ symbol: "AAPL", shares: 2, averageCost: 90 }]),
    );
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ allFailed: false, quotes: [validQuote("AAPL", 110)] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: "Too many requests" }),
      });

    const { result } = renderHook(() => useInvestments());
    await waitFor(() => expect(result.current.enhancedHoldings[0]?.priceSource).toBe("live"));

    act(() => result.current.refetch());

    await waitFor(() => expect(result.current.error).toMatch(/HTTP 429/));
    expect(result.current.enhancedHoldings[0]).toMatchObject({
      currentPrice: 110,
      priceSource: "saved",
      dayChange: 0,
      dayChangePercent: 0,
    });
    expect(global.fetch).toHaveBeenCalledTimes(2);
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
