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

  test('should have functional desktop navigation', async ({ page }) => {
    await page.goto('/')

    await page.waitForLoadState('networkidle')

    const navLabels = await page
      .getByLabel('Primary navigation')
      .getByRole('link')
      .allTextContents()

    expect(navLabels).toEqual([
      'Home',
      'About',
      'Projects',
      'Writing',
      'Investments',
      'Resume',
      'Contact',
    ])
  })

  test('should have functional mobile navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    await page.getByRole('button', { name: /open navigation menu/i }).click()

    const navLabels = await page
      .getByLabel('Mobile navigation')
      .getByRole('link')
      .allTextContents()

    expect(navLabels).toEqual([
      'Home',
      'About',
      'Projects',
      'Writing',
      'Investments',
      'Resume',
      'Contact',
    ])
  })

  test('should use the simplified homepage hero and projects CTA', async ({ page }) => {
    await page.goto('/')
    const hero = page.getByTestId('hero')

    await expect(
      hero.getByRole('heading', {
        name: /product manager focused on reliability, analytics, and execution/i,
      })
    ).toBeVisible()
    await expect(hero.getByRole('link', { name: /view projects/i })).toBeVisible()
    await expect(hero.getByText(/product manager portfolio/i)).toHaveCount(0)
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
      name: /product manager focused on reliability, analytics, and execution/i,
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
