import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

jest.mock("../GrowthPanel", () => ({
  GrowthPanel: () => null,
}));

jest.mock("../PriceChartPanel", () => ({
  PriceChartPanel: () => null,
}));

jest.mock("../ComparisonTab", () => ({
  ComparisonTab: () => null,
}));

import { StockSearch } from "../StockSearch";
import { StockResearch } from "../StockResearch";
import { AddStockForm } from "../AddStockForm";
import { __testUtils as liveQuoteTestUtils } from "@/hooks/useLiveQuote";
import { __testUtils as stockDataTestUtils } from "@/hooks/useStockData";
import { clearClientInvestmentDataCachesForTests } from "@/lib/investmentsClientData";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

function flushPromises() {
  return act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

// Fake-timer fast-forward past StockSearch's 200ms input debounce. Callers
// must enable jest.useFakeTimers() before typing so the debounce timer is
// registered against the fake clock.
function waitForDebounce() {
  return act(async () => {
    jest.advanceTimersByTime(250);
    await Promise.resolve();
  });
}

function setInputValue(input: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  valueSetter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function pressKey(input: HTMLInputElement, key: string) {
  input.dispatchEvent(
    new KeyboardEvent("keydown", {
      key,
      code: key,
      bubbles: true,
    })
  );
}

function queryTabs(container: HTMLElement) {
  return Array.from(container.querySelectorAll('[role="tab"]')).map((tab) =>
    tab.textContent?.trim()
  );
}

const curatedIndex = {
  symbols: ["AAPL", "MSFT", "V"],
  failed: [],
  lastUpdated: "2026-03-16T08:00:00.000Z",
  entries: [
    {
      symbol: "AAPL",
      shortName: "Apple",
      longName: "Apple Inc.",
      searchText: "aapl apple apple inc",
    },
    {
      symbol: "MSFT",
      shortName: "Microsoft",
      longName: "Microsoft Corporation",
      searchText: "msft microsoft microsoft corporation",
    },
    {
      symbol: "V",
      shortName: "Visa",
      longName: "Visa Inc.",
      searchText: "v visa visa inc visa inc class a",
    },
  ],
};

const appleSnapshot = {
  symbol: "AAPL",
  source: "prefetched",
  lastUpdated: "2026-03-16T08:00:00.000Z",
  capabilities: {
    info: true,
    fundamentals: true,
    profitability: true,
    margins: true,
    growth: true,
    income_statement: true,
    balance_sheet: true,
    cash_flow: true,
    price: true,
    beta: true,
    wacc: true,
    industry: true,
    news: true,
    compare: true,
  },
  sections: {
    info: {
      shortName: "Apple",
      longName: "Apple Inc.",
      sector: "Technology",
      industry: "Consumer Electronics",
      country: "United States",
    },
    fundamentals: {
      ttmPe: 28.4,
      psRatio: 7.9,
      pbRatio: 41.2,
      pegRatio: 2.1,
      marketCap: 2900000000000,
    },
    profitability: { roe: 33.2, roic: 28.4, roa: 19.1 },
    margins: [{ grossMargin: 46.1, netMargin: 24.4, fcfMargin: 25.7 }],
    growth: [{ metric: "Revenue YoY", yoyGrowth: 8.5 }],
    income_statement: { quarterly: [], annual: [] },
    balance_sheet: { quarterly: [], annual: [] },
    cash_flow: { quarterly: [], annual: [] },
    beta: { beta5y: 1.12 },
    wacc: { wacc: 8.4 },
    industry: [{ metric: "P/E (TTM)", value: 28.4, industryAvg: 31.2 }],
    news: [{ title: "Apple expands services push", publisher: "Reuters" }],
    price: [
      { date: "2026-03-14", open: 192, high: 197, low: 191, close: 195, volume: 1000 },
      { date: "2026-03-15", open: 195, high: 199, low: 194, close: 198, volume: 1200 },
    ],
  },
};

const visaSnapshot = {
  symbol: "V",
  source: "prefetched",
  lastUpdated: "2026-03-16T08:00:00.000Z",
  capabilities: appleSnapshot.capabilities,
  sections: {
    ...appleSnapshot.sections,
    info: {
      shortName: "Visa",
      longName: "Visa Inc.",
      sector: "Financial Services",
      industry: "Credit Services",
      country: "United States",
      longBusinessSummary: "Visa operates a global payments network.",
    },
    fundamentals: {
      ttmPe: 31.2,
      psRatio: 15.2,
      pbRatio: 14.9,
      pegRatio: 2.4,
      marketCap: 620000000000,
    },
    beta: { beta5y: 0.95 },
    price: [
      { date: "2026-02-26", open: 334, high: 339, low: 333, close: 338.2, volume: 900 },
      { date: "2026-02-27", open: 338.2, high: 341.4, low: 337.5, close: 340.12, volume: 925 },
    ],
  },
};

const appleSnapshotWithoutPrice = {
  ...appleSnapshot,
  capabilities: {
    ...appleSnapshot.capabilities,
    price: false,
  },
  sections: {
    ...appleSnapshot.sections,
    price: undefined,
  },
};

describe("investments UI", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    mockFetch.mockReset();
    stockDataTestUtils.clearCaches();
    liveQuoteTestUtils.clearQuoteCache();
    clearClientInvestmentDataCachesForTests();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    jest.useRealTimers();
  });

  it("shows the search control and empty state before a symbol is selected", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => curatedIndex,
    });

    await act(async () => {
      root.render(
        <StockResearch
          symbol=""
          activeTab="overview"
          onSymbolChange={() => {}}
          onTabChange={() => {}}
        />
      );
    });
    await flushPromises();

    expect(
      container.querySelector('input[aria-label="Search stock symbol"]')
    ).not.toBeNull();
    expect(container.textContent).toContain("Start with a ticker symbol");
  });

  it("matches company names and supports keyboard selection for curated symbols", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => curatedIndex,
    });

    const onChange = jest.fn();

    await act(async () => {
      root.render(<StockSearch value="" onChange={onChange} />);
    });
    await flushPromises();

    const input = container.querySelector(
      'input[aria-label="Search stock symbol"]'
    ) as HTMLInputElement | null;

    expect(input).not.toBeNull();

    jest.useFakeTimers();
    await act(async () => {
      if (!input) return;
      setInputValue(input, "visa");
    });
    await waitForDebounce();

    expect(document.body.textContent).toContain("Visa Inc.");

    await act(async () => {
      if (!input) return;
      pressKey(input, "ArrowDown");
      pressKey(input, "Enter");
    });

    expect(onChange).toHaveBeenCalledWith("V");
  });

  it("blocks non-curated symbols from entering research", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => curatedIndex,
    });

    const onChange = jest.fn();

    await act(async () => {
      root.render(<StockSearch value="" onChange={onChange} />);
    });
    await flushPromises();

    const input = container.querySelector(
      'input[aria-label="Search stock symbol"]'
    ) as HTMLInputElement | null;

    expect(input).not.toBeNull();

    jest.useFakeTimers();
    await act(async () => {
      if (!input) return;
      setInputValue(input, "SHOP");
    });
    await waitForDebounce();

    await act(async () => {
      if (!input) return;
      pressKey(input, "Enter");
    });

    expect(onChange).not.toHaveBeenCalled();
    expect(container.textContent).toContain("This workspace currently supports the curated research set only.");
  });

  it("blocks adding holdings that cannot receive market quotes", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => curatedIndex,
    });

    const onAdd = jest.fn();

    await act(async () => {
      root.render(<AddStockForm onAdd={onAdd} />);
    });
    await flushPromises();

    await act(async () => {
      const button = Array.from(container.querySelectorAll("button")).find((item) =>
        item.textContent?.includes("Add Holding")
      ) as HTMLButtonElement | undefined;
      button?.click();
    });
    await flushPromises();

    const symbolInput = container.querySelector("#add-symbol") as HTMLInputElement | null;
    const sharesInput = container.querySelector("#add-shares") as HTMLInputElement | null;
    const costInput = container.querySelector("#add-cost") as HTMLInputElement | null;

    await act(async () => {
      if (!symbolInput || !sharesInput || !costInput) return;
      setInputValue(symbolInput, "SHOP");
      setInputValue(sharesInput, "3");
      setInputValue(costInput, "80");
    });

    await act(async () => {
      const button = Array.from(container.querySelectorAll("button")).find((item) =>
        item.textContent?.includes("Add Position")
      ) as HTMLButtonElement | undefined;
      button?.click();
    });

    expect(onAdd).not.toHaveBeenCalled();
    expect(container.textContent).toContain(
      "SHOP is not in the curated research set, so market quotes are unavailable for that holding."
    );
  });

  it("uses market quotes for current price while labeling stale historical data", async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/data/investments/index.json")) {
        return Promise.resolve({
          ok: true,
          json: async () => curatedIndex,
        });
      }

      if (url.includes("/data/investments/V/snapshot.json")) {
        return Promise.resolve({
          ok: true,
          json: async () => visaSnapshot,
        });
      }

      if (url.includes("/api/investments/quotes?symbols=V")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            quotes: [
              {
                symbol: "V",
                price: 352.45,
                change: 3.1,
                changePercent: 0.89,
                dayHigh: 353,
                dayLow: 348.2,
                open: 349.7,
                previousClose: 349.35,
                volume: 2500000,
                marketCap: 0,
                name: "Visa Inc.",
                asOf: new Date().toISOString(),
                source: "finnhub",
              },
            ],
            timestamp: "2026-03-16T15:30:00.000Z",
          }),
        });
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    await act(async () => {
      root.render(
        <StockResearch
          symbol="V"
          activeTab="overview"
          onSymbolChange={() => {}}
          onTabChange={() => {}}
        />
      );
    });
    await flushPromises();
    await flushPromises();

    expect(container.textContent).toContain("Visa Inc.");
    expect(container.textContent).toContain("$352.45");
    expect(container.textContent).toContain("Latest market quote");

    const tabs = queryTabs(container);
    expect(tabs).toEqual(
      expect.arrayContaining([
        "Overview",
        "Growth",
        "Valuation",
        "Industry",
        "Chart",
        "Compare",
      ])
    );
  });

  it("falls back to the saved close and price-as-of copy when market quotes are unavailable", async () => {
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
          json: async () => appleSnapshot,
        });
      }

      if (url.includes("/api/investments/quotes?symbols=AAPL")) {
        return Promise.resolve({
          ok: false,
          status: 503,
        });
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    await act(async () => {
      root.render(
        <StockResearch
          symbol="AAPL"
          activeTab="overview"
          onSymbolChange={() => {}}
          onTabChange={() => {}}
        />
      );
    });
    await flushPromises();
    await flushPromises();

    expect(container.textContent).toContain("Apple Inc.");
    expect(container.textContent).toContain("$198.00");
    expect(container.textContent).toContain("Price as of Mar 15, 2026");
    expect(container.textContent).toContain("Showing the latest saved close from Mar 15, 2026.");
    expect(container.textContent).toContain("Market quote is temporarily unavailable.");
  });

  it("shows a no-price state when neither market quotes nor historical prices are available", async () => {
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
          json: async () => appleSnapshotWithoutPrice,
        });
      }

      if (url.includes("/api/investments/quotes?symbols=AAPL")) {
        return Promise.resolve({
          ok: false,
          status: 503,
        });
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    await act(async () => {
      root.render(
        <StockResearch
          symbol="AAPL"
          activeTab="overview"
          onSymbolChange={() => {}}
          onTabChange={() => {}}
        />
      );
    });
    await flushPromises();
    await flushPromises();

    expect(container.textContent).toContain("Apple Inc.");
    expect(container.textContent).toContain("Unavailable");
    expect(container.textContent).toContain("No price data");
    expect(container.textContent).toContain("Market quote is temporarily unavailable.");
    expect(container.textContent).not.toContain("Price as of Mar 16, 2026");
  });
});
