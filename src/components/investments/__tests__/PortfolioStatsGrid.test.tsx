import React from "react";
import { render, screen, within } from "@testing-library/react";
import { PortfolioStatsGrid } from "../PortfolioStatsGrid";
import type { EnhancedHolding, PortfolioSummary } from "@/types/investment";

function holding(overrides: Partial<EnhancedHolding> & { symbol: string }): EnhancedHolding {
  return {
    shares: 1,
    averageCost: 100,
    currentPrice: 100,
    currentValue: 100,
    totalCost: 100,
    gainLoss: 0,
    gainLossPercent: 0,
    dayChange: 0,
    dayChangePercent: 0,
    allocationPercent: 25,
    name: overrides.symbol,
    priceSource: "live",
    isLoading: false,
    ...overrides,
  };
}

const summary: PortfolioSummary = {
  totalValue: 12000,
  totalCost: 10234.5,
  totalGainLoss: 1765.5,
  totalGainLossPercent: 17.25,
  dayChange: 0,
  dayChangePercent: 0,
};

function cell(label: string) {
  const labelEl = screen.getByText(label, { selector: "span[title]" });
  const parent = labelEl.parentElement as HTMLElement;
  const [, value, sub] = Array.from(parent.children) as HTMLElement[];
  return { labelEl, value: value.textContent, sub: sub.textContent, subEl: sub };
}

describe("PortfolioStatsGrid", () => {
  it("is a named landmark that shows the market status", () => {
    render(<PortfolioStatsGrid summary={summary} holdings={[]} marketStatus="Market closed" />);
    const region = screen.getByRole("region", { name: "Portfolio stats" });
    expect(within(region).getByText("Market closed")).toBeInTheDocument();
  });

  it("shows dashes and hides the allocation links for an empty book", () => {
    render(<PortfolioStatsGrid summary={{ ...summary, totalCost: 0 }} holdings={[]} marketStatus="Open" />);

    expect(cell("Cost basis").value).toBe("$0.00");
    expect(cell("Positions").value).toBe("0");
    expect(cell("Top holding").value).toBe("—");
    expect(cell("Best performer").value).toBe("—");
    expect(cell("Biggest day move").value).toBe("—");
    expect(cell("Top-3 concentration").value).toBe("—");
    expect(cell("Top-3 concentration").sub.trim()).toBe("");

    expect(screen.queryByRole("link", { name: "Allocation breakdown" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Per-position detail" })).toBeNull();
    expect(screen.getByRole("link", { name: "Performance over time" })).toHaveAttribute("href", "#performance");
    expect(screen.getByRole("link", { name: "Add a holding" })).toHaveAttribute("href", "#add-holding");
  });

  it("ranks holdings and formats each stat", () => {
    const holdings = [
      holding({ symbol: "AAPL", allocationPercent: 40, gainLossPercent: 12.345, dayChangePercent: 1.2 }),
      holding({ symbol: "MSFT", allocationPercent: 30, gainLossPercent: 30.5, dayChangePercent: -3.456 }),
      holding({ symbol: "V", allocationPercent: 20, gainLossPercent: -5, dayChangePercent: 0.5 }),
      holding({ symbol: "KO", allocationPercent: 10, gainLossPercent: 2, dayChangePercent: 0.1 }),
    ];
    render(<PortfolioStatsGrid summary={summary} holdings={holdings} marketStatus="Open" />);

    expect(cell("Cost basis").value).toBe("$10,234.50");
    expect(cell("Cost basis").sub).toBe("Across 4 positions");
    expect(cell("Positions").sub).toBe("90.0% in top three");
    expect(cell("Top holding").value).toBe("AAPL");
    expect(cell("Top holding").sub).toBe("40.0% of book");
    expect(cell("Best performer").value).toBe("MSFT");
    expect(cell("Best performer").sub).toBe("+30.50%");
    // Largest absolute move wins, sign kept with a true minus sign.
    expect(cell("Biggest day move").value).toBe("MSFT");
    expect(cell("Biggest day move").sub).toBe("−3.46%");
    expect(cell("Biggest day move").subEl.className).toContain("statNeg");
    expect(cell("Best performer").subEl.className).toContain("statPos");
    expect(cell("Top-3 concentration").value).toBe("90.0%");

    expect(screen.getByRole("link", { name: "Allocation breakdown" })).toHaveAttribute("href", "#allocation");
    expect(screen.getByRole("link", { name: "Per-position detail" })).toHaveAttribute("href", "#holdings-list");
  });

  it("uses the singular for one position and calls a small book the whole book", () => {
    render(
      <PortfolioStatsGrid
        summary={summary}
        holdings={[holding({ symbol: "AAPL", allocationPercent: 100, gainLossPercent: -8 })]}
        marketStatus="Open"
      />
    );
    expect(cell("Cost basis").sub).toBe("Across 1 position");
    expect(cell("Top-3 concentration").sub).toBe("Whole book");
    expect(cell("Best performer").sub).toBe("−8.00%");
    expect(cell("Best performer").subEl.className).toContain("statNeg");
  });

  it("counts the positions beyond the top three", () => {
    const holdings = ["A", "B", "C", "D", "E"].map((symbol) => holding({ symbol, allocationPercent: 20 }));
    render(<PortfolioStatsGrid summary={summary} holdings={holdings} marketStatus="Open" />);
    expect(cell("Top-3 concentration").sub).toBe("2 more positions");
  });

  it("says one more position, not positions, for a four-holding book", () => {
    const holdings = ["A", "B", "C", "D"].map((symbol) => holding({ symbol, allocationPercent: 25 }));
    render(<PortfolioStatsGrid summary={summary} holdings={holdings} marketStatus="Open" />);
    expect(cell("Top-3 concentration").sub).toBe("1 more position");
  });

  it("keeps cost-basis holdings out of the rankings and non-live quotes out of the day move", () => {
    const holdings = [
      holding({ symbol: "COST", priceSource: "costBasis", allocationPercent: 80, gainLossPercent: 99, dayChangePercent: 9 }),
      holding({ symbol: "SAVED", priceSource: "saved", allocationPercent: 15, gainLossPercent: 4, dayChangePercent: 7 }),
      holding({ symbol: "LIVE", priceSource: "live", allocationPercent: 5, gainLossPercent: 1, dayChangePercent: 0.25 }),
    ];
    render(<PortfolioStatsGrid summary={summary} holdings={holdings} marketStatus="Open" />);

    expect(cell("Top holding").value).toBe("SAVED");
    expect(cell("Best performer").value).toBe("SAVED");
    expect(cell("Biggest day move").value).toBe("LIVE");
    expect(cell("Biggest day move").sub).toBe("+0.25%");
    expect(cell("Top-3 concentration").value).toBe("20.0%");
  });

  it("leaves holdings with no allocation out of the top holding", () => {
    const holdings = [
      holding({ symbol: "NULL", allocationPercent: null }),
      holding({ symbol: "REAL", allocationPercent: 12 }),
    ];
    render(<PortfolioStatsGrid summary={summary} holdings={holdings} marketStatus="Open" />);
    expect(cell("Top holding").value).toBe("REAL");
  });
});
