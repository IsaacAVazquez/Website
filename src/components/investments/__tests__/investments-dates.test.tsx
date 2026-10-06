import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";

jest.mock("@/hooks/useInvestments", () => ({
  useInvestments: () => ({
    holdings: [],
    enhancedHoldings: [],
    summary: { totalValue: 0 },
    isLoading: false,
    error: null,
    lastUpdated: null,
    snapshots: [],
    persistenceStatus: "persistent",
    addHolding: jest.fn(),
    updateHolding: jest.fn(),
    removeHolding: jest.fn(),
    refetch: jest.fn(),
  }),
}));

jest.mock("@/hooks/useStockData", () => ({
  useStockData: (_symbol: string | null, section: string) => ({
    data:
      section === "news"
        ? [{ title: "Apple expands services push", reportDate: "2025-03-21" }]
        : null,
  }),
}));

jest.mock("@/lib/investmentsClientData", () => ({
  getClientInvestmentsIndex: jest.fn(),
}));

jest.mock("../PortfolioSummary", () => ({ PortfolioSummary: () => null }));
jest.mock("../AddStockForm", () => ({ AddStockForm: () => null }));
jest.mock("../ResearchSection", () => ({ ResearchSection: () => null }));
jest.mock("../StockSearch", () => ({ StockSearch: () => null }));
jest.mock("../retirement/RetirementPlanner", () => ({
  RetirementPlanner: () => null,
}));

import { InvestmentsDashboard } from "../InvestmentsDashboard";
import { ResearchOverview } from "../ResearchOverview";
import { getClientInvestmentsIndex } from "@/lib/investmentsClientData";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
const mockIndex = getClientInvestmentsIndex as jest.Mock;

describe("investments date labels", () => {
  let container: HTMLDivElement;
  let root: Root;
  let formatted: jest.SpyInstance;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    formatted = jest.spyOn(Date.prototype, "toLocaleDateString");
    mockIndex.mockResolvedValue({ entries: [] });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    formatted.mockRestore();
  });

  // The server renders in UTC. A label formatted in the viewer's zone printed
  // Sep 14 in a Pacific browser and failed hydration with React error 418. The
  // text check catches that on a machine west of UTC, and the option check
  // catches it on a UTC runner, where both zones print the same day.
  function expectEveryDateInUtc() {
    expect(formatted).toHaveBeenCalled();
    for (const [, options] of formatted.mock.calls) {
      expect(options).toMatchObject({ timeZone: "UTC" });
    }
  }

  it("prints the dataset date on the day the server printed it", async () => {
    await act(async () => {
      root.render(
        <InvestmentsDashboard
          researchSymbol="AAPL"
          researchTab="overview"
          onResearchSymbolChange={() => {}}
          onResearchTabChange={() => {}}
          datasetLastUpdated="2026-09-15T01:03:45.681080+00:00"
        />
      );
    });

    expect(container.textContent).toContain("Research data as of Sep 15, 2026");
    expect(container.textContent).toContain("Curated snapshot · Sep 15, 2026");
    expectEveryDateInUtc();
  });

  it("counts recent prices against today and ignores the count frozen at build", async () => {
    const daysAgo = (days: number) =>
      new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
    mockIndex.mockResolvedValue({
      entries: [
        { symbol: "AAPL", priceAsOf: daysAgo(2) },
        { symbol: "MSFT", priceAsOf: daysAgo(30) },
        { symbol: "V", priceAsOf: daysAgo(45) },
      ],
    });

    await act(async () => {
      root.render(
        <InvestmentsDashboard
          researchSymbol="AAPL"
          researchTab="overview"
          onResearchSymbolChange={() => {}}
          onResearchTabChange={() => {}}
          datasetLastUpdated="2026-09-15T01:03:45.681080+00:00"
          datasetPriceHealth={{
            assessedAt: "2026-09-15T01:03:45.681080+00:00",
            maxAgeDays: 7,
            pricedCount: 3,
            recentCount: 3,
            delayedCount: 0,
            missingCount: 0,
            oldestAsOf: "2026-09-11",
            latestAsOf: "2026-09-11",
          }}
        />
      );
    });

    expect(container.textContent).toContain("1 recent price histories");
    expect(container.textContent).toContain("2 delayed histories");
    expect(container.textContent).not.toContain("3 recent price histories");
  });

  it("prints a news date on the day the provider reported", async () => {
    await act(async () => {
      root.render(<ResearchOverview symbol="AAPL" />);
    });

    expect(container.textContent).toContain("Mar 21, 2025");
    expectEveryDateInUtc();
  });
});

describe("investments task choice", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    mockIndex.mockResolvedValue({ entries: [] });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const sheetOrder = () =>
    Array.from(container.querySelectorAll("[data-task]")).map((sheet) => sheet.getAttribute("data-task"));

  async function renderWith(task: "portfolio" | "research" | "retirement" | undefined, onTaskChange = jest.fn()) {
    await act(async () => {
      root.render(
        <InvestmentsDashboard
          task={task}
          onTaskChange={onTaskChange}
          researchSymbol=""
          researchTab="overview"
          onResearchSymbolChange={() => {}}
          onResearchTabChange={() => {}}
        />
      );
    });
    return onTaskChange;
  }

  // Every workspace stays on the page, so section links and a print still
  // reach all three. The choice only decides which one comes first.
  it("prints the chosen workspace first and keeps the other two after it", async () => {
    await renderWith(undefined);
    expect(sheetOrder()).toEqual(["portfolio", "research", "retirement"]);

    const portfolioSheet = container.querySelector('[data-task="portfolio"]');
    await renderWith("retirement");
    expect(sheetOrder()).toEqual(["retirement", "research", "portfolio"]);
    // The same node moved, so what a visitor typed into a workspace survives the choice.
    expect(container.querySelector('[data-task="portfolio"]')).toBe(portfolioSheet);

    await renderWith("research");
    expect(sheetOrder()).toEqual(["research", "portfolio", "retirement"]);
  });

  it("marks the chosen task and reports a new choice", async () => {
    const onTaskChange = await renderWith("research");
    const choice = (name: string) =>
      Array.from(container.querySelectorAll<HTMLButtonElement>('[role="group"][aria-labelledby="invest-task-label"] button')).find(
        (button) => button.textContent === name
      )!;

    expect(choice("Research").getAttribute("aria-pressed")).toBe("true");
    expect(choice("Portfolio").getAttribute("aria-pressed")).toBe("false");

    act(() => choice("Retirement").click());
    expect(onTaskChange).toHaveBeenCalledWith("retirement");
  });
});
