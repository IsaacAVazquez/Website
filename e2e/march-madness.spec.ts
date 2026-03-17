import { expect, test } from "@playwright/test";

test.describe("March Madness", () => {
  test("loads the default route with metadata and no horizontal overflow", async ({ page }) => {
    await page.goto("/march-madness-2026");
    await page.waitForLoadState("networkidle");

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
    await page.waitForLoadState("networkidle");

    await page.getByRole("link", { name: /see best upsets/i }).click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/view=picks/);
    await expect(page.getByText(/time zone upsets/i)).toBeVisible();

    await page.goto("/march-madness-2026");
    await page.getByRole("link", { name: /how the model works/i }).click();
    await expect(page).toHaveURL(/#why-this-model-is-different/);
    await expect(page.getByRole("heading", { name: /why this model is different/i })).toBeVisible();

    await page.goto("/march-madness-2026?view=analytics&analytics=s-curve");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/underseeded — got a raw deal/i)).toBeVisible();

    await page.goto("/march-madness-2026?view=bracket&region=west");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("San Jose, CA (PT)", { exact: true })).toBeVisible();

    await page.goto("/march-madness-2026?view=picks");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/analytics upsets/i)).toBeVisible();
  });

test("publishes a companion article in the writing index", async ({ page }) => {
    await page.goto("/writing");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/2026 march madness bracket analysis/i).first()).toBeVisible();

    const articleCard = page.locator('a[href="/writing/2026-march-madness-bracket-analysis"]').first();

    await expect(articleCard).toBeVisible();
    await expect(articleCard).toHaveAttribute("href", "/writing/2026-march-madness-bracket-analysis");
  });
});
