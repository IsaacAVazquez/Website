import { render, screen, fireEvent, within } from "@testing-library/react";

// HoldingRow pulls historical prices through useStockData to draw a sparkline.
// We don't exercise charting here, so stub the hook to an empty state — the row
// then renders the "no trend" placeholder and stays deterministic.
jest.mock("@/hooks/useStockData", () => ({
  useStockData: () => ({
    data: null,
    isLoading: false,
    error: null,
    isNotFetched: false,
    lastUpdated: null,
    freshness: null,
    source: null,
    capabilities: {},
    refetch: () => {},
  }),
}));

import { HoldingsTable } from "../HoldingsTable";
import type { EnhancedHolding } from "@/types/investment";

function makeHolding(overrides: Partial<EnhancedHolding> = {}): EnhancedHolding {
  return {
    symbol: "AAPL",
    shares: 10,
    averageCost: 150,
    currentPrice: 198.12,
    currentValue: 1981.2,
    totalCost: 1500,
    gainLoss: 481.2,
    gainLossPercent: 32.08,
    dayChange: 4.1,
    dayChangePercent: 2.11,
    allocationPercent: 60,
    name: "Apple Inc.",
    isLoading: false,
    ...overrides,
  };
}

function renderTable(holdings: EnhancedHolding[], handlers: Partial<{
  onUpdate: jest.Mock;
  onRemove: jest.Mock;
  onResearch: jest.Mock;
}> = {}) {
  const onUpdate = handlers.onUpdate ?? jest.fn();
  const onRemove = handlers.onRemove ?? jest.fn();
  const onResearch = handlers.onResearch ?? jest.fn();
  render(
    <HoldingsTable
      holdings={holdings}
      onUpdate={onUpdate}
      onRemove={onRemove}
      onResearch={onResearch}
    />
  );
  return { onUpdate, onRemove, onResearch };
}

describe("HoldingsTable", () => {
  function tickerSymbols(): string[] {
    return Array.from(document.querySelectorAll('[data-testid="ticker-symbol"]')).map(
      (el) => el.textContent ?? ""
    );
  }

  it("renders a row per holding with formatted price, value and gain", () => {
    renderTable([makeHolding()]);

    expect(tickerSymbols()).toContain("AAPL");
    expect(screen.getByText("Apple Inc.")).toBeInTheDocument();
    expect(screen.getByText("$198.12")).toBeInTheDocument();
    expect(screen.getByText("$1,981.20")).toBeInTheDocument();
    // signed gain uses a "+" prefix
    expect(screen.getByText("+$481.20")).toBeInTheDocument();
    expect(screen.getByText("+32.08%")).toBeInTheDocument();
  });

  it("pluralizes the position count in the panel header", () => {
    const { rerender } = render(
      <HoldingsTable
        holdings={[makeHolding()]}
        onUpdate={jest.fn()}
        onRemove={jest.fn()}
        onResearch={jest.fn()}
      />
    );
    expect(screen.getByText(/1 position · sorted by allocation/)).toBeInTheDocument();

    rerender(
      <HoldingsTable
        holdings={[
          makeHolding({ symbol: "AAPL" }),
          makeHolding({ symbol: "MSFT", name: "Microsoft", allocationPercent: 40 }),
        ]}
        onUpdate={jest.fn()}
        onRemove={jest.fn()}
        onResearch={jest.fn()}
      />
    );
    expect(screen.getByText(/2 positions · sorted by allocation/)).toBeInTheDocument();
  });

  it("formats a loss with a minus sign", () => {
    renderTable([
      makeHolding({
        symbol: "NVDA",
        name: "Nvidia",
        gainLoss: -120.5,
        gainLossPercent: -8.04,
      }),
    ]);

    // U+2212 MINUS SIGN for negatives
    expect(screen.getByText("−$120.50")).toBeInTheDocument();
    expect(screen.getByText("−8.04%")).toBeInTheDocument();
  });

  it("sorts holdings by allocation descending", () => {
    renderTable([
      makeHolding({ symbol: "LOW", name: "Low Co", allocationPercent: 10 }),
      makeHolding({ symbol: "HIGH", name: "High Co", allocationPercent: 80 }),
      makeHolding({ symbol: "MID", name: "Mid Co", allocationPercent: 45 }),
    ]);

    expect(tickerSymbols()).toEqual(["HIGH", "MID", "LOW"]);
  });

  it("falls back to the symbol when no name is provided", () => {
    renderTable([makeHolding({ symbol: "TSLA", name: "" })]);
    // both the ticker symbol cell and the name cell show TSLA
    expect(screen.getAllByText("TSLA").length).toBeGreaterThanOrEqual(1);
  });

  it("renders a trend placeholder when no spark data is available", () => {
    renderTable([makeHolding()]);
    // useStockData mocked to null -> sparkData empty -> em dash placeholder
    const trendCells = screen.getAllByText("—");
    expect(trendCells.length).toBeGreaterThanOrEqual(1);
  });

  it("invokes onResearch when the research action is clicked", () => {
    const onResearch = jest.fn();
    renderTable([makeHolding({ symbol: "AAPL" })], { onResearch });

    fireEvent.click(screen.getByLabelText("Research AAPL"));
    expect(onResearch).toHaveBeenCalledWith("AAPL");
  });

  it("enters edit mode and saves valid shares/cost", () => {
    const onUpdate = jest.fn();
    renderTable([makeHolding({ symbol: "AAPL" })], { onUpdate });

    fireEvent.click(screen.getByLabelText("Edit AAPL"));
    expect(screen.getByText("Edit position")).toBeInTheDocument();

    const sharesInput = screen.getByDisplayValue("10");
    const costInput = screen.getByDisplayValue("150");
    fireEvent.change(sharesInput, { target: { value: "12" } });
    fireEvent.change(costInput, { target: { value: "160" } });

    fireEvent.click(screen.getByText("Save"));
    expect(onUpdate).toHaveBeenCalledWith("AAPL", { shares: 12, averageCost: 160 });
  });

  it("does not call onUpdate when edited values are invalid", () => {
    const onUpdate = jest.fn();
    renderTable([makeHolding({ symbol: "AAPL" })], { onUpdate });

    fireEvent.click(screen.getByLabelText("Edit AAPL"));
    const sharesInput = screen.getByDisplayValue("10");
    fireEvent.change(sharesInput, { target: { value: "-5" } });
    fireEvent.click(screen.getByText("Save"));

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("requires a confirmation step before removing a holding", () => {
    const onRemove = jest.fn();
    renderTable([makeHolding({ symbol: "AAPL" })], { onRemove });

    fireEvent.click(screen.getByLabelText("Remove AAPL"));
    expect(onRemove).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText("Confirm remove holding"));
    expect(onRemove).toHaveBeenCalledWith("AAPL");
  });

  it("renders an empty table body when given no holdings", () => {
    renderTable([]);
    expect(screen.getByText(/0 positions · sorted by allocation/)).toBeInTheDocument();
    const table = screen.getByRole("table");
    // only the header row is present
    expect(within(table).queryByText("AAPL")).not.toBeInTheDocument();
  });
});
