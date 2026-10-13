import { expect, test } from "@playwright/test";
import { openTool } from "./browserReady";

test.describe("March Madness", () => {
  test("loads the default route with metadata and no horizontal overflow", async ({ page }) => {
    await page.goto("/march-madness-2026");

    await expect(
      page.getByRole("heading", { name: /march madness bracket analysis/i }).first()
    ).toBeVisible();

    await expect(page.getByText(/top upset picks/i)).toBeVisible();
    await expect(page.getByText(/why this model is different/i)).toBeVisible();

    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toContain("/march-madness-2026");

    const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(ogImage).toContain("/march-madness-2026/opengraph-image");

    const ldJsonBlocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ldJsonBlocks.some((block) => block.includes('"@type":"FAQPage"'))).toBeTruthy();
    expect(ldJsonBlocks.some((block) => block.includes('"@type":"Article"'))).toBeTruthy();
    expect(
      ldJsonBlocks.some(
        (block) =>
          block.includes('"applicationCategory":"SportsApplication"') &&
          block.includes("March Madness 2026 Bracket Analysis")
      )
    ).toBeTruthy();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(hasHorizontalOverflow).toBeFalsy();
  });

  test("supports hero CTAs and deep-link states", async ({ page }) => {
    await page.goto("/march-madness-2026");

    await page.getByRole("link", { name: /see best upsets/i }).click();
    await expect(page).toHaveURL(/view=picks/);
    await expect(page.getByText(/time zone upsets/i)).toBeVisible();

    await page.goto("/march-madness-2026");
    await page.getByRole("link", { name: /how the model works/i }).click();
    await expect(page).toHaveURL(/#why-this-model-is-different/);
    await expect(page.getByRole("heading", { name: /why this model is different/i })).toBeVisible();

    await page.goto("/march-madness-2026?view=analytics&analytics=s-curve");
    await expect(page.getByRole("heading", { name: /S-curve seed errors/i })).toBeVisible();
    await expect(page.getByText(/Vanderbilt \+5/i).first()).toBeVisible();

    await page.goto("/march-madness-2026?view=bracket&region=west");
    await expect(page.getByText("San Jose, CA (PT)", { exact: true })).toBeVisible();

    await page.goto("/march-madness-2026?view=picks");
    await expect(page.getByText(/analytics upsets/i)).toBeVisible();
  });

  test("comes back to an open pick with Back", async ({ page }) => {
    await openTool(page, "/march-madness-2026?view=picks");

    const pick = page.locator('[aria-controls="pick-body-tz-0"]');
    await pick.click();
    await expect(pick).toHaveAttribute("aria-expanded", "true");
    await expect(page).toHaveURL(/view=picks&pick=tz-0/);

    await page.getByRole("link", { name: "Read the postmortem", exact: true }).click();
    await expect(page).toHaveURL(/\/writing\/2026-march-madness-postmortem/);

    await page.goBack();
    await expect(page).toHaveURL(/view=picks&pick=tz-0/);
    await expect(pick).toHaveAttribute("aria-expanded", "true");
  });

  test("comes back to an open pick when the reader leaves before the router answers", async ({ page }) => {
    // A slow connection: the route's own navigation responses are held, prefetches are not.
    await page.route(
      (url) => url.pathname === "/march-madness-2026",
      async (route) => {
        const headers = route.request().headers();
        if (headers["rsc"] && !headers["next-router-prefetch"] && !headers["next-router-segment-prefetch"]) {
          await new Promise((resolve) => setTimeout(resolve, 900));
        }
        await route.fallback();
      }
    );
    await openTool(page, "/march-madness-2026?view=picks");

    const pick = page.locator('[aria-controls="pick-body-tz-0"]');
    await pick.click();
    // The address names the pick before the held response can have come back.
    await expect(page).toHaveURL(/view=picks&pick=tz-0/, { timeout: 500 });

    await page.getByRole("link", { name: "Read the postmortem", exact: true }).click();
    await expect(page).toHaveURL(/\/writing\/2026-march-madness-postmortem/);

    await page.goBack();
    await expect(page).toHaveURL(/view=picks&pick=tz-0/);
    await expect(pick).toHaveAttribute("aria-expanded", "true");
    await page.unrouteAll({ behavior: "ignoreErrors" });
  });

  test("links to the companion article from the bracket tool", async ({ page }) => {
    await page.goto("/march-madness-2026");

    const articleCard = page.getByRole("link", { name: /read the companion article/i });

    await expect(articleCard).toBeVisible();
    await expect(articleCard).toHaveAttribute("href", "/writing/2026-march-madness-bracket-analysis");
  });
});
