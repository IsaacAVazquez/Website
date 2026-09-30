import { expect, test } from "@playwright/test";

test.describe("Resume", () => {
  test("renders the résumé and exposes a working PDF download", async ({ page }) => {
    const response = await page.goto("/resume");

    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("h1")).toHaveCount(1);

    const download = page.getByRole("link", { name: /download pdf/i }).first();
    await expect(download).toBeVisible();
    await expect(download).toHaveAttribute("href", "/Isaac_Vazquez_Resume.pdf");

    // The handler points an anchor at this asset; verify it actually resolves
    // rather than 404s, which is the realistic regression (handler/href/rename).
    const pdf = await page.request.get("/Isaac_Vazquez_Resume.pdf");
    expect(pdf.status()).toBe(200);
    expect(Number(pdf.headers()["content-length"] ?? "0")).toBeGreaterThan(0);
  });

  test("starts the contact link on its column when the page prints", async ({ page }) => {
    await page.goto("/resume");
    const link = page.getByRole("main").getByRole("link", { name: /get in touch/i });
    await expect(link).toBeVisible();

    await page.emulateMedia({ media: "print" });

    // A ghost link takes its side padding back with a negative start margin.
    // The print sheet drops that padding, and while it kept the margin the
    // label began left of the column, where the edge of the page cut the "G"
    // off. The PDF's text layer still read "Get in touch", so this measures
    // where the label starts against the line above it.
    const [label, lineAbove] = await link.evaluate((a) => [
      a.getClientRects()[0].left + parseFloat(getComputedStyle(a).paddingLeft),
      a.previousElementSibling!.getBoundingClientRect().left,
    ]);
    expect(label).toBeCloseTo(lineAbove, 0);
  });
});
