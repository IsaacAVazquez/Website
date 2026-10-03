import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { PortfolioHeroCard } from "../PortfolioHeroCard";
import { toLocalDateKey } from "@/lib/date-formatters";
import type { PortfolioSnapshot, PortfolioSummary } from "@/types/investment";

let mockReducedMotion = false;
jest.mock("@/hooks/useReducedMotion", () => ({
  useReducedMotion: () => mockReducedMotion,
}));

// jest.setup.js installs an observer that never reports. This one reports a
// 600px wide chart as soon as it observes, the way a laid-out page would.
const SetupResizeObserver = global.ResizeObserver;
class ReportingResizeObserver {
  constructor(private callback: ResizeObserverCallback) {}
  observe() {
    this.callback(
      [{ contentRect: { width: 600 } } as ResizeObserverEntry],
      this as unknown as ResizeObserver
    );
  }
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  global.ResizeObserver = ReportingResizeObserver as unknown as typeof ResizeObserver;
  mockReducedMotion = false;
});
afterEach(() => {
  global.ResizeObserver = SetupResizeObserver;
  jest.useRealTimers();
});

const summary: PortfolioSummary = {
  totalValue: 12345.678,
  totalCost: 10000,
  totalGainLoss: 2345.68,
  totalGainLossPercent: 23.4568,
  dayChange: 123.45,
  dayChangePercent: 1.004,
};

function daysAgo(n: number, totalValue: number): PortfolioSnapshot {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return { date: toLocalDateKey(d), totalValue, totalCost: 10000, holdingCount: 3 };
}

const baseProps = {
  summary,
  snapshots: [] as PortfolioSnapshot[],
  isLoading: false,
  marketStatus: "Market open",
  hasLiveQuotes: true,
  allQuotesLive: true,
};

function chart(container: HTMLElement) {
  return container.querySelector(".invest-chart-wrap svg") as SVGSVGElement;
}

function pressed() {
  return screen
    .getAllByRole("button")
    .filter((b) => b.getAttribute("aria-pressed") === "true")
    .map((b) => b.textContent);
}

describe("PortfolioHeroCard summary", () => {
  it("shows a fetching skeleton before the first quotes arrive", () => {
    render(<PortfolioHeroCard {...baseProps} summary={{ ...summary, totalValue: 0 }} isLoading />);
    expect(screen.getByRole("status")).toHaveTextContent("Fetching market quotes");
    expect(screen.queryByRole("region", { name: "Portfolio total value" })).toBeNull();
  });

  it("splits the balance and signs the day and all-time changes", () => {
    const { container } = render(<PortfolioHeroCard {...baseProps} />);
    expect(screen.getByRole("region", { name: "Portfolio total value" })).toBeInTheDocument();
    expect(screen.getByText("Total portfolio value · Market open", { exact: false })).toBeInTheDocument();
    const balance = container.querySelector(".invest-hero-balance") as HTMLElement;
    expect(Array.from(balance.children).map((c) => c.textContent)).toEqual(["$12,345", ".68", "USD"]);

    const chip = container.querySelector(".chip") as HTMLElement;
    expect(chip.textContent).toBe("+$123.45");
    expect(chip.className).toContain("pos");
    expect(screen.getByText("+1.00% latest session")).toBeInTheDocument();
    expect(screen.getByText("+23.46% all time")).toBeInTheDocument();
    expect(container.querySelector(".invest-hero-livedot")).not.toBeNull();
  });

  it("marks a losing session and a partial set of live quotes", () => {
    const { container } = render(
      <PortfolioHeroCard
        {...baseProps}
        allQuotesLive={false}
        summary={{ ...summary, dayChange: -50, dayChangePercent: -0.4, totalGainLossPercent: -2 }}
      />
    );
    const chip = container.querySelector(".chip") as HTMLElement;
    expect(chip.textContent).toBe("−$50.00");
    expect(chip.className).toContain("neg");
    expect(screen.getByText("−0.40% latest session · partial")).toBeInTheDocument();
    expect(screen.getByText("−2.00% all time")).toBeInTheDocument();
  });

  it("says the day change is unavailable without live quotes", () => {
    const { container } = render(<PortfolioHeroCard {...baseProps} hasLiveQuotes={false} />);
    expect(screen.getByText("Day change unavailable")).toBeInTheDocument();
    expect(container.querySelector(".chip")).toBeNull();
    expect(container.querySelector(".invest-hero-livedot")).toBeNull();
  });

  it("wires the add and refresh actions and links to research", () => {
    const onAddHolding = jest.fn();
    const onRefresh = jest.fn();
    render(<PortfolioHeroCard {...baseProps} onAddHolding={onAddHolding} onRefresh={onRefresh} />);

    fireEvent.click(screen.getByRole("button", { name: "Add holding" }));
    expect(onAddHolding).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Refresh data" }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "Open research" })).toHaveAttribute("href", "#research-section");
  });

  it("omits the actions it was not given", () => {
    render(<PortfolioHeroCard {...baseProps} />);
    expect(screen.queryByRole("button", { name: "Add holding" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Refresh data/ })).toBeNull();
  });

  it("says how long ago the data refreshed and disables refresh while loading", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-10-03T12:00:30Z"));
    const lastUpdated = new Date("2026-10-03T11:55:00Z");
    render(<PortfolioHeroCard {...baseProps} isLoading lastUpdated={lastUpdated} onRefresh={jest.fn()} />);
    const refresh = screen.getByRole("button", { name: "Refresh data · 5m ago" });
    expect(refresh).toBeDisabled();
  });
});

describe("PortfolioHeroCard chart", () => {
  it("tells a first visit how the line starts", () => {
    const { container } = render(<PortfolioHeroCard {...baseProps} />);
    expect(pressed()).toEqual(["ALL"]);
    const tspans = Array.from(chart(container).querySelectorAll("tspan")).map((t) => t.textContent);
    expect(tspans).toEqual(["A point is saved each day you visit,", "and the line draws once there are two."]);
    expect(chart(container).querySelector("path")).toBeNull();
  });

  it("starts on the narrowest range holding two points", () => {
    const { container } = render(
      <PortfolioHeroCard {...baseProps} snapshots={[daysAgo(60, 9000), daysAgo(20, 9500), daysAgo(1, 10000)]} />
    );
    expect(pressed()).toEqual(["1M"]);
    // Two of the three points fall in the month, so the line draws.
    expect(chart(container).querySelectorAll("path")).toHaveLength(2);
    expect(chart(container).querySelectorAll("circle.inv-hero-point")).toHaveLength(2);
  });

  it("says a picked range is too sparse, and redraws when a wider one is picked", () => {
    const { container } = render(
      <PortfolioHeroCard {...baseProps} snapshots={[daysAgo(80, 9000), daysAgo(40, 9500)]} />
    );
    expect(pressed()).toEqual(["3M"]);

    fireEvent.click(screen.getByRole("button", { name: "1W" }));
    expect(pressed()).toEqual(["1W"]);
    const tspans = Array.from(chart(container).querySelectorAll("tspan")).map((t) => t.textContent);
    expect(tspans).toEqual(["Not enough saved points", "in this range yet."]);

    fireEvent.click(screen.getByRole("button", { name: "ALL" }));
    expect(chart(container).querySelectorAll("path")).toHaveLength(2);
  });

  it("falls back to ALL when only the full history has two points", () => {
    render(<PortfolioHeroCard {...baseProps} snapshots={[daysAgo(800, 5000), daysAgo(500, 7000)]} />);
    expect(pressed()).toEqual(["ALL"]);
  });

  it("labels the value axis in compact dollars and the time axis by day", () => {
    const { container } = render(
      <PortfolioHeroCard {...baseProps} snapshots={[daysAgo(6, 10000), daysAgo(3, 12000), daysAgo(0, 15000)]} />
    );
    const labels = Array.from(chart(container).querySelectorAll("g > text")).map((t) => t.textContent ?? "");
    const dollars = labels.filter((l) => l.startsWith("$"));
    expect(dollars.length).toBeGreaterThan(1);
    dollars.forEach((l) => expect(l).toMatch(/^\$\d+(\.\d+)?k$/));
    const days = labels.filter((l) => !l.startsWith("$"));
    expect(days.length).toBeGreaterThan(0);
    days.forEach((l) => expect(l).toMatch(/^[A-Z][a-z]{2} \d{2}$/));
  });

  it("pulses the latest point unless reduced motion is asked for", () => {
    const snapshots = [daysAgo(2, 10000), daysAgo(1, 11000)];
    const { container, unmount } = render(<PortfolioHeroCard {...baseProps} snapshots={snapshots} />);
    expect(chart(container).querySelectorAll("animate")).toHaveLength(2);
    unmount();

    mockReducedMotion = true;
    const reduced = render(<PortfolioHeroCard {...baseProps} snapshots={snapshots} />);
    expect(chart(reduced.container).querySelectorAll("animate")).toHaveLength(0);
    // The static ring still marks the latest point.
    expect(chart(reduced.container).querySelectorAll("circle[r='6']")).toHaveLength(1);
  });

  it("drops the per-point dots on a long history", () => {
    const snapshots = Array.from({ length: 25 }, (_, i) => daysAgo(25 - i, 10000 + i * 10));
    const { container } = render(<PortfolioHeroCard {...baseProps} snapshots={snapshots} />);
    expect(pressed()).toEqual(["1W"]);
    fireEvent.click(screen.getByRole("button", { name: "1M" }));
    expect(chart(container).querySelectorAll("circle.inv-hero-point")).toHaveLength(0);
    expect(chart(container).querySelectorAll("path")).toHaveLength(2);
  });

  it("keeps a flat history drawable", () => {
    const { container } = render(
      <PortfolioHeroCard {...baseProps} snapshots={[daysAgo(2, 10000), daysAgo(1, 10000)]} />
    );
    const line = chart(container).querySelectorAll("path")[1];
    expect(line.getAttribute("d")).not.toMatch(/NaN/);
  });
});
