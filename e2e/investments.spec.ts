import { expect, test, type Locator, type Page } from "@playwright/test";

async function expectInvestmentsShell(page: Page) {
  await expect(page.getByTestId("investments-shell")).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Investments$/i })).toBeVisible();
}

async function waitForClientInvestmentsIndex(page: Page) {
  await page.waitForResponse((response) => {
    const url = new URL(response.url());

    return (
      url.pathname === "/data/investments/index.json" &&
      response.request().resourceType() === "fetch"
    );
  });
}

// A browser lays a print out from the page as it stands when the beforeprint
// listeners return, so this reads the planner in the same task as the event.
async function readPlannerAtPrint(page: Page) {
  return page.evaluate(() => {
    window.dispatchEvent(new Event("beforeprint"));
    const planner = document.querySelector("#retirement");
    return {
      text: planner?.textContent ?? "",
      leverRows: planner?.querySelectorAll(".invest-retire-lever-label").length ?? 0,
      chartPaths: planner?.querySelectorAll(".invest-retire-chart svg path").length ?? 0,
    };
  });
}

const curatedIndex = {
  symbols: ["AAPL", "MSFT", "V"],
  failed: [],
  lastUpdated: "2026-03-16T08:00:00.000Z",
  entries: [
    {
      symbol: "AAPL",
      shortName: "Apple",
      longName: "Apple Inc.",
      searchText: "aapl apple apple inc",
    },
    {
      symbol: "MSFT",
      shortName: "Microsoft",
      longName: "Microsoft Corporation",
      searchText: "msft microsoft microsoft corporation",
    },
    {
      symbol: "V",
      shortName: "Visa",
      longName: "Visa Inc.",
      searchText: "v visa visa inc visa inc class a",
    },
  ],
};

const baseCapabilities = {
  info: true,
  fundamentals: true,
  profitability: true,
  margins: true,
  growth: true,
  income_statement: true,
  balance_sheet: true,
  cash_flow: true,
  price: true,
  beta: true,
  wacc: true,
  dcf: true,
  industry: true,
  news: true,
  compare: true,
};

const appleSnapshot = {
  symbol: "AAPL",
  source: "prefetched",
  lastUpdated: "2026-03-16T08:00:00.000Z",
  capabilities: baseCapabilities,
  sections: {
    info: {
      shortName: "Apple",
      longName: "Apple Inc.",
      sector: "Technology",
      industry: "Consumer Electronics",
      country: "United States",
    },
    fundamentals: {
      ttmPe: 28.4,
      psRatio: 7.9,
      pbRatio: 41.2,
      pegRatio: 2.1,
      marketCap: 2900000000000,
    },
    profitability: { roe: 33.2, roic: 28.4, roa: 19.1 },
    margins: [{ grossMargin: 46.1, netMargin: 24.4, fcfMargin: 25.7 }],
    growth: [{ metric: "Revenue YoY", yoyGrowth: 8.5 }],
    income_statement: { quarterly: [], annual: [] },
    balance_sheet: { quarterly: [], annual: [] },
    cash_flow: { quarterly: [], annual: [] },
    beta: { beta5y: 1.12 },
    wacc: { wacc: 8.4 },
    dcf: { fairValue: 220, currentPrice: 198, upside: 11.1, recommendation: "Hold" },
    industry: [{ metric: "P/E (TTM)", value: 28.4, industryAvg: 31.2 }],
    news: [{ title: "Apple expands services push", publisher: "Reuters" }],
    price: [
      { date: "2026-03-14", open: 192, high: 197, low: 191, close: 195, volume: 1000 },
      { date: "2026-03-15", open: 195, high: 199, low: 194, close: 198, volume: 1200 },
    ],
  },
};

const visaSnapshot = {
  symbol: "V",
  source: "prefetched",
  lastUpdated: "2026-03-16T08:00:00.000Z",
  capabilities: baseCapabilities,
  sections: {
    ...appleSnapshot.sections,
    info: {
      shortName: "Visa",
      longName: "Visa Inc.",
      sector: "Financial Services",
      industry: "Credit Services",
      country: "United States",
      longBusinessSummary: "Visa operates a global payments network.",
    },
    fundamentals: {
      ttmPe: 31.2,
      psRatio: 15.2,
      pbRatio: 14.9,
      pegRatio: 2.4,
      marketCap: 620000000000,
    },
    dcf: { fairValue: 340, currentPrice: 340.12, upside: -3.5, recommendation: "Hold" },
    beta: { beta5y: 0.95 },
    price: [
      { date: "2026-02-26", open: 334, high: 339, low: 333, close: 338.2, volume: 900 },
      { date: "2026-02-27", open: 338.2, high: 341.4, low: 337.5, close: 340.12, volume: 925 },
    ],
  },
};

const currentQuoteAsOf = new Date().toISOString();

const quotesBySymbol = {
  AAPL: {
    symbol: "AAPL",
    price: 201.32,
    change: 2.14,
    changePercent: 1.07,
    dayHigh: 202.1,
    dayLow: 198.8,
    open: 199.4,
    previousClose: 199.18,
    volume: 1000000,
    marketCap: 0,
    name: "Apple Inc.",
    asOf: currentQuoteAsOf,
    source: "finnhub",
  },
  V: {
    symbol: "V",
    price: 352.45,
    change: 3.1,
    changePercent: 0.89,
    dayHigh: 353,
    dayLow: 348.2,
    open: 349.7,
    previousClose: 349.35,
    volume: 2500000,
    marketCap: 0,
    name: "Visa Inc.",
    asOf: currentQuoteAsOf,
    source: "finnhub",
  },
} as const;

async function routeInvestmentsFixtures(
  page: Page,
  options: {
    quoteResponse?: (symbols: string[]) => Record<string, unknown>;
  } = {}
) {
  await page.route("**/data/investments/index.json", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(curatedIndex),
    });
  });

  await page.route("**/data/investments/AAPL/snapshot.json", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(appleSnapshot),
    });
  });

  await page.route("**/data/investments/V/snapshot.json", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(visaSnapshot),
    });
  });

  await page.route("**/api/investments/quotes?**", async (route) => {
    const url = new URL(route.request().url());
    const symbols = (url.searchParams.get("symbols") ?? "")
      .split(",")
      .map((symbol) => symbol.trim().toUpperCase())
      .filter(Boolean);

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        options.quoteResponse
          ? options.quoteResponse(symbols)
          : {
              quotes: symbols
                .map((symbol) => quotesBySymbol[symbol as keyof typeof quotesBySymbol])
                .filter(Boolean),
              timestamp: "2026-03-16T15:30:00.000Z",
            }
      ),
    });
  });
}

test.describe("Investments", () => {
  test("is discoverable from the Catalog 97 navigation through the dashboards index", async ({ page }) => {
    await routeInvestmentsFixtures(page);
    await page.goto("/accessibility");

    const mainNav = page.getByRole("navigation", { name: "Main" });
    await expect(mainNav.getByRole("link", { name: /^Dashboards$/ })).toBeVisible();
    await mainNav.getByRole("link", { name: /^Dashboards$/ }).click();
    await expect(page).toHaveURL(/\/dashboards$/);

    const tile = page.getByRole("main").locator('a[href="/investments"]').first();
    await expect(tile).toBeVisible();
    await tile.click();
    await expectInvestmentsShell(page);
    await expect(page).toHaveURL(/.*investments/);
  });

  test("supports deep-linked research and uses live price separately from history", async ({ page }) => {
    await routeInvestmentsFixtures(page);

    await page.goto("/investments?view=research&symbol=V&section=overview");
    await expectInvestmentsShell(page);

    await expect(page.getByRole("combobox", { name: /search stock symbol/i })).toHaveValue("V");
    await expect(page.getByText("Visa Inc.")).toBeVisible();
    await expect(page.getByText("$352.45")).toBeVisible();
    await expect(page.getByText(/market quote as of/i).first()).toBeVisible();

    await page.getByRole("tab", { name: /^chart$/i }).click();
    await expect(page).toHaveURL(/section=chart/);
    await expect(page.getByRole("heading", { name: /price history/i })).toBeVisible();
  });

  test("finds Visa by company name and preserves selected research context after reload", async ({ page }) => {
    await routeInvestmentsFixtures(page);

    const indexLoaded = waitForClientInvestmentsIndex(page);
    await page.goto("/investments");
    await expectInvestmentsShell(page);
    await indexLoaded;

    const search = page.getByRole("combobox", { name: /search stock symbol/i });
    await search.fill("visa");
    await expect(page.getByRole("listbox", { name: /symbol suggestions/i })).toBeVisible();
    await expect(page.getByRole("option", { name: /^V\s+Visa Inc\.$/i })).toBeVisible();
    await search.press("Enter");

    await expect(page).toHaveURL(/symbol=V/);
    await expect(page.getByText("Visa Inc.")).toBeVisible();

    await page.getByRole("tab", { name: /^chart$/i }).click();
    await expect(page).toHaveURL(/section=chart/);
    await expect(page.getByRole("heading", { name: /price history/i })).toBeVisible();

    await page.reload();
    await expectInvestmentsShell(page);

    await expect(page).toHaveURL(/symbol=V/);
    await expect(page).toHaveURL(/section=chart/);
    await expect(page.getByText("Visa Inc.")).toBeVisible();
    await expect(page.getByRole("heading", { name: /price history/i })).toBeVisible();
  });

  test("blocks non-curated symbols without fetching an unknown snapshot", async ({ page }) => {
    const requests: string[] = [];

    await routeInvestmentsFixtures(page);
    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("/data/investments/")) {
        requests.push(url);
      }
    });

    await page.goto("/investments");
    await expectInvestmentsShell(page);

    const search = page.getByRole("combobox", { name: /search stock symbol/i });
    await search.fill("SHOP");
    await page.waitForTimeout(300);

    await search.press("Enter");

    await expect(page).not.toHaveURL(/symbol=SHOP/);
    expect(requests.filter((url) => url.includes("/data/investments/index.json")).length).toBe(1);
    expect(requests.filter((url) => url.includes("/data/investments/SHOP/snapshot.json"))).toHaveLength(0);
  });

  test("handles direct links to non-curated symbols without requesting an unknown snapshot", async ({ page }) => {
    const requests: string[] = [];

    await routeInvestmentsFixtures(page);
    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("/data/investments/")) {
        requests.push(url);
      }
    });

    await page.goto("/investments?view=research&symbol=SHOP&section=overview");
    await expectInvestmentsShell(page);

    await expect(page.getByRole("combobox", { name: /search stock symbol/i })).toHaveValue("SHOP");
    await expect(
      page.getByText("This symbol is not in the current research set.")
    ).toBeVisible();
    expect(requests.filter((url) => url.includes("/data/investments/SHOP/snapshot.json"))).toHaveLength(0);
  });

  test("falls back to the latest historical close when live pricing is unavailable", async ({ page }) => {
    await routeInvestmentsFixtures(page, {
      quoteResponse: (symbols) => ({
        quotes: symbols.map((symbol) => ({
          symbol,
          price: 0,
          change: 0,
          changePercent: 0,
          dayHigh: 0,
          dayLow: 0,
          open: 0,
          previousClose: 0,
          volume: 0,
          marketCap: 0,
          name: symbol === "V" ? "Visa Inc." : symbol,
          error: "Live price is temporarily unavailable. Showing the latest saved data instead.",
        })),
        allFailed: true,
        rateLimited: false,
        timestamp: "2026-03-16T15:30:00.000Z",
      }),
    });

    await page.goto("/investments?view=research&symbol=V&section=overview");
    await expectInvestmentsShell(page);

    await expect(page.getByText("$340.12")).toBeVisible();
    await expect(page.getByText(/price as of feb 27, 2026/i)).toBeVisible();
    await expect(page.getByText(/showing the latest saved close from feb 27, 2026/i)).toBeVisible();
    await expect(page.getByText(/market quote is temporarily unavailable/i)).toBeVisible();
    await expect(page.getByText(/^Unavailable$/)).toHaveCount(0);
  });

  test("keeps the shell stable across section navigation and avoids horizontal overflow", async ({ page }) => {
    await routeInvestmentsFixtures(page);

    await page.goto("/investments?view=research&symbol=V&section=chart");
    await expectInvestmentsShell(page);

    const shell = page.locator('[data-testid="investments-shell"]');
    const before = await shell.boundingBox();

    // The section sidebar is desktop-only (it collapses to display:none at
    // mobile widths). Click the nav link where it exists; otherwise reach the
    // section the way a mobile visitor does, by scrolling it into view.
    const researchLink = page.getByRole("link", { name: /^research$/i });
    if (await researchLink.isVisible()) {
      await researchLink.click();
    } else {
      await page.locator("#research-section").scrollIntoViewIfNeeded();
    }
    await expect(page.locator("#research-section")).toBeInViewport();

    const after = await shell.boundingBox();

    expect(before).not.toBeNull();
    expect(after).not.toBeNull();
    expect(Math.abs((after?.width ?? 0) - (before?.width ?? 0))).toBeLessThan(2);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(hasHorizontalOverflow).toBeFalsy();
  });

  test("prints the retirement projection when the planner was never scrolled to", async ({ page }) => {
    await routeInvestmentsFixtures(page);

    await page.goto("/investments");
    await expectInvestmentsShell(page);

    // The planner is the last section and holds its projection back until it
    // is near the viewport. Nothing in this test scrolls.
    await expect(page.locator("#retirement")).toContainText("Crunching scenarios");

    // The event only reaches the planner once the page has hydrated, so it is
    // repeated until a copy holds the verdict. That same copy then has to hold
    // everything else, because a print does not get a second pass.
    let printed = await readPlannerAtPrint(page);
    await expect
      .poll(async () => {
        printed = await readPlannerAtPrint(page);
        return printed.text;
      })
      .toMatch(/\d+ of 100/);

    expect(printed.text).not.toContain("Crunching scenarios");
    expect(printed.chartPaths).toBeGreaterThan(0);
    expect(printed.leverRows).toBeGreaterThan(0);
    expect(printed.text).toContain("Capital market assumptions:");
    expect(printed.text).toMatch(/educational purposes only/i);
  });

  test("prints in its narrow layout from a desktop window", async ({ page }) => {
    await routeInvestmentsFixtures(page);
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "portfolio_holdings",
        JSON.stringify([{ symbol: "AAPL", shares: 2, averageCost: 150 }]),
      );
    });

    // Wider than every breakpoint the page has, so nothing below can lean on a
    // width query.
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto("/investments?view=research&symbol=V&section=overview");
    await expectInvestmentsShell(page);
    await expect(page.locator(".invest-holdings th.col-trend")).toBeVisible();
    await expect(page.locator(".research-key-metrics").first()).toBeVisible();

    // Safari's engine answers a width query with the window's width while it
    // lays the print out at the paper's, so print media at this viewport is
    // the state its print is in.
    await page.emulateMedia({ media: "print" });

    const readLayout = () =>
      page.evaluate(() => {
        const style = (selector: string) => {
          const node = document.querySelector(selector);
          return node ? getComputedStyle(node) : null;
        };
        const columns = (selector: string) =>
          style(selector)?.gridTemplateColumns.split(" ").length ?? null;
        return {
          shellColumns: columns(".invest-shell"),
          sidebar: style(".invest-sidebar")?.display ?? null,
          sectionRail: style("[class*='sectionRail']")?.display ?? null,
          heroColumns: columns(".invest-hero"),
          statColumns: columns("[class*='statsGrid']"),
          trendColumn: style(".invest-holdings th.col-trend")?.display ?? null,
          metricColumns: columns(".research-key-metrics"),
          railStart: style(".invest-rail")?.gridColumnStart ?? null,
          plannerColumns: columns("#retirement .invest-retire-layout"),
        };
      });

    // The page draws the research view again while the route settles its URL,
    // so the read repeats until every piece is on the page.
    await expect.poll(readLayout).toEqual({
      shellColumns: 1,
      sidebar: "none",
      sectionRail: "flex",
      heroColumns: 1,
      statColumns: 2,
      trendColumn: "none",
      metricColumns: 2,
      railStart: "1",
      plannerColumns: 1,
    });
  });

  test("keeps the disclaimers and the assumptions on the printed page", async ({ page }) => {
    await routeInvestmentsFixtures(page);

    await page.goto("/investments");
    await expectInvestmentsShell(page);

    const planner = page.locator("#retirement");
    await planner.scrollIntoViewIfNeeded();
    await expect(planner.getByLabel("Assumptions used")).toBeVisible();

    await page.emulateMedia({ media: "print" });

    await expect(page.getByText(/general information\s+and education only/i)).toBeVisible();
    await expect(planner.getByLabel("Assumptions used")).toBeVisible();
    await expect(planner.getByLabel("Important disclaimer")).toContainText(
      /educational purposes only/i,
    );
    await expect(planner.getByLabel("Important disclaimer")).toBeVisible();
  });

  test("homepage prioritizes the fintech project in projects", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("section").filter({
      has: page.getByRole("heading", { name: /selected work/i }),
    });

    await expect(section).toBeVisible();
    await expect(page.getByRole("heading", { name: /selected work/i })).toBeVisible();

    // Each project heading ends in an aria-hidden "↗" glyph, which textContent
    // still reports; compare the titles without it.
    const titles = (
      await section.getByRole("heading", { level: 3 }).allTextContents()
    ).map((title) => title.replace(/\s*↗\s*$/u, "").trim());
    expect(titles.slice(0, 3)).toEqual([
      "Investment Analytics Platform",
      "News Pulse Dashboard",
      "Interchange IQ",
    ]);
  });
});

// Where a link that names a section should leave the page. The section's top
// sits at the top of the viewport, under its scroll margin, or the page is as
// far down as it goes. Anything else is reported as the position it found.
async function readLanding(page: Page, id: string) {
  return page.evaluate((fragment) => {
    const section = document.getElementById(fragment);
    if (!section) return `#${fragment} is not on the page`;
    const top = section.getBoundingClientRect().top;
    const margin = parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
    const lowest = document.documentElement.scrollHeight - window.innerHeight;
    const atTheTop = Math.abs(top - margin) <= 2;
    const asFarAsItGoes = Math.abs(window.scrollY - lowest) <= 2 && top > margin;
    return atTheTop || asFarAsItGoes
      ? "landed"
      : `#${fragment} is ${Math.round(top)}px down the viewport at scrollY ${Math.round(window.scrollY)}`;
  }, id);
}

const savedHoldings = [
  { symbol: "V", shares: 10, averageCost: 200 },
  { symbol: "AAPL", shares: 5, averageCost: 150 },
];

test.describe("Investments links that name a section", () => {
  // The targets the sidebar links to on an empty portfolio, plus the form the
  // stats panel links to.
  for (const id of ["hero", "performance", "portfolio-stats", "add-holding", "research-section", "retirement"]) {
    test(`a fresh load of #${id} lands on it`, async ({ page }) => {
      await routeInvestmentsFixtures(page);

      await page.goto(`/investments?symbol=V&section=chart#${id}`);
      await expectInvestmentsShell(page);

      await expect.poll(() => readLanding(page, id)).toBe("landed");

      // The research data and the planner's projection both arrive after the
      // first landing and change the height of the page.
      await expect(page.getByRole("heading", { name: /price history/i })).toBeVisible();
      await expect.poll(() => readLanding(page, id)).toBe("landed");
    });
  }

  // The holdings ledger and the allocation chart only render once the saved
  // positions load, which is after the page has hydrated.
  for (const id of ["holdings-list", "allocation"]) {
    test(`a fresh load of #${id} lands on it once the saved holdings render`, async ({ page }) => {
      await page.addInitScript((holdings) => {
        window.localStorage.setItem("portfolio_holdings", JSON.stringify(holdings));
      }, savedHoldings);
      await routeInvestmentsFixtures(page);

      await page.goto(`/investments#${id}`);
      await expectInvestmentsShell(page);

      await expect.poll(() => readLanding(page, id)).toBe("landed");
    });
  }

  test("holds the section in place when saved holdings render above it", async ({ page }) => {
    await page.addInitScript((holdings) => {
      window.localStorage.setItem("portfolio_holdings", JSON.stringify(holdings));
    }, savedHoldings);
    await routeInvestmentsFixtures(page);

    await page.goto("/investments?symbol=V&section=chart#research-section");
    await expectInvestmentsShell(page);

    // The ledger and the quotes render above the research section.
    await expect(page.locator("#holdings-list")).toBeVisible();
    await expect(page.getByText("$352.45").first()).toBeVisible();
    await expect.poll(() => readLanding(page, "research-section")).toBe("landed");
  });

  test("keeps the fragment when it rewrites a legacy link", async ({ page }) => {
    await routeInvestmentsFixtures(page);

    await page.goto("/investments?view=research&symbol=V&section=chart#research-section");
    await expectInvestmentsShell(page);

    await expect(page).toHaveURL(/\/investments\?symbol=V&section=chart#research-section$/);
    await expect.poll(() => readLanding(page, "research-section")).toBe("landed");
  });

  test("holds the section in place when the page grows above it", async ({ page }) => {
    await routeInvestmentsFixtures(page);

    await page.goto("/investments?symbol=V&section=chart#research-section");
    await expectInvestmentsShell(page);
    await expect.poll(() => readLanding(page, "research-section")).toBe("landed");

    await growPageAheadOf(page, "#hero", 300);

    await expect.poll(() => readLanding(page, "research-section")).toBe("landed");
  });

  test("leaves the page where the visitor put it", async ({ page }) => {
    await routeInvestmentsFixtures(page);

    await page.goto("/investments?symbol=V&section=chart#research-section");
    await expectInvestmentsShell(page);
    await expect.poll(() => readLanding(page, "research-section")).toBe("landed");

    // A scroll by any means moves the page off the landing, so a scripted one
    // stands in for the wheel, the keyboard, and the scrollbar. It comes a
    // moment after the landing, as a visitor's would.
    await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    const positions = await growPageAheadOf(page, "#hero", 300);

    expect(positions).toEqual(positions.map(() => 0));
  });
});

// Grows the page ahead of an element, the way late content does, and reads
// where the page sits in each of the frames that follow.
async function growPageAheadOf(page: Page, selector: string, pixels: number) {
  return page.evaluate(
    async ({ ahead, height }) => {
      const spacer = document.createElement("div");
      spacer.style.height = `${height}px`;
      const element = document.querySelector(ahead);
      if (!element) throw new Error(`Nothing on the page matches ${ahead}`);
      element.before(spacer);

      const positions: number[] = [];
      for (let frame = 0; frame < 12; frame += 1) {
        await new Promise((next) => requestAnimationFrame(next));
        positions.push(Math.round(window.scrollY));
      }
      return positions;
    },
    { ahead: selector, height: pixels },
  );
}

// The chart sets its type in SVG user units, 20 at desktop and 40 under 640px,
// so both sizes are measured.
const chartViewports = [
  { name: "desktop type", width: 1280, height: 800 },
  { name: "phone type", width: 390, height: 844 },
];

type ChartPlan = { name: string; stored: Record<string, number> | null };

// Where the last tick lands depends on the plan's ages. These put it short of
// the right edge, on the edge, at a three digit age, and on the edge of a plan
// that runs two years.
const chartPlans: ChartPlan[] = [
  { name: "the sample plan, 35 to 95", stored: null },
  { name: "a plan that ends on a tick, 35 to 90", stored: { currentAge: 35, retirementAge: 65, horizonAge: 90 } },
  { name: "the longest plan, 18 to 110", stored: { currentAge: 18, retirementAge: 65, horizonAge: 110 } },
  { name: "the shortest plan, 89 to 91", stored: { currentAge: 89, retirementAge: 90, horizonAge: 91 } },
];

// The labels at the edges of the plot depend on the ages as well. These put
// the retirement marker near the right edge, a tick on both edges, a three
// digit tick on the right edge, a tick just inside the left edge, and three
// digit ticks side by side.
const edgePlans: ChartPlan[] = [
  { name: "the sample plan, 35 to 95", stored: null },
  { name: "a late retirement, 70 on a plan from 35 to 75", stored: { currentAge: 35, retirementAge: 70, horizonAge: 75 } },
  { name: "a plan with a tick on both edges, 40 to 100", stored: { currentAge: 40, retirementAge: 65, horizonAge: 100 } },
  { name: "the longest plan, 18 to 110", stored: { currentAge: 18, retirementAge: 65, horizonAge: 110 } },
  { name: "the shortest plan, 89 to 91", stored: { currentAge: 89, retirementAge: 90, horizonAge: 91 } },
  { name: "a plan that ends past 100, 70 to 110", stored: { currentAge: 70, retirementAge: 75, horizonAge: 110 } },
];

async function openRetirementChart(
  page: Page,
  viewport: { width: number; height: number },
  stored: ChartPlan["stored"],
) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  if (stored) {
    await page.addInitScript((plan) => {
      window.localStorage.setItem("retirement_plan", JSON.stringify({ version: 1, plan }));
    }, stored);
  }
  await routeInvestmentsFixtures(page);

  await page.goto("/investments");
  await expectInvestmentsShell(page);

  // The planner holds its projection back until it is near the viewport.
  await page.locator("#retirement").scrollIntoViewIfNeeded();
  const chart = page.locator("#retirement .invest-retire-chart");
  await expect(chart.locator("svg text.is-x").first()).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  return chart;
}

// Every label in the drawing with its box on screen, next to the drawing's own
// box. The drawing clips at that box, so a label that crosses it loses ink.
async function measureChartLabels(chart: Locator) {
  return chart.evaluate((figure) => {
    const drawing = figure.querySelector("svg");
    if (!drawing) throw new Error("The chart has no drawing.");
    const boxOf = (node: Element) => {
      const { left, right, top, bottom } = node.getBoundingClientRect();
      return { left, right, top, bottom };
    };
    return {
      drawing: boxOf(drawing),
      // The lowest gridline is the $0 line, which is the floor of the plot.
      floor: Math.max(...[...drawing.querySelectorAll("line.grid")].map((line) => boxOf(line).bottom)),
      labels: [...drawing.querySelectorAll("text")].map((node) => ({
        text: (node.textContent ?? "").trim(),
        axis: node.classList.contains("is-x")
          ? ("age" as const)
          : node.classList.contains("is-marker")
            ? ("marker" as const)
            : ("balance" as const),
        ...boxOf(node),
      })),
    };
  });
}

test.describe("Retirement projection chart", () => {
  test.describe("label boxes", () => {
    // Every engine reports the same length for a label, so the chart lays out
    // the same in each. Firefox then reports a box for SVG text that is 3px
    // wider than the text on each side and about 2px taller above and below,
    // at any size, so a box there says nothing about the ink.
    test.skip(({ browserName }) => browserName === "firefox", "Firefox pads the box it reports for SVG text");

    for (const viewport of chartViewports) {
      for (const plan of edgePlans) {
        test(`keeps every label inside the drawing at ${viewport.name} for ${plan.name}`, async ({ page }) => {
          const chart = await openRetirementChart(page, viewport, plan.stored);
          const { drawing, labels } = await measureChartLabels(chart);

          expect(labels.map((label) => label.axis)).toEqual(
            expect.arrayContaining(["age", "balance", "marker"]),
          );

          const clipped = labels.flatMap((label) => {
            const past = {
              left: drawing.left - label.left,
              right: label.right - drawing.right,
              top: drawing.top - label.top,
              bottom: label.bottom - drawing.bottom,
            };
            return Object.entries(past)
              .filter(([, by]) => by > 0)
              .map(([edge, by]) => `"${label.text}" runs ${by.toFixed(1)}px past the ${edge} edge`);
          });
          expect(clipped).toEqual([]);
        });

        test(`keeps the age ticks clear of the other labels at ${viewport.name} for ${plan.name}`, async ({ page }) => {
          const chart = await openRetirementChart(page, viewport, plan.stored);
          const { labels } = await measureChartLabels(chart);

          const ages = labels.filter((label) => label.axis === "age");
          const rest = labels.filter((label) => label.axis !== "age");
          expect(ages.length).toBeGreaterThan(1);
          expect(rest.map((label) => label.text)).toContain("$0");

          const collisions: string[] = [];
          ages.forEach((age, index) => {
            // A tick is held against the ticks after it and against every other label.
            for (const other of [...ages.slice(index + 1), ...rest]) {
              const across = Math.min(age.right, other.right) - Math.max(age.left, other.left);
              const down = Math.min(age.bottom, other.bottom) - Math.max(age.top, other.top);
              if (across > 0 && down > 0) {
                collisions.push(
                  `"${age.text}" and "${other.text}" overlap by ${across.toFixed(1)}px across and ${down.toFixed(1)}px down`,
                );
              }
            }
          });
          expect(collisions).toEqual([]);
        });
      }

      test(`keeps the age ticks below the plot at ${viewport.name}`, async ({ page }) => {
        const chart = await openRetirementChart(page, viewport, null);
        const { floor, labels } = await measureChartLabels(chart);

        const ages = labels.filter((label) => label.axis === "age");
        expect(ages.length).toBeGreaterThan(1);

        const raised = ages
          .filter((age) => age.top < floor)
          .map((age) => `"${age.text}" starts ${(floor - age.top).toFixed(1)}px above the floor of the plot`);
        expect(raised).toEqual([]);
      });
    }
  });

  test("labels whole ages on a plan that runs two years", async ({ page }) => {
    const chart = await openRetirementChart(page, chartViewports[0], {
      currentAge: 89,
      retirementAge: 90,
      horizonAge: 91,
    });
    const { labels } = await measureChartLabels(chart);

    const ages = labels.filter((label) => label.axis === "age").map((label) => label.text);
    expect(ages.length).toBeGreaterThan(1);
    expect(ages.filter((age) => !/^\d+$/.test(age))).toEqual([]);
  });

  for (const viewport of chartViewports) {
    for (const plan of chartPlans) {
      test(`keeps the age label clear of the age ticks at ${viewport.name} for ${plan.name}`, async ({ page }) => {
        const chart = await openRetirementChart(page, viewport, plan.stored);

        const { named, ticks } = await chart.evaluate((figure) => {
          const measure = (node: Element) => {
            const box = node.getBoundingClientRect();
            return {
              text: (node.textContent ?? "").trim(),
              left: box.left,
              right: box.right,
              top: box.top,
              bottom: box.bottom,
            };
          };
          // The axis is named by whichever element holds the word itself,
          // whether that sits in the drawing or in the caption above it.
          const holdsTheWord = (node: Element) =>
            [...node.childNodes].some(
              (child) => child.nodeType === Node.TEXT_NODE && /\bage\b/i.test(child.textContent ?? ""),
            );
          return {
            named: [...figure.querySelectorAll("*")].filter(holdsTheWord).map(measure),
            ticks: [...figure.querySelectorAll("svg text.is-x")].map(measure),
          };
        });

        expect(named.length, "the chart says its x axis is age").toBeGreaterThan(0);
        expect(ticks.length).toBeGreaterThan(1);

        const row = [...named, ...ticks];
        const collisions: string[] = [];
        row.forEach((a, index) => {
          for (const b of row.slice(index + 1)) {
            const across = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const down = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            if (across > 0 && down > 0) {
              collisions.push(`"${a.text}" and "${b.text}" overlap by ${across.toFixed(1)}px`);
            }
          }
        });
        expect(collisions).toEqual([]);
      });
    }
  }

  test("keeps the caption on the chart's page when the page prints", async ({ page }) => {
    await routeInvestmentsFixtures(page);

    await page.goto("/investments");
    await expectInvestmentsShell(page);
    await page.locator("#retirement").scrollIntoViewIfNeeded();

    // The caption names the x axis. A drawing never splits across pages, so
    // the one break this rule can stop is the one between the two.
    await expect(page.locator("#retirement .invest-retire-chart")).toHaveCSS("break-inside", "avoid");
  });
});
