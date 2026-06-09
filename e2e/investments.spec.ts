import { expect, test, type Page } from "@playwright/test";

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
  test("is discoverable from main navigation", async ({ page }, testInfo) => {
    await routeInvestmentsFixtures(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    if (testInfo.project.name.includes("Mobile")) {
      await page.getByRole("button", { name: /open navigation menu/i }).click();
      const mobileNav = page.getByLabel("Mobile navigation");
      await expect(mobileNav.getByRole("link", { name: /investments/i })).toBeVisible();
      await expect(
        mobileNav.getByRole("link", { name: /investments/i })
      ).toHaveAttribute("href", "/investments");
    } else {
      await expect(
        page.getByLabel("Primary navigation").getByRole("link", { name: /investments/i })
      ).toBeVisible();
      await expect(
        page.getByLabel("Primary navigation").getByRole("link", { name: /investments/i })
      ).toHaveAttribute("href", "/investments");
    }

    await page.goto("/investments");
    await expectInvestmentsShell(page);
    await expect(page).toHaveURL(/.*investments/);
  });

  test("supports deep-linked research and uses live price separately from history", async ({ page }) => {
    await routeInvestmentsFixtures(page);

    await page.goto("/investments?view=research&symbol=V&section=overview");
    await expectInvestmentsShell(page);

    await expect(page.getByRole("textbox", { name: /search stock symbol/i })).toHaveValue("V");
    await expect(page.getByText("Visa Inc.")).toBeVisible();
    await expect(page.getByText("$352.45")).toBeVisible();
    await expect(page.getByText(/live quote/i).first()).toBeVisible();

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

    const search = page.getByRole("textbox", { name: /search stock symbol/i });
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
      if (
        url.includes("/data/investments/") ||
        url.includes("/api/investments/data/")
      ) {
        requests.push(url);
      }
    });

    await page.goto("/investments");
    await expectInvestmentsShell(page);

    const search = page.getByRole("textbox", { name: /search stock symbol/i });
    await search.fill("SHOP");
    await page.waitForTimeout(300);

    await search.press("Enter");

    await expect(page).not.toHaveURL(/symbol=SHOP/);
    expect(requests.filter((url) => url.includes("/api/investments/data/"))).toHaveLength(0);
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

    await expect(page.getByRole("textbox", { name: /search stock symbol/i })).toHaveValue("SHOP");
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
    await expect(page.getByText(/live pricing is temporarily unavailable/i)).toBeVisible();
    await expect(page.getByText(/^Unavailable$/)).toHaveCount(0);
  });

  test("keeps the shell stable across section navigation and avoids horizontal overflow", async ({ page }) => {
    await routeInvestmentsFixtures(page);

    await page.goto("/investments?view=research&symbol=V&section=chart");
    await expectInvestmentsShell(page);

    const shell = page.locator('[data-testid="investments-shell"]');
    const before = await shell.boundingBox();

    await page.getByRole("link", { name: /^research$/i }).click();
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

  test("homepage prioritizes the fintech project in projects", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("section#projects");

    await expect(section).toBeVisible();
    await expect(section.getByRole("heading", { name: /product surfaces that show how i think in practice/i })).toBeVisible();

    const titles = await section.getByRole("heading", { level: 3 }).allTextContents();
    expect(titles.slice(0, 3)).toEqual([
      "Investment Analytics Platform",
      "News Pulse Dashboard",
      "Interchange IQ",
    ]);
  });
});
