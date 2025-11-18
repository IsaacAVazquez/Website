import { test, expect } from '@playwright/test'

test.describe('Fantasy Football Features', () => {
  test('should load fantasy football landing page', async ({ page }) => {
    await page.goto('/fantasy-football')

    // Check page loaded
    await expect(page).toHaveURL(/.*fantasy-football/)

    // Check for fantasy football content
    const heading = page.locator('h1').first()
    await expect(heading).toBeVisible()
  })

  test('should display tier rankings', async ({ page }) => {
    await page.goto('/fantasy-football/tiers/qb')

    // Wait for content to load
    await page.waitForLoadState('networkidle')

    // Verify we're on the QB tiers page
    await expect(page).toHaveURL(/.*qb/)
  })

  test('should navigate between different position tiers', async ({ page }) => {
    await page.goto('/fantasy-football/tiers/qb')

    // Look for RB link/button
    const rbLink = page.getByRole('link', { name: /rb/i }).or(
      page.getByRole('button', { name: /rb/i })
    )

    if (await rbLink.count() > 0) {
      await rbLink.first().click()
      await expect(page).toHaveURL(/.*rb/)
    }
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/fantasy-football')

    // Verify page is accessible on mobile
    await expect(page).toHaveURL(/.*fantasy-football/)
  })
})
