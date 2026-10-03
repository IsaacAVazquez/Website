import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { FinancialStatementsPanel } from "../FinancialStatementsPanel";

type HookState = {
  data: unknown;
  isLoading: boolean;
  error: string | null;
  isNotFetched: boolean;
  refetch: jest.Mock;
};

const sections: Record<string, Partial<HookState>> = {};
const refetch = jest.fn();
const calls: Array<[string | null, string]> = [];

jest.mock("@/hooks/useStockData", () => ({
  useStockData: (symbol: string | null, section: string) => {
    calls.push([symbol, section]);
    return { data: null, isLoading: false, error: null, isNotFetched: false, refetch, ...sections[section] };
  },
}));

const income = {
  quarterly: [
    // The snapshot stores figures as numeric strings, with "*" for a missing period.
    { label: "Revenue", "2026-06": "94930000000.0", "2026-03": 1_250_000_000_000, "2025-12": "*" },
    { label: "Net income", "2026-06": -2_500_000, "2026-03": 12_345, "2025-12": null },
    { label: "EPS", "2026-06": 1.234, "2026-03": "n/a", "2025-12": 999 },
  ],
  annual: [{ label: "Revenue", FY2025: 391_000_000_000 }],
};

function table() {
  return screen.getByRole("table");
}

function rowCells(label: string) {
  const row = within(table())
    .getAllByRole("row")
    .find((r) => r.firstElementChild?.textContent === label);
  if (!row) throw new Error(`No row ${label}`);
  return Array.from(row.children).map((c) => c as HTMLElement);
}

beforeEach(() => {
  for (const key of Object.keys(sections)) delete sections[key];
  calls.length = 0;
  refetch.mockReset();
});

describe("FinancialStatementsPanel", () => {
  it("renders the quarterly income statement with compact number formatting", () => {
    sections.income_statement = { data: income };
    render(<FinancialStatementsPanel symbol="AAPL" />);

    expect(table()).toHaveAccessibleName("income statement statement");
    const headers = within(table()).getAllByRole("columnheader").map((h) => h.textContent);
    expect(headers).toEqual(["Metric", "2026-06", "2026-03", "2025-12"]);

    const revenue = rowCells("Revenue").map((c) => c.textContent);
    expect(revenue).toEqual(["Revenue", "94.93B", "1.25T", "—"]);

    const net = rowCells("Net income");
    expect(net.map((c) => c.textContent)).toEqual(["Net income", "-2.50M", "12.3K", "—"]);
    expect(net[1].className).toContain("--c97-negative");
    expect(net[2].className).not.toContain("--c97-negative");

    // Non-numeric text passes through, small numbers keep two decimals.
    expect(rowCells("EPS").map((c) => c.textContent)).toEqual(["EPS", "1.23", "n/a", "999"]);
    expect(calls).toContainEqual(["AAPL", "income_statement"]);
  });

  it("switches statement and period through the pressed-state toggles", () => {
    sections.income_statement = { data: income };
    sections.balance_sheet = {
      data: { quarterly: [{ label: "Total assets", Q1: 5e9 }], annual: [{ label: "Total assets", FY: 6e9 }] },
    };
    render(<FinancialStatementsPanel symbol="AAPL" />);

    const quarterly = screen.getByRole("button", { name: "Quarterly" });
    const annual = screen.getByRole("button", { name: "Annual" });
    expect(quarterly).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(annual);
    expect(annual).toHaveAttribute("aria-pressed", "true");
    expect(quarterly).toHaveAttribute("aria-pressed", "false");
    expect(rowCells("Revenue").map((c) => c.textContent)).toEqual(["Revenue", "391.00B"]);

    const balance = screen.getByRole("button", { name: "Balance sheet" });
    fireEvent.click(balance);
    expect(balance).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Income statement" })).toHaveAttribute("aria-pressed", "false");
    expect(table()).toHaveAccessibleName("balance sheet statement");
    expect(rowCells("Total assets").map((c) => c.textContent)).toEqual(["Total assets", "6.00B"]);
    expect(calls).toContainEqual(["AAPL", "balance_sheet"]);
  });

  it("falls back to quarterly rows when the chosen period is missing", () => {
    sections.cash_flow = { data: { quarterly: [{ label: "Free cash flow", Q2: 2.5e7 }] } };
    render(<FinancialStatementsPanel symbol="AAPL" />);
    fireEvent.click(screen.getByRole("button", { name: "Cash flow" }));
    fireEvent.click(screen.getByRole("button", { name: "Annual" }));
    expect(table()).toHaveAccessibleName("cash flow statement");
    expect(rowCells("Free cash flow").map((c) => c.textContent)).toEqual(["Free cash flow", "25.00M"]);
  });

  it("accepts a bare array and a row-keyed object", () => {
    sections.income_statement = { data: [{ item: "Revenue", A: 10 }] };
    const { unmount } = render(<FinancialStatementsPanel symbol="AAPL" />);
    expect(rowCells("Revenue").map((c) => c.textContent)).toEqual(["Revenue", "10"]);
    unmount();

    sections.income_statement = { data: { Revenue: { label: "Revenue", FY2026: 2000 } } };
    render(<FinancialStatementsPanel symbol="AAPL" />);
    expect(rowCells("Revenue").map((c) => c.textContent)).toEqual(["Revenue", "2.0K"]);
  });

  it("caps the table at eight period columns", () => {
    const row: Record<string, unknown> = { label: "Revenue" };
    for (let i = 1; i <= 12; i++) row[`P${i}`] = i;
    sections.income_statement = { data: { quarterly: [row] } };
    render(<FinancialStatementsPanel symbol="AAPL" />);
    expect(within(table()).getAllByRole("columnheader")).toHaveLength(9);
  });

  it("shows a loading status, then the empty message", () => {
    sections.income_statement = { isLoading: true };
    const { rerender } = render(<FinancialStatementsPanel symbol="AAPL" />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading financial statement");
    expect(screen.queryByRole("table")).toBeNull();

    sections.income_statement = { data: { quarterly: [], annual: [] } };
    rerender(<FinancialStatementsPanel symbol="AAPL" />);
    expect(screen.getByText("No data available.")).toBeInTheDocument();
  });

  it("shows the error with a retry that refetches", () => {
    sections.income_statement = { error: "Snapshot failed to load" };
    render(<FinancialStatementsPanel symbol="AAPL" />);
    expect(screen.getByRole("status")).toHaveTextContent("Snapshot failed to load");
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
