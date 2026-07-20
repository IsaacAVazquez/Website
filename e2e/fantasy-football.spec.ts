import { expect, test, type Locator, type Page } from "@playwright/test";

async function getReadyFantasyShell(page: Page) {
  const shell = page.locator('[data-testid="fantasy-football-shell"]');
  await expect(shell).toHaveAttribute("data-hydrated", "true");
  return shell;
}

async function waitForDraftTrackerHydration(page: Page) {
  await expect(
    page.locator('[data-testid="fantasy-draft-tracker-shell"]')
  ).toHaveAttribute("data-hydrated", "true");
}

async function activateControl(control: Locator) {
  await control.evaluate((element: HTMLElement) => element.click());
}

async function selectPosition(
  page: Page,
  shell: Locator,
  label: string,
  position: string
) {
  const option = shell.getByRole("radio", { name: label });
  await activateControl(option);
  await expect(option).toHaveAttribute("aria-checked", "true");
  await expect(page).toHaveURL(new RegExp(`position=${position}`));
}

async function selectScoring(
  page: Page,
  shell: Locator,
  label: string,
  scoring: string
) {
  const button = shell.getByRole("button", { name: new RegExp(`^${label}$`) });
  await activateControl(button);
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(new RegExp(`scoring=${scoring}`));
}

test.describe("Fantasy football rankings", () => {
  test("publishes every position in PPR, Half PPR, and Standard", async ({ page }) => {
    const scoringFormats = [
      { key: "ppr", label: "PPR" },
      { key: "half_ppr", label: "Half PPR" },
      { key: "standard", label: "Standard" },
    ] as const;
    const positions = [
      { key: "overall", label: "Overall" },
      { key: "qb", label: "QB" },
      { key: "rb", label: "RB" },
      { key: "wr", label: "WR" },
      { key: "te", label: "TE" },
      { key: "flex", label: "Flex" },
      { key: "k", label: "K" },
      { key: "dst", label: "DST" },
    ] as const;

    for (const scoring of scoringFormats) {
      await page.goto(`/fantasy-football?position=overall&scoring=${scoring.key}`);
      const shell = await getReadyFantasyShell(page);
      const board = shell.locator('article[aria-labelledby="rankings-board-heading"]');

      await expect(shell.getByRole("button", { name: new RegExp(`^${scoring.label}$`) })).toHaveAttribute(
        "aria-pressed",
        "true"
      );

      for (const position of positions) {
        if (position.key !== "overall") {
          await selectPosition(page, shell, position.label, position.key);
        }
        await expect(page.getByRole("heading", { name: new RegExp(`${position.label} rankings`, "i") })).toBeVisible();
        await expect(board.getByText("No Data Available")).toHaveCount(0);
        await expect(board.getByRole("button", { name: /^Open .+ detail/ }).first()).toBeVisible();
      }

      await activateControl(shell.getByRole("radio", { name: "Tiers" }));
      await expect(page).toHaveURL(/view=tiers/);
      await expect(shell.getByLabel("DST tier breakdown")).toBeVisible();
      await expect(shell.getByText("Tier 1").first()).toBeVisible();
    }
  });

  test("loads the canonical rankings board and supports PPR position switching", async ({ page }) => {
    await page.goto("/fantasy-football");
    const shell = await getReadyFantasyShell(page);

    await expect(page.getByRole("heading", { name: /Rankings first\. Draft utility second\./i })).toBeVisible();
    await expect(page).toHaveURL(/position=overall/);
    await expect(page).toHaveURL(/scoring=ppr/);
    await expect(page.getByText("No Data Available")).toHaveCount(0);
    await expect(shell.getByRole("radio", { name: /RB/i })).toBeEnabled();

    await selectPosition(page, shell, "RB", "rb");
    await expect(page.getByRole("heading", { name: /RB rankings/i })).toBeVisible();
    await expect(page.getByText(/Christian McCaffrey|Bijan Robinson|Saquon Barkley/i).first()).toBeVisible();
  });

  test("supports deep-linked position and scoring params", async ({ page }) => {
    await page.goto("/fantasy-football?position=te&scoring=half_ppr");

    await expect(page).toHaveURL(/position=te/);
    await expect(page).toHaveURL(/scoring=half_ppr/);
    await expect(page.getByRole("heading", { name: /TE rankings/i })).toBeVisible();
    await expect(page.getByText("No Data Available")).toHaveCount(0);
  });

  test("keeps normal scoring-position boards available across formats, including K and DST", async ({
    page,
  }) => {
    await page.goto("/fantasy-football?position=rb&scoring=standard");
    const shell = await getReadyFantasyShell(page);

    await expect(page.getByRole("heading", { name: /RB rankings/i })).toBeVisible();
    await expect(page.getByText("No Data Available")).toHaveCount(0);

    await selectScoring(page, shell, "Half PPR", "half_ppr");
    await expect(page.getByRole("heading", { name: /RB rankings/i })).toBeVisible();

    await selectScoring(page, shell, "PPR", "ppr");
    await expect(page.getByRole("heading", { name: /RB rankings/i })).toBeVisible();

    await selectPosition(page, shell, "K", "k");
    await expect(page.getByRole("heading", { name: /K rankings/i })).toBeVisible();
    await expect(page.getByText("No Data Available")).toHaveCount(0);

    await selectPosition(page, shell, "DST", "dst");
    await expect(page.getByRole("heading", { name: /DST rankings/i })).toBeVisible();
    await expect(page.getByText("No Data Available")).toHaveCount(0);
  });

  test("repeated switching uses stable static data without rate-limit failures", async ({ page }) => {
    await page.goto("/fantasy-football?position=overall&scoring=standard");
    const shell = await getReadyFantasyShell(page);

    for (const target of ["RB", "WR", "QB", "TE"]) {
      await selectPosition(page, shell, target, target.toLowerCase());
      await expect(page.getByRole("heading", { name: new RegExp(`${target} rankings`, "i") })).toBeVisible();
    }

    await selectScoring(page, shell, "Half PPR", "half_ppr");
    await selectPosition(page, shell, "WR", "wr");
    await expect(page.getByRole("heading", { name: /WR rankings/i })).toBeVisible();

    await selectScoring(page, shell, "PPR", "ppr");
    await selectPosition(page, shell, "TE", "te");
    await expect(page.getByRole("heading", { name: /TE rankings/i })).toBeVisible();

    await expect(page.getByText(/429/i)).toHaveCount(0);
    await expect(page.getByText(/rate limit/i)).toHaveCount(0);
  });

  test("keeps the aside sticky on desktop and stacked on mobile", async ({ page, isMobile }) => {
    await page.goto("/fantasy-football?position=wr&scoring=ppr");

    const aside = page.locator('[data-testid="fantasy-football-shell"] aside');
    await expect(aside).toBeVisible();

    const computedPosition = await aside.evaluate((element) => getComputedStyle(element).position);

    if (isMobile) {
      expect(computedPosition).not.toBe("sticky");
    } else {
      expect(computedPosition).toBe("sticky");
    }
  });

  test("searches the board and switches between list and tier views", async ({ page }) => {
    await page.goto("/fantasy-football?position=overall&scoring=ppr");
    const shell = await getReadyFantasyShell(page);
    const rankingsBoard = shell.locator('article[aria-labelledby="rankings-board-heading"]');
    const search = shell.getByLabel("Search the current rankings board");

    await search.fill("Ja'Marr Chase");
    await expect(search).toHaveValue("Ja'Marr Chase");
    await expect(rankingsBoard.getByText("Ja'Marr Chase", { exact: true }).first()).toBeVisible();
    await expect(rankingsBoard.getByText("Bijan Robinson", { exact: true })).toHaveCount(0);
    await shell.getByRole("button", { name: "Clear search" }).click();

    await activateControl(shell.getByRole("radio", { name: "Tiers" }));
    await expect(page).toHaveURL(/view=tiers/);
    await expect(shell.getByLabel("Overall tier breakdown")).toBeVisible();
    await expect(shell.getByText("Tier 1").first()).toBeVisible();

    await activateControl(shell.getByRole("radio", { name: "List" }));
    await expect(page).not.toHaveURL(/view=tiers/);
  });

  test("keeps position-only queued players visible after switching boards", async ({ page }) => {
    await page.goto("/fantasy-football?position=k&scoring=ppr");
    const shell = await getReadyFantasyShell(page);

    await shell.getByRole("button", { name: "Add Brandon Aubrey to queue" }).click();
    await selectPosition(page, shell, "RB", "rb");
    await expect(shell.getByText("Brandon Aubrey", { exact: true })).toBeVisible();

    const clearQueue = shell.getByRole("button", { name: "Clear queue" });
    await expect(clearQueue).toBeVisible();
    const clearBox = await clearQueue.boundingBox();
    expect(clearBox?.height).toBeGreaterThanOrEqual(44);
    await clearQueue.click();
    await shell.getByRole("button", { name: "Confirm clear queue" }).click();
    await expect(shell.getByText("0 starred")).toBeVisible();
  });

  test("persists a private note and compares players accessibly", async ({ page, isMobile }) => {
    test.skip(isMobile, "Desktop list exposes inline compare controls; mobile compare is available in player detail.");
    await page.goto("/fantasy-football?position=overall&scoring=ppr");
    const shell = await getReadyFantasyShell(page);

    await shell.getByRole("button", { name: /Open Ja'Marr Chase detail/ }).click();
    const note = page.getByRole("textbox", { name: "Private note" });
    await note.fill("Target at the first-round turn");
    await page.getByRole("button", { name: "Close", exact: true }).click();

    await shell.getByRole("button", { name: /Open Ja'Marr Chase detail/ }).click();
    await expect(page.getByRole("textbox", { name: "Private note" })).toHaveValue("Target at the first-round turn");
    await page.keyboard.press("Escape");

    await shell.getByRole("button", { name: "Add Ja'Marr Chase to compare" }).click();
    await shell.getByRole("button", { name: "Add Bijan Robinson to compare" }).click();
    await page.getByRole("button", { name: "Compare 2" }).click();

    const dialog = page.getByRole("dialog", { name: "Compare players" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Ja'Marr Chase", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Bijan Robinson", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("renders without horizontal overflow at 360px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/fantasy-football?position=overall&scoring=ppr");

    const horizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(horizontalOverflow).toBeLessThanOrEqual(1);
    await expect(page.getByRole("link", { name: /Launch draft assistant/i }).first()).toBeVisible();
  });

  test("supports the fantasy rankings in dark mode", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("theme", "light"));
    await page.goto("/fantasy-football?position=overall&scoring=ppr");
    const toggle = page.locator('button[aria-label^="Theme:"]:visible').first();
    await expect(toggle).toBeVisible();

    const initialPaper = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--home-paper").trim()
    );
    await toggle.click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    const darkPaper = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--home-paper").trim()
    );

    expect(darkPaper).not.toBe(initialPaper);
    await expect(page.getByRole("heading", { name: /Overall rankings/i })).toBeVisible();
  });
});

test.describe("Fantasy football draft tracker", () => {
  test("loads the correct board for every scoring format", async ({ page }) => {
    const scoringFormats = [
      { label: "PPR", topPlayer: "Ja'Marr Chase" },
      { label: "Half PPR", topPlayer: "Bijan Robinson" },
      { label: "Standard", topPlayer: "Jahmyr Gibbs" },
    ] as const;

    await page.goto("/fantasy-football/draft-tracker");
    await waitForDraftTrackerHydration(page);

    for (const scoring of scoringFormats) {
      await page.getByRole("button", { name: new RegExp(`^${scoring.label}`) }).click();
      await page.getByRole("button", { name: /Start draft assistant/i }).click();

      await expect(page.getByText(`${scoring.label} scoring`, { exact: true })).toBeVisible();
      await expect(page.getByText("Draft assistant unavailable for this scoring format")).toHaveCount(0);
      const firstPick = page.getByRole("button", { name: "Log pick" }).first().locator("..");
      await expect(firstPick).toContainText(scoring.topPlayer);
      await page.getByRole("button", { name: "Log pick" }).first().click();
      await expect(page.getByText(/1 of \d+ picks logged/i)).toBeVisible();

      await activateControl(page.getByRole("button", { name: "Reset draft" }));
      await page.getByRole("button", { name: "Confirm reset" }).click();
      await expect(page.getByRole("button", { name: /Start draft assistant/i })).toBeVisible();
    }
  });

  test("loads, records picks, and persists after reload", async ({ page }) => {
    await page.goto("/fantasy-football/draft-tracker");
    await waitForDraftTrackerHydration(page);

    await expect(page.getByRole("heading", { name: /Manual draft tracking that actually stays usable\./i })).toBeVisible();
    await page.getByRole("button", { name: /Start draft assistant/i }).click();

    await expect(page.getByRole("heading", { name: /Pick #1 on the clock/i })).toBeVisible();
    await page.getByRole("button", { name: "Log pick" }).first().click();
    await page.getByRole("button", { name: "Log pick" }).first().click();

    await expect(page.getByText(/2 of \d+ picks logged/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Log pick" }).first().locator("..")).toContainText(/Tier/i);

    await page.reload();

    await expect(page.getByText(/2 of \d+ picks logged/i)).toBeVisible();
    await expect(page.getByText("No Data Available")).toHaveCount(0);

    await page.getByRole("button", { name: "Reset draft" }).click();
    await expect(page.getByRole("button", { name: "Confirm reset" })).toBeVisible();
    await page.getByRole("button", { name: "Keep draft" }).click();
    await expect(page.getByText(/2 of \d+ picks logged/i)).toBeVisible();
  });
});

test.describe("Fantasy redirects", () => {
  test("/fantasy-football/rb-tiers redirects to the canonical board", async ({ page }) => {
    await page.goto("/fantasy-football/rb-tiers");

    await expect(page).toHaveURL(/\/fantasy-football\?position=rb&scoring=ppr/);
  });

  test("/fantasy-football/tiers/qb redirects to the canonical board", async ({ page }) => {
    await page.goto("/fantasy-football/tiers/qb");

    await expect(page).toHaveURL(/\/fantasy-football\?position=qb&scoring=ppr/);
  });

  test("/qb shortcut redirects to the canonical board", async ({ page }) => {
    await page.goto("/qb");

    await expect(page).toHaveURL(/\/fantasy-football\?position=qb&scoring=ppr/);
  });
});
