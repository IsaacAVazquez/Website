import React from "react";
import { render, screen, within } from "@testing-library/react";
import { ResearchPosition } from "../ResearchPosition";
import type { EnhancedHolding } from "@/types/investment";

function position(overrides: Partial<EnhancedHolding> = {}): EnhancedHolding {
  return {
    symbol: "AAPL",
    shares: 12.5,
    averageCost: 150.256,
    currentPrice: 200,
    currentValue: 2500.4,
    totalCost: 1878.2,
    gainLoss: 622.2,
    gainLossPercent: 33.13,
    dayChange: -18.75,
    dayChangePercent: -0.74,
    allocationPercent: 23.456,
    name: "Apple Inc.",
    priceSource: "live",
    isLoading: false,
    ...overrides,
  };
}

function metric(label: string) {
  const list = screen.getByRole("list", { name: "Position metrics" });
  const item = within(list)
    .getAllByRole("listitem")
    .find((el) => el.firstElementChild?.textContent === label);
  if (!item) throw new Error(`No metric ${label}`);
  return item.lastElementChild as HTMLElement;
}

describe("ResearchPosition", () => {
  it("formats a priced position with signed figures and tone", () => {
    render(<ResearchPosition position={position()} />);

    expect(screen.getByRole("article", { name: "Your position" })).toBeInTheDocument();
    expect(screen.getByText("Held · 12.5 sh")).toBeInTheDocument();
    expect(metric("Shares").textContent).toBe("12.5");
    expect(metric("Avg cost").textContent).toBe("$150.26");
    expect(metric("Market value").textContent).toBe("$2,500");
    expect(metric("Total return").textContent).toBe("+$622.20 · +33.13%");
    expect(metric("Total return").className).toContain("--c97-positive");
    expect(metric("Day P/L").textContent).toBe("−$18.75 · −0.74%");
    expect(metric("Day P/L").className).toContain("--c97-negative");
  });

  it("shows the allocation bar clamped to 0–100 with an accessible label", () => {
    const { rerender } = render(<ResearchPosition position={position()} />);
    expect(screen.getByText("23.5%")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Allocation 23.5 percent of portfolio" })).toBeInTheDocument();

    rerender(<ResearchPosition position={position({ allocationPercent: 140 })} />);
    expect(screen.getByRole("img", { name: "Allocation 100.0 percent of portfolio" })).toBeInTheDocument();

    rerender(<ResearchPosition position={position({ allocationPercent: -3 })} />);
    expect(screen.getByRole("img", { name: "Allocation 0.0 percent of portfolio" })).toBeInTheDocument();
  });

  it("hides the allocation when it is unknown", () => {
    render(<ResearchPosition position={position({ allocationPercent: null })} />);
    expect(screen.queryByText("Allocation")).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("says the price is unavailable instead of a $0 return for a lot valued at cost", () => {
    render(<ResearchPosition position={position({ priceSource: "costBasis", gainLoss: 0, gainLossPercent: 0 })} />);
    expect(metric("Market value").textContent).toBe("Price unavailable");
    expect(metric("Total return").textContent).toBe("Price unavailable");
    expect(metric("Day P/L").textContent).toBe("Price unavailable");
    expect(metric("Total return").className).toContain("--c97-ink");
    // Cost and share count still come from the saved lot.
    expect(metric("Avg cost").textContent).toBe("$150.26");
  });

  it("prints a neutral zero and dashes for non-finite figures", () => {
    render(
      <ResearchPosition
        position={position({ gainLoss: 0, gainLossPercent: 0, dayChange: Number.NaN, dayChangePercent: Number.NaN })}
      />
    );
    expect(metric("Total return").textContent).toBe("$0.00 · 0.00%");
    expect(metric("Total return").className).toContain("--c97-ink");
    expect(metric("Day P/L").textContent).toBe("— · —");
  });
});
