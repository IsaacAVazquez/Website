import { test, expect, type Page } from "@playwright/test";
import { openTool, reloadTool } from "./browserReady";

const browserErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    // WebKit logs the report-only policy's missing report-to as an error.
    if (message.type() === "error" && !/delivered in report-only mode/.test(message.text()))
      errors.push(message.text());
  });
});

test.afterEach(async ({ page }, info) => {
  const workspace = page.locator(".pw-root").first();
  if (await workspace.count())
    await workspace.screenshot({ path: info.outputPath("workspace.png") });
  expect(browserErrors.get(page), "browser application errors").toEqual([]);
});

for (const theme of ["light", "dark"] as const) {
  test.describe(`Project following in ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(
        (value) => localStorage.setItem("theme", value),
        theme,
      );
    });

    test("saves and restores a tool shortlist with requirements", async ({
      page,
    }) => {
      await openTool(page, "/ai-dev-tools");
      const workspace = page.locator("#tool-comparison");
      await workspace
        .getByLabel("Add a tool", { exact: true })
        .selectOption("aider");
      await workspace.getByLabel("Run local models", { exact: true }).focus();
      await page.keyboard.press("Space");
      await workspace
        .getByLabel("Working environment", { exact: true })
        .selectOption("terminal");
      await workspace.getByLabel("Shortlist name").fill("Terminal shortlist");
      await workspace
        .getByRole("button", { name: "Save shortlist", exact: true })
        .focus();
      await page.keyboard.press("Enter");
      await expect(workspace.getByRole("status")).toContainText(
        "Saved Terminal shortlist",
      );
      await reloadTool(page);
      await workspace
        .getByRole("button", { name: "Load Terminal shortlist", exact: true })
        .click();
      await expect(
        workspace.getByLabel("Run local models", { exact: true }),
      ).toBeChecked();
      await expect(workspace.getByRole("table")).toContainText(
        "Local models · Listed",
      );
      await page.setViewportSize({ width: 320, height: 900 });
      const scroll = workspace.getByRole("region", {
        name: "Tool comparison (scrolls sideways)",
      });
      await scroll.focus();
      await page.keyboard.press("ArrowRight");
      await expect
        .poll(() => scroll.evaluate((element) => element.scrollLeft))
        .toBeGreaterThan(0);
      for (const id of ["cursor", "github-copilot", "openai-codex"])
        await workspace
          .getByLabel("Add a tool", { exact: true })
          .selectOption(id);
      await expect(
        workspace.getByLabel("Add a tool", { exact: true }),
      ).toBeDisabled();
      await expect(workspace.getByRole("table")).toContainText("Unknown");
    });

    test("keeps company notes and sourced funding rounds", async ({ page }) => {
      await openTool(page, "/tech-startup-tracker");
      const workspace = page.locator("#company-research");
      await workspace.getByLabel("Follow a company").selectOption({ index: 1 });
      await workspace
        .getByLabel("Research notes")
        .fill("Read the product and compare the latest announcement.");
      await workspace
        .getByRole("button", { name: "Save notes", exact: true })
        .click();
      await workspace
        .getByLabel("Round name", { exact: true })
        .fill("Research round");
      await workspace.getByLabel("Announcement date").fill("2026-10-20");
      await workspace
        .getByLabel("Announcement source link")
        .fill("https://example.com/announcement");
      await workspace
        .getByRole("button", { name: "Add funding round", exact: true })
        .click();
      await expect(workspace.getByRole("status")).toContainText(
        "Funding round saved",
      );
      await reloadTool(page);
      await expect(workspace.getByLabel("Research notes")).toHaveValue(
        "Read the product and compare the latest announcement.",
      );
      await expect(workspace).toContainText(
        "Research round · Amount undisclosed · Your research",
      );
      await expect(
        workspace.locator('a[href="https://example.com/announcement"]'),
      ).toBeVisible();
    });

    test("restores followed golf players and round scores", async ({
      page,
    }) => {
      await openTool(page, "/golf");
      const workspace = page.locator("#followed-golf");
      await workspace.getByLabel("Follow a player").selectOption({ index: 1 });
      await expect(workspace.getByRole("table")).toBeVisible();
      await reloadTool(page);
      await expect(
        workspace.getByRole("button", { name: /^Unfollow / }),
      ).toHaveCount(1);
      await expect(workspace.getByRole("table")).toContainText("R1 strokes");
    });

    test("restores a saved place and its distance filters", async ({
      page,
    }) => {
      await openTool(page, "/earthquake-pulse");
      const workspace = page.locator("#saved-places");
      await workspace
        .getByLabel("Place name", { exact: true })
        .fill("Berkeley");
      await workspace.getByLabel("Latitude", { exact: true }).fill("37.8715");
      await workspace
        .getByLabel("Longitude", { exact: true })
        .fill("-122.2730");
      await workspace.getByLabel("Radius in km", { exact: true }).fill("250");
      await workspace
        .getByRole("button", { name: "Save place", exact: true })
        .click();
      await reloadTool(page);
      await expect(
        workspace.getByLabel("Saved place", { exact: true }),
      ).toContainText("Berkeley");
      await expect(workspace).toContainText("within 250 km");
      await expect(workspace).toContainText(
        "zero matches does not mean no earthquakes occurred",
      );
    });

    test("restores a followed race with source dates", async ({ page }) => {
      await openTool(page, "/polling-aggregator");
      const workspace = page.locator("#followed-races");
      await workspace.getByLabel("Follow a race").selectOption({ index: 1 });
      await reloadTool(page);
      await expect(
        workspace.getByRole("button", { name: /^Unfollow / }),
      ).toHaveCount(1);
      await expect(workspace).toContainText("newest field end");
      await expect(workspace).toContainText("seeing this data for the first time");
    });

    test("restores a followed launch and exposes calendar eligibility", async ({
      page,
    }) => {
      await openTool(page, "/spacex-mission-control");
      const workspace = page.locator("#followed-launches");
      await workspace.getByLabel("Follow a launch").selectOption({ index: 1 });
      await reloadTool(page);
      await expect(
        workspace.getByRole("button", { name: /^Unfollow / }),
      ).toHaveCount(1);
      await expect(workspace).toContainText("seeing this data for the first time");
      await expect(
        workspace.getByRole("button", { name: /Download launch calendar/ }),
      ).toBeVisible();
    });
  });
}

for (const theme of ["light", "dark"] as const)
  test(`populated ${theme} workspaces fit phone and desktop widths`, async ({
    page,
  }, info) => {
    await page.addInitScript(
      (value) => localStorage.setItem("theme", value),
      theme,
    );
    const routes = [
      "/ai-dev-tools",
      "/tech-startup-tracker",
      "/spacex-mission-control",
      "/golf",
      "/polling-aggregator",
      "/earthquake-pulse",
    ];
    for (const route of routes) {
      await openTool(page, route);
      const add = page.locator(".pw-root select").first();
      if (route !== "/earthquake-pulse") await add.selectOption({ index: 1 });
      else {
        await page.getByLabel("Place name", { exact: true }).fill("Berkeley");
        await page.getByLabel("Latitude", { exact: true }).fill("37.8715");
        await page.getByLabel("Longitude", { exact: true }).fill("-122.273");
        await page
          .getByRole("button", { name: "Save place", exact: true })
          .click();
      }
      for (const width of [320, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(page.locator("main")).toHaveCount(1);
        await expect(page.locator("h1")).toHaveCount(1);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth + 1,
          ),
          `${route} at ${width}`,
        ).toBe(true);
        if (width === 320 || width === 1440)
          await page
            .locator(".pw-root")
            .first()
            .screenshot({
              path: info.outputPath(`${route.slice(1)}-${width}-${theme}.png`),
            });
      }
    }
  });
