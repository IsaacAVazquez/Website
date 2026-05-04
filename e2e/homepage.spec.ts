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

  test('should use the homepage hero and primary CTAs', async ({ page }) => {
    await page.goto('/')
    const hero = page.getByTestId('hero')

    await expect(
      hero.getByRole('heading', {
        name: /i build products that make hard problems easier to act on/i,
      })
    ).toBeVisible()
    await expect(hero.getByRole('link', { name: /view projects/i })).toBeVisible()
    await expect(hero.getByRole('link', { name: /read writing/i })).toBeVisible()
    await expect(page.getByTestId('home-projects')).toBeVisible()
    await expect(page.getByTestId('home-writing')).toBeVisible()
    await expect(page.getByRole('button', { name: /theme:/i }).first()).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

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
      name: /i build products that make hard problems easier to act on/i,
    })
    const primaryCta = page.getByRole('link', { name: /view projects/i })

    const headingBox = await heroHeading.boundingBox()
    const ctaBox = await primaryCta.boundingBox()

    expect(headingBox).not.toBeNull()
    expect(ctaBox).not.toBeNull()
    expect((headingBox?.y ?? 9999) < 650).toBe(true)
    expect((ctaBox?.y ?? 9999) + (ctaBox?.height ?? 0) <= 844).toBe(true)
  })

  test('shows the editorial sections and card links', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(
      page.getByRole('heading', {
        name: /product surfaces that show how i think in practice/i,
      })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', {
        name: /writing that shows how i think about pm, ai workflows, and fintech tools/i,
      })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', {
        name: /if you're building something that needs judgment and follow-through, i'd like to hear about it/i,
      })
    ).toBeVisible()

    await expect(page.getByTestId('home-projects').getByRole('link')).toHaveCount(3)
    await expect(page.getByTestId('home-writing').getByRole('link')).toHaveCount(3)
  })

  test('supports dark theme on the homepage', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('theme', 'dark')
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.getByTestId('hero')).toBeVisible()
    await expect(page.getByTestId('home-writing')).toBeVisible()
  })

  test('disables decorative homepage motion when reduced motion is requested', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const styles = await page.evaluate(() => {
      const reveal = document.querySelector('.home-reveal')

      return {
        revealOpacity: reveal ? window.getComputedStyle(reveal).opacity : null,
      }
    })

    expect(styles.revealOpacity).toBe('1')
  })
})
