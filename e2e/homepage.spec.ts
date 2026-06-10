import { test, expect } from '@playwright/test'

// The header renders every entry in src/constants/navlinks.tsx (8 links) in both
// the desktop and mobile menus. Keep this in sync with that file.
const NAV_LABELS = [
  'Home',
  'About',
  'Projects',
  'Writing',
  'Investments',
  'Fantasy',
  'Resume',
  'Contact',
]

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Isaac Vazquez/)
  })

  test('should display hero section', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('hero')).toBeVisible()
  })

  test('should have functional desktop navigation', async ({ page }) => {
    await page.goto('/')

    await page.waitForLoadState('networkidle')

    const navLabels = await page
      .getByLabel('Primary navigation')
      .getByRole('link')
      .allTextContents()

    expect(navLabels).toEqual(NAV_LABELS)
  })

  test('should have functional mobile navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    await page.getByRole('button', { name: /open navigation menu/i }).click()

    const navLabels = await page
      .getByLabel('Mobile navigation')
      .getByRole('link')
      .allTextContents()

    expect(navLabels).toEqual(NAV_LABELS)
  })

  test('shows the editorial hero and primary CTAs', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(
      page.getByRole('heading', { level: 1, name: /isaac vazquez/i })
    ).toBeVisible()
    // The primary CTAs sit in the bio band just under the hero wordmark.
    await expect(page.getByRole('link', { name: /view projects/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /read writing/i }).first()).toBeVisible()
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

    const skipLink = page.getByRole('link', { name: /skip to content/i })
    if ((await skipLink.count()) > 0) {
      await expect(skipLink).toBeVisible()
    }
  })

  test('keeps the hero heading in the initial mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const heroHeading = page.getByRole('heading', { level: 1, name: /isaac vazquez/i })
    await expect(heroHeading).toBeVisible()

    // The whole heading box must fit inside the initial 844px viewport —
    // asserting only `y < 844` would pass for any heading near the top.
    const headingBox = await heroHeading.boundingBox()
    expect(headingBox).not.toBeNull()
    expect(headingBox!.y).toBeGreaterThanOrEqual(0)
    expect(headingBox!.y + headingBox!.height).toBeLessThanOrEqual(844)

    // The primary "View projects" CTA is present further down the page.
    await expect(page.getByRole('link', { name: /view projects/i }).first()).toBeVisible()
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
        name: /writing on pm, ai workflows, and fintech tools/i,
      })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', {
        name: /building something that needs judgment and follow-through/i,
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

  test('keeps homepage content visible when reduced motion is requested', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Hero and marquee motion are decorative; with reduced motion the hero and
    // the editorial sections must still render their content (not stay hidden).
    await expect(page.getByTestId('hero')).toBeVisible()
    await expect(
      page.getByRole('heading', {
        name: /product surfaces that show how i think in practice/i,
      })
    ).toBeVisible()
  })
})
