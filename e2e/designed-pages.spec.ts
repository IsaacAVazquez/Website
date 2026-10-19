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

test.describe("Résumé", () => {
  test("sets the sheet on the bed with the rails beside it", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/resume");
    await expect(page.locator("h1")).toHaveText("Isaac Vazquez");
    const sheet = page.locator("[data-sheet]");
    const bed = page.locator("[data-c97-surface='bone']").first();
    await expect(sheet).toBeVisible();
    const [s, b] = await Promise.all([sheet.boundingBox(), bed.boundingBox()]);
    expect(s!.width).toBeLessThanOrEqual(680);
    expect(s!.height).toBeGreaterThanOrEqual((s!.width * 11) / 8.5 - 1);
    expect(Math.abs(s!.x + s!.width / 2 - (b!.x + b!.width / 2))).toBeLessThan(2);
    await expect(page.locator("[data-sheet] h2")).toHaveCount(4);
  });
});

test.describe("Contact", () => {
  test("is one reply card with the address lines as targets", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("h1")).toHaveText(/like to hear from you/i);
    await expect(page.locator("[data-card]")).toHaveCount(1);
    // The stamp is its own ink-blue surface; the page has no blue band.
    await expect(page.locator("section[data-c97-surface='ink-blue']")).toHaveCount(0);
    for (const name of [/berkeley\.edu/i, /linkedin/i, /github/i]) {
      const box = await page.locator("[data-card]").getByRole("link", { name }).boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    await expect(page.locator("[data-stamp]")).toContainText("2026");
  });

  test("keeps the card inside a 320px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/contact");
    const wide = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(wide).toBe(false);
  });
});
