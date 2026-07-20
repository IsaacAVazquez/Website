import { act, renderHook, waitFor } from "@testing-library/react";
import { __testUtils, useLiveQuote } from "../useLiveQuote";

const originalFetch = global.fetch;

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function buildQuoteResponse(
  symbol: string,
  price: number,
  name: string,
  asOf = new Date().toISOString(),
) {
  return {
    ok: true,
    json: async () => ({
      quotes: [
        {
          symbol,
          price,
          change: 1.5,
          changePercent: 0.75,
          dayHigh: price + 1,
          dayLow: price - 1,
          open: price - 0.5,
          previousClose: price - 1.5,
          volume: 1000000,
          marketCap: 1000000000,
          name,
          asOf,
          source: "finnhub",
        },
      ],
      timestamp: "2026-03-30T08:00:00.000Z",
    }),
  };
}

// The quotes route answers 503 when every requested symbol failed, but the
// body still carries the structured per-symbol error placeholders.
function buildErrorQuoteResponse(symbol: string, error: string) {
  return {
    ok: false,
    status: 503,
    json: async () => ({
      quotes: [
        {
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
        },
      ],
      rateLimited: true,
      allFailed: true,
      timestamp: "2026-03-30T08:01:00.000Z",
    }),
  };
}

describe("useLiveQuote", () => {
  beforeEach(() => {
    __testUtils.clearQuoteCache();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("clears stale quotes during symbol switches and ignores late responses from superseded requests", async () => {
    const aaplResponse = createDeferred<ReturnType<typeof buildQuoteResponse>>();
    const msftResponse = createDeferred<ReturnType<typeof buildQuoteResponse>>();

    (global.fetch as jest.Mock).mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/investments/quotes?symbols=AAPL")) {
        return aaplResponse.promise;
      }

      if (url.includes("/api/investments/quotes?symbols=MSFT")) {
        return msftResponse.promise;
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    const { result, rerender } = renderHook(
      ({ symbol }) => useLiveQuote(symbol),
      {
        initialProps: {
          symbol: "AAPL" as string | null,
        },
      }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(true));

    rerender({ symbol: "MSFT" });

    await waitFor(() => expect(result.current.isLoading).toBe(true));
    expect(result.current.quote).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.lastUpdated).toBeNull();

    msftResponse.resolve(buildQuoteResponse("MSFT", 418.25, "Microsoft Corporation"));

    await waitFor(() => expect(result.current.quote?.symbol).toBe("MSFT"));
    expect(result.current.quote?.name).toBe("Microsoft Corporation");
    expect(result.current.isLoading).toBe(false);

    aaplResponse.resolve(buildQuoteResponse("AAPL", 203.1, "Apple Inc."));

    await waitFor(() => expect(result.current.quote?.symbol).toBe("MSFT"));
    expect(result.current.quote?.name).toBe("Microsoft Corporation");
    expect(result.current.error).toBeNull();
  });

  it("keeps the last good quote visible and surfaces the failure during a same-symbol refetch failure", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(buildQuoteResponse("AAPL", 203.1, "Apple Inc."))
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

    const { result } = renderHook(() => useLiveQuote("AAPL"));

    await waitFor(() => expect(result.current.quote?.symbol).toBe("AAPL"));
    expect(result.current.quote?.price).toBe(203.1);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.isLoading).toBe(true));
    expect(result.current.quote?.price).toBe(203.1);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.quote?.price).toBe(203.1);
    expect(result.current.quote?.isFallback).toBe(true);
    // The stale quote stays on screen, but the failed refresh is not silent.
    expect(result.current.error).toMatch(/temporarily unavailable/i);
  });

  it("does not cache an error-valued quote over the last good quote", async () => {
    const rateLimitMessage =
      "Live price is temporarily unavailable right now. Try again in a few minutes.";
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(buildQuoteResponse("AAPL", 203.1, "Apple Inc."))
      .mockResolvedValueOnce(buildErrorQuoteResponse("AAPL", rateLimitMessage))
      .mockResolvedValueOnce(buildQuoteResponse("AAPL", 204.25, "Apple Inc."));

    const { result } = renderHook(() => useLiveQuote("AAPL"));

    await waitFor(() => expect(result.current.quote?.price).toBe(203.1));

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.quote?.price).toBe(203.1);
    expect(result.current.quote?.error).toBeUndefined();
    // The per-quote message from the 503 body reaches the UI, not the
    // generic fallback.
    expect(result.current.error).toBe(rateLimitMessage);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.quote?.price).toBe(204.25));
    expect(result.current.error).toBeNull();
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it("revalidates on focus after the short cache window", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(buildQuoteResponse("AAPL", 203.1, "Apple Inc."))
      .mockResolvedValueOnce(buildQuoteResponse("AAPL", 204.25, "Apple Inc."));

    const { result } = renderHook(() => useLiveQuote("AAPL"));
    await waitFor(() => expect(result.current.quote?.price).toBe(203.1));

    const baseNow = Date.now();
    jest.spyOn(Date, "now").mockReturnValue(baseNow + 60_001);
    act(() => window.dispatchEvent(new Event("focus")));

    await waitFor(() => expect(result.current.quote?.price).toBe(204.25));
    expect(global.fetch).toHaveBeenCalledTimes(2);

    act(() => window.dispatchEvent(new Event("focus")));
    await act(async () => Promise.resolve());
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("marks a quote saved when its provider timestamp expires", async () => {
    const now = new Date("2026-07-12T20:00:00.000Z");
    jest.useFakeTimers();
    jest.setSystemTime(now);
    jest.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    (global.fetch as jest.Mock).mockResolvedValue(
      buildQuoteResponse("AAPL", 203.1, "Apple Inc.", now.toISOString()),
    );

    const { result } = renderHook(() => useLiveQuote("AAPL"));
    await waitFor(() => expect(result.current.quote?.price).toBe(203.1));
    expect(result.current.quote?.isFallback).not.toBe(true);

    act(() => {
      jest.advanceTimersByTime(4 * 24 * 60 * 60 * 1000 + 1);
    });

    expect(result.current.quote?.isFallback).toBe(true);
  });
});
