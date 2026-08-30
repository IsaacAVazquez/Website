import { expect, test, type Locator, type Page } from "@playwright/test";

const CALCULATOR_URL =
  "/fantasy-football/trade-calculator?scoring=ppr&teams=12&rosterSize=15&lineup=traditional";

async function getReadyCalculator(page: Page) {
  const shell = page.locator('[data-testid="fantasy-trade-calculator-shell"]');
  await expect(shell).toHaveAttribute("data-hydrated", "true");
  await expect(shell.getByText(/players available in PPR/i)).toBeVisible();
  return shell;
}

async function addFirstSearchResult(search: Locator, listbox: Locator) {
  const label = await search.getAttribute("aria-label");
  await search.fill(label?.includes("give") ? "WR" : "RB");
  await expect(listbox).toBeVisible();
  await search.press("ArrowDown");
  await search.press("Enter");
  await expect(search).toBeFocused();
}

test.describe("Fantasy football trade calculator", () => {
  test("builds, saves, and isolates a keyboard-entered trade by scoring format", async ({ page }) => {
    await page.goto(CALCULATOR_URL);
    const shell = await getReadyCalculator(page);

    const giveSearch = shell.getByRole("combobox", { name: "Add a player to you give" });
    const getSearch = shell.getByRole("combobox", { name: "Add a player to you get" });
    await addFirstSearchResult(
      giveSearch,
      shell.getByRole("listbox", { name: "Players for you give" })
    );
    await addFirstSearchResult(
      getSearch,
      shell.getByRole("listbox", { name: "Players for you get" })
    );

    await expect(shell.getByLabel("You give players").getByRole("listitem")).toHaveCount(1);
    await expect(shell.getByLabel("You get players").getByRole("listitem")).toHaveCount(1);
    await expect(shell.getByLabel("Trade evaluation")).not.toContainText("Build both sides");

    await page.reload();
    const reloaded = await getReadyCalculator(page);
    await expect(reloaded.getByLabel("You give players").getByRole("listitem")).toHaveCount(1);
    await expect(reloaded.getByLabel("You get players").getByRole("listitem")).toHaveCount(1);

    await reloaded.getByRole("radio", { name: "Half PPR" }).click();
    await expect(page).toHaveURL(/scoring=half_ppr/);
    await expect(reloaded.getByText(/players available in Half PPR/i)).toBeVisible();
    await expect(reloaded.getByLabel("You give players")).toContainText(
      "Search the overall board and add the first player."
    );
    await expect(reloaded.getByLabel("You get players")).toContainText(
      "Search the overall board and add the first player."
    );
  });

  test("keeps the task readable and operable on a narrow screen", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.goto(CALCULATOR_URL);
    const shell = await getReadyCalculator(page);

    await expect(shell.getByRole("heading", { name: "Build a Trade Offer", level: 1 })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBe(0);

    const controls = shell.locator("button:visible, a:visible, input[type=search]:visible, select:visible, summary:visible");
    for (const control of await controls.all()) {
      const box = await control.boundingBox();
      if (!box) continue;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
});
