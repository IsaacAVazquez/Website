import { expect, test } from "@playwright/test";

const curatedIndex = {
  symbols: ["AAPL", "MSFT"],
  failed: [],
  lastUpdated: "2026-03-16T08:00:00.000Z",
};

const appleSnapshot = {
  symbol: "AAPL",
  source: "prefetched",
  lastUpdated: "2026-03-16T08:00:00.000Z",
  capabilities: {
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
  },
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

test.describe("Investments", () => {
  test("is discoverable from main navigation", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("link", { name: /investments/i }).first()).toBeVisible();
    await page.getByRole("link", { name: /investments/i }).first().click();

    await expect(page).toHaveURL(/.*investments/);
    await expect(
      page.getByRole("heading", { name: /investment research platform/i })
    ).toBeVisible();
  });

  test("loads curated research from static assets and blocks non-curated symbols", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (
        url.includes("/data/investments/") ||
        url.includes("/api/investments/data/")
      ) {
        requests.push(url);
      }
    });

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

    await page.route("**/data/investments/SHOP/snapshot.json", async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "text/plain",
        body: "Not found",
      });
    });

    await page.goto("/investments");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("tab", { name: /overview/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /financials/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /growth/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /valuation/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /industry/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^dcf$/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /chart/i })).toBeVisible();
    await expect(page.getByText(/live snapshot mode/i)).toHaveCount(0);

    await page.getByRole("textbox", { name: /search stock symbol/i }).fill("SHOP");
    await page.getByRole("textbox", { name: /search stock symbol/i }).press("Enter");

    await expect(
      page.getByText(/research is currently available for curated symbols only/i)
    ).toBeVisible();

    expect(requests.filter((url) => url.includes("/api/investments/data/"))).toHaveLength(0);
    expect(requests.filter((url) => url.includes("/data/investments/index.json")).length).toBe(1);
    expect(requests.filter((url) => url.includes("/data/investments/AAPL/snapshot.json")).length).toBe(1);
    expect(requests.filter((url) => url.includes("/data/investments/SHOP/snapshot.json"))).toHaveLength(0);
  });

  test("keeps the shell stable across top-level tabs and avoids horizontal overflow", async ({ page }) => {
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

    await page.goto("/investments");
    await page.waitForLoadState("networkidle");

    const shell = page.locator('[data-testid="investments-shell"]');
    const before = await shell.boundingBox();

    await page.getByRole("tab", { name: /my portfolio/i }).click();
    await page.waitForLoadState("networkidle");

    const after = await shell.boundingBox();

    expect(before).not.toBeNull();
    expect(after).not.toBeNull();
    expect(Math.abs((after?.width ?? 0) - (before?.width ?? 0))).toBeLessThan(2);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(hasHorizontalOverflow).toBeFalsy();
  });

  test("homepage prioritizes the fintech project in selected work", async ({ page }) => {
    await page.goto("/");
    const section = page.locator('section[aria-label="Selected work"]');

    await expect(section.getByRole("heading", { name: /selected work/i })).toBeVisible();

    const titles = await section.locator("h3").allTextContents();
    expect(titles.slice(0, 3)).toEqual([
      "Investment Analytics Platform",
      "Transforming Client Reporting into Self-Service Analytics",
      "Scaling a Platform to 60M+ Users",
    ]);
  });
});
