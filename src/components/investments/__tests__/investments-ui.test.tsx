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
import { __testUtils as stockDataTestUtils } from "@/hooks/useStockData";
import { clearClientInvestmentDataCachesForTests } from "@/lib/investmentsClientData";

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

function waitForDebounce() {
  return act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 250));
  });
}

function queryTabs(container: HTMLElement) {
  return Array.from(container.querySelectorAll('[role="tab"]')).map((tab) =>
    tab.textContent?.trim()
  );
}

const curatedIndex = {
  symbols: ["AAPL", "MSFT"],
  failed: [],
  lastUpdated: "2026-03-16T08:00:00.000Z",
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
    dcf: true,
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
    dcf: { fairValue: 220, currentPrice: 198, upside: 11.1, recommendation: "Hold" },
    industry: [{ metric: "P/E (TTM)", value: 28.4, industryAvg: 31.2 }],
    news: [{ title: "Apple expands services push", publisher: "Reuters" }],
    price: [
      { date: "2026-03-14", open: 192, high: 197, low: 191, close: 195, volume: 1000 },
      { date: "2026-03-15", open: 195, high: 199, low: 194, close: 198, volume: 1200 },
    ],
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
    clearClientInvestmentDataCachesForTests();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("shows the search control and empty state before a symbol is selected", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => curatedIndex,
    });

    await act(async () => {
      root.render(<StockResearch />);
    });
    await flushPromises();

    expect(
      container.querySelector('input[aria-label="Search stock symbol"]')
    ).not.toBeNull();
    expect(container.textContent).toContain("Start with a ticker symbol");
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

    await act(async () => {
      if (!input) return;
      const valueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      )?.set;
      valueSetter?.call(input, "SHOP");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await waitForDebounce();

    await act(async () => {
      input?.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13,
          bubbles: true,
        })
      );
    });

    expect(onChange).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Research is currently available for curated symbols only.");
  });

  it("loads a curated symbol from one static snapshot without showing live-mode UI", async () => {
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

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    await act(async () => {
      root.render(<StockResearch initialSymbol="AAPL" />);
    });
    await flushPromises();
    await flushPromises();

    expect(container.textContent).not.toContain("Live snapshot mode for");

    const tabs = queryTabs(container);
    expect(tabs).toEqual(
      expect.arrayContaining([
        "Overview",
        "Financials",
        "Growth",
        "Valuation",
        "Industry",
        "DCF",
        "Chart",
        "Compare",
      ])
    );
    expect(
      container.querySelector('input[aria-label="Search stock symbol"]')
    ).not.toBeNull();
    expect(container.textContent).toContain("Apple");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
