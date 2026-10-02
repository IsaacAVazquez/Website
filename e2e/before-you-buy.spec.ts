import { expect, test } from "@playwright/test";

const ROUTE = "/investments/before-you-buy";
const DISCLAIMER = "An independent concept by Isaac Vazquez, not affiliated with or endorsed by Google.";

test.describe("Before You Buy", () => {
  test("opens on the sample portfolio with the disclaimer and a worked example", async ({ page }) => {
    await page.goto(ROUTE);

    await expect(page.getByRole("heading", { level: 1, name: "Before You Buy" })).toBeVisible();
    await expect(page.getByText(DISCLAIMER)).toBeVisible();
    const summary = page.locator('.c97-project-hero [role="status"]');
    await expect(summary).toContainText("Adding $5,000 of NVIDIA Corporation (NVDA) to this $50,000 portfolio");
    await expect(page.getByRole("heading", { name: "The market's five worst days" })).toBeVisible();
    await expect(page.locator("table").last().locator("tbody tr")).toHaveCount(5);
  });

  test("an example buy rewrites the summary", async ({ page }) => {
    await page.goto(ROUTE);
    const summary = page.locator('.c97-project-hero [role="status"]');
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
    await expect(page.locator('.c97-project-hero [role="status"]')).toContainText(/to this \$[\d,]+ portfolio/);
    const holdings = page.getByRole("table").first().locator("tbody tr");
    await expect(holdings).toHaveCount(1);
    await expect(holdings.first()).toContainText("AAPL");
  });
});
