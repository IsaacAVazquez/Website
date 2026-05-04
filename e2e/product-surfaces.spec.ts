import { expect, test, type Page } from "@playwright/test";

async function expectHealthyRoute(page: Page, path: string, h1: RegExp) {
  const response = await page.goto(path);

  expect(response?.status()).toBeLessThan(400);
  await expect(page.getByRole("heading", { level: 1, name: h1 })).toBeVisible();
  await expect(page.locator("h1")).toHaveCount(1);
}

async function expectNoHorizontalOverflow(page: Page) {
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1
  );

  expect(hasHorizontalOverflow).toBe(false);
}

test.describe("Product surfaces", () => {
  test("football dashboards render standings and selectable club detail panels", async ({
    page,
  }) => {
    const dashboards = [
      {
        path: "/premier-league",
        h1: /Premier League Pulse/i,
        tableName: /Premier League standings/i,
        detailTestId: "pl-selected-club",
      },
      {
        path: "/la-liga",
        h1: /La Liga Pulse/i,
        tableName: /La Liga standings/i,
        detailTestId: "la-liga-selected-club",
      },
    ];

    for (const dashboard of dashboards) {
      await expectHealthyRoute(page, dashboard.path, dashboard.h1);
      await expect(page.getByRole("table", { name: dashboard.tableName })).toBeVisible();

      await page.getByRole("button", { name: /show .+ details/i }).first().click();
      await expect(page.getByTestId(dashboard.detailTestId)).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });

  test("snapshot dashboards preserve interactive filter state in the URL", async ({
    page,
  }) => {
    await expectHealthyRoute(page, "/formula-1", /Formula 1 Pulse/i);

    const driversView = page.getByRole("button", { name: /^Drivers$/i });
    await driversView.click();
    await expect(page).toHaveURL(/view=drivers/);
    await expect(driversView).toHaveAttribute("aria-pressed", "true");
    await expectNoHorizontalOverflow(page);

    await expectHealthyRoute(page, "/github-trending-pulse", /GitHub Trending Pulse/i);

    const topicTab = page.getByRole("tab", { name: /^Topic$/i });
    await topicTab.click();
    await expect(page).toHaveURL(/view=topic/);
    await expect(topicTab).toHaveAttribute("aria-selected", "true");

    const starsSort = page.getByRole("button", { name: /^Stars$/i });
    await starsSort.click();
    await expect(page).toHaveURL(/sort=stars/);
    await expect(starsSort).toHaveAttribute("aria-pressed", "true");
    await expectNoHorizontalOverflow(page);
  });

  test("polling and SpaceX tools load deep-linked operational views", async ({
    page,
  }) => {
    await expectHealthyRoute(page, "/polling-aggregator?view=senate", /Polling Aggregator/i);
    await expect(page.getByRole("button", { name: /^Senate$/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(page.getByRole("table", { name: /Senate race ratings/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await expectHealthyRoute(
      page,
      "/spacex-mission-control?status=past",
      /operations room, not a brochure/i
    );
    await expect(page.getByTestId("mission-hero")).toBeVisible();
    await expect(page.getByTestId("mission-board")).toBeVisible();
    await expect(page.getByTestId("mission-detail-panel")).toBeVisible();
    await expect(page.getByRole("tab", { name: /^Past$/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expectNoHorizontalOverflow(page);
  });

  test("fintech tools accept calculator and ledger input", async ({ page }) => {
    await expectHealthyRoute(page, "/fintech-tools/interchange-iq", /Interchange IQ/i);

    const monthlyVolume = page.getByLabel("Monthly volume");
    await monthlyVolume.evaluate((node) => {
      const input = node as HTMLInputElement;
      const valueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;

      valueSetter?.call(input, "125000");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await expect(monthlyVolume).toHaveAttribute("aria-valuenow", "125000");
    await expect(page.getByTestId("interchange-iq-shell")).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await expectHealthyRoute(page, "/fintech-tools/budget-planner", /Budget Planner/i);
    await expect(page.getByTestId("budget-planner-shell")).toBeVisible();

    await page.getByLabel("Expense amount").fill("42.50");
    await page.getByLabel("Expense note").fill("E2E lunch");
    await expect(page.getByRole("button", { name: /^Add expense$/i })).toBeEnabled();
    await page.getByLabel("Expense note").press("Enter");

    await expect(page.getByText("E2E lunch")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
