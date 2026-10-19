import { expect, test } from "@playwright/test";

// The three designed pages as one object each (2026-10-19): About as a proof,
// the résumé as a sheet on the press bed, Contact as a reply card. Spec:
// docs/superpowers/specs/2026-10-19-about-resume-contact-objects-design.md

test.describe("About", () => {
  test("marks four claims and links each to its checked note", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("h1")).toHaveCount(1);
    const marks = page.locator("main a[href^='#note-']");
    await expect(marks).toHaveCount(4);
    for (const n of [1, 2, 3, 4]) {
      await expect(page.locator(`#note-${n}`)).toHaveCount(1);
    }
    await expect(page.locator(".c97-columns")).toHaveCount(0);
    // The shell's header and footer keep their seams; the page itself has none.
    await expect(page.locator("main .c97-sheet[data-seam]")).toHaveCount(0);
  });

  test("prints the same questions the FAQ schema carries", async ({ page }) => {
    await page.goto("/about");
    const schema = await page.locator("script[type='application/ld+json']").allTextContents();
    const faqPage = schema.some((s) => s.includes('"FAQPage"'));
    expect(faqPage).toBe(true);
    await expect(page.locator("[data-specimen] h3")).toHaveCount(4);
  });
});
