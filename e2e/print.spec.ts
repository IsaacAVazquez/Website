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
      "c97-mosaic of 4, grid, 2 across",
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
});
