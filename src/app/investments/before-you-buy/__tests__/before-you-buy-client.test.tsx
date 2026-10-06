import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { BeforeYouBuyClient } from "../before-you-buy-client";
import type { PortfolioHolding } from "@/types/investment";

// The real search reads the curated index over the network; a plain field
// stands in, passing the typed text straight to onChange.
jest.mock("@/components/investments/StockSearch", () => ({
  StockSearch: ({ value, onChange }: { value: string; onChange: (next: string) => void }) => (
    <input aria-label="Search stock symbol" value={value} onChange={(event) => onChange(event.target.value)} />
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

function readouts() {
  return Array.from(document.querySelectorAll(".c97-stat")).map((stat) => ({
    label: stat.querySelector("dt")?.textContent,
    value: stat.querySelector(".c97-stat-value")?.textContent,
    detail: stat.querySelector(".c97-stat-delta")?.textContent ?? null,
  }));
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
});

describe("BeforeYouBuyClient", () => {
  it("holds placeholder readouts while a year of prices loads", () => {
    mockSnapshot.mockReturnValue(new Promise(() => {}));
    render(<BeforeYouBuyClient />);
    expect(screen.getByRole("heading", { level: 1, name: "Before You Buy" })).toBeInTheDocument();
    expect(summary()).toHaveTextContent("Loading a year of prices for the portfolio and the buy…");
    expect(readouts()).toEqual([
      { label: "Sector share", value: "…", detail: null },
      { label: "Beta", value: "…", detail: null },
      { label: "Correlation", value: "…", detail: null },
    ]);
  });

  it("describes what $5,000 of NVDA would change in the sample portfolio", async () => {
    useUniverse();
    await renderPage();

    const text = summary().textContent ?? "";
    expect(text).toContain(
      "Adding $5,000 of NVIDIA (NVDA) to this $50,000 portfolio takes Technology from 30% to 36% of the portfolio, and NVDA comes to 9% of the total."
    );
    expect(text).toMatch(/On the S&P 500's five worst days of that year, your current mix averaged [-+]\d+\.\d% and the new one would have averaged [-+]\d+\.\d%\./);

    const [sector, beta, correlation] = readouts();
    expect(sector).toEqual({ label: "Technology share", value: "36%", detail: "Was 30%" });
    expect(beta.label).toBe("Beta");
    expect(beta.value).toMatch(/^\d\.\d\d$/);
    expect(beta.detail).toMatch(/^Was \d\.\d\d$/);
    expect(correlation).toMatchObject({ label: "Correlation", detail: "With what you hold" });

    // Forty daily closes from Jan 2 end on Feb 10.
    expect(screen.getByText(/Prices through Feb 10, 2026\./)).toBeInTheDocument();
    expect(screen.getByText(/Not investment advice\./)).toBeInTheDocument();
  });

  // The 2026-10-05 audit measured the stock field at y1525 on a 390x844 phone, a band below the sentence it changes.
  it("keeps the stock, the amount, and the portfolio choice on the plate with the summary", async () => {
    useUniverse();
    await renderPage();

    const plate = within(summary().parentElement as HTMLElement);
    expect(plate.getByLabelText("Search stock symbol")).toBeInTheDocument();
    expect(plate.getByRole("spinbutton", { name: "Amount in dollars" })).toBeInTheDocument();
    expect(within(plate.getByRole("group", { name: "Portfolio" })).getAllByRole("button")).toHaveLength(2);
  });

  it("lists the sample holdings and the sector weights before and after", async () => {
    useUniverse();
    await renderPage();

    expect(rows("Portfolio holdings")).toEqual([
      ["SPY", "$15,000", "30%"],
      ["AAPL", "$8,000", "16%"],
      ["MSFT", "$7,000", "14%"],
      ["GOOGL", "$6,000", "12%"],
      ["AMZN", "$5,000", "10%"],
      ["JPM", "$5,000", "10%"],
      ["COST", "$4,000", "8%"],
    ]);

    const sectors = rows("Sector weights before and after");
    expect(sectors).toContainEqual(["Technology", "30%", "36%"]);
    expect(sectors).toContainEqual(["Index fund", "30%", "27%"]);
    expect(sectors).toContainEqual(["Consumer Defensive", "8%", "7%"]);
    expect(sectors).toContainEqual(["Largest holding", "SPY 30%", "SPY 27%"]);
    const betaRow = sectors.find((row) => row[0] === "Beta against SPY")!;
    betaRow.slice(1).forEach((cell) => expect(cell).toMatch(/^\d\.\d\d$/));

    expect(screen.getByText(/NVDA's daily moves had a correlation of -?\d\.\d\d with the/)).toBeInTheDocument();
  });

  it("shows the market's five worst days, worst first", async () => {
    useUniverse();
    await renderPage();
    const worst = rows("The market's five worst days");
    expect(worst).toHaveLength(5);
    const spyMoves = worst.map((row) => Number(row[1]!.replace("%", "")));
    expect([...spyMoves].sort((a, b) => a - b)).toEqual(spyMoves);
    worst.forEach((row) => {
      expect(row[0]).toMatch(/^[A-Z][a-z]{2} \d{1,2}, 2026$/);
      row.slice(1).forEach((cell) => expect(cell).toMatch(/^[-+]\d+\.\d%$/));
    });
  });

  it("draws the sector mix now and with the buy, folding small sectors into Other", async () => {
    useUniverse();
    await renderPage();
    const now = screen.getByRole("img", { name: /^Now: / });
    expect(now.getAttribute("aria-label")).toContain("Index fund 30%");
    expect(now.getAttribute("aria-label")).toContain("Technology 30%");
    // Six sectors are more than the palette's four distinct steps plus one.
    const after = screen.getByRole("img", { name: /^With the buy: / });
    expect(after.getAttribute("aria-label")).toMatch(/Other \d+%$/);
    expect(after.children.length).toBe(5);
  });

  it("switches the buy to an example stock", async () => {
    useUniverse();
    await renderPage();

    const ko = screen.getByRole("button", { name: "KO" });
    fireEvent.click(ko);
    await settle();

    expect(ko).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "NVDA" })).toHaveAttribute("aria-pressed", "false");
    expect(mockSnapshot).toHaveBeenCalledWith("KO");
    expect(summary()).toHaveTextContent(
      "Adding $5,000 of Coca-Cola (KO) to this $50,000 portfolio takes Consumer Defensive from 8% to 16% of the portfolio"
    );
  });

  it("upper-cases a symbol picked in the search", async () => {
    useUniverse();
    await renderPage();
    fireEvent.change(screen.getByLabelText("Search stock symbol"), { target: { value: "amd" } });
    await settle();
    expect(mockSnapshot).toHaveBeenCalledWith("AMD");
    expect(summary()).toHaveTextContent("Adding $5,000 of AMD (AMD)");
  });

  it("asks for an amount above zero and flags the field", async () => {
    useUniverse();
    await renderPage();
    const amount = screen.getByRole("spinbutton", { name: "Amount in dollars" });

    fireEvent.change(amount, { target: { value: "0" } });
    expect(summary()).toHaveTextContent("Enter an amount above zero to see what the buy would change.");
    expect(amount).toHaveAttribute("aria-invalid", "true");
    const error = screen.getByText("Enter an amount above zero.");
    expect(amount).toHaveAttribute("aria-describedby", error.id);
    expect(readouts()).toEqual([]);
    expect(screen.queryByRole("region", { name: /Portfolio holdings/ })).toBeNull();

    fireEvent.change(amount, { target: { value: "11000" } });
    expect(amount).not.toHaveAttribute("aria-invalid");
    expect(amount).not.toHaveAttribute("aria-describedby");
    expect(summary()).toHaveTextContent("Adding $11,000 of NVIDIA (NVDA)");
  });

  it("says when the buy has no prices", async () => {
    useUniverse(["NVDA"]);
    await renderPage();
    expect(summary()).toHaveTextContent("Prices for NVDA aren't available right now, so there's nothing to compare yet.");
    expect(readouts()).toEqual([]);
    expect(screen.queryByRole("heading", { name: "Before and after" })).toBeNull();
  });

  it("says when the benchmark has no prices", async () => {
    useUniverse(["SPY"]);
    await renderPage();
    expect(summary()).toHaveTextContent("Prices for SPY aren't available right now, so there's nothing to compare yet.");
  });

  it("leaves out sample holdings the data does not cover", async () => {
    useUniverse(["COST"]);
    await renderPage();
    expect(screen.getByText(/Left out because my data doesn't cover them: COST\./)).toBeInTheDocument();
    expect(rows("Portfolio holdings").map((row) => row[0])).not.toContain("COST");
    expect(summary()).toHaveTextContent("to this $46,000 portfolio");
  });

  it("points to the investments page when nothing is saved", async () => {
    useUniverse();
    await renderPage();
    expect(screen.getByRole("button", { name: "Sample portfolio" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Your saved holdings" })).toBeDisabled();
    expect(screen.getByText(/to try your own\./)).toBeInTheDocument();
  });

  it("values saved holdings at the last close and can switch back to the sample", async () => {
    mockSaved = [
      { symbol: "AAPL", shares: 10, averageCost: 150 },
      { symbol: "ZZZZ", shares: 5, averageCost: 20 },
    ];
    useUniverse();
    await renderPage();

    const savedButton = screen.getByRole("button", { name: "Your saved holdings" });
    expect(savedButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/Your holdings from the/)).toBeInTheDocument();
    expect(screen.getByText(/Left out because my data doesn't cover them: ZZZZ\./)).toBeInTheDocument();

    const appleClose = prices(UNIVERSE.AAPL.base, UNIVERSE.AAPL.beta, 3).at(-1)!.close;
    const value = (10 * appleClose).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
    expect(rows("Portfolio holdings")).toEqual([["AAPL", value, "100%"]]);

    fireEvent.click(screen.getByRole("button", { name: "Sample portfolio" }));
    await settle();
    expect(screen.getByRole("button", { name: "Sample portfolio" })).toHaveAttribute("aria-pressed", "true");
    expect(rows("Portfolio holdings")).toHaveLength(7);

    fireEvent.click(savedButton);
    await settle();
    expect(savedButton).toHaveAttribute("aria-pressed", "true");
    expect(rows("Portfolio holdings")).toEqual([["AAPL", value, "100%"]]);
  });
});
