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

// Safari's engine answers a width query with the window's width while it lays
// the print out at the paper's, which measured 680 to 700px on a letter page
// on 2026-09-29. Print media at a viewport wider than every breakpoint is the
// state its print is in, so a grid that still takes a wide rule here prints
// squeezed there. These tests read styles and print nothing.
const DESKTOP = { width: 1600, height: 900 };

// The shared grids that hold three or four children, which are the counts the
// wide rules arrange. The footer tiles are four. A grid in block flow counts
// as one across.
async function sharedGrids(page: Page) {
  return page.evaluate(() => {
    const names = ["c97-columns", "c97-mosaic", "c97-footer-tiles"];
    const found = new Set<string>();
    const grids = document.querySelectorAll(names.map((name) => `.${name}`).join(","));
    for (const grid of grids) {
      const count = grid.children.length;
      if (count !== 3 && count !== 4) continue;
      const style = getComputedStyle(grid);
      const across =
        style.display === "grid" ? style.gridTemplateColumns.split(" ").length : 1;
      const name = names.find((candidate) => grid.classList.contains(candidate));
      found.add(`${name} of ${count}, ${style.display}, ${across} across`);
    }
    return [...found].sort();
  });
}

// Safari's engine does not apply a mask on paper. It paints the mask's image
// over the element, so the torn seams printed black and a gradient mask
// printed as a solid bar, and Firefox's engine printed the masked seams as
// straight strips. Both were measured on 2026-09-29. Anything that shows on
// paper has to print without a mask.
async function masksThatShow(page: Page) {
  return page.evaluate(() => {
    const found = new Set<string>();
    for (const element of document.querySelectorAll("*")) {
      if (element.getClientRects().length === 0) continue;
      for (const pseudo of ["", "::before", "::after"]) {
        const style = getComputedStyle(element, pseudo || null);
        if (pseudo && /^(none|normal)$/.test(style.content)) continue;
        if (style.display === "none" || style.visibility === "hidden") continue;
        if (style.opacity === "0") continue;
        if (!style.maskImage || style.maskImage === "none") continue;
        const classes = element.getAttribute("class")?.trim().split(/\s+/).join(".");
        found.add(`${element.tagName.toLowerCase()}${classes ? `.${classes}` : ""}${pseudo}`);
      }
    }
    return [...found];
  });
}

// A grid that stacks its children on paper keeps the gap it had as a grid,
// its own `--c97-columns-gap` included, so the résumé's tighter bands do not
// spread when they print. The gap is read off the grid's computed row-gap,
// which keeps its value in block flow.
async function stackedGapsThatDrift(page: Page) {
  return page.evaluate(() => {
    const drift: string[] = [];
    for (const grid of document.querySelectorAll(".c97-columns, .c97-mosaic")) {
      if (grid.children.length !== 3) continue;
      const gap = getComputedStyle(grid).rowGap;
      for (const child of [...grid.children].slice(1)) {
        const margin = getComputedStyle(child).marginTop;
        if (margin !== gap) drift.push(`${grid.className}: gap ${gap}, margin ${margin}`);
      }
    }
    return drift;
  });
}

const NARROW_GRIDS = [
  {
    route: "/about",
    grids: ["c97-columns of 3, block, 1 across", "c97-footer-tiles of 4, grid, 2 across"],
  },
  {
    route: "/dashboards",
    grids: [
      "c97-columns of 3, block, 1 across",
      "c97-footer-tiles of 4, grid, 2 across",
      "c97-mosaic of 3, block, 1 across",
    ],
  },
  {
    route: "/accessibility",
    grids: ["c97-columns of 4, grid, 2 across", "c97-footer-tiles of 4, grid, 2 across"],
  },
];

test.describe("Print", () => {
  for (const route of ["/", "/about", "/investments"]) {
    test(`repeats no vector image behind ${route} on paper`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator("[data-c97-surface]").first()).toBeVisible();

      await page.emulateMedia({ media: "print" });

      expect(await repeatingVectorBackgrounds(page)).toEqual([]);
    });
  }

  for (const route of ["/about", "/resume", "/writing/2026-march-madness-bracket-analysis"]) {
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

  for (const { route, grids } of NARROW_GRIDS) {
    test(`prints the shared grids on ${route} narrow from a desktop window`, async ({
      page,
    }) => {
      await page.setViewportSize(DESKTOP);
      await page.goto(route);
      await expect(page.locator(".c97-footer-tiles")).toBeVisible();

      await page.emulateMedia({ media: "print" });

      await expect.poll(() => sharedGrids(page)).toEqual(grids);
    });
  }

  for (const route of ["/about", "/resume"]) {
    test(`keeps each grid's own gap when ${route} stacks it on paper`, async ({ page }) => {
      await page.setViewportSize(DESKTOP);
      await page.goto(route);
      await expect(page.locator(".c97-columns").first()).toBeVisible();

      await page.emulateMedia({ media: "print" });

      await expect.poll(() => stackedGapsThatDrift(page)).toEqual([]);
    });
  }

  test("prints Home in its narrow layout from a desktop window", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/");
    await expect(page.locator("[class*='heroGrid']")).toBeVisible();

    await page.emulateMedia({ media: "print" });

    const readLayout = () =>
      page.evaluate(() => {
        const columns = (selector: string) => {
          const node = document.querySelector(selector);
          return node ? getComputedStyle(node).gridTemplateColumns.split(" ").length : null;
        };
        return {
          hero: columns("[class*='heroGrid']"),
          collage: columns("[class*='Collage_collage']"),
          work: columns("[class*='workGrid']"),
        };
      });

    await expect.poll(readLayout).toEqual({ hero: 1, collage: 1, work: 1 });
  });

  for (const route of ["/", "/about", "/investments", "/writing"]) {
    test(`shows nothing through a mask on ${route} on paper`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator("[data-c97-surface]").first()).toBeVisible();

      await page.emulateMedia({ media: "print" });

      expect(await masksThatShow(page)).toEqual([]);
    });
  }

  test("tears the seams with a clip path on paper", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator(".c97-sheet[data-seam='deckle']")).toHaveCount(1);

    await page.emulateMedia({ media: "print" });

    const seams = await page.evaluate(() => {
      const read = (element: Element | null, pseudo: string) => {
        if (!element) return null;
        const style = getComputedStyle(element, pseudo);
        return { mask: style.maskImage, clip: style.clipPath };
      };
      return {
        header: read(document.querySelector(".c97-header"), "::after"),
        torn: read(document.querySelector(".c97-sheet[data-seam='torn']"), "::before"),
        deckle: read(document.querySelector(".c97-sheet[data-seam='deckle']"), "::before"),
      };
    });

    for (const seam of [seams.header, seams.torn, seams.deckle]) {
      expect(seam?.mask).toBe("none");
      expect(seam?.clip).toMatch(/^polygon\(/);
    }
    // The deckle is its own edge, so it cannot fall back to the torn one.
    expect(seams.deckle?.clip).not.toBe(seams.torn?.clip);
    expect(seams.header?.clip).toBe(seams.torn?.clip);
  });
});
