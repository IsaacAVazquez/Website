import { renderHook, waitFor } from "@testing-library/react";
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

function buildQuoteResponse(symbol: string, price: number, name: string) {
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
        },
      ],
      timestamp: "2026-03-30T08:00:00.000Z",
    }),
  };
}

describe("useLiveQuote", () => {
  beforeEach(() => {
    __testUtils.clearQuoteCache();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
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
});
