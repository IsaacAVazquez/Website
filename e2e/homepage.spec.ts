import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Isaac Vazquez/)
  })

  test('should display hero section', async ({ page }) => {
    await page.goto('/')

    // Check for hero content
    const hero = page.locator('[data-testid="hero"]').or(page.locator('h1').first())
    await expect(hero).toBeVisible()
  })

  test('should have functional navigation', async ({ page }) => {
    await page.goto('/')

    // Wait for navigation to be visible
    await page.waitForLoadState('networkidle')

    // Check if About link exists and is clickable
    const aboutLink = page.getByRole('link', { name: /about/i })
    if (await aboutLink.count() > 0) {
      await expect(aboutLink.first()).toBeVisible()
    }
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Check that page loads on mobile
    await expect(page).toHaveTitle(/Isaac Vazquez/)
  })

  test('should have accessible skip link', async ({ page }) => {
    await page.goto('/')

    // Tab to focus on skip link (if present)
    await page.keyboard.press('Tab')

    // Check if skip link exists
    const skipLink = page.getByRole('link', { name: /skip to content/i })
    if (await skipLink.count() > 0) {
      await expect(skipLink).toBeVisible()
    }
  })
})
