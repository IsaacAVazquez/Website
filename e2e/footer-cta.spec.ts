import { test, expect } from "@playwright/test";

test.describe("Footer CTA cleanup", () => {
  test("uses the Catalog 97 footer after the homepage closing statement", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByText(/if you have a thing that needs proving/i)
    ).toBeVisible();

    const footer = page.getByRole("contentinfo", { name: "Site footer" });
    await expect(footer).toHaveCount(1);
    await expect(footer.getByRole("navigation", { name: "Pages" })).toBeVisible();
    await expect(footer).not.toHaveAttribute("data-footer-variant");
  });

  test("uses the Catalog 97 footer on the contact page", async ({ page }) => {
    await page.goto("/contact");

    await expect(
      page.getByRole("heading", { name: /if you have something worth building/i })
    ).toBeVisible();

    const footer = page.getByRole("contentinfo", { name: "Site footer" });
    await expect(footer).toHaveCount(1);
    await expect(footer.getByRole("navigation", { name: "Elsewhere" })).toBeVisible();
    await expect(footer).not.toHaveAttribute("data-footer-variant");
  });

  test("keeps the portfolio CTA separate from the Catalog 97 footer", async ({ page }) => {
    await page.goto("/portfolio");

    await expect(page.getByRole("link", { name: /ask about one/i })).toBeVisible();

    const footer = page.getByRole("contentinfo", { name: "Site footer" });
    await expect(footer).toHaveCount(1);
    await expect(footer.getByRole("link", { name: /work/i })).toBeVisible();
    await expect(page.locator("#contact")).toHaveCount(0);
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
