import { expect, test } from "@playwright/test";

/**
 * Representative coverage for the localStorage-backed personal-interest tools
 * (travel, wine-cellar, museum-log, recipe-finder, food-map). Their logic is
 * unit-covered in jsdom; this proves the real-browser persistence round-trip
 * and SSR hydration of a large client survive a full reload.
 */
test.describe("Personal-interest tools persist state", () => {
  test("museum log remembers a logged visit across a reload", async ({ page }) => {
    await page.goto("/museum-log");
    await expect(
      page.getByRole("heading", { level: 1, name: "Museum Log" })
    ).toBeVisible();

    // Surface a known seeded museum through the filter, then log a visit.
    const filter = page
      .locator('label[aria-label="Filter museums"]')
      .getByRole("searchbox");
    await filter.fill("Modern Art");

    const logVisit = page.getByRole("button", {
      name: /log a visit to museum of modern art/i,
    });
    await expect(logVisit).toBeVisible();
    await logVisit.click();

    // The action flips to the "not visited" affordance once the visit is logged.
    const visitedToggle = page.getByRole("button", {
      name: /mark museum of modern art as not visited/i,
    });
    await expect(visitedToggle).toBeVisible();

    // Reload — the visit is persisted to localStorage and must survive.
    await page.reload();
    await page
      .locator('label[aria-label="Filter museums"]')
      .getByRole("searchbox")
      .fill("Modern Art");
    await expect(
      page.getByRole("button", {
        name: /mark museum of modern art as not visited/i,
      })
    ).toBeVisible();
  });
});
