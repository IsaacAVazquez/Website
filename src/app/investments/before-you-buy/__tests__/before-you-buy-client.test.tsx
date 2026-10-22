import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { BeforeYouBuyClient } from "../before-you-buy-client";
import type { PortfolioHolding } from "@/types/investment";

// The real search reads the curated index over the network; a plain field
// stands in, passing the typed text straight to onChange.
jest.mock("@/components/investments/StockSearch", () => ({
  StockSearch: ({ value, onChange, label = "Search stock symbol" }: { value: string; onChange: (next: string) => void; label?: string }) => (
    <input aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}));

let mockSaved: PortfolioHolding[] = [];
jest.mock("@/hooks/useInvestments", () => ({
  loadHoldings: () => mockSaved,
}));

const mockSnapshot = jest.fn();
jest.mock("@/lib/investmentsClientData", () => ({
  getClientInvestmentSnapshot: (symbol: string) => mockSnapshot(symbol),
}));

const DAYS = 40;
const START = Date.UTC(2026, 0, 2);
const dateAt = (t: number) => new Date(START + t * 86_400_000).toISOString().slice(0, 10);

/** A year's worth of closes in miniature: each symbol tracks SPY by `beta` plus its own wobble. */
function prices(base: number, beta: number, wobble: number) {
  let market = 0;
  return Array.from({ length: DAYS }, (_, t) => {
    market += t === 0 ? 0 : 0.01 * Math.sin(t * 1.3);
    return { date: dateAt(t), close: base * Math.exp(beta * market + 0.004 * Math.sin(t * wobble)) };
  });
}

const UNIVERSE: Record<string, { sector?: string; shortName: string; base: number; beta: number }> = {
  SPY: { shortName: "SPDR S&P 500", base: 500, beta: 1 },
  AAPL: { sector: "Technology", shortName: "Apple", base: 200, beta: 1.2 },
  MSFT: { sector: "Technology", shortName: "Microsoft", base: 400, beta: 1.1 },
  GOOGL: { sector: "Communication Services", shortName: "Alphabet", base: 150, beta: 1.15 },
  AMZN: { sector: "Consumer Cyclical", shortName: "Amazon", base: 180, beta: 1.3 },
  JPM: { sector: "Financial Services", shortName: "JPMorgan", base: 210, beta: 0.9 },
  COST: { sector: "Consumer Defensive", shortName: "Costco", base: 900, beta: 0.7 },
  NVDA: { sector: "Technology", shortName: "NVIDIA", base: 120, beta: 1.8 },
  KO: { sector: "Consumer Defensive", shortName: "Coca-Cola", base: 60, beta: 0.5 },
  AMD: { sector: "Technology", shortName: "AMD", base: 150, beta: 1.6 },
};

function useUniverse(missing: string[] = []) {
  mockSnapshot.mockImplementation((symbol: string) => {
    const entry = UNIVERSE[symbol];
    if (!entry || missing.includes(symbol)) return Promise.reject(new Error(`${symbol} unavailable`));
    const i = Object.keys(UNIVERSE).indexOf(symbol);
    return Promise.resolve({
      sections: {
        info: { sector: entry.sector, shortName: entry.shortName },
        price: prices(entry.base, entry.beta, i + 2),
      },
    });
  });
}

async function settle() {
  for (let i = 0; i < 4; i++) {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  }
}

async function renderPage() {
  const utils = render(<BeforeYouBuyClient />);
  await settle();
  return utils;
}

function summary() {
  return screen.getAllByRole("status").find((el) => el.getAttribute("aria-live") === "polite") as HTMLElement;
}

function rows(tableLabel: string) {
  const region = screen.getByRole("region", { name: `${tableLabel} (scrollable)` });
  return within(region)
    .getAllByRole("row")
    .slice(1)
    .map((row) => Array.from(row.children).map((cell) => cell.textContent));
}

beforeEach(() => {
  mockSaved = [];
  mockSnapshot.mockReset();
  localStorage.clear();
});

describe("editable purchase workspace", () => {
  it("compares equal purchases against the same current portfolio", async () => {
    useUniverse();
    await renderPage();
    const comparison = screen.getByRole("region", { name: "Purchase comparison (scrollable)" });
    expect(within(comparison).getByRole("columnheader", { name: "Buy NVDA" })).toBeInTheDocument();
    expect(within(comparison).getByRole("columnheader", { name: "Buy SPY" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Amount in dollars"), { target: { value: "10000" } });
    expect(summary()).toHaveTextContent("16.7%");
    fireEvent.change(screen.getByLabelText("Alternative stock"), { target: { value: "KO" } });
    await settle();
    expect(within(screen.getByRole("region", { name: "Purchase comparison (scrollable)" })).getByRole("columnheader", { name: "Buy KO" })).toBeInTheDocument();
  });

  it("edits a copy of saved holdings and restores the separate draft", async () => {
    mockSaved = [{ symbol: "AAPL", shares: 10, averageCost: 150 }];
    useUniverse();
    const page = await renderPage();
    fireEvent.click(screen.getByText(/View and edit/));
    fireEvent.change(screen.getByLabelText("AAPL value in dollars"), { target: { value: "10000" } });
    expect(summary()).toHaveTextContent("33.3%");
    expect(mockSaved).toEqual([{ symbol: "AAPL", shares: 10, averageCost: 150 }]);
    page.unmount();
    await renderPage();
    expect(summary()).toHaveTextContent("33.3%");
    expect(screen.getByRole("button", { name: "Your draft" })).toHaveAttribute("aria-pressed", "true");
  });

  it("adds and removes a holding without leaving the page", async () => {
    useUniverse();
    await renderPage();
    fireEvent.click(screen.getByText(/View and edit/));
    fireEvent.change(screen.getByLabelText("Add holding symbol"), { target: { value: "KO" } });
    fireEvent.change(screen.getByLabelText("New holding value in dollars"), { target: { value: "10000" } });
    fireEvent.click(screen.getByRole("button", { name: /^Add holding$/ }));
    await settle();
    expect(screen.getByLabelText("KO value in dollars")).toHaveValue(10000);
    expect(summary()).toHaveTextContent("7.7%");
    fireEvent.click(screen.getByRole("button", { name: "Remove KO" }));
    expect(summary()).toHaveTextContent("9.1%");
  });
});

describe("BeforeYouBuyClient", () => {
  it("discloses fund exposure introduced only by the alternative purchase", async () => {
    localStorage.setItem("before-you-buy-portfolio-v1", JSON.stringify([{ symbol: "AAPL", value: 50000 }]));
    useUniverse();
    await renderPage();
    expect(screen.getByText(/I don't have their underlying holdings/)).toHaveTextContent("9.1% after buying SPY");
  });

  it("keeps the disclaimer and loading state visible before data arrives", () => {
    mockSnapshot.mockReturnValue(new Promise(() => {}));
    render(<BeforeYouBuyClient />);
    expect(screen.getByRole("heading", { level: 1, name: "Before You Buy" })).toBeInTheDocument();
    expect(summary()).toHaveTextContent("Loading prices for the portfolio and the purchases…");
    expect(screen.getByText("Not investment advice.")).toBeInTheDocument();
  });

  it("leads with the resulting position and explains the direct sector tradeoff", async () => {
    useUniverse();
    await renderPage();
    expect(summary()).toHaveTextContent("9.1%");
    expect(summary()).toHaveTextContent("NVDA");
    expect(screen.getByText(/Your direct Technology share rises from 30.0% to 36.4%/)).toHaveTextContent("With SPY instead, it would be 27.3%.");
    expect(screen.getByText(/Prices through Feb 10, 2026/)).toHaveTextContent("39 shared daily returns");
    expect(screen.getByText(/I don't have their underlying holdings/)).toHaveTextContent("27.3%");
    const worst = rows("The market's five worst days");
    expect(worst).toHaveLength(5);
    expect(worst[0]).toHaveLength(5);
    expect(screen.getByRole("img", { name: /^Current:/ })).toHaveAttribute("aria-label", expect.stringContaining("Fund holdings 30.0%"));
  });

  it("changes the purchase with an example and supports a single option", async () => {
    useUniverse();
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: /^KO$/ }));
    await settle();
    expect(summary()).toHaveTextContent("KO");
    expect(screen.getByText(/Your direct Consumer Defensive share/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove comparison" }));
    expect(screen.queryByLabelText("Alternative stock")).toBeNull();
    const table = screen.getByRole("region", { name: "Purchase comparison (scrollable)" });
    expect(within(table).getAllByRole("columnheader")).toHaveLength(3);
  });

  it("does not show duplicate scenarios when both stock choices match", async () => {
    useUniverse();
    await renderPage();
    fireEvent.change(screen.getByLabelText("Alternative stock"), { target: { value: "NVDA" } });
    expect(screen.getByText(/Both choices are NVDA/)).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Purchase comparison (scrollable)" })).getAllByRole("columnheader")).toHaveLength(3);
  });

  it("explains invalid purchase and holding values without saving an invalid draft", async () => {
    useUniverse();
    await renderPage();
    const amount = screen.getByLabelText("Amount in dollars");
    fireEvent.change(amount, { target: { value: "0" } });
    expect(amount).toHaveAttribute("aria-invalid", "true");
    expect(summary()).toHaveTextContent("Enter an amount above zero");
    fireEvent.change(amount, { target: { value: "5000" } });
    fireEvent.click(screen.getByText(/View and edit/));
    fireEvent.change(screen.getByLabelText("AAPL value in dollars"), { target: { value: "10000" } });
    const saved = localStorage.getItem("before-you-buy-portfolio-v1");
    fireEvent.change(screen.getByLabelText("AAPL value in dollars"), { target: { value: "" } });
    expect(summary()).toHaveTextContent("Enter a value above zero for each holding");
    expect(localStorage.getItem("before-you-buy-portfolio-v1")).toBe(saved);
  });

  it("keeps allocations available while explaining missing historical data", async () => {
    useUniverse(["SPY"]);
    await renderPage();
    expect(summary()).toHaveTextContent("9.1%");
    expect(screen.getByText(/Prices unavailable for SPY/)).toBeInTheDocument();
    expect(screen.getByText(/Historical comparisons need at least 30/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "The market's five worst days" })).toBeNull();
  });

  it("makes an excluded saved holding explicit and lets the user supply its value", async () => {
    mockSaved = [{ symbol: "AAPL", shares: 10, averageCost: 150 }, { symbol: "ZZZZ", shares: 5, averageCost: 20 }];
    useUniverse();
    await renderPage();
    expect(screen.getByText(/This comparison leaves out holdings without prices/)).toHaveTextContent("ZZZZ");
    fireEvent.click(screen.getByText(/View and edit/));
    fireEvent.change(screen.getByLabelText("ZZZZ value in dollars"), { target: { value: "1000" } });
    expect(screen.queryByText(/This comparison leaves out holdings without prices/)).toBeNull();
    expect(screen.getByText(/share without a sector classification/)).toBeInTheDocument();
  });

  it("starts a draft from the valued saved holdings when another row is edited first", async () => {
    mockSaved = [{ symbol: "AAPL", shares: 10, averageCost: 150 }, { symbol: "ZZZZ", shares: 5, averageCost: 20 }];
    useUniverse();
    await renderPage();
    fireEvent.click(screen.getByText(/View and edit/));
    fireEvent.change(screen.getByLabelText("AAPL value in dollars"), { target: { value: "3000" } });
    expect(JSON.parse(localStorage.getItem("before-you-buy-portfolio-v1")!)).toEqual([{ symbol: "AAPL", value: 3000 }]);
    expect(summary()).not.toHaveTextContent("Enter a value above zero");
  });

  it("locks saved rows until their prices load", () => {
    mockSaved = [{ symbol: "AAPL", shares: 10, averageCost: 150 }];
    mockSnapshot.mockImplementation(() => new Promise(() => {}));
    render(<BeforeYouBuyClient />);
    fireEvent.click(screen.getByText(/View and edit/));
    expect(screen.getByLabelText("AAPL value in dollars")).toBeDisabled();
  });

  it("rejects malformed restored portfolios and accepts an intentional empty draft", async () => {
    localStorage.setItem("before-you-buy-portfolio-v1", JSON.stringify([{ symbol: "<script>", value: 1000 }]));
    useUniverse();
    const first = await renderPage();
    expect(screen.getByRole("button", { name: "Sample portfolio" })).toHaveAttribute("aria-pressed", "true");
    first.unmount();
    localStorage.setItem("before-you-buy-portfolio-v1", "[]");
    await renderPage();
    expect(summary()).toHaveTextContent("100.0%");
    expect(screen.getByRole("button", { name: "Your draft" })).toHaveAttribute("aria-pressed", "true");
  });

  it("opens all disclosures for print and preserves the user's open disclosures", async () => {
    useUniverse();
    await renderPage();
    const disclosures = Array.from(document.querySelectorAll<HTMLDetailsElement>(".byb details"));
    disclosures[0].open = true;
    act(() => { window.dispatchEvent(new Event("beforeprint")); });
    expect(disclosures.every((detail) => detail.open)).toBe(true);
    act(() => { window.dispatchEvent(new Event("afterprint")); });
    expect(disclosures[0].open).toBe(true);
    expect(disclosures.slice(1).every((detail) => !detail.open)).toBe(true);
  });
});
