import fs from "node:fs";
import { openTool, reloadTool } from "./browserReady";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { caseStudiesData } from "../src/constants/caseStudies";

// Discover pages so adding a tool also adds browser coverage. Dynamic project
// pages come from the same catalog that supplies the portfolio index.
function pageRoutes(directory: string, prefix = ""): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && !entry.name.startsWith("[") && !entry.name.startsWith("_")) {
      return pageRoutes(path.join(directory, entry.name), `${prefix}/${entry.name}`);
    }
    return entry.name === "page.tsx" ? [prefix || "/"] : [];
  });
}

const browserErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrat|Minified React error|did not match/i.test(message.text())) {
      errors.push(message.text());
    }
  });
});
test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page), "uncaught browser and hydration errors").toEqual([]);
});

const routes = [...new Set([
  ...pageRoutes(path.join(process.cwd(), "src/app")),
  ...Object.keys(caseStudiesData).map((slug) => `/portfolio/${slug}`),
])];

test.describe("Every page and portfolio project", () => {
  for (const route of routes) {
    test(`${route} renders usable content in both themes at phone width`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await openTool(page, route);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("main")).toHaveCount(1);
      await expect(page).not.toHaveTitle(/not found|application error/i);
      await page.evaluate(() => document.fonts.ready);
      for (let theme = 0; theme < 2; theme++) {
        await expect.poll(() => page.evaluate(() =>
          document.documentElement.scrollWidth - window.innerWidth
        ), { message: `${route} fits the viewport` }).toBeLessThanOrEqual(1);
        await page.getByRole("button", { name: /^Theme:/ }).click();
      }
      await expect(page.locator("main")).not.toContainText(/Application error:|Something went wrong/);
    });
  }
});

test("wine cellar adds, edits, reloads, and deletes a tasting", async ({ page }) => {
  await openTool(page, "/wine-cellar");
  await page.getByLabel("Wine name", { exact: true }).fill("Browser test wine");
  await page.getByLabel("Producer", { exact: true }).fill("Test vineyard");
  await page.getByRole("button", { name: "Add tasting", exact: true }).click();
  await expect(page.getByRole("button", { name: "Edit Browser test wine", exact: true })).toBeVisible();
  await reloadTool(page);
  await page.getByRole("button", { name: "Edit Browser test wine", exact: true }).click();
  await page.getByLabel("Wine name", { exact: true }).fill("Updated test wine");
  await page.getByRole("button", { name: "Save tasting", exact: true }).click();
  await page.getByRole("button", { name: "Delete Updated test wine", exact: true }).click();
  await expect(page.getByRole("button", { name: "Edit Updated test wine", exact: true })).toHaveCount(0);
  await reloadTool(page);
  await expect(page.getByRole("button", { name: "Edit Updated test wine", exact: true })).toHaveCount(0);
});

test("travel saves a trip, a completed stop, and a journal entry", async ({ page }) => {
  await openTool(page, "/travel");
  await page.getByRole("button", { name: "New trip", exact: true }).click();
  const form = page.getByRole("form", { name: "Create a new trip" });
  await form.getByLabel("Trip name").fill("Test trip");
  await form.getByLabel("Destination").fill("Lisbon");
  await form.getByLabel("Start date").fill("2026-10-10");
  await form.getByLabel("End date").fill("2026-10-12");
  await form.getByRole("button", { name: "Save trip" }).click();
  const itinerary = page.getByRole("region", { name: "Day-by-day itinerary" });
  await itinerary.getByLabel("Title", { exact: true }).fill("Test walk");
  await itinerary.getByRole("button", { name: "Add stop", exact: true }).click();
  await page.getByRole("button", { name: "Mark Test walk as done", exact: true }).click();
  const journal = page.getByRole("region", { name: "Trip journal" });
  await journal.getByLabel("Title", { exact: true }).fill("Test journal");
  await journal.getByLabel("Notes", { exact: true }).fill("A walk along the river.");
  await journal.getByRole("button", { name: "Add entry", exact: true }).click();
  await reloadTool(page);
  await expect(page.getByRole("button", { name: "Mark Test walk as not done", exact: true })).toBeVisible();
  await expect(journal.getByText("A walk along the river.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Delete Test walk", exact: true }).click();
  await expect(page.getByRole("button", { name: "Mark Test walk as not done", exact: true })).toHaveCount(0);
});

test("recipe finder saves and removes pantry ingredients", async ({ page }) => {
  await openTool(page, "/recipe-finder");
  await page.getByLabel("Add an ingredient", { exact: true }).fill("chicken");
  await page.getByRole("button", { name: "Add ingredient", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remove chicken", exact: true })).toBeVisible();
  await reloadTool(page);
  await page.getByRole("button", { name: "Remove chicken", exact: true }).click();
  await reloadTool(page);
  await expect(page.getByRole("button", { name: "Remove chicken", exact: true })).toHaveCount(0);
});

test("food map selects a city and a restaurant and restores the selection", async ({ page }) => {
  await openTool(page, "/food-map");
  const city = page.getByRole("radio").last();
  await city.click();
  await expect(city).toHaveAttribute("aria-checked", "true");
  const ticket = page.locator(".fm-ticket").first();
  const name = await ticket.locator(".fm-ticket-name").innerText();
  await ticket.click();
  await expect(page.getByRole("heading", { level: 2, name, exact: true })).toBeVisible();
  await reloadTool(page);
  await expect(page.getByRole("heading", { level: 2, name, exact: true })).toBeVisible();
});

test("score pools saves pool settings across its three routes", async ({ page }) => {
  await openTool(page, "/score-pools");
  await page.getByLabel("Pool name", { exact: true }).fill("Browser test pool");
  await page.getByRole("button", { name: "Create pool", exact: true }).click();
  await expect(page.getByRole("button", { name: "Browser test pool", exact: true })).toBeVisible();
  await openTool(page, "/score-pools/settings");
  const basics = page.getByRole("region", { name: "Pool basics" });
  await basics.getByLabel("Pool name", { exact: true }).fill("Updated test pool");
  await basics.getByLabel(/^Timezone/).selectOption("America/Los_Angeles");
  await reloadTool(page);
  await expect(basics.getByLabel("Pool name", { exact: true })).toHaveValue("Updated test pool");
  await expect(basics.getByLabel(/^Timezone/)).toHaveValue("America/Los_Angeles");
  await openTool(page, "/score-pools/tracker");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await openTool(page, "/score-pools");
  await expect(page.getByRole("button", { name: "Updated test pool", exact: true })).toBeVisible();
});

test("fantasy Formula 1 adds and restores a team asset", async ({ page, context }) => {
  await openTool(page, "/fantasy-formula-1");
  const add = page.getByRole("button", { name: /^Add / }).first();
  const name = (await add.getAttribute("aria-label"))!.replace(/^Add /, "");
  await add.click();
  const lineup = page.getByTestId("fantasy-formula-1-lineup");
  await expect(lineup.getByRole("button", { name: `Remove ${name}`, exact: true })).toBeVisible();
  const peer = await context.newPage();
  peer.on("pageerror", (error) => browserErrors.get(page)!.push(error.message));
  await openTool(peer, "/fantasy-formula-1");
  const peerSelection = peer.getByTestId("fantasy-formula-1-lineup").getByRole("button", { name: `Remove ${name}`, exact: true });
  await expect(peerSelection).toBeVisible();
  await reloadTool(page);
  await lineup.getByRole("button", { name: `Remove ${name}`, exact: true }).click();
  await expect(lineup.getByRole("button", { name: `Remove ${name}`, exact: true })).toHaveCount(0);
  await expect(peerSelection).toHaveCount(0);
  await peer.close();
});

test("decision lab preserves keyboard slider changes in a shared URL", async ({ page }) => {
  await openTool(page, "/decision-lab");
  const slider = page.getByRole("slider").first();
  await slider.focus();
  await slider.press("Home");
  await expect(slider).toHaveValue("0");
  await expect(page).toHaveURL(/impact=0/);
  await reloadTool(page);
  await expect(slider).toHaveValue("0");
  await page.getByRole("button", { name: "Reset to preset" }).click();
  await expect(slider).not.toHaveValue("0");
});

test("developer tool search handles no results and resets", async ({ page }) => {
  await openTool(page, "/ai-dev-tools");
  await page.getByLabel("Search tools", { exact: true }).fill("zzzz-no-matching-tool");
  await expect(page.getByText("No tools match those filters", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.getByLabel("Search tools", { exact: true })).toHaveValue("");
  await expect(page.getByText("No tools match those filters", { exact: true })).toHaveCount(0);
});

for (const route of ["/earthquake-pulse", "/bay-area-transit"]) {
  test(`${route} switches every operational tab`, async ({ page }) => {
    await openTool(page, route);
    const tabs = page.getByRole("tab");
    expect(await tabs.count()).toBeGreaterThan(1);
    for (let index = 0; index < await tabs.count(); index++) {
      await tabs.nth(index).click();
      await expect(tabs.nth(index)).toHaveAttribute("aria-selected", "true");
      await expect(page.getByRole("tabpanel")).toBeVisible();
    }
  });
}

test("enablement assistant switches between program and team views", async ({ page }) => {
  await openTool(page, "/enablement-assistant");
  const views = page.getByRole("group", { name: "Enablement workspace views" });
  await views.getByRole("button", { name: "Onboard a team", exact: true }).click();
  await expect(views.getByRole("button", { name: "Onboard a team", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "Start with the team that needs help" })).toBeVisible();
  await views.getByRole("button", { name: "Program dashboard", exact: true }).click();
  await expect(views.getByRole("button", { name: "Program dashboard", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "See where the standard is holding" })).toBeVisible();
});

test("arcade starts and accepts a keyboard hit on a live target", async ({ page }) => {
  await openTool(page, "/arcade");
  await page.getByRole("button", { name: /START GAME/ }).click();
  const live = page.getByRole("button", { name: /target live/ });
  await live.press("Enter");
  await expect(page.getByRole("region", { name: "Reactor game cabinet" })).not.toContainText("00000");
});
