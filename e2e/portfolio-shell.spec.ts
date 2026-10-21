import { test, expect } from "@playwright/test";
import { expectAlignedLayout } from "./layoutChecks";

// Structural shell invariants for the primary routes. We deliberately do NOT
// pin exact hero copy here — that drifts with editorial redesigns (and broke
// this suite once already). The data-layer ordering/copy is covered by unit
// tests; here we assert each route has a title, exactly one h1, one main
// landmark, no horizontal overflow, and edges that line up with the header.
const routes = ["/", "/portfolio", "/writing", "/dashboards", "/about", "/resume", "/contact"];

test.describe("Portfolio shell", () => {
  for (const path of routes) {
    test(`${path} has a title, exactly one h1, and one main landmark`, async ({ page }) => {
      await page.goto(path);

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
      await expectAlignedLayout(page);
    });
  }

  test("/portfolio renders the masthead, lead projects, write-ups, and the way to the inventory", async ({ page }) => {
    await page.goto("/portfolio");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: /before you buy/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^juno$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^civitech$/i })).toBeVisible();
    await expect(page.locator('main a[href="/dashboards"]')).toHaveCount(1);

    // The inventory controls moved to /dashboards on 2026-10-19.
    await expect(page.getByRole("searchbox")).toHaveCount(0);
    await expect(page.getByRole("combobox")).toHaveCount(0);

    // Entries link straight to each live tool instead of through the
    // /portfolio/<slug> redirect.
    expect(await page.locator('main a[href="/investments"]').count()).toBeGreaterThan(0);
    expect(await page.locator('main a[href^="/portfolio/"]').count()).toBe(0);
  });
});
