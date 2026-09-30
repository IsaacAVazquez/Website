import { expect, test, type Page } from "@playwright/test";

// Firefox's engine prints a page with no text at all when backgrounds are on
// and it has to repeat a vector image behind the page. Measured on 2026-09-29
// in Playwright's headless builds of Firefox 153 and 155, a repeating SVG
// background blanked the whole print, while the same image drawn once and a
// repeating gradient both printed. This test reads styles and prints nothing.
async function repeatingVectorBackgrounds(page: Page) {
  return page.evaluate(() => {
    const found = new Set<string>();
    for (const element of document.querySelectorAll("*")) {
      for (const pseudo of ["", "::before", "::after"]) {
        const style = getComputedStyle(element, pseudo || null);
        if (!/svg/i.test(style.backgroundImage)) continue;
        if (style.backgroundRepeat === "no-repeat") continue;
        const classes = element.getAttribute("class")?.trim().split(/\s+/).join(".");
        found.add(`${element.tagName.toLowerCase()}${classes ? `.${classes}` : ""}${pseudo}`);
      }
    }
    return [...found];
  });
}

test.describe("Print", () => {
  for (const route of ["/", "/about", "/investments"]) {
    test(`repeats no vector image behind ${route} on paper`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator("[data-c97-surface]").first()).toBeVisible();

      await page.emulateMedia({ media: "print" });

      expect(await repeatingVectorBackgrounds(page)).toEqual([]);
    });
  }
});
