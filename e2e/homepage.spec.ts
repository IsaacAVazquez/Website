import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Isaac Vazquez/)
  })

  test('should display hero section', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('[data-testid="hero"]')).toBeVisible()
  })

  test('should have functional navigation', async ({ page }, testInfo) => {
    await page.goto('/')

    await page.waitForLoadState('networkidle')

    if (testInfo.project.name.includes('Mobile')) {
      await page.getByRole('button', { name: /open navigation menu/i }).click()
      const mobileNav = page.getByLabel('Mobile navigation')
      await expect(mobileNav.getByRole('link', { name: /projects/i })).toBeVisible()
      await expect(mobileNav.getByRole('link', { name: /writing/i })).toHaveCount(0)
      return
    }

    await expect(page.getByLabel('Primary navigation').getByRole('link', { name: /projects/i })).toBeVisible()
    await expect(page.getByLabel('Primary navigation').getByRole('link', { name: /writing/i })).toHaveCount(0)
  })

  test('should use the simplified homepage hero and projects CTA', async ({ page }) => {
    await page.goto('/')
    const hero = page.getByTestId('hero')

    await expect(hero.getByRole('heading', { name: /building thoughtful products/i })).toBeVisible()
    await expect(hero.getByRole('link', { name: /view projects/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /browse writing/i })).toBeVisible()
    await expect(page.getByText(/explore the strongest entry points/i)).toHaveCount(0)
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

  test('keeps the primary homepage CTA in the initial mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const heroHeading = page.getByRole('heading', {
      level: 1,
      name: /building thoughtful products/i,
    })
    const primaryCta = page.getByRole('link', { name: /view projects/i })

    const headingBox = await heroHeading.boundingBox()
    const ctaBox = await primaryCta.boundingBox()

    expect(headingBox).not.toBeNull()
    expect(ctaBox).not.toBeNull()
    expect((headingBox?.y ?? 9999) < 650).toBe(true)
    expect((ctaBox?.y ?? 9999) + (ctaBox?.height ?? 0) <= 844).toBe(true)
  })
})
