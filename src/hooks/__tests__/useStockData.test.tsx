import React from "react";
import { act } from "react";
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
    expect(fundamentalsState?.data?.ttmPe).toBe(28.4);
    expect(mockFetch).toHaveBeenCalledTimes(1);
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
});
