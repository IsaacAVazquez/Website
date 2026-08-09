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

  test("/portfolio renders the masthead, lead projects, filter, and index", async ({ page }) => {
    await page.goto("/portfolio");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /investment analytics platform/i })
    ).toBeVisible();

    const filters = page.getByRole("group", {
      name: "Filter projects by category",
    });
    await expect(filters).toBeVisible();
    await expect(filters.getByRole("button", { name: /^All / })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    const search = page.getByRole("searchbox", { name: "Search projects" });
    await search.fill("investment analytics");
    await expect(
      page.getByRole("heading", { name: /investment analytics platform/i })
    ).toBeVisible();

    await search.fill("no matching project title");
    await expect(page.getByText("No projects match that search.")).toBeVisible();

    await search.fill("");
    await page.getByRole("combobox", { name: "Sort projects" }).selectOption("alpha");
    const leadTitles = await page
      .locator('section[data-c97-surface="camel"] h2')
      .allTextContents();
    expect(leadTitles).toEqual([...leadTitles].sort((left, right) => left.localeCompare(right)));

    expect(await page.locator('main a[href^="/portfolio/"]').count()).toBeGreaterThan(0);
  });
});
