import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { AllocationChart } from "../AllocationChart";
import { GrowthPanel } from "../GrowthPanel";
import type { EnhancedHolding } from "@/types/investment";

const mockGrowth = {
  data: [
    { metric: "Revenue", yoyGrowth: 12.5 },
    { metric: "Net income", yoyGrowth: -4 },
  ],
  isLoading: false,
  error: null,
  isNotFetched: false,
  refetch: jest.fn(),
};

jest.mock("@/hooks/useStockData", () => ({
  useStockData: () => mockGrowth,
}));

function holding(symbol: string, allocationPercent: number): EnhancedHolding {
  return {
    symbol,
    shares: 1,
    averageCost: 100,
    currentPrice: 100,
    currentValue: allocationPercent * 10,
    totalCost: 100,
    gainLoss: 0,
    gainLossPercent: 0,
    dayChange: 0,
    dayChangePercent: 0,
    allocationPercent,
    name: symbol,
    priceSource: "live",
    isLoading: false,
  };
}

// Both charts clear their SVG and draw it again whenever their effect runs.
// The effect was keyed on arrays built during render, so it ran on every
// render of the dashboard, a keystroke in the holdings filter included.
describe("investment charts", () => {
  it("renders symbol markup as literal tooltip text", () => {
    const symbol = '<img src="invalid">';
    const { container } = render(<AllocationChart holdings={[holding(symbol, 100)]} />);
    fireEvent.mouseEnter(container.querySelector("svg path")!);
    expect(container.querySelector("strong")?.textContent).toBe(symbol);
    expect(container.querySelector("img")).toBeNull();
  });

  it("keeps the allocation donut when it renders again with the same holdings", () => {
    const holdings = [holding("AAPL", 60), holding("MSFT", 40)];
    const { container, rerender } = render(<AllocationChart holdings={holdings} />);
    const arc = container.querySelector("svg path");
    expect(arc).not.toBeNull();

    rerender(<AllocationChart holdings={holdings} />);

    expect(container.querySelector("svg path")).toBe(arc);
  });

  it("draws the allocation donut again when the holdings change", () => {
    const { container, rerender } = render(<AllocationChart holdings={[holding("AAPL", 100)]} />);
    expect(container.querySelectorAll("svg path")).toHaveLength(1);

    rerender(<AllocationChart holdings={[holding("AAPL", 60), holding("MSFT", 40)]} />);

    expect(container.querySelectorAll("svg path")).toHaveLength(2);
  });

  it("keeps the growth bars when the panel renders again with the same data", () => {
    const { container, rerender } = render(<GrowthPanel symbol="AAPL" />);
    const bar = container.querySelector("svg rect");
    expect(bar).not.toBeNull();

    rerender(<GrowthPanel symbol="AAPL" />);

    expect(container.querySelector("svg rect")).toBe(bar);
  });
});
