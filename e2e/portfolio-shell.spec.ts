import { test, expect } from "@playwright/test";

const routeExpectations = [
  {
    path: "/",
    title: /Product Manager \| UC Berkeley Haas MBA \| Portfolio & Case Studies \| Isaac Vazquez/,
    h1: /isaac\s*vazquez/i,
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
  "Fantasy Formula 1 Optimizer",
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

  test("/portfolio surfaces every project across the featured spot and archive pages", async ({
    page,
  }) => {
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");

    // The flagship project is pinned as the featured spotlight (an <h2>),
    // pulled out of the paginated archive grid below.
    await expect(
      page.getByRole("heading", { name: "Investment Analytics Platform" }),
    ).toBeVisible();

    // The archive grid paginates (12 cards per page). Walk every page and
    // collect the project card titles (each an <h3>) so a project silently
    // dropping out of the index still fails the test.
    const archiveTitles = new Set<string>();
    const collect = async () => {
      const titles = await page.locator("h3").allTextContents();
      titles.forEach((t) => archiveTitles.add(t.trim()));
    };
    const nextButton = page.getByRole("button", { name: /^next$/i });

    await collect();
    while (!(await nextButton.isDisabled())) {
      await nextButton.click();
      await page.waitForTimeout(200);
      await collect();
    }

    const surfaced = new Set(archiveTitles);
    surfaced.add("Investment Analytics Platform");

    expect([...surfaced].sort()).toEqual([...orderedPortfolioTitles].sort());
  });
});
