import { render, screen, within } from "@testing-library/react";
import { ComparisonMetricTable, type MetricRow } from "../ComparisonMetricTable";

function renderTable(rows: MetricRow[]) {
  return render(
    <ComparisonMetricTable
      title="Valuation"
      rows={rows}
      symbolA="AAPL"
      symbolB="MSFT"
    />
  );
}

describe("ComparisonMetricTable", () => {
  it("renders the title, symbol headers, and metric labels", () => {
    renderTable([
      { label: "P/E (TTM)", valueA: 28.4, valueB: 31.2, higherIsBetter: false },
    ]);

    expect(screen.getByText("Valuation")).toBeInTheDocument();
    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("MSFT")).toBeInTheDocument();
    expect(screen.getByText("P/E (TTM)")).toBeInTheDocument();
  });

  it("marks column A as the winner when lower-is-better and A is lower", () => {
    renderTable([
      { label: "P/E (TTM)", valueA: 28.4, valueB: 31.2, higherIsBetter: false },
    ]);

    // The winning cell carries the "(better)" sr-only marker as a child.
    const better = screen.getByText("(better)");
    const winningCell = better.parentElement as HTMLElement;
    expect(winningCell).not.toBeNull();
    expect(within(winningCell).getByText("28.4")).toBeInTheDocument();
  });

  it("marks column B as the winner when higher-is-better and B is higher", () => {
    renderTable([
      { label: "ROE", valueA: 22.1, valueB: 35.6, higherIsBetter: true },
    ]);

    const better = screen.getByText("(better)");
    const winningCell = better.parentElement as HTMLElement;
    expect(within(winningCell).getByText("35.6")).toBeInTheDocument();
  });

  it("shows no winner marker when higherIsBetter is null", () => {
    renderTable([
      { label: "Current price", valueA: 198, valueB: 410, higherIsBetter: null },
    ]);

    expect(screen.queryByText("(better)")).not.toBeInTheDocument();
    expect(screen.getByText("198")).toBeInTheDocument();
    expect(screen.getByText("410")).toBeInTheDocument();
  });

  it("shows no winner marker on a tie", () => {
    renderTable([
      { label: "Beta", valueA: 1.1, valueB: 1.1, higherIsBetter: false },
    ]);

    expect(screen.queryByText("(better)")).not.toBeInTheDocument();
  });

  it("does not declare a winner when a value is non-numeric", () => {
    renderTable([
      { label: "Recommendation", valueA: "Buy", valueB: "Hold", higherIsBetter: true },
    ]);

    expect(screen.queryByText("(better)")).not.toBeInTheDocument();
    expect(screen.getByText("Buy")).toBeInTheDocument();
    expect(screen.getByText("Hold")).toBeInTheDocument();
  });

  it("renders an em dash for null/undefined/empty values", () => {
    renderTable([
      { label: "Missing", valueA: null, valueB: undefined, higherIsBetter: false },
      { label: "Empty", valueA: "", valueB: "", higherIsBetter: null },
    ]);

    // four "—" placeholders across the two rows
    expect(screen.getAllByText("—")).toHaveLength(4);
  });

  it("renders one row per metric", () => {
    renderTable([
      { label: "P/E (TTM)", valueA: 28.4, valueB: 31.2, higherIsBetter: false },
      { label: "P/S", valueA: 7.9, valueB: 11.2, higherIsBetter: false },
      { label: "ROE", valueA: 33.2, valueB: 41.0, higherIsBetter: true },
    ]);

    expect(screen.getByText("P/E (TTM)")).toBeInTheDocument();
    expect(screen.getByText("P/S")).toBeInTheDocument();
    expect(screen.getByText("ROE")).toBeInTheDocument();
  });
});
