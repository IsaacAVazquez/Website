import { readFileSync } from "node:fs";
import path from "node:path";
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
  await control.click();
}

/**
 * A rankings row names itself through an `absolute inset-0` overlay button, and
 * the row content sits above it at `z-[2]` with its own click handler so the
 * per-cell hover titles fire and player names stay selectable. A click therefore
 * lands on the content rather than on the overlay, which is exactly what a
 * visitor hits, so open the row through the list item while still identifying
 * which row it is by the overlay button's accessible name.
 */
function rankingsRow(shell: Locator, accessibleName: string | RegExp) {
  return shell
    .getByRole("listitem")
    .filter({ has: shell.page().getByRole("button", { name: accessibleName }) })
    .first();
}

const BEST_BALL_PRESETS = [
  {
    id: "bbm-vii",
    rankingControl: "Mania",
    rankingView: "Mania board",
    rankingHeading: "Best Ball Mania VII",
    trackerControl: "BBM VII",
    teamsLine: "12 teams · 18 rounds · 18 players",
    trackerHeading: "Best Ball Mania VII",
  },
  {
    id: "puppy",
    rankingControl: "Puppy",
    rankingView: "Puppy board",
    rankingHeading: "The Puppy",
    trackerControl: "Puppy",
    teamsLine: "12 teams · 18 rounds · 18 players",
    trackerHeading: "The Puppy",
  },
  {
    id: "eliminator",
    rankingControl: "Eliminator",
    rankingView: "Eliminator board",
    rankingHeading: "The Eliminator",
    trackerControl: "Eliminator",
    teamsLine: "12 teams · 18 rounds · 18 players",
    trackerHeading: "Eliminator",
  },
  {
    id: "weekly-winners",
    rankingControl: "Weekly",
    rankingView: "Weekly board",
    rankingHeading: "Weekly Winners",
    trackerControl: "Weekly Winners",
    teamsLine: "12 teams · 18 rounds · 18 players",
    trackerHeading: "Weekly Winners",
  },
  {
    id: "sit-and-go",
    rankingControl: "Sit and Go",
    rankingView: "Sit and Go board",
    rankingHeading: "Sit and Go",
    trackerControl: "Sit & Go",
    teamsLine: "12 teams · 18 rounds · 18 players",
    trackerHeading: "Sit & Go",
  },
  {
    id: "superflex",
    rankingControl: "Superflex",
    rankingView: "Superflex board",
    rankingHeading: "Superflex",
    trackerControl: "Superflex",
    teamsLine: "12 teams · 20 rounds · 20 players",
    trackerHeading: "Superflex",
  },
] as const;

async function getPersistedBestBallPickCount(page: Page, contestId: string) {
  return page.evaluate((targetContestId) => {
    const key = Array.from({ length: window.localStorage.length }, (_, index) =>
      window.localStorage.key(index)
    ).find(
      (candidate) =>
        candidate?.startsWith("fantasy-best-ball-draft-v1-") &&
        candidate.endsWith(`-${targetContestId}`)
    );
    if (!key) return null;

    try {
      const saved = JSON.parse(window.localStorage.getItem(key) ?? "null") as {
        picks?: unknown[];
      } | null;
      return Array.isArray(saved?.picks) ? saved.picks.length : null;
    } catch {
      return null;
    }
  }, contestId);
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

      await expect(shell.getByRole("button", { name: new RegExp(`^${scoring.label}$`) })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      // The overall board always spans several tiers, so the tier plates render.
      await expect(shell.getByText("01", { exact: true })).toBeVisible();

      for (const position of positions) {
        if (position.key !== "overall") {
          await selectPosition(page, shell, position.label, position.key);
        }
        await expect(page.getByRole("heading", { name: new RegExp(`${position.label} rankings`, "i") })).toBeVisible();
        await expect(shell.getByText("No Data Available")).toHaveCount(0);
        await expect(shell.getByRole("button", { name: /^Open .+ detail/ }).first()).toBeVisible();
      }
    }
  });

  test("loads the canonical rankings board and supports PPR position switching", async ({ page }) => {
    await page.goto("/fantasy-football");
    const shell = await getReadyFantasyShell(page);

    await expect(page.getByRole("heading", { name: /Fantasy Football Rankings/i })).toBeVisible();
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

  test("keeps the board controls sticky on desktop and static on mobile", async ({ page, isMobile }) => {
    await page.goto("/fantasy-football?position=wr&scoring=ppr");
    await getReadyFantasyShell(page);

    const controls = page.getByTestId("fantasy-board-controls");
    await expect(controls).toBeVisible();

    const computedPosition = await controls.evaluate((element) => getComputedStyle(element).position);

    if (isMobile) {
      expect(computedPosition).not.toBe("sticky");
    } else {
      expect(computedPosition).toBe("sticky");
    }
  });

  test("searches the board and clears it from the empty state", async ({ page }) => {
    await page.goto("/fantasy-football?position=overall&scoring=ppr");
    const shell = await getReadyFantasyShell(page);
    // The desktop input and the phone search button share this label, and only
    // one of the two is ever rendered visible, so name the textbox role and take
    // the visible control rather than matching the hidden half of the pair.
    const search = shell
      .getByRole("textbox", { name: "Search the current rankings board" })
      .filter({ visible: true });

    await search.fill("Ja'Marr Chase");
    await expect(search).toHaveValue("Ja'Marr Chase");
    await expect(shell.getByText("Ja'Marr Chase", { exact: true }).first()).toBeVisible();
    await expect(shell.getByText("Bijan Robinson", { exact: true })).toHaveCount(0);

    await search.fill("player who does not exist");
    await expect(shell.getByText("No players match on this board.")).toBeVisible();

    await shell.getByRole("button", { name: "Clear search" }).click();
    await expect(search).toHaveValue("");
    await expect(shell.getByRole("button", { name: /^Open .+ detail/ }).first()).toBeVisible();
  });

  test("queues a player from the drawer and keeps it after a reload", async ({ page }) => {
    await page.goto("/fantasy-football?position=overall&scoring=ppr");
    const shell = await getReadyFantasyShell(page);

    const firstRow = shell.getByRole("button", { name: /^Open .+ detail/ }).first();
    const rowLabel = await firstRow.getAttribute("aria-label");
    const playerName = rowLabel?.match(/^Open (.+) detail$/)?.[1];
    expect(playerName, "the board exposes a first player").toBeTruthy();

    await rankingsRow(shell, `Open ${playerName} detail`).click();
    const dialog = page.getByRole("dialog", { name: `${playerName} detail` });
    await dialog.getByRole("button", { name: /Add to queue/ }).click();
    await expect(dialog.getByRole("button", { name: /Queued/ })).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    await page.reload();
    await getReadyFantasyShell(page);
    await rankingsRow(shell, `Open ${playerName} detail`).click();
    await expect(
      page.getByRole("dialog", { name: `${playerName} detail` }).getByRole("button", { name: /Queued/ })
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("shows prior-season points per game in the drawer, with its season and sample", async ({ page }) => {
    // Pick the target from the published snapshot rather than probing rows.
    // Rookies and anyone under the games-played floor legitimately carry no
    // game log, so scanning the board would be both slower and less certain.
    const snapshot = await (await page.request.get("/data/fantasy/ppr.json")).json();
    const scored = snapshot.overall.find((player: { gameLog?: unknown }) => player.gameLog);
    expect(scored, "the published PPR board carries prior-season scoring").toBeTruthy();

    await page.goto("/fantasy-football?position=overall&scoring=ppr");
    const shell = await getReadyFantasyShell(page);

    await rankingsRow(shell, `Open ${scored.name} detail`).click();
    const dialog = page.getByRole("dialog", { name: `${scored.name} detail` });
    // The label shares its span with the metric tooltip trigger, so an exact
    // match no longer finds an element whose whole text is the label.
    await expect(dialog.getByText("Points per game").first()).toBeVisible();

    // The basis travels with the number: which season, which scoring, and how
    // many games sit behind the spread.
    await expect(
      dialog.getByText(`${scored.gameLog.season} season · PPR · ${scored.gameLog.games} games`)
    ).toBeVisible();
    await expect(dialog.getByText(scored.gameLog.average.toFixed(1), { exact: true })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("persists a private note from the drawer", async ({ page }) => {
    await page.goto("/fantasy-football?position=overall&scoring=ppr");
    const shell = await getReadyFantasyShell(page);

    const firstRow = shell.getByRole("button", { name: /^Open .+ detail/ }).first();
    const rowLabel = await firstRow.getAttribute("aria-label");
    const playerName = rowLabel?.match(/^Open (.+) detail$/)?.[1];
    expect(playerName, "the board exposes a first player").toBeTruthy();

    await rankingsRow(shell, `Open ${playerName} detail`).click();
    const note = page.getByRole("textbox", { name: "Private note" });
    await note.fill("Target at the first-round turn");
    await page.getByRole("button", { name: "Close", exact: true }).click();

    await rankingsRow(shell, `Open ${playerName} detail`).click();
    await expect(page.getByRole("textbox", { name: "Private note" })).toHaveValue("Target at the first-round turn");
    await page.keyboard.press("Escape");
  });

  test("renders without horizontal overflow at 360px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/fantasy-football?position=overall&scoring=ppr");
    await getReadyFantasyShell(page);

    const horizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(horizontalOverflow).toBeLessThanOrEqual(1);
    await expect(page.getByRole("link", { name: "Draft tracker", exact: true }).first()).toBeVisible();
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
    // The expected first pick is read from the same committed snapshot the
    // board renders, not hardcoded — scheduled data refreshes reorder the
    // rankings and a name literal goes stale within days.
    // The setup screen abbreviates the scoring segments ("Half", "Std") while
    // the live room's header chip spells the format out, so each format carries
    // both names.
    const scoringFormats = [
      { control: "PPR", chip: "PPR", file: "ppr" },
      { control: "Half", chip: "Half PPR", file: "half_ppr" },
      { control: "Std", chip: "Standard", file: "standard" },
    ].map((scoring) => {
      const snapshot = JSON.parse(
        readFileSync(
          path.join(process.cwd(), "public", "data", "fantasy", `${scoring.file}.json`),
          "utf8"
        )
      ) as { overall: Array<{ name: string }> };
      const topPlayer = snapshot.overall[0]?.name;
      expect(topPlayer, `${scoring.chip} snapshot has an overall board`).toBeTruthy();
      return { ...scoring, topPlayer: topPlayer! };
    });

    await page.goto("/fantasy-football/draft-tracker");
    await waitForDraftTrackerHydration(page);

    for (const [index, scoring] of scoringFormats.entries()) {
      await page.getByRole("button", { name: scoring.control, exact: true }).click();
      // The first room starts on one press. Every later one starts over the room
      // "New room" parked, and clearing those picks is the destructive step, so
      // the first press only arms the button and a second confirms it.
      await page.getByRole("button", { name: /^Start draft/ }).click();
      if (index > 0) {
        await page.getByRole("button", { name: /^Confirm new draft/ }).click();
      }

      await expect(page.getByText(`${scoring.chip} scoring`, { exact: true })).toBeVisible();
      await expect(page.getByText("Draft assistant unavailable for this scoring format")).toHaveCount(0);
      const board = page.getByRole("region", { name: "Draft board" });
      const firstPick = board.getByRole("button", { name: /^Log / }).first();
      await expect(firstPick).toHaveAccessibleName(`Log ${scoring.topPlayer}`);
      await firstPick.click();
      // The live fascia is the room's pick counter now, so one logged pick moves
      // it from #1 to #2 of the same total.
      await expect(
        page.getByRole("region", { name: "Live draft status" }).getByText(/^#2 \/ \d+$/)
      ).toBeVisible();

      await activateControl(page.getByRole("button", { name: "New room" }));
      await expect(page.getByRole("button", { name: /^Start draft/ })).toBeVisible();
    }
  });

  test("loads, records picks, and persists after reload", async ({ page }) => {
    await page.goto("/fantasy-football/draft-tracker");
    await waitForDraftTrackerHydration(page);

    await expect(page.getByRole("heading", { name: "One screen, then draft." })).toBeVisible();
    await page.getByRole("button", { name: /^Start draft/ }).click();

    // The room states its live position in the header kicker rather than in a
    // heading, and pick #1 on the clock is the first thing it has to say.
    await expect(page.getByText("Draft assistant · Live · Pick #1")).toBeVisible();

    // Every logged pick keeps an undo entry on the "Last picks" tape, so the
    // tape is where the room says how many picks it is holding.
    const loggedPicks = page.getByRole("button", { name: /^Undo back to pick / });
    const board = page.getByRole("region", { name: "Draft board" });
    await board.getByRole("button", { name: /^Log / }).first().click();
    await expect(loggedPicks).toHaveCount(1);
    await board.getByRole("button", { name: /^Log / }).first().click();
    await expect(loggedPicks).toHaveCount(2);

    // Board rows stay grouped under their published tier plate, which names
    // itself for assistive tech since its header is spans rather than a heading.
    await expect(board.getByRole("region", { name: /^Tier \d+, / }).first()).toBeVisible();

    await page.reload();

    await expect(loggedPicks).toHaveCount(2);
    await expect(page.getByText("No Data Available")).toHaveCount(0);

    // "New room" only parks the room. Starting over it is the destructive step,
    // so the first press arms a confirmation and "Back to room" keeps the picks.
    await page.getByRole("button", { name: "New room" }).click();
    await page.getByRole("button", { name: /^Start draft/ }).click();
    await expect(page.getByRole("button", { name: /^Confirm new draft/ })).toBeVisible();
    await page.getByRole("button", { name: "Back to room" }).click();
    await expect(loggedPicks).toHaveCount(2);
  });
});

test.describe("Fantasy football best ball", () => {
  test("publishes all six ranking presets", async ({ page }) => {
    await page.goto("/fantasy-football/best-ball?contest=bbm-vii");

    const shell = page.locator('[data-testid="best-ball-shell"]');
    const contestGroup = shell.getByRole("group", { name: "Best ball contest" });
    await expect(
      shell.getByRole("button", { name: /^Open .+ details$/ }).first()
    ).toBeVisible();

    for (const preset of BEST_BALL_PRESETS) {
      const control = contestGroup.getByRole("button", {
        name: preset.rankingControl,
        exact: true,
      });
      await control.click();

      await expect(control).toHaveAttribute("aria-pressed", "true");
      await expect(page).toHaveURL(new RegExp(`contest=${preset.id}`));
      await expect(
        shell.getByRole("heading", { name: preset.rankingView, exact: true })
      ).toBeVisible();
      await expect(
        shell.getByRole("heading", { name: preset.rankingHeading, exact: true })
      ).toBeVisible();
      await expect(
        shell.getByRole("button", { name: /^Open .+ details$/ }).first()
      ).toBeVisible();
      await expect(shell.getByText("No players match on this board.")).toHaveCount(0);
    }
  });

  test("opens setup for all six tracker presets", async ({ page }) => {
    await page.goto("/fantasy-football/best-ball/draft-tracker?contest=bbm-vii");

    const shell = page.locator('[data-testid="best-ball-draft-tracker-shell"]');
    const contestNav = shell.getByRole("navigation", { name: "Best ball contest" });
    await expect(shell.getByRole("heading", { name: "Choose your draft slot" })).toBeVisible();

    for (const preset of BEST_BALL_PRESETS) {
      const control = contestNav.getByRole("button", {
        name: preset.trackerControl,
        exact: true,
      });
      await control.click();

      await expect(control).toHaveAttribute("aria-pressed", "true");
      await expect(page).toHaveURL(new RegExp(`contest=${preset.id}`));
      await expect(shell.getByRole("heading", { name: "Choose your draft slot" })).toBeVisible();

      const details = shell.locator('aside[aria-label="Contest details"]');
      await expect(
        details.getByRole("heading", { name: preset.trackerHeading, exact: true })
      ).toBeVisible();
      await expect(details.getByText(preset.teamsLine, { exact: true })).toBeVisible();
    }
  });

  test("persists a BBM room and persists an undo after reload", async ({ page }) => {
    await page.goto("/fantasy-football/best-ball/draft-tracker?contest=bbm-vii");

    const shell = page.locator('[data-testid="best-ball-draft-tracker-shell"]');
    await expect(shell.getByRole("heading", { name: "Choose your draft slot" })).toBeVisible();
    await shell.getByRole("button", { name: "Open draft room from slot 1" }).click();
    await expect(shell.getByRole("heading", { name: "You are on the clock at pick 1" })).toBeVisible();

    const firstPlayer = shell.getByRole("button", { name: /^Log at pick 1, board rank/ }).first();
    const firstPlayerName = (
      await firstPlayer.getByTestId("best-ball-board-player-name").textContent()
    )?.trim();
    expect(firstPlayerName, "the refreshed BBM board exposes a first player").toBeTruthy();

    await firstPlayer.click();
    // The room used to state the pick counter in three places at once. The distill pass
    // left the sticky live bar as the single authority, so it now reads "Pick 2 of 216"
    // rather than a bare "2 of 216" tile.
    await expect(shell.getByText("Pick 2 of 216", { exact: true })).toBeVisible();
    await expect.poll(() => getPersistedBestBallPickCount(page, "bbm-vii")).toBe(1);

    await page.reload();
    await expect(shell.getByText("Pick 2 of 216", { exact: true })).toBeVisible();
    await expect(shell.getByText(firstPlayerName!, { exact: true }).first()).toBeVisible();

    await shell.getByRole("button", { name: "Undo last pick" }).click();
    await expect(shell.getByText("Pick 1 of 216", { exact: true })).toBeVisible();
    await expect(
      shell
        .getByRole("button", { name: /^Log at pick 1, board rank/ })
        .filter({ hasText: firstPlayerName! })
        .first()
    ).toBeVisible();
    await expect.poll(() => getPersistedBestBallPickCount(page, "bbm-vii")).toBe(0);

    await page.reload();
    await expect(shell.getByRole("heading", { name: "Choose your draft slot" })).toBeVisible();
  });

  test("keeps later tracker contests reachable without page overflow at 360px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/fantasy-football/best-ball/draft-tracker?contest=bbm-vii");

    const shell = page.locator('[data-testid="best-ball-draft-tracker-shell"]');
    const contestNav = shell.getByRole("navigation", { name: "Best ball contest" });
    await expect(shell.getByRole("heading", { name: "Choose your draft slot" })).toBeVisible();

    const scrollerSize = await contestNav.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(scrollerSize.scrollWidth).toBeGreaterThan(scrollerSize.clientWidth);

    for (const preset of BEST_BALL_PRESETS.slice(3)) {
      const control = contestNav.getByRole("button", {
        name: preset.trackerControl,
        exact: true,
      });
      await control.scrollIntoViewIfNeeded();
      await expect(control).toBeInViewport();

      const bounds = await control.boundingBox();
      expect(bounds, `${preset.trackerControl} has visible bounds`).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(-1);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(361);

      await control.click();
      await expect(control).toHaveAttribute("aria-pressed", "true");
      await expect(page).toHaveURL(new RegExp(`contest=${preset.id}`));
      await expect(shell.getByRole("heading", { name: "Choose your draft slot" })).toBeVisible();
    }

    const horizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(horizontalOverflow).toBeLessThanOrEqual(1);
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

test.describe("server-rendered rankings", () => {
  test("ships the first page of the board in the HTML for clients that do not run JavaScript", async ({ page }) => {
    const snapshot = await (await page.request.get("/data/fantasy/ppr.json")).json();
    const html = await (await page.request.get("/fantasy-football?position=wr&scoring=ppr")).text();

    // One "Open <name> detail" control per seeded row; React escapes apostrophes,
    // so the name check uses a receiver without one.
    expect(html.match(/aria-label="Open [^"]+ detail"/g)?.length ?? 0).toBeGreaterThanOrEqual(40);
    const plainName = snapshot.positions.WR.slice(0, 40).find(
      (player: { name: string }) => !player.name.includes("'")
    )?.name;
    expect(plainName).toBeTruthy();
    expect(html).toContain(plainName);
  });
});
