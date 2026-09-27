import { expect, test, type Page } from "@playwright/test";
import { getAllCaseStudies } from "../src/constants/caseStudies";
import { PROJECT_PRESS } from "../src/constants/projectPress";

// The rendered half of src/constants/__tests__/project-routes-complete.test.ts.
// Every live portfolio project renders one h1 and one main, opens on its hero
// sheet in its lead ink, and hydrates without a mismatch in a browser whose
// zone is not the server's (the server renders in UTC).
const PROJECT_ROUTES = getAllCaseStudies()
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
        // Hydration has reached the heading once React has attached a fiber to it.
        await page.waitForFunction(() => {
          const heading = document.querySelector("h1");
          return !!heading && Object.keys(heading).some((key) => key.startsWith("__reactFiber"));
        });

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
