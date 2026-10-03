import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { PriceChartPanel } from "../PriceChartPanel";

type HookState = {
  data: unknown;
  isLoading: boolean;
  error: string | null;
  isNotFetched: boolean;
  refetch: jest.Mock;
};

const store: Record<string, Partial<HookState>> = {};
const refetch = jest.fn();
const requested: Array<string | null> = [];

jest.mock("@/hooks/useStockData", () => ({
  useStockData: (symbol: string | null) => {
    requested.push(symbol);
    const base = { data: null, isLoading: false, error: null, isNotFetched: false, refetch };
    // The real hook upper-cases the symbol before it reads the snapshot.
    return symbol ? { ...base, ...store[symbol.toUpperCase()] } : base;
  },
}));

const DAY = 24 * 60 * 60 * 1000;

function dateKey(ms: number) {
  return new Date(ms).toISOString().slice(0, 10);
}

/** `count` daily rows ending `endMs`, closing at `closes(i)`. */
function series(count: number, closes: (i: number) => number, endMs = Date.now()) {
  return Array.from({ length: count }, (_, i) => ({
    date: dateKey(endMs - (count - 1 - i) * DAY),
    open: closes(i),
    high: closes(i) + 1,
    low: closes(i) - 1,
    close: closes(i),
    volume: 1000 + i,
  }));
}

// jsdom lays nothing out, so give the chart's wrapper a width to draw into.
beforeAll(() => {
  jest.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(580);
});
afterAll(() => {
  jest.restoreAllMocks();
});

beforeEach(() => {
  for (const key of Object.keys(store)) delete store[key];
  requested.length = 0;
  refetch.mockReset();
});

function priceSvg() {
  return screen.getByRole("img") as unknown as SVGSVGElement;
}

function volumeBars(container: HTMLElement) {
  const svgs = container.querySelectorAll("svg.w-full");
  return Array.from(svgs[1].querySelectorAll("rect"));
}

function button(name: string | RegExp) {
  return screen.getByRole("button", { name });
}

describe("PriceChartPanel states", () => {
  it("shows a loading status", () => {
    store.AAPL = { isLoading: true };
    render(<PriceChartPanel symbol="AAPL" />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading price history");
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("shows the hook's error with a retry", () => {
    store.AAPL = { error: "Snapshot failed" };
    render(<PriceChartPanel symbol="AAPL" />);
    expect(screen.getByText("Snapshot failed")).toBeInTheDocument();
    fireEvent.click(button(/retry/i));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("treats a non-array payload as unavailable", () => {
    store.AAPL = { data: { error: "bad shape" } };
    render(<PriceChartPanel symbol="AAPL" />);
    expect(screen.getByText("Price data unavailable")).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("treats an empty series as not fetched and dates nothing", () => {
    store.AAPL = { data: [] };
    render(<PriceChartPanel symbol="AAPL" />);
    expect(screen.getByText("Price data unavailable")).toBeInTheDocument();
    expect(screen.getByText(/Historical series through —\./)).toBeInTheDocument();
    expect(screen.queryByText(/days before today/)).toBeNull();
  });
});

describe("PriceChartPanel chart", () => {
  it("draws a one-year price, moving average, and volume chart by default", () => {
    store.AAPL = { data: series(300, (i) => 100 + i) };
    const { container } = render(<PriceChartPanel symbol="AAPL" />);

    const svg = priceSvg();
    expect(svg).toHaveAttribute("aria-label", "AAPL price chart");
    expect(svg.querySelector("text[transform='rotate(-90)']")?.textContent).toBe("Price (USD)");
    // Area, close line, and 50-day average.
    const paths = svg.querySelectorAll("path:not(.domain)");
    expect(paths).toHaveLength(3);
    expect(paths[2].getAttribute("d")).toMatch(/^M/);
    expect(button("1Y")).toHaveAttribute("aria-pressed", "true");
    expect(volumeBars(container)).toHaveLength(252);
    expect(screen.queryByText(/days before today/)).toBeNull();
  });

  it("narrows the window when another range is picked", () => {
    store.AAPL = { data: series(300, (i) => 100 + i) };
    const { container } = render(<PriceChartPanel symbol="AAPL" />);

    fireEvent.click(button("1M"));
    expect(button("1M")).toHaveAttribute("aria-pressed", "true");
    expect(button("1Y")).toHaveAttribute("aria-pressed", "false");
    expect(volumeBars(container)).toHaveLength(21);

    fireEvent.click(button("6M"));
    expect(volumeBars(container)).toHaveLength(126);
  });

  it("colours volume bars by the day's direction", () => {
    // Up, down, flat (counts as up), down.
    const closes = [100, 105, 101, 101, 99];
    store.AAPL = { data: series(closes.length, (i) => closes[i]) };
    const { container } = render(<PriceChartPanel symbol="AAPL" />);
    expect(volumeBars(container).map((r) => r.getAttribute("fill"))).toEqual([
      "var(--c97-positive)",
      "var(--c97-positive)",
      "var(--c97-negative)",
      "var(--c97-positive)",
      "var(--c97-negative)",
    ]);
  });

  it("leaves the moving average empty until 50 closes exist, and toggles it off", () => {
    store.AAPL = { data: series(30, (i) => 100 + i) };
    render(<PriceChartPanel symbol="AAPL" />);
    const ma = () => priceSvg().querySelectorAll("path:not(.domain)")[2];
    expect(ma().getAttribute("d")).toBeNull();

    const toggle = button("50-day MA");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(priceSvg().querySelectorAll("path:not(.domain)")).toHaveLength(2);
  });

  it("draws a labelled cost-basis line that can be hidden", () => {
    store.AAPL = { data: series(60, (i) => 100 + i) };
    render(<PriceChartPanel symbol="AAPL" costBasis={142.5} />);

    expect(screen.getByText("Cost $142.50")).toBeInTheDocument();
    const toggle = button("Cost basis");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText("Cost $142.50")).toBeNull();
  });

  it("pins an out-of-range cost basis to the plot edge", () => {
    store.AAPL = { data: series(60, (i) => 100 + i) };
    render(<PriceChartPanel symbol="AAPL" costBasis={10_000} />);
    const label = screen.getByText("Cost $10000.00");
    // Clamped to the top of the plot, with the label 4px above the line.
    expect(label.getAttribute("y")).toBe("-4");
  });

  it.each([null, 0, -5, Number.NaN])("offers no cost-basis control for %p", (costBasis) => {
    store.AAPL = { data: series(60, (i) => 100 + i) };
    render(<PriceChartPanel symbol="AAPL" costBasis={costBasis} />);
    expect(screen.queryByRole("button", { name: "Cost basis" })).toBeNull();
    expect(screen.queryByText(/^Cost \$/)).toBeNull();
  });

  it("shows the hovered close in a tooltip and hides it on leave", () => {
    store.AAPL = { data: series(30, (i) => 100 + i * 0.5) };
    const { container } = render(<PriceChartPanel symbol="AAPL" />);
    const overlay = priceSvg().querySelector("rect[pointer-events='all']") as SVGRectElement;
    const tooltip = container.querySelector("div.absolute") as HTMLDivElement;

    fireEvent.mouseMove(overlay, { clientX: 0, clientY: 50 });
    expect(tooltip.style.display).toBe("block");
    const first = (store.AAPL.data as { date: string }[])[0].date;
    expect(tooltip.textContent).toBe(`${first}Close: $100.00`);

    fireEvent.mouseLeave(overlay);
    expect(tooltip.style.display).toBe("none");
  });

  it("warns when the history stops more than three days before today", () => {
    store.AAPL = { data: series(30, (i) => 100 + i, Date.UTC(2026, 0, 2)) };
    render(<PriceChartPanel symbol="AAPL" />);
    expect(screen.getByText(/Historical series through Jan 2, 2026\./)).toBeInTheDocument();
    expect(screen.getByText(/Historical chart data ends \d+ days before today\./)).toBeInTheDocument();
  });

  it("reads report_date when a row carries one", () => {
    store.AAPL = {
      data: series(10, (i) => 100 + i, Date.UTC(2026, 0, 20)).map(({ date, ...row }) => ({
        ...row,
        date: "ignored",
        report_date: date,
      })),
    };
    render(<PriceChartPanel symbol="AAPL" />);
    expect(screen.getByText(/Historical series through Jan 20, 2026\./)).toBeInTheDocument();
    expect(priceSvg()).toBeInTheDocument();
  });
});

describe("PriceChartPanel vs SPY", () => {
  it("does not fetch SPY until the comparison is switched on", () => {
    store.AAPL = { data: series(60, (i) => 100 + i) };
    render(<PriceChartPanel symbol="AAPL" />);
    expect(requested).not.toContain("SPY");
  });

  it("indexes both series to 100 and drops the dollar overlays", () => {
    store.AAPL = { data: series(60, (i) => 200 + i) };
    store.SPY = { data: series(60, (i) => 500 - i) };
    const { container } = render(<PriceChartPanel symbol="aapl" costBasis={210} />);

    fireEvent.click(button("vs SPY"));
    expect(requested).toContain("SPY");
    expect(button("vs SPY")).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("button", { name: "50-day MA" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Cost basis" })).toBeNull();

    const svg = priceSvg();
    expect(svg).toHaveAttribute("aria-label", "aapl price, indexed to 100 vs SPY");
    expect(svg.querySelector("text[transform='rotate(-90)']")?.textContent).toBe("Indexed (start = 100)");
    // SPY line, area, and close line, with no moving average or cost line.
    expect(svg.querySelectorAll("path:not(.domain)")).toHaveLength(3);
    expect(screen.queryByText(/^Cost \$/)).toBeNull();

    const overlay = svg.querySelector("rect[pointer-events='all']") as SVGRectElement;
    const tooltip = container.querySelector("div.absolute") as HTMLDivElement;
    fireEvent.mouseMove(overlay, { clientX: 0, clientY: 10 });
    expect(tooltip.innerHTML).toContain("AAPL: 100.0");
    expect(tooltip.innerHTML).toContain("SPY: 100.0");

    // Switching back restores the absolute chart.
    fireEvent.click(button("vs SPY"));
    expect(priceSvg()).toHaveAttribute("aria-label", "aapl price chart");
  });

  it("explains and keeps absolute prices when SPY data is missing", () => {
    store.AAPL = { data: series(60, (i) => 200 + i) };
    store.SPY = { error: "Not found", isNotFetched: true };
    render(<PriceChartPanel symbol="AAPL" />);

    fireEvent.click(button("vs SPY"));
    expect(screen.getByText(/SPY comparison data isn.t in this data build yet/)).toBeInTheDocument();
    expect(priceSvg()).toHaveAttribute("aria-label", "AAPL price chart");
  });

  it("offers no SPY comparison on SPY itself", () => {
    store.SPY = { data: series(60, (i) => 500 + i) };
    render(<PriceChartPanel symbol="SPY" />);
    expect(screen.queryByRole("button", { name: "vs SPY" })).toBeNull();
  });
});
