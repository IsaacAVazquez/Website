import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useStockData } from "../useStockData";

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
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("surfaces source and capabilities for prefetched and on-demand symbols", async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/investments/data/AAPL")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: { shortName: "Apple" },
            source: "prefetched",
            capabilities: { info: true, news: true, compare: true },
            lastUpdated: "2026-03-16T08:00:00.000Z",
          }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({
          data: { shortName: "Shopify" },
          source: "on-demand",
          capabilities: { info: true, news: false, compare: false },
          lastUpdated: "2026-03-16T08:05:00.000Z",
        }),
      });
    });

    let latestState:
      | ReturnType<typeof useStockData<{ shortName: string }>>
      | undefined;

    function Probe({ symbol }: { symbol: string | null }) {
      latestState = useStockData<{ shortName: string }>(symbol, "info");
      return null;
    }

    await act(async () => {
      root.render(<Probe symbol="AAPL" />);
    });
    await flushPromises();

    expect(latestState?.source).toBe("prefetched");
    expect(latestState?.capabilities.compare).toBe(true);
    expect(latestState?.data?.shortName).toBe("Apple");

    await act(async () => {
      root.render(<Probe symbol="SHOP" />);
    });
    await flushPromises();

    expect(latestState?.source).toBe("on-demand");
    expect(latestState?.capabilities.compare).toBe(false);
    expect(latestState?.capabilities.news).toBe(false);
    expect(latestState?.data?.shortName).toBe("Shopify");
  });

  it("returns an empty state when no symbol is selected", async () => {
    let latestState:
      | ReturnType<typeof useStockData<{ shortName: string }>>
      | undefined;

    function Probe() {
      latestState = useStockData<{ shortName: string }>(null, "info");
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
