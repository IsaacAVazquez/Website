import { expect, test } from "@playwright/test";

test.describe("Search", () => {
  test("hydrates deep-linked search state and clears back to the canonical URL", async ({
    page,
  }) => {
    await page.goto(
      "/search?q=fantasy&type=project&category=Fantasy%20Football%20Analytics"
    );

    const input = page.getByRole("textbox", { name: /search content/i });

    await expect(input).toHaveValue("fantasy");
    await expect(
      page.getByRole("heading", { name: /result found for .fantasy/i })
    ).toBeVisible();
    await expect(page.getByText("Fantasy Football Analytics Platform")).toBeVisible();
    await expect(page.getByText("Type: project")).toBeVisible();
    await expect(page.getByText("Category: Fantasy Football Analytics")).toBeVisible();

    await page.getByRole("button", { name: /show filters|hide filters/i }).click();
    await page.getByRole("button", { name: /clear filters/i }).click();

    await expect(page).toHaveURL(/\/search\?q=fantasy$/);

    await page.getByRole("button", { name: /clear search/i }).click();

    await expect(input).toHaveValue("");
    await expect(page).toHaveURL(/\/search$/);
    await expect(page.getByText(/search tips/i)).toBeVisible();
  });
});
