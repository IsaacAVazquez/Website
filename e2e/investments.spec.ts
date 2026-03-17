import { expect, test } from "@playwright/test";

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

  test("supports mocked on-demand ticker research mode", async ({ page }) => {
    await page.route("**/api/investments/index", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          symbols: ["AAPL", "MSFT"],
          failed: [],
          lastUpdated: "2026-03-16T08:00:00.000Z",
        }),
      });
    });

    await page.route("**/api/investments/data/SHOP?*", async (route) => {
      const url = new URL(route.request().url());
      const section = url.searchParams.get("section");
      const capabilities = {
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
        dcf: false,
        industry: false,
        news: false,
        compare: false,
      };

      const payload = (() => {
        switch (section) {
          case "info":
            return {
              data: {
                shortName: "SHOP",
                longName: "Shopify",
                sector: "Technology",
                industry: "Software",
                country: "Canada",
              },
              source: "on-demand",
              capabilities,
              lastUpdated: "2026-03-16T08:05:00.000Z",
            };
          case "fundamentals":
            return {
              data: {
                ttmPe: 45.3,
                psRatio: 12.4,
                pbRatio: 6.2,
                pegRatio: 1.8,
                marketCap: 105000000000,
              },
              source: "on-demand",
              capabilities,
              lastUpdated: "2026-03-16T08:05:00.000Z",
            };
          case "profitability":
            return {
              data: { roe: 12.2, roic: 9.4 },
              source: "on-demand",
              capabilities,
              lastUpdated: "2026-03-16T08:05:00.000Z",
            };
          case "margins":
            return {
              data: [{ grossMargin: 52.1, netMargin: 11.4, fcfMargin: 14.2 }],
              source: "on-demand",
              capabilities,
              lastUpdated: "2026-03-16T08:05:00.000Z",
            };
          case "growth":
            return {
              data: [{ metric: "Revenue YoY", yoyGrowth: 18.5 }],
              source: "on-demand",
              capabilities,
              lastUpdated: "2026-03-16T08:05:00.000Z",
            };
          case "price":
            return {
              data: [
                {
                  report_date: "2026-03-14",
                  date: "2026-03-14",
                  open: 102,
                  high: 108,
                  low: 101,
                  close: 106,
                  volume: 1000,
                },
                {
                  report_date: "2026-03-15",
                  date: "2026-03-15",
                  open: 106,
                  high: 110,
                  low: 104,
                  close: 108,
                  volume: 1200,
                },
              ],
              source: "on-demand",
              capabilities,
              lastUpdated: "2026-03-16T08:05:00.000Z",
            };
          case "beta":
            return {
              data: { beta5y: 1.12 },
              source: "on-demand",
              capabilities,
              lastUpdated: "2026-03-16T08:05:00.000Z",
            };
          case "wacc":
            return {
              data: { wacc: 9.1 },
              source: "on-demand",
              capabilities,
              lastUpdated: "2026-03-16T08:05:00.000Z",
            };
          case "dcf":
            return {
              error: "DCF data unavailable",
              source: "on-demand",
              capabilities,
              lastUpdated: "2026-03-16T08:05:00.000Z",
            };
          case "news":
            return {
              error: 'Section "news" is available for curated research symbols only.',
              source: "on-demand",
              capabilities,
              lastUpdated: "2026-03-16T08:05:00.000Z",
            };
          default:
            return {
              data: { quarterly: [], annual: [] },
              source: "on-demand",
              capabilities,
              lastUpdated: "2026-03-16T08:05:00.000Z",
            };
        }
      })();

      await route.fulfill({
        status: section === "dcf" || section === "news" ? 404 : 200,
        contentType: "application/json",
        body: JSON.stringify(payload),
      });
    });

    await page.goto("/investments");
    await page.getByRole("textbox", { name: /search stock symbol/i }).fill("SHOP");
    await page.getByRole("textbox", { name: /search stock symbol/i }).press("Enter");

    await expect(page.getByText(/Live snapshot mode for/i)).toBeVisible();
    await expect(page.getByRole("tab", { name: /overview/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /financials/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /growth/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /valuation/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /chart/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^dcf$/i })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: /industry/i })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: /compare/i })).toHaveCount(0);
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
