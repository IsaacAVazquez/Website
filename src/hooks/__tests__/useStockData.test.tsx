import React from "react";
import { act } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { createRoot, type Root } from "react-dom/client";
import { __testUtils, useStockData } from "../useStockData";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

function flushPromises() {
  return act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
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

const curatedIndex = {
  symbols: ["AAPL", "MSFT", "V"],
  failed: [],
  lastUpdated: "2026-03-16T08:00:00.000Z",
};

describe("useStockData", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    mockFetch.mockReset();
    __testUtils.clearCaches();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("fetches one curated snapshot and serves multiple sections from local cache", async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/data/investments/index.json")) {
        return Promise.resolve({
          ok: true,
          json: async () => curatedIndex,
        });
      }

      if (url.includes("/data/investments/AAPL/snapshot.json")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            source: "prefetched",
            symbol: "AAPL",
            capabilities: {
              info: true,
              fundamentals: true,
              news: true,
              price: true,
              compare: true,
            },
            lastUpdated: "2026-03-16T08:00:00.000Z",
            sections: {
              info: { shortName: "Apple" },
              fundamentals: { ttmPe: 28.4 },
              price: [
                { date: "2026-03-14", open: 192, high: 197, low: 191, close: 195, volume: 1000 },
                { date: "2026-03-15", open: 195, high: 199, low: 194, close: 198, volume: 1200 },
              ],
            },
          }),
        });
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    let infoState:
      | ReturnType<typeof useStockData<{ shortName: string }>>
      | undefined;
    let fundamentalsState:
      | ReturnType<typeof useStockData<{ ttmPe: number }>>
      | undefined;

    function Probe() {
      const nextInfoState = useStockData<{ shortName: string }>("AAPL", "info");
      const nextFundamentalsState = useStockData<{ ttmPe: number }>("AAPL", "fundamentals");

      React.useEffect(() => {
        infoState = nextInfoState;
        fundamentalsState = nextFundamentalsState;
      }, [nextFundamentalsState, nextInfoState]);

      return null;
    }

    await act(async () => {
      root.render(<Probe />);
    });
    await flushPromises();

    expect(infoState?.source).toBe("prefetched");
    expect(infoState?.capabilities.compare).toBe(true);
    expect(infoState?.data?.shortName).toBe("Apple");
    expect(infoState?.freshness).toEqual({
      snapshotBuiltAt: "2026-03-16T08:00:00.000Z",
      sections: {
        price: "2026-03-15",
      },
    });
    expect(fundamentalsState?.data?.ttmPe).toBe(28.4);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("returns an empty state when no symbol is selected", async () => {
    let latestState:
      | ReturnType<typeof useStockData<{ shortName: string }>>
      | undefined;

    function Probe() {
      const nextState = useStockData<{ shortName: string }>(null, "info");

      React.useEffect(() => {
        latestState = nextState;
      }, [nextState]);

      return null;
    }

    await act(async () => {
      root.render(<Probe />);
    });

    expect(latestState?.data).toBeNull();
    expect(latestState?.source).toBeNull();
    expect(latestState?.isLoading).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("clears stale state during symbol switches and ignores late responses from superseded requests", async () => {
    const indexResponse = {
      ok: true,
      json: async () => curatedIndex,
    };
    const aaplResponse = createDeferred<{
      ok: boolean;
      json: () => Promise<{
        source: "prefetched";
        symbol: string;
        capabilities: { info: true };
        lastUpdated: string;
        sections: { info: { shortName: string } };
      }>;
    }>();
    const msftResponse = createDeferred<{
      ok: boolean;
      json: () => Promise<{
        source: "prefetched";
        symbol: string;
        capabilities: { info: true };
        lastUpdated: string;
        sections: { info: { shortName: string } };
      }>;
    }>();

    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/data/investments/index.json")) {
        return Promise.resolve(indexResponse);
      }

      if (url.includes("/data/investments/AAPL/snapshot.json")) {
        return aaplResponse.promise;
      }

      if (url.includes("/data/investments/MSFT/snapshot.json")) {
        return msftResponse.promise;
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    const { result, rerender } = renderHook(
      ({ symbol }) => useStockData<{ shortName: string }>(symbol, "info"),
      {
        initialProps: {
          symbol: "AAPL" as string | null,
        },
      }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(true));

    rerender({ symbol: "MSFT" });

    await waitFor(() => expect(result.current.isLoading).toBe(true));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.source).toBeNull();
    expect(result.current.capabilities).toEqual({});

    msftResponse.resolve({
      ok: true,
      json: async () => ({
        source: "prefetched",
        symbol: "MSFT",
        capabilities: { info: true },
        lastUpdated: "2026-03-16T08:00:00.000Z",
        sections: {
          info: { shortName: "Microsoft" },
        },
      }),
    });

    await waitFor(() => expect(result.current.data?.shortName).toBe("Microsoft"));
    expect(result.current.source).toBe("prefetched");

    aaplResponse.resolve({
      ok: true,
      json: async () => ({
        source: "prefetched",
        symbol: "AAPL",
        capabilities: { info: true },
        lastUpdated: "2026-03-16T08:00:00.000Z",
        sections: {
          info: { shortName: "Apple" },
        },
      }),
    });

    await flushPromises();

    expect(result.current.data?.shortName).toBe("Microsoft");
    expect(result.current.error).toBeNull();
  });

  it("classifies non-curated symbols as not fetched without requesting an unknown snapshot", async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/data/investments/index.json")) {
        return Promise.resolve({
          ok: true,
          json: async () => curatedIndex,
        });
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    const { result } = renderHook(() =>
      useStockData<{ shortName: string }>("SHOP", "info")
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.isNotFetched).toBe(true);
    expect(result.current.error).toMatch(/curated research universe/i);
    expect(
      (global.fetch as jest.Mock).mock.calls.some(([url]) =>
        String(url).includes("/data/investments/SHOP/snapshot.json")
      )
    ).toBe(false);
  });

  it("treats missing curated snapshot assets as temporary dataset errors", async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/data/investments/index.json")) {
        return Promise.resolve({
          ok: true,
          json: async () => curatedIndex,
        });
      }

      if (url.includes("/data/investments/AAPL/snapshot.json")) {
        return Promise.resolve({
          ok: false,
          status: 404,
        });
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    const { result } = renderHook(() =>
      useStockData<{ shortName: string }>("AAPL", "info")
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.isNotFetched).toBe(false);
    expect(result.current.error).toMatch(/temporarily unavailable/i);
    expect(result.current.source).toBe("prefetched");
  });

  it("keeps the last good section data visible during a same-symbol refetch failure", async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/data/investments/index.json")) {
        return Promise.resolve({
          ok: true,
          json: async () => curatedIndex,
        });
      }

      if (url.includes("/data/investments/AAPL/snapshot.json")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            source: "prefetched",
            symbol: "AAPL",
            capabilities: {
              info: true,
            },
            lastUpdated: "2026-03-16T08:00:00.000Z",
            sections: {
              info: { shortName: "Apple" },
            },
          }),
        });
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    const { result } = renderHook(() =>
      useStockData<{ shortName: string }>("AAPL", "info")
    );

    await waitFor(() => expect(result.current.data?.shortName).toBe("Apple"));

    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/data/investments/index.json")) {
        return Promise.resolve({
          ok: true,
          json: async () => curatedIndex,
        });
      }

      if (url.includes("/data/investments/AAPL/snapshot.json")) {
        return Promise.resolve({
          ok: false,
          status: 503,
        });
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    act(() => {
      result.current.refetch();
    });

    expect(result.current.data?.shortName).toBe("Apple");
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.shortName).toBe("Apple");
    expect(result.current.error).toBeNull();
  });

  it("preserves freshness details when a curated snapshot is missing the requested section", async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/data/investments/index.json")) {
        return Promise.resolve({
          ok: true,
          json: async () => curatedIndex,
        });
      }

      if (url.includes("/data/investments/AAPL/snapshot.json")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            source: "prefetched",
            symbol: "AAPL",
            capabilities: {
              info: true,
              compare: true,
            },
            lastUpdated: "2026-03-16T08:00:00.000Z",
            freshness: {
              snapshotBuiltAt: "2026-03-16T08:00:00.000Z",
              sections: {
                price: "2026-03-15",
              },
            },
            sections: {
              info: { shortName: "Apple" },
            },
          }),
        });
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    const { result } = renderHook(() =>
      useStockData<{ headline: string }>("AAPL", "news")
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.isNotFetched).toBe(true);
    expect(result.current.error).toMatch(/section "news" not available/i);
    expect(result.current.freshness).toEqual({
      snapshotBuiltAt: "2026-03-16T08:00:00.000Z",
      sections: {
        price: "2026-03-15",
      },
    });
  });
});
