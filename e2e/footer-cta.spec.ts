import { test, expect } from "@playwright/test";

test.describe("Footer CTA cleanup", () => {
  test("uses the compact footer on the homepage", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: /building something that needs judgment and follow-through/i,
      })
    ).toBeVisible();

    const footer = page.getByRole("contentinfo");
    await expect(footer).toHaveAttribute("data-footer-variant", "compact");
    await expect(
      footer.getByRole("heading", { name: /building something that needs judgment and follow-through/i })
    ).toHaveCount(0);
  });

  test("uses the compact footer on the contact page", async ({ page }) => {
    await page.goto("/contact");

    await expect(
      page.getByRole("heading", { name: /get in touch\./i })
    ).toBeVisible();

    const footer = page.getByRole("contentinfo");
    await expect(footer).toHaveAttribute("data-footer-variant", "compact");
    await expect(
      footer.getByRole("heading", { name: /building something that needs judgment and follow-through/i })
    ).toHaveCount(0);
  });

  test("relies on the footer as the single closing CTA on the portfolio page", async ({ page }) => {
    await page.goto("/portfolio");

    await expect(page.getByText(/continue the conversation/i)).toHaveCount(0);
    await expect(page.getByText(/start a conversation/i)).toHaveCount(0);

    const footer = page.getByRole("contentinfo");
    await expect(footer).toHaveAttribute("data-footer-variant", "full");
    await expect(
      footer.getByRole("heading", { name: /building something that needs judgment and follow-through/i })
    ).toBeVisible();
  });

  test("uses the footer sign-off on writing detail pages", async ({ page }) => {
    await page.goto("/writing/2026-march-madness-bracket-analysis");

    await expect(
      page.getByText(/interested in learning more about product management or working together\?/i)
    ).toHaveCount(0);

    const footer = page.getByRole("contentinfo");
    await expect(footer).toHaveAttribute("data-footer-variant", "full");
    await expect(
      footer.getByRole("heading", { name: /building something that needs judgment and follow-through/i })
    ).toBeVisible();
  });
});
