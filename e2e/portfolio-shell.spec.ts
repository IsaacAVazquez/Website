import { test, expect } from "@playwright/test";

const routeExpectations = [
  {
    path: "/",
    title: /Product Manager \| UC Berkeley Haas MBA \| Portfolio & Case Studies \| Isaac Vazquez/,
    h1: /isaac vazquez/i,
  },
  {
    path: "/portfolio",
    title: /Projects \| Isaac Vazquez/,
    h1: /all projects across product, analytics & tooling/i,
  },
  {
    path: "/contact",
    title: /Contact \| Isaac Vazquez/,
    h1: /get in touch/i,
  },
  {
    path: "/writing",
    title: /Writing \| Isaac Vazquez/,
    h1: /notes on product, ai & judgment/i,
  },
  {
    path: "/resume",
    title: /Resume \| Isaac Vazquez/,
    h1: /isaac\s*vazquez/i,
  },
];

const orderedPortfolioTitles = [
  "Investment Analytics Platform",
  "Interchange IQ",
  "News Pulse Dashboard",
  "Pulse Dashboards",
  "AI Dev Tool Ecosystem",
  "Frontier Model Tracker",
  "GitHub Trending Pulse",
  "Tech Startup Tracker",
  "Decision Lab",
  "Food Map",
  "Museum Log",
  "Wine Cellar",
  "Recipe Finder",
  "Budget Planner",
  "Job Search",
  "Polling Aggregator",
  "SpaceX Mission Control",
  "Premier League Pulse",
  "La Liga Pulse",
  "World Cup Pulse",
  "Fantasy Football Analytics Platform",
  "NFL Pulse",
  "Formula 1 Pulse",
  "PGA Tour Pulse",
  "MLB Pulse",
  "NBA Pulse",
  "March Madness 2026 Bracket Analysis",
];

test.describe("Portfolio shell", () => {
  for (const route of routeExpectations) {
    test(`${route.path} has a distinct title, one h1, and one main landmark`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveTitle(route.title);
      await expect(page.getByRole("heading", { level: 1, name: route.h1 })).toBeVisible();
      await expect(page.locator("h1")).toHaveCount(1);

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

  test("/portfolio lists every project across the paginated archive", async ({ page }) => {
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");

    const seen = new Set<string>();

    // The flagship is pinned out of the grid as the featured spotlight; its
    // cover link carries an "Open <title>" accessible name.
    const featuredAria = await page
      .locator('a[aria-label^="Open "]')
      .first()
      .getAttribute("aria-label");
    if (featuredAria) {
      seen.add(featuredAria.replace(/^Open /, "").trim());
    }

    // The archive section is the one holding the sort control; its cards are
    // h3s. Walk every page so we collect the whole index regardless of sort
    // order or page size.
    const archive = page.locator("section", {
      has: page.locator('select[aria-label="Sort projects"]'),
    });
    const nextButton = page.getByRole("button", { name: "Next", exact: true });

    for (let guard = 0; guard < 25; guard += 1) {
      const titles = await archive
        .getByRole("heading", { level: 3 })
        .allTextContents();
      titles.forEach((title) => seen.add(title.trim()));

      if (await nextButton.isDisabled()) break;
      const firstBefore = titles[0] ?? "";
      await nextButton.click();
      await expect
        .poll(async () =>
          (
            await archive.getByRole("heading", { level: 3 }).first().textContent()
          )?.trim()
        )
        .not.toBe(firstBefore);
    }

    expect([...seen].sort()).toEqual([...orderedPortfolioTitles].sort());
  });
});
