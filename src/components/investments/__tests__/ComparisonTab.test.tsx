import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { ComparisonTab } from "../ComparisonTab";

type HookState = {
  data: unknown;
  isLoading: boolean;
  error: string | null;
  isNotFetched: boolean;
  lastUpdated: string | null;
  refetch: jest.Mock;
};

const store: Record<string, Partial<HookState>> = {};
const refetch = jest.fn();

jest.mock("@/hooks/useStockData", () => ({
  useStockData: (symbol: string | null, section: string) => ({
    data: null,
    isLoading: false,
    error: null,
    isNotFetched: false,
    lastUpdated: null,
    refetch,
    ...store[`${symbol}:${section}`],
  }),
}));

const mockGetIndex = jest.fn();
jest.mock("@/lib/investmentsClientData", () => ({
  getClientInvestmentsIndex: () => mockGetIndex(),
}));

function seed(symbol: string, sections: Record<string, Partial<HookState>>) {
  for (const [section, state] of Object.entries(sections)) store[`${symbol}:${section}`] = state;
}

const apple = {
  fundamentals: {
    data: { ttmPe: 12, psRatio: 1.5, pbRatio: 3, pegRatio: 1.1 },
    lastUpdated: "2026-07-21T03:00:00.000Z",
  },
  growth: {
    data: [
      { metric: "Total Revenue", yoyGrowth: 25 },
      { metric: "Net Income", yoyGrowth: 15 },
      { metric: "Diluted EPS", value: 18.5 },
    ],
  },
  profitability: { data: { roe: 35, roa: 12, roic: 28.456 } },
  margins: { data: [{ grossMargin: 40, netMargin: 10 }, { grossMargin: 46.1, netMargin: 24.4 }] },
  beta: { data: { beta5y: 1.1 } },
};

const microsoft = {
  fundamentals: { data: { ttmPe: 35, psRatio: 12, pbRatio: 10, pegRatio: 2.4 } },
  growth: { data: [{ metric: "Total Revenue", yoyGrowth: 15 }, { metric: "Operating Income", yoyGrowth: -2 }] },
  profitability: { data: { roe: 30, roa: 15, roic: 25 } },
  margins: { data: [{ grossMargin: 69, netMargin: 36 }] },
  beta: { data: { beta5y: 0.9 } },
};

async function renderTab() {
  const utils = render(<ComparisonTab />);
  // Let the index promise settle so the symbol list update lands inside act.
  await act(async () => {
    await Promise.resolve();
  });
  return utils;
}

function tableRow(title: string, label: string) {
  const table = screen.getByRole("table", { name: `${title} comparison` });
  const row = within(table)
    .getAllByRole("row")
    .find((r) => r.firstElementChild?.textContent === label);
  if (!row) throw new Error(`No ${label} row in ${title}`);
  return Array.from(row.children).map((c) => c.textContent);
}

beforeEach(() => {
  for (const key of Object.keys(store)) delete store[key];
  refetch.mockReset();
  mockGetIndex.mockReset();
  mockGetIndex.mockResolvedValue({ symbols: ["AAPL", "MSFT", "V"], failed: [], entries: [], lastUpdated: "" });
});

describe("ComparisonTab", () => {
  it("offers the curated symbols from the index, defaulting to AAPL vs MSFT", async () => {
    await renderTab();
    const a = screen.getByRole("combobox", { name: "Select first stock to compare" }) as HTMLSelectElement;
    const b = screen.getByRole("combobox", { name: "Select second stock to compare" }) as HTMLSelectElement;
    expect(a.value).toBe("AAPL");
    expect(b.value).toBe("MSFT");
    expect(Array.from(a.options).map((o) => o.value)).toEqual(["AAPL", "MSFT", "V"]);
  });

  it("keeps the fallback list when the index fails to load", async () => {
    mockGetIndex.mockRejectedValue(new Error("offline"));
    await renderTab();
    const a = screen.getByRole("combobox", { name: "Select first stock to compare" }) as HTMLSelectElement;
    expect(a.options.length).toBeGreaterThan(30);
    expect(Array.from(a.options).map((o) => o.value)).toContain("BRK-B");
  });

  it("fills the metric tables with formatted values and marks the better side", async () => {
    seed("AAPL", apple);
    seed("MSFT", microsoft);
    await renderTab();

    expect(tableRow("Valuation", "P/E (TTM)")).toEqual(["P/E (TTM)", "12.00(better)", "35.00"]);
    expect(tableRow("Valuation", "PEG ratio")).toEqual(["PEG ratio", "1.10(better)", "2.40"]);

    expect(tableRow("Growth (YoY)", "Revenue YoY")).toEqual(["Revenue YoY", "25.00%(better)", "15.00%"]);
    expect(tableRow("Growth (YoY)", "Operating income YoY")).toEqual(["Operating income YoY", "—", "-2.00%"]);
    expect(tableRow("Growth (YoY)", "EPS YoY")).toEqual(["EPS YoY", "18.50%", "—"]);
    expect(tableRow("Growth (YoY)", "FCF YoY")).toEqual(["FCF YoY", "—", "—"]);

    // Latest margins row wins.
    expect(tableRow("Profitability", "Gross margin")).toEqual(["Gross margin", "46.10%", "69.00%(better)"]);
    expect(tableRow("Profitability", "ROIC")).toEqual(["ROIC", "28.46%(better)", "25.00%"]);
  });

  it("dates each side with its snapshot in the display zone", async () => {
    seed("AAPL", apple);
    seed("MSFT", microsoft);
    await renderTab();
    // 03:00 UTC on Jul 21 is still Jul 20 in Los Angeles.
    expect(screen.getByText("Snapshot as of Jul 20, 2026")).toBeInTheDocument();
    expect(screen.getAllByText(/Snapshot as of/)).toHaveLength(1);
  });

  it("scores the radar from absolute benchmarks", async () => {
    seed("AAPL", apple);
    seed("MSFT", microsoft);
    const { container } = await renderTab();

    const svg = container.querySelector("svg[aria-label]") as SVGSVGElement;
    expect(svg).toHaveAttribute("aria-label", "Radar comparison chart: AAPL vs MSFT");
    expect(Array.from(svg.querySelectorAll("text")).map((t) => t.textContent)).toEqual([
      "Valuation",
      "Growth",
      "Profitability",
      "Safety",
    ]);
    const points = Array.from(svg.querySelectorAll("circle[cx]")).map((c) => ({
      x: Number(c.getAttribute("cx")),
      y: Number(c.getAttribute("cy")),
    }));
    // AAPL valuation: P/E 12 → 82, P/S 1.5 → 80, P/B 3 → 65, mean 75.67, on the upward axis.
    expect(points[0].y).toBeCloseTo(-(82 + 80 + 65) / 3);
    // AAPL growth: mean of 25, 15, 18.5 is 19.5 → 67, on the rightward axis.
    expect(points[1].x).toBeCloseTo(67);
    // MSFT safety: beta 0.9 → 60, on the leftward axis.
    expect(points[7].x).toBeCloseTo(-60);
  });

  it("drops a radar axis that either side cannot score", async () => {
    seed("AAPL", { ...apple, beta: { data: null } });
    seed("MSFT", microsoft);
    const { container } = await renderTab();
    const labels = Array.from(container.querySelectorAll("svg text")).map((t) => t.textContent);
    expect(labels).toEqual(["Valuation", "Growth", "Profitability"]);
  });

  it("says when too few axes are shared to draw a radar", async () => {
    seed("AAPL", { fundamentals: apple.fundamentals });
    seed("MSFT", microsoft);
    await renderTab();
    expect(screen.getByText(/not enough shared, verified metrics/)).toBeInTheDocument();
  });

  it("requests the newly chosen symbol", async () => {
    seed("AAPL", apple);
    seed("MSFT", microsoft);
    seed("V", { fundamentals: { data: { ttmPe: 31.2, psRatio: 15.2, pbRatio: 14.9, pegRatio: 2.4 } } });
    await renderTab();

    fireEvent.change(screen.getByRole("combobox", { name: "Select second stock to compare" }), {
      target: { value: "V" },
    });
    const table = screen.getByRole("table", { name: "Valuation comparison" });
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Metric", "AAPL", "V"]);
    expect(tableRow("Valuation", "P/E (TTM)")).toEqual(["P/E (TTM)", "12.00(better)", "31.20"]);
  });

  function radarPoints(container: HTMLElement) {
    return Array.from(container.querySelectorAll("svg circle[cx]")).map((c) => ({
      x: Number(c.getAttribute("cx")),
      y: Number(c.getAttribute("cy")),
    }));
  }

  // Each case sets AAPL's P/E alone (so valuation is that one score) and its
  // beta, then reads the valuation dot (up) and the safety dot (left).
  it.each([
    [8, 0.2, 95, 95],
    [17, 0.5, 68, 82],
    [25, 0.7, 52, 70],
    [40, 1.3, 35, 36],
    [60, 1.8, 20, 22],
    [90, 2.5, 8, 10],
  ])("scores P/E %p and beta %p against the benchmark tiers", async (pe, beta, valuation, safety) => {
    seed("AAPL", { ...apple, fundamentals: { data: { ttmPe: pe } }, beta: { data: { beta5y: beta } } });
    seed("MSFT", microsoft);
    const { container } = await renderTab();
    const points = radarPoints(container);
    expect(points[0].y).toBeCloseTo(-valuation);
    expect(points[3].x).toBeCloseTo(-safety);
  });

  it("averages a growth object and scores weak profitability low", async () => {
    seed("AAPL", {
      ...apple,
      growth: { data: { revenue: 12, eps: 8 } },
      profitability: { data: { roe: -5, roa: 3, roic: 1 } },
      margins: { data: [{ grossMargin: 20, netMargin: 4 }] },
    });
    seed("MSFT", microsoft);
    const { container } = await renderTab();
    const points = radarPoints(container);
    // Growth mean 10 is not above 10, so it scores 52.
    expect(points[1].x).toBeCloseTo(52);
    // ROE −5 → 10, ROA 3 → 42, net margin 4 → 26.
    expect(points[2].y).toBeCloseTo((10 + 42 + 26) / 3);
    // An object shape has no named rows, so the growth table stays empty for AAPL.
    expect(tableRow("Growth (YoY)", "Revenue YoY")).toEqual(["Revenue YoY", "—", "15.00%"]);
  });

  it("leaves the growth axis out when the growth section is an error payload", async () => {
    seed("AAPL", { ...apple, growth: { data: { error: "no data" } } });
    seed("MSFT", microsoft);
    const { container } = await renderTab();
    const labels = Array.from(container.querySelectorAll("svg text")).map((t) => t.textContent);
    expect(labels).toEqual(["Valuation", "Profitability", "Safety"]);
  });

  it("requests the newly chosen first symbol", async () => {
    seed("V", microsoft);
    seed("MSFT", microsoft);
    await renderTab();
    fireEvent.change(screen.getByRole("combobox", { name: "Select first stock to compare" }), {
      target: { value: "V" },
    });
    expect(tableRow("Valuation", "P/E (TTM)")).toEqual(["P/E (TTM)", "35.00", "35.00"]);
  });

  it("shows a loading status while any section loads", async () => {
    seed("MSFT", { beta: { isLoading: true } });
    await renderTab();
    expect(screen.getByRole("status")).toHaveTextContent("Loading comparison");
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("names the symbol that failed and retries every section", async () => {
    seed("AAPL", apple);
    seed("MSFT", { ...microsoft, margins: { error: "Network error" } });
    await renderTab();

    expect(screen.getByText("Comparison data for MSFT did not load.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(refetch).toHaveBeenCalledTimes(10);
  });

  it("treats a section the snapshot lacks as missing rather than failed", async () => {
    seed("AAPL", { ...apple, growth: { error: "Not found", isNotFetched: true } });
    seed("MSFT", microsoft);
    await renderTab();
    expect(screen.queryByText(/did not load/)).toBeNull();
    expect(tableRow("Growth (YoY)", "Revenue YoY")).toEqual(["Revenue YoY", "—", "15.00%"]);
  });
});
