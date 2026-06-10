import { test, expect } from "@playwright/test";

// Structural shell invariants for the primary routes. We deliberately do NOT
// pin exact hero copy here — that drifts with editorial redesigns (and broke
// this suite once already). The data-layer ordering/copy is covered by unit
// tests; here we assert each route has a title, exactly one h1, one main
// landmark, and no horizontal overflow.
const routes = ["/", "/portfolio", "/contact", "/writing", "/resume"];

test.describe("Portfolio shell", () => {
  for (const path of routes) {
    test(`${path} has a title, exactly one h1, and one main landmark`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveTitle(/Isaac Vazquez/);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1").first()).toBeVisible();

      const layoutState = await page.evaluate(() => ({
        mainCount: document.querySelectorAll("main").length,
        hasOverflow:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth + 1,
      }));

      expect(layoutState.mainCount).toBe(1);
      expect(layoutState.hasOverflow).toBe(false);
    });
  }

  test("/portfolio renders the masthead, the pinned featured project, and the card index", async ({ page }) => {
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Investment Analytics Platform is pinned as the featured spotlight.
    await expect(
      page.getByRole("heading", { name: /investment analytics platform/i })
    ).toBeVisible();
    // The (paginated) archive renders project cards. The full ordered index is
    // verified at the data layer in src/constants/__tests__/caseStudies.test.ts;
    // here we just confirm the index populates with real cards.
    const cardTitles = await page.getByTestId("portfolio-card-title").allTextContents();
    expect(cardTitles.length).toBeGreaterThan(0);
  });
});
