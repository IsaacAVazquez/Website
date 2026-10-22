import { expect, test } from "@playwright/test";

const ROUTE = "/investments/before-you-buy";
const status = (page: import("@playwright/test").Page) => page.locator('.byb-result [role="status"]');

test.describe("Before You Buy", () => {
  test("opens with a worked comparison and a clear data boundary", async ({ page }) => {
    await page.goto(ROUTE);
    await expect(status(page)).toContainText("9.1%");
    await expect(page.getByRole("heading", { level: 1, name: "Before You Buy" })).toBeVisible();
    await expect(page.getByText("An independent concept by Isaac Vazquez, not affiliated with or endorsed by Google.", { exact: false })).toBeVisible();
    const comparison = page.getByRole("region", { name: "Purchase comparison (scrollable)" });
    await expect(comparison.getByRole("columnheader", { name: "Buy SPY" })).toBeVisible();
    await expect(page.getByText(/I don't have their underlying holdings/)).toBeVisible();
    await expect(page.getByRole("region", { name: "The market's five worst days (scrollable)" }).locator("tbody tr")).toHaveCount(5);
  });

  test("picks an alternative from its own suggestion list", async ({ page }) => {
    await page.goto(ROUTE);
    await expect(status(page)).toContainText("NVDA");
    const search = page.getByRole("combobox", { name: "Alternative stock" });
    await search.fill("xo");
    const list = page.locator('.byb [role="listbox"]');
    await expect(list).toBeVisible();
    const fieldColour = await search.evaluate((field) => getComputedStyle(field).backgroundColor);
    await expect(list).toHaveCSS("background-color", fieldColour);
    await list.getByRole("option", { name: /^XOM/ }).click();
    await expect(page.getByRole("region", { name: "Purchase comparison (scrollable)" }).getByRole("columnheader", { name: "Buy XOM" })).toBeVisible();
  });

  test("edits and restores a draft without overwriting saved investments", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("portfolio_holdings", JSON.stringify([{ symbol: "AAPL", shares: 10, averageCost: 200 }])));
    await page.goto(ROUTE);
    await expect(status(page)).toContainText("NVDA");
    await expect(page.getByRole("button", { name: "Your saved holdings" })).toHaveAttribute("aria-pressed", "true");
    await page.getByText(/View and edit/).click();
    await page.getByLabel("AAPL value in dollars").fill("10000");
    await expect(status(page)).toContainText("33.3%");
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("portfolio_holdings")!))).toEqual([{ symbol: "AAPL", shares: 10, averageCost: 200 }]);
    await page.reload();
    await expect(status(page)).toContainText("33.3%");
    await expect(page.getByRole("button", { name: "Your draft" })).toHaveAttribute("aria-pressed", "true");
  });

  test("adds a holding and handles an invalid amount", async ({ page }) => {
    await page.goto(ROUTE);
    await expect(status(page)).toContainText("NVDA");
    await page.getByText(/View and edit/).click();
    await page.getByRole("combobox", { name: "Add holding symbol" }).fill("KO");
    await page.getByRole("option", { name: /^KO/ }).click();
    await page.getByLabel("New holding value in dollars").fill("10000");
    await page.getByRole("button", { name: "Add holding", exact: true }).click();
    await expect(status(page)).toContainText("7.7%");
    await page.getByLabel("Amount in dollars").fill("0");
    await expect(status(page)).toContainText("Enter an amount above zero");
    await expect(page.getByText("Not investment advice.", { exact: true })).toBeVisible();
  });

  test("keeps a long portfolio collapsed before the result on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => localStorage.setItem("portfolio_holdings", JSON.stringify(["SPY", "AAPL", "MSFT", "GOOGL", "AMZN", "JPM", "COST", "NVDA", "XOM", "KO", "V", "ABBV", "ACN", "ADBE"].map((symbol) => ({ symbol, shares: 10, averageCost: 100 })))));
    await page.goto(ROUTE);
    await expect(status(page)).toContainText("NVDA");
    const search = await page.getByRole("combobox", { name: "Search stock symbol", exact: true }).boundingBox();
    const result = await status(page).boundingBox();
    expect(result!.y - search!.y).toBeLessThanOrEqual(844);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByText(/View and edit/).click();
    await expect(page.locator(".byb-editor tbody tr")).toHaveCount(14);
  });

  test("renders both themes, the open editor, mobile, and print without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(ROUTE);
    await expect(status(page)).toContainText("NVDA");
    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    await expect(page.locator(".byb")).toHaveCSS("background-color", "rgb(253, 253, 252)");
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await expect(page.locator(".byb")).toHaveCSS("background-color", "rgb(18, 19, 21)");
    await page.getByText(/View and edit/).click();
    await expect(page.locator(".byb-editor")).toBeVisible();
    await page.getByText(/View and edit/).click();
    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    await expect(page.locator(".byb")).toHaveCSS("background-color", "rgb(253, 253, 252)");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ media: "print" });
    await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
    await expect(page.locator(".byb-how")).toHaveAttribute("open", "");
    expect(errors).toEqual([]);
  });
});
