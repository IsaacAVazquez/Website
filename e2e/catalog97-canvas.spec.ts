import { expect, test } from "@playwright/test";

const CATALOG_ROUTES = [
  "/",
  "/portfolio",
  "/writing",
  "/dashboards",
  "/about",
  "/resume",
  "/contact",
];

test.describe("Catalog 97 layouts canvas", () => {
  test("loads every same-origin route preview inside its frame", async ({ page }) => {
    await page.goto("/design/catalog-pages");

    const frames = page.locator("iframe");
    await expect(frames).toHaveCount(CATALOG_ROUTES.length);

    for (const [index, route] of CATALOG_ROUTES.entries()) {
      const frame = frames.nth(index);
      await frame.scrollIntoViewIfNeeded();
      await expect(frame).toHaveAttribute("src", route);
      await expect(page.frameLocator("iframe").nth(index).locator("h1")).toBeVisible();
    }
  });
});
