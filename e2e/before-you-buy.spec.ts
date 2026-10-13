import { expect, test } from "@playwright/test";

const ROUTE = "/investments/before-you-buy";
const DISCLAIMER = "An independent concept by Isaac Vazquez, not affiliated with or endorsed by Google.";

test.describe("Before You Buy", () => {
  test("opens on the sample portfolio with the disclaimer and a worked example", async ({ page }) => {
    await page.goto(ROUTE);

    await expect(page.getByRole("heading", { level: 1, name: "Before You Buy" })).toBeVisible();
    await expect(page.getByText(DISCLAIMER)).toBeVisible();
    const summary = page.locator('.byb-result [role="status"]');
    await expect(summary).toContainText("Adding $5,000 of NVIDIA Corporation (NVDA) to this $50,000 portfolio");
    await expect(page.getByRole("heading", { name: "The market's five worst days" })).toBeVisible();
    await expect(page.locator("table").last().locator("tbody tr")).toHaveCount(5);
  });

  test("an example buy rewrites the summary", async ({ page }) => {
    await page.goto(ROUTE);
    const summary = page.locator('.byb-result [role="status"]');
    await expect(summary).toContainText("(NVDA)");

    await page.getByRole("button", { name: "XOM", exact: true }).click();

    await expect(summary).toContainText("Exxon Mobil Corporation (XOM)");
    await expect(summary).toContainText("Energy");
  });

  test("uses the holdings saved on /investments", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "portfolio_holdings",
        JSON.stringify([{ symbol: "AAPL", shares: 10, averageCost: 200 }])
      );
    });
    await page.goto(ROUTE);

    await expect(page.getByRole("button", { name: "Your saved holdings" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('.byb-result [role="status"]')).toContainText(/to this \$[\d,]+ portfolio/);
    const holdings = page.getByRole("table").first().locator("tbody tr");
    await expect(holdings).toHaveCount(1);
    await expect(holdings.first()).toContainText("AAPL");
  });

  test("lists search suggestions in the route's own palette and picks one", async ({ page }) => {
    await page.goto(ROUTE);
    const summary = page.locator('.byb-result [role="status"]');
    // The summary names the buy once the page has hydrated and the index has loaded.
    await expect(summary).toContainText("(NVDA)");

    const search = page.getByRole("combobox", { name: "Search stock symbol" });
    await search.fill("xo");
    // The list portals into the route root, so it reads the route's palette
    // and paints the same field colour as the search above it.
    const list = page.locator('.byb [role="listbox"]');
    await expect(list).toBeVisible();
    const fieldColour = await search.evaluate((field) => getComputedStyle(field).backgroundColor);
    await expect(list).toHaveCSS("background-color", fieldColour);

    await list.getByRole("option", { name: /^XOM/ }).click();
    await expect(summary).toContainText("(XOM)");
  });

  test("keeps the result within a screen of the inputs on a phone with many saved holdings", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      const symbols = ["SPY", "AAPL", "MSFT", "GOOGL", "AMZN", "JPM", "COST", "NVDA", "XOM", "KO", "V", "ABBV", "ACN", "ADBE"];
      window.localStorage.setItem(
        "portfolio_holdings",
        JSON.stringify(symbols.map((symbol) => ({ symbol, shares: 10, averageCost: 100 })))
      );
    });
    await page.goto(ROUTE);

    const summary = page.locator('.byb-result [role="status"]');
    await expect(summary).toContainText(/to this \$[\d,]+ portfolio/);
    await expect(page.getByRole("table").first().locator("tbody tr")).toHaveCount(14);

    // The holdings scroll inside their own region, so fourteen rows do not
    // push the summary a screen below the stock field that rewrites it.
    const search = await page.getByRole("combobox", { name: "Search stock symbol" }).boundingBox();
    const result = await summary.boundingBox();
    expect(result!.y - search!.y).toBeLessThanOrEqual(844);
  });
});
