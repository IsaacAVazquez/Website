import { expect, test } from "@playwright/test";

test.describe("Resume", () => {
  test("renders the résumé and exposes a working PDF download", async ({ page }) => {
    const response = await page.goto("/resume");

    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("h1")).toHaveCount(1);

    // The Download PDF action is the single highest-value control on this page.
    const download = page.getByRole("button", { name: /download pdf/i });
    await expect(download).toBeVisible();
    await expect(download).toBeEnabled();

    // The handler points an anchor at this asset; verify it actually resolves
    // rather than 404s, which is the realistic regression (handler/href/rename).
    const pdf = await page.request.get("/Isaac_Vazquez_Resume.pdf");
    expect(pdf.status()).toBe(200);
    expect(Number(pdf.headers()["content-length"] ?? "0")).toBeGreaterThan(0);
  });
});
