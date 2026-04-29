import { test, expect } from "@playwright/test";

const routeExpectations = [
  {
    path: "/",
    title: /Product Manager \| UC Berkeley Haas MBA \| Portfolio & Case Studies \| Isaac Vazquez/,
    h1: /product manager focused on reliability, analytics, and execution/i,
  },
  {
    path: "/portfolio",
    title: /Projects \| Isaac Vazquez/,
    h1: /all projects across product, analytics, and tooling/i,
  },
  {
    path: "/contact",
    title: /Contact \| Isaac Vazquez/,
    h1: /get in touch/i,
  },
  {
    path: "/writing",
    title: /Writing \| Isaac Vazquez/,
    h1: /notes on product strategy, operating systems, and analytics-heavy work/i,
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
  "AI Dev Tool Ecosystem",
  "Frontier Model Tracker",
  "GitHub Trending Pulse",
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
  "Fantasy Football Analytics Platform",
  "NFL Pulse",
  "Formula 1 Pulse",
  "PGA Tour Pulse",
  "MLB Pulse",
  "NBA Pulse",
  "March Madness 2026 Bracket Analysis",
  "TextOut Platform",
  "RunningMate Platform Launch",
  "Scaling a Platform to 60M+ Users",
  "Transforming Client Reporting into Self-Service Analytics",
  "Unlocking Daily Deploys Through Process Automation",
  "Preventing Outages Through Proactive Performance Intelligence",
  "Pricing Strategy Initiative",
  "Digital Acquisition Strategy",
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

  test("/portfolio shows the full ordered project index", async ({ page }) => {
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");

    const projectTitles = await page
      .locator('section[aria-label="All projects"] h3')
      .allTextContents();

    expect(projectTitles).toEqual(orderedPortfolioTitles);
  });
});
