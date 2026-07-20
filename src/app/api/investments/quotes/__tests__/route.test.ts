/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

jest.mock("@/lib/finnhub", () => {
  const actual = jest.requireActual("@/lib/finnhub");
  return {
    ...actual,
    fetchFinnhubQuote: jest.fn(),
    getAllowedSymbols: jest.fn(),
  };
});

import { GET } from "../route";
import { fetchQuotesWithConcurrency } from "@/lib/investmentsQuoteBatch";
import {
  fetchFinnhubQuote,
  FinnhubAllowlistUnavailableError,
  getAllowedSymbols,
} from "@/lib/finnhub";
import { investmentsQuoteRateLimiter } from "@/lib/rateLimit";

const mockFetchFinnhubQuote = fetchFinnhubQuote as jest.MockedFunction<typeof fetchFinnhubQuote>;
const mockGetAllowedSymbols = getAllowedSymbols as jest.MockedFunction<
  typeof getAllowedSymbols
>;

const errorQuote = (symbol: string, error: string) => ({
  symbol,
  price: 0,
  change: 0,
  changePercent: 0,
  dayHigh: 0,
  dayLow: 0,
  open: 0,
  previousClose: 0,
  volume: 0,
  marketCap: 0,
  name: symbol,
  error,
});

describe("GET /api/investments/quotes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    investmentsQuoteRateLimiter.reset();
    mockGetAllowedSymbols.mockResolvedValue(new Set(["AAPL", "MSFT"]));
  });

  it("returns friendly placeholder errors when live quote fetches fail", async () => {
    mockFetchFinnhubQuote.mockResolvedValueOnce(
      errorQuote("AAPL", "Live price is temporarily unavailable. Showing the latest saved data instead.")
    );

    const response = await GET(
      new NextRequest("https://isaacavazquez.com/api/investments/quotes?symbols=AAPL")
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body.allFailed).toBe(true);
    expect(body.rateLimited).toBe(false);
    expect(body.quotes[0].symbol).toBe("AAPL");
    expect(body.quotes[0].error).toMatch(/temporarily unavailable/i);
  });

  it("surfaces rate-limited responses without failing the route", async () => {
    mockFetchFinnhubQuote.mockResolvedValueOnce(
      errorQuote("AAPL", "Live price is temporarily unavailable right now. Try again in a few minutes.")
    );

    const response = await GET(
      new NextRequest("https://isaacavazquez.com/api/investments/quotes?symbols=AAPL")
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body.allFailed).toBe(true);
    expect(body.rateLimited).toBe(true);
    expect(body.quotes[0].error).toMatch(/few minutes/i);
  });

  it("returns partial success when one symbol fails and another succeeds", async () => {
    mockFetchFinnhubQuote
      .mockResolvedValueOnce({
        symbol: "AAPL",
        price: 203.1,
        change: 2.1,
        changePercent: 1.05,
        dayHigh: 204,
        dayLow: 200.5,
        open: 201.5,
        previousClose: 201,
        volume: 0,
        marketCap: 0,
        name: "AAPL",
      })
      .mockResolvedValueOnce(
        errorQuote("MSFT", "Live price is temporarily unavailable. Showing the latest saved data instead.")
      );

    const response = await GET(
      new NextRequest("https://isaacavazquez.com/api/investments/quotes?symbols=AAPL,MSFT")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body.allFailed).toBe(false);
    expect(body.rateLimited).toBe(false);
    expect(body.quotes).toHaveLength(2);
    expect(body.quotes[0].symbol).toBe("AAPL");
    expect(body.quotes[0].error).toBeUndefined();
    expect(body.quotes[1].symbol).toBe("MSFT");
    expect(body.quotes[1].error).toMatch(/temporarily unavailable/i);
  });

  it("varies fully successful cached responses by query", async () => {
    mockFetchFinnhubQuote.mockResolvedValueOnce({
      symbol: "AAPL",
      price: 203.1,
      change: 2.1,
      changePercent: 1.05,
      dayHigh: 204,
      dayLow: 200.5,
      open: 201.5,
      previousClose: 201,
      volume: 0,
      marketCap: 0,
      name: "AAPL",
    });

    const response = await GET(
      new NextRequest("https://isaacavazquez.com/api/investments/quotes?symbols=AAPL")
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Netlify-Vary")).toBe("query");
    expect(response.headers.get("Cache-Control")).toContain("max-age=30");
  });

  it.each(["", "AAPL,,MSFT", "BAD SYMBOL"])(
    "rejects malformed symbol queries without caching them",
    async (symbols) => {
      const response = await GET(
        new NextRequest(
          `https://isaacavazquez.com/api/investments/quotes?symbols=${encodeURIComponent(symbols)}`
        )
      );

      expect(response.status).toBe(400);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(mockFetchFinnhubQuote).not.toHaveBeenCalled();
    }
  );

  it("rejects non-curated symbols without caching the response", async () => {
    const response = await GET(
      new NextRequest("https://isaacavazquez.com/api/investments/quotes?symbols=ZZZZZ")
    );

    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mockFetchFinnhubQuote).not.toHaveBeenCalled();
  });

  it("keeps valid quotes usable when a mixed request includes a non-curated symbol", async () => {
    mockFetchFinnhubQuote.mockResolvedValueOnce({
      symbol: "AAPL",
      price: 203.1,
      change: 2.1,
      changePercent: 1.05,
      dayHigh: 204,
      dayLow: 200.5,
      open: 201.5,
      previousClose: 201,
      volume: 0,
      marketCap: 0,
      name: "AAPL",
    });

    const response = await GET(
      new NextRequest(
        "https://isaacavazquez.com/api/investments/quotes?symbols=AAPL,ZZZZZ"
      )
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body.quotes).toEqual([
      expect.objectContaining({ symbol: "AAPL", price: 203.1 }),
      expect.objectContaining({
        symbol: "ZZZZZ",
        error: expect.stringMatching(/not eligible/i),
      }),
    ]);
  });

  it("returns 503 when the curated allowlist cannot be resolved", async () => {
    mockGetAllowedSymbols.mockRejectedValueOnce(
      new FinnhubAllowlistUnavailableError()
    );

    const response = await GET(
      new NextRequest("https://isaacavazquez.com/api/investments/quotes?symbols=AAPL")
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body.error).toMatch(/temporarily unavailable/i);
    expect(mockFetchFinnhubQuote).not.toHaveBeenCalled();
  });

  it("returns deadline placeholders instead of serially waiting through every provider wave", async () => {
    const symbols = Array.from({ length: 10 }, (_, index) => `T${index}`);
    mockFetchFinnhubQuote.mockImplementation(
      () => new Promise(() => undefined),
    );

    const quotes = await fetchQuotesWithConcurrency(symbols, 5);

    expect(quotes).toHaveLength(10);
    expect(quotes).toEqual(
      expect.arrayContaining(
        symbols.map((symbol) =>
          expect.objectContaining({
            symbol,
            error: expect.stringMatching(/time limit/i),
          })
        )
      )
    );
    expect(mockFetchFinnhubQuote).toHaveBeenCalledTimes(5);
    for (const [, options] of mockFetchFinnhubQuote.mock.calls) {
      expect(options?.timeoutMs).toBeGreaterThan(0);
      expect(options?.timeoutMs).toBeLessThanOrEqual(5);
    }
  });
});
