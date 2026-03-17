import { expect, test } from "@playwright/test";

test.describe("March Madness", () => {
  test("supports primary and secondary tab navigation without horizontal overflow", async ({ page }) => {
    await page.goto("/march-madness-2026");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: /march madness/i })
    ).toBeVisible();

    await page.getByRole("tab", { name: /^West$/ }).click();
    await expect(page.getByText(/regional site:/i)).toBeVisible();

    await page.getByRole("tab", { name: /^Analytics$/ }).click();
    await page.getByRole("tab", { name: /^S-Curve$/ }).click();
    await expect(page.getByText(/underseeded/i)).toBeVisible();

    await page.getByRole("tab", { name: /^Time Zones$/ }).click();
    await expect(page.getByText(/Bracket Flips/i)).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(hasHorizontalOverflow).toBeFalsy();
  });
});
