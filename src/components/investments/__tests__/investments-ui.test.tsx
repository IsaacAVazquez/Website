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

function queryTabs(container: HTMLElement) {
  return Array.from(container.querySelectorAll('[role="tab"]')).map((tab) =>
    tab.textContent?.trim()
  );
}

describe("investments UI", () => {
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

  it("submits valid unseeded symbols for on-demand research", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        symbols: ["AAPL", "MSFT"],
        failed: [],
        lastUpdated: "2026-03-16T08:00:00.000Z",
      }),
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

    expect(onChange).toHaveBeenCalledWith("SHOP");
  });

  it("hides seeded-only tabs for on-demand research mode", async () => {
    const onDemandCapabilities = {
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
      dcf: false,
      industry: false,
      transcripts: false,
      news: false,
      compare: false,
    };

    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/investments/index")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            symbols: ["AAPL", "MSFT"],
            failed: [],
            lastUpdated: "2026-03-16T08:00:00.000Z",
          }),
        });
      }

      if (url.includes("/api/investments/data/SHOP")) {
        const section = new URL(url, "http://localhost").searchParams.get("section");
        if (section === "info") {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              data: {
                shortName: "SHOP",
                longName: "Shopify",
                sector: "Technology",
                industry: "Software",
                country: "Canada",
              },
              source: "on-demand",
              capabilities: onDemandCapabilities,
              lastUpdated: "2026-03-16T08:05:00.000Z",
            }),
          });
        }

        if (section === "dcf" || section === "news") {
          return Promise.resolve({
            ok: false,
            json: async () => ({
              error: "Unavailable",
              source: "on-demand",
              capabilities: onDemandCapabilities,
              lastUpdated: "2026-03-16T08:05:00.000Z",
            }),
          });
        }

        if (section === "price") {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              data: [
                {
                  report_date: "2026-03-14",
                  date: "2026-03-14",
                  open: 102,
                  high: 108,
                  low: 101,
                  close: 106,
                  volume: 1000,
                },
                {
                  report_date: "2026-03-15",
                  date: "2026-03-15",
                  open: 106,
                  high: 110,
                  low: 104,
                  close: 108,
                  volume: 1200,
                },
              ],
              source: "on-demand",
              capabilities: onDemandCapabilities,
              lastUpdated: "2026-03-16T08:05:00.000Z",
            }),
          });
        }

        const data =
          section === "margins"
            ? [{ grossMargin: 52.1, netMargin: 11.4, fcfMargin: 14.2 }]
            : section === "growth"
              ? [{ metric: "Revenue YoY", yoyGrowth: 18.5 }]
              : section === "beta"
                ? { beta5y: 1.12 }
                : section === "wacc"
                  ? { wacc: 9.1 }
                  : section === "profitability"
                    ? { roe: 12.2, roic: 9.4 }
                    : section === "fundamentals"
                      ? {
                          ttmPe: 45.3,
                          psRatio: 12.4,
                          pbRatio: 6.2,
                          pegRatio: 1.8,
                          marketCap: 105000000000,
                        }
                      : { quarterly: [], annual: [] };

        return Promise.resolve({
          ok: true,
          json: async () => ({
            data,
            source: "on-demand",
            capabilities: onDemandCapabilities,
            lastUpdated: "2026-03-16T08:05:00.000Z",
          }),
        });
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    await act(async () => {
      root.render(<StockResearch initialSymbol="SHOP" />);
    });
    await flushPromises();
    await flushPromises();

    expect(container.textContent).toContain("Live snapshot mode for");

    const tabs = queryTabs(container);
    expect(tabs).toEqual(
      expect.arrayContaining(["Overview", "Financials", "Growth", "Valuation", "Chart"])
    );
    expect(tabs).not.toContain("Industry");
    expect(tabs).not.toContain("Transcripts");
    expect(tabs).not.toContain("DCF");
    expect(tabs).not.toContain("Compare");
  });
});
