import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import { openTool as open, reloadTool } from "./browserReady";

const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const messages: string[] = [];
  errors.set(page, messages);
  page.on("pageerror", (error) => messages.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 500 && new URL(response.url()).origin === new URL(page.url()).origin) {
      messages.push(`${response.status()} ${response.url()}`);
    }
  });
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page), "browser errors and failed local API requests").toEqual([]);
});

for (const sport of ["mlb", "nba", "nfl", "world-cup-2026"]) {
  test(`${sport} loads selected team data and switches detail views`, async ({ page }) => {
    await open(page, `/${sport}`);
    // The first club is already selected and ships with server-rendered detail.
    const select = page.getByRole("button", { name: /^Show .+ details$/ }).nth(1);
    const api = sport === "world-cup-2026" ? "world-cup" : sport;
    const detail = page.waitForResponse((response) => response.url().includes(`/api/${api}/teams/`));
    await select.click();
    expect((await detail).status()).toBe(200);
    await expect(page.getByTestId(`${api}-selected-team`)).toBeVisible();
    // On MLB, NBA, and NFL the detail is a drawer whose backdrop covers the tabs.
    await page.keyboard.press("Escape");
    const tabs = page.getByRole("tab");
    for (let index = 0; index < await tabs.count(); index++) {
      await tabs.nth(index).click();
      await expect(tabs.nth(index)).toHaveAttribute("aria-selected", "true");
      await expect(page.getByRole("tabpanel")).toBeVisible();
    }
  });
}

test("golf switches leaderboard views and loads player details", async ({ page }) => {
  await open(page, "/golf");
  const tabs = page.getByRole("tab");
  for (let index = 0; index < await tabs.count(); index++) {
    await tabs.nth(index).click();
    await expect(tabs.nth(index)).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel")).toBeVisible();
  }
  const player = page.locator(".c97-golf-card").nth(1);
  const detail = page.waitForResponse((response) => response.url().includes("/api/golf/players/"));
  await player.click();
  expect((await detail).status()).toBe(200);
  await expect(player).toHaveAttribute("aria-current", "true");
});

for (const [route, group] of [
  ["/frontier-models", "Provider"],
  ["/tech-startup-tracker", "Group startups by"],
] as const) {
  test(`${route} restores a changed catalog filter on reload`, async ({ page }) => {
    await open(page, route);
    const filter = page.getByRole("group", { name: group, exact: true }).getByRole("button").last();
    const label = await filter.innerText();
    await filter.click();
    await expect(filter).toHaveAttribute("aria-pressed", "true");
    const url = page.url();
    await reloadTool(page);
    await expect(page).toHaveURL(url);
    await expect(page.getByRole("group", { name: group, exact: true }).getByRole("button", { name: label, exact: true }))
      .toHaveAttribute("aria-pressed", "true");
  });
}

test("rent versus buy updates its result and preserves the saved inputs", async ({ page }) => {
  await open(page, "/fintech-tools/rent-vs-buy");
  const price = page.getByLabel("Home price", { exact: true });
  const original = await price.inputValue();
  await price.fill("900000");
  await price.blur();
  await reloadTool(page);
  await expect(price).toHaveValue("900000");
  await expect(page.locator("main")).not.toContainText(/NaN|Infinity/);
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(price).toHaveValue(original);
});

test("travel deals restores the trip inputs used by its calculations", async ({ page }) => {
  await open(page, "/travel-deals");
  await page.getByLabel("Departure date", { exact: true }).fill("2026-12-10");
  await page.getByLabel("Nights", { exact: true }).fill("8");
  await page.getByLabel("Nights", { exact: true }).blur();
  await reloadTool(page);
  await expect(page.getByLabel("Departure date", { exact: true })).toHaveValue("2026-12-10");
  await expect(page.getByLabel("Nights", { exact: true })).toHaveValue("8");
  await expect(page.locator("main")).not.toContainText(/NaN|Infinity/);
});

test("MBA tracker saves and reloads a manual application", async ({ page }) => {
  // Manual application storage is local. Keep this workflow independent of
  // third-party hiring boards, whose availability is checked separately.
  await page.route("**/api/mba-jobs?*", (route) => route.fulfill({ json: {
    jobs: [], fetchedAt: new Date().toISOString(), errors: [],
    companiesRequested: [], sourceStatuses: [],
  } }));
  await open(page, "/mba-internship-notifications");
  await page.getByRole("button", { name: "Application pipeline", exact: true }).click();
  await page.getByRole("button", { name: "Add application", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Add application" });
  await dialog.getByLabel("Company", { exact: true }).fill("Test company");
  await dialog.getByLabel("Role", { exact: true }).fill("Test product role");
  await dialog.getByRole("button", { name: "Save application", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Test product role", exact: true })).toBeVisible();
  await reloadTool(page);
  await expect(page.getByRole("heading", { name: "Test product role", exact: true })).toBeVisible();
  await page.getByLabel("Application status for Test product role", { exact: true }).selectOption("applied");
  await reloadTool(page);
  await expect(page.getByLabel("Application status for Test product role", { exact: true })).toHaveValue("applied");
});

for (const route of ["/fantasy-football/weekly"]) {
  test(`${route} filters the published player board`, async ({ page }) => {
    await open(page, route);
    const search = page.getByPlaceholder("Search player or team");
    await search.fill("zzzz-no-player");
    await expect(page.locator("main")).toContainText(/No (players|waiver targets|matches)/i);
    await search.fill("");
    await expect(page.locator('section[aria-labelledby="weekly-board"]')
      .locator("tbody tr, ol[aria-label] > li").first()).toBeVisible();
  });
}

test("waivers saves a player marked available in the league", async ({ page }) => {
  await open(page, "/fantasy-football/waivers");
  const search = page.getByRole("searchbox", { name: "Find a player to roster or mark available", exact: true });
  await search.click();
  await search.pressSequentially("Smith");
  const available = page.getByRole("button", { name: /^Available in my league:/ }).first();
  const name = await available.getAttribute("aria-label");
  await available.click();
  await expect(available).toHaveAttribute("aria-pressed", "true");
  await reloadTool(page);
  await search.click();
  await search.pressSequentially("Smith");
  await expect(page.getByRole("button", { name: name!, exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("enablement assistant completes intake and builds a recommendation", async ({ page }) => {
  await open(page, "/enablement-assistant");
  await page.getByRole("group", { name: "Enablement workspace views" }).getByRole("button", { name: "Onboard a team", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Build recommendation", exact: true }).click();
  await expect(page.locator("#recommendation")).toBeVisible();
});

test("mock draft explains why a stale board cannot start a simulation", async ({ page }) => {
  const snapshot = JSON.parse(fs.readFileSync("public/data/fantasy/ppr.json", "utf8"));
  snapshot.upstreamUpdatedAt = "2026-01-01T00:00:00Z";
  snapshot.sliceMetadata.overall.updatedAt = snapshot.upstreamUpdatedAt;
  await page.route("**/data/fantasy/ppr.json*", (route) => route.fulfill({ json: snapshot }));
  await open(page, "/fantasy-football/mock-draft");
  await expect(page.getByRole("button", { name: "Start mock", exact: true })).toBeDisabled();
  await expect(page.locator("main")).toContainText("past its freshness window");
});

test("mock draft records a pick, takes it back, and completes a fresh room", async ({ page }) => {
  // The published draft board is deliberately dated to preseason. Keep its
  // player data but give this fixture a fresh timestamp to exercise simulation.
  const snapshot = JSON.parse(fs.readFileSync("public/data/fantasy/ppr.json", "utf8"));
  snapshot.upstreamUpdatedAt = new Date().toISOString();
  snapshot.sliceMetadata.overall.updatedAt = snapshot.upstreamUpdatedAt;
  await page.route("**/data/fantasy/ppr.json*", (route) => route.fulfill({ json: snapshot }));
  await open(page, "/fantasy-football/mock-draft");
  await page.getByRole("combobox", { name: "Your slot", exact: true }).selectOption("1");
  await page.getByRole("combobox", { name: "Rounds · early rep", exact: true }).selectOption("3");
  await page.getByRole("button", { name: "Start mock", exact: true }).click();
  await page.getByRole("button", { name: /^Draft / }).first().click();
  await expect(page.getByRole("button", { name: "Take back your last pick", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Take back your last pick", exact: true }).click();
  await expect(page.getByRole("button", { name: "Take back (no picks yet)", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Sim to end, which finishes the room with no take back", exact: true }).click();
  await expect(page.getByRole("group", { name: "Your haul", exact: true })).toBeVisible();
});

test("mock draft practices with a dated board only after consent and preserves its recap", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-04T12:00:00Z"));
  // Use the committed board and its real source dates without restamping it.
  await open(page, "/fantasy-football/mock-draft");
  const consent = page.getByRole("checkbox", { name: "Practice with the dated preseason board", exact: true });
  await expect(consent).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Start mock", exact: true })).toBeDisabled();
  await consent.check();
  await expect(page.locator("main")).toContainText("Dated preseason practice");
  await page.getByRole("combobox", { name: "Your slot", exact: true }).selectOption("1");
  await page.getByRole("combobox", { name: "Rounds · early rep", exact: true }).selectOption("3");
  await page.getByRole("button", { name: "Start mock", exact: true }).click();
  await page.getByRole("button", { name: /^Draft / }).first().click();
  await consent.uncheck();
  await expect(page.getByRole("button", { name: "Sim to end, which finishes the room with no take back", exact: true })).toBeDisabled();
  await expect(page.locator("main")).toContainText("Choose dated preseason practice above to resume");
  await consent.check();
  await page.getByRole("button", { name: "Sim to end, which finishes the room with no take back", exact: true }).click();
  await expect(page.getByRole("group", { name: "Your haul", exact: true })).toBeVisible();
  await reloadTool(page);
  await expect(consent).not.toBeChecked();
  await expect(page.getByRole("group", { name: "Your haul", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run it back", exact: true })).toBeDisabled();
  await consent.check();
  await expect(page.getByRole("button", { name: "Run it back", exact: true })).toBeEnabled();
});
