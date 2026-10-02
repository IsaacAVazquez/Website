import { expect, test, type Page } from "@playwright/test";
import { caseStudiesData } from "../src/constants/caseStudies";
import { catalog97NavLinks } from "../src/constants/catalog97Nav";
import { PROJECT_PRESS } from "../src/constants/projectPress";
import { expectAlignedLayout } from "./layoutChecks";

// The rendered half of src/constants/__tests__/project-routes-complete.test.ts.
// Every live portfolio project renders one h1 and one main, opens on its hero
// sheet in its lead ink, and hydrates without a mismatch in a browser whose
// zone is not the server's (the server renders in UTC).
const PROJECT_ROUTES = Object.values(caseStudiesData)
  .map((study) => study.link)
  .filter((link): link is string => typeof link === "string" && link.startsWith("/"));

const HYDRATION = /hydrat|did not match|didn't match|Minified React error #(418|419|422|423|425)/i;

function collectHydrationErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && HYDRATION.test(message.text())) errors.push(message.text().slice(0, 400));
  });
  page.on("pageerror", (error) => {
    if (HYDRATION.test(error.message)) errors.push(error.message.slice(0, 400));
  });
  return errors;
}

/** Hydration has reached the heading once React has attached a fiber to it. */
function waitForHydration(page: Page) {
  return page.waitForFunction(() => {
    const heading = document.querySelector("h1");
    return !!heading && Object.keys(heading).some((key) => key.startsWith("__reactFiber"));
  });
}

for (const timezoneId of ["America/Los_Angeles", "Asia/Tokyo"]) {
  test.describe(`project routes in ${timezoneId}`, () => {
    test.use({ timezoneId, locale: "en-US" });

    for (const route of PROJECT_ROUTES) {
      test(`${route} renders its hero and hydrates cleanly`, async ({ page }) => {
        const hydrationErrors = collectHydrationErrors(page);
        await page.goto(route);

        const h1 = page.locator("h1");
        await expect(h1).toHaveCount(1);
        await expect(page.locator("main")).toHaveCount(1);
        await waitForHydration(page);

        const lead = PROJECT_PRESS[route]?.lead;
        expect(lead, `${route} has a press row`).toBeTruthy();
        const sheet = await h1.evaluate((el) => el.closest("[data-c97-surface]")?.getAttribute("data-c97-surface"));
        expect(sheet).toBe(`ink-${lead}`);
        await expect(h1).toHaveClass(/c97-poster/);

        await page.waitForTimeout(500);
        expect(hydrationErrors).toEqual([]);
      });
    }
  });
}

// The seven designed routes are not project routes, so they get the hydration
// half of that check here. Text that one engine's locale data prints its own
// way only fails in that engine (WebKit on macOS abbreviates an en-GB September
// as "Sep" where Node says "Sept"), so this runs in every browser project.
test.describe("designed routes", () => {
  test.use({ timezoneId: "Asia/Tokyo", locale: "en-US" });

  for (const { href } of catalog97NavLinks) {
    test(`${href} hydrates cleanly`, async ({ page }) => {
      const hydrationErrors = collectHydrationErrors(page);
      await page.goto(href);
      await waitForHydration(page);

      await page.waitForTimeout(500);
      expect(hydrationErrors).toEqual([]);
    });
  }
});

// Every project route (the fantasy sub-routes included), score pools, a topic,
// and a post line up with the header at a phone, a laptop, and a big monitor.
// Chromium only, since the edges don't differ by engine and the full matrix
// runs every spec in five browsers.
const LAYOUT_ROUTES = [
  ...Object.keys(PROJECT_PRESS),
  "/score-pools",
  "/writing/topics/sports-fantasy",
  "/writing/complete-guide-qa-engineering",
];

test.describe("project route layout", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "layout is checked in Chromium");

  for (const route of LAYOUT_ROUTES) {
    test(`${route} lines up with the header at 390, 1440, and 1920`, async ({ page }) => {
      await page.goto(route);
      await expectAlignedLayout(page);
    });
  }
});
