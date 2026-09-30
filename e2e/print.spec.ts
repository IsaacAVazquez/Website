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

// Firefox's engine prints nothing for an element under a CSS filter or a blend
// mode, the element's text and background included. Measured on 2026-09-29 in
// Playwright's builds of Firefox 153 and 155, where the portrait on /about, an
// article's cover and author photo, and the résumé's logos were all missing
// from the print. This test reads styles and prints nothing.
async function filteredOrBlended(page: Page) {
  return page.evaluate(() => {
    const found = new Set<string>();
    for (const element of document.querySelectorAll("*")) {
      for (const pseudo of ["", "::before", "::after"]) {
        const style = getComputedStyle(element, pseudo || null);
        if (style.filter === "none" && style.mixBlendMode === "normal") continue;
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

  for (const route of ["/about", "/writing/2026-march-madness-bracket-analysis"]) {
    test(`filters and blends nothing on ${route} on paper in Firefox's engine`, async ({
      page,
      browserName,
    }) => {
      test.skip(browserName !== "firefox", "Chrome's and Safari's engines print a filtered element");
      await page.goto(route);
      await expect(page.locator("img").first()).toBeAttached();

      await page.emulateMedia({ media: "print" });

      expect(await filteredOrBlended(page)).toEqual([]);
    });
  }

  // The 35mm treatment is part of the design, so an engine that can print it keeps it.
  test("keeps the portrait's treatment on paper outside Firefox's engine", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "firefox", "Firefox's engine prints nothing under a filter");
    await page.goto("/about");
    const portrait = page.locator("img.c97-slot-img");
    await expect(portrait).toBeAttached();

    await page.emulateMedia({ media: "print" });

    await expect(portrait).not.toHaveCSS("filter", "none");
  });
});
