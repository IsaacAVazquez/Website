import { expect, test } from "@playwright/test";

test.describe("Fantasy football rankings", () => {
  test("loads the canonical rankings board and supports PPR position switching", async ({ page }) => {
    await page.goto("/fantasy-football");
    await page.waitForLoadState("networkidle");
    const shell = page.locator('[data-testid="fantasy-football-shell"]');

    await expect(page.getByRole("heading", { name: /Rankings first\. Draft utility second\./i })).toBeVisible();
    await expect(page).toHaveURL(/position=overall/);
    await expect(page).toHaveURL(/scoring=ppr/);
    await expect(page.getByText("No Data Available")).toHaveCount(0);
    await expect(shell.getByRole("tab", { name: /RB/i })).toHaveAttribute("aria-disabled", "false");

    await shell.getByRole("tab", { name: /RB/i }).click();
    await expect(page).toHaveURL(/position=rb/);
    await expect(page.getByRole("heading", { name: /RB rankings/i })).toBeVisible();
    await expect(page.getByText(/Christian McCaffrey|Bijan Robinson|Saquon Barkley/i).first()).toBeVisible();
  });

  test("supports deep-linked position and scoring params", async ({ page }) => {
    await page.goto("/fantasy-football?position=te&scoring=half_ppr");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/position=te/);
    await expect(page).toHaveURL(/scoring=half_ppr/);
    await expect(page.getByRole("heading", { name: /TE rankings/i })).toBeVisible();
    await expect(page.getByText(/unavailable/i)).toHaveCount(0);
  });

  test("keeps normal scoring-position boards available across formats, including K and DST", async ({
    page,
  }) => {
    await page.goto("/fantasy-football?position=rb&scoring=standard");
    await page.waitForLoadState("networkidle");
    const shell = page.locator('[data-testid="fantasy-football-shell"]');

    await expect(page.getByRole("heading", { name: /RB rankings/i })).toBeVisible();
    await expect(page.getByText(/unavailable/i)).toHaveCount(0);

    await shell.getByRole("button", { name: /^Half PPR$/ }).click();
    await expect(page).toHaveURL(/scoring=half_ppr/);
    await expect(page.getByRole("heading", { name: /RB rankings/i })).toBeVisible();

    await shell.getByRole("button", { name: /^PPR$/ }).click();
    await expect(page).toHaveURL(/scoring=ppr/);
    await expect(page.getByRole("heading", { name: /RB rankings/i })).toBeVisible();

    await shell.getByRole("tab", { name: "K" }).click();
    await expect(page.getByRole("heading", { name: /K rankings/i })).toBeVisible();
    await expect(page.getByText(/unavailable/i)).toHaveCount(0);

    await shell.getByRole("tab", { name: "DST" }).click();
    await expect(page.getByRole("heading", { name: /DST rankings/i })).toBeVisible();
    await expect(page.getByText(/unavailable/i)).toHaveCount(0);
  });

  test("repeated switching uses stable static data without rate-limit failures", async ({ page }) => {
    await page.goto("/fantasy-football?position=overall&scoring=standard");
    await page.waitForLoadState("networkidle");
    const shell = page.locator('[data-testid="fantasy-football-shell"]');

    for (const target of ["RB", "WR", "QB", "TE"]) {
      await shell.getByRole("tab", { name: target }).click();
      await expect(page.getByRole("heading", { name: new RegExp(`${target} rankings`, "i") })).toBeVisible();
    }

    await shell.getByRole("button", { name: /^Half PPR$/ }).click();
    await expect(page).toHaveURL(/scoring=half_ppr/);
    await shell.getByRole("tab", { name: "WR" }).click();
    await expect(page.getByRole("heading", { name: /WR rankings/i })).toBeVisible();

    await shell.getByRole("button", { name: /^PPR$/ }).click();
    await shell.getByRole("tab", { name: "TE" }).click();
    await expect(page.getByRole("heading", { name: /TE rankings/i })).toBeVisible();

    await expect(page.getByText(/429/i)).toHaveCount(0);
    await expect(page.getByText(/rate limit/i)).toHaveCount(0);
  });

  test("keeps the aside sticky on desktop and stacked on mobile", async ({ page, isMobile }) => {
    await page.goto("/fantasy-football?position=wr&scoring=ppr");
    await page.waitForLoadState("networkidle");

    const aside = page.locator('[data-testid="fantasy-football-shell"] aside');
    await expect(aside).toBeVisible();

    const computedPosition = await aside.evaluate((element) => getComputedStyle(element).position);

    if (isMobile) {
      expect(computedPosition).not.toBe("sticky");
    } else {
      expect(computedPosition).toBe("sticky");
    }
  });
});

test.describe("Fantasy football draft tracker", () => {
  test("loads, records picks, and persists after reload", async ({ page }) => {
    await page.goto("/fantasy-football/draft-tracker");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /Manual draft tracking that actually stays usable\./i })).toBeVisible();
    await page.getByRole("button", { name: /Start draft assistant/i }).click();

    await expect(page.getByRole("heading", { name: /Pick #1 on the clock/i })).toBeVisible();
    await page.getByRole("button", { name: "Log pick" }).first().click();
    await page.getByRole("button", { name: "Log pick" }).first().click();

    await expect(page.getByText("2 picks logged")).toBeVisible();
    await expect(page.getByRole("button", { name: "Log pick" }).first().locator("..")).toContainText(/Tier/i);

    await page.reload();
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("2 picks logged")).toBeVisible();
    await expect(page.getByText("No Data Available")).toHaveCount(0);
  });
});

test.describe("Fantasy redirects", () => {
  test("/fantasy-football/rb-tiers redirects to the canonical board", async ({ page }) => {
    await page.goto("/fantasy-football/rb-tiers");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/fantasy-football\?position=rb&scoring=ppr/);
  });

  test("/fantasy-football/tiers/qb redirects to the canonical board", async ({ page }) => {
    await page.goto("/fantasy-football/tiers/qb");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/fantasy-football\?position=qb&scoring=ppr/);
  });

  test("/qb shortcut redirects to the canonical board", async ({ page }) => {
    await page.goto("/qb");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/fantasy-football\?position=qb&scoring=ppr/);
  });
});
