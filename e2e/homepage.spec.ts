import { test, expect } from '@playwright/test'

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

// The editorial homepage (HomePageV3) leads with a wordmark hero and exposes
// stable section ids (#projects, #writing, #contact) instead of test ids.
const heroSection = 'section[aria-labelledby="home-hero-wordmark"]'

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Isaac Vazquez/)
  })

  test('should display hero section', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator(heroSection)).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 1, name: /isaac\s*vazquez/i })
    ).toBeVisible()
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

  test('should use the homepage hero and primary CTAs', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator(heroSection)).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 1, name: /isaac\s*vazquez/i })
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: /view projects/i }).first()
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: /read writing/i }).first()
    ).toBeVisible()
    await expect(page.locator('#projects')).toBeVisible()
    await expect(page.locator('#writing')).toBeVisible()
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

  test('keeps the homepage hero in the initial mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const heroHeading = page.getByRole('heading', {
      level: 1,
      name: /isaac\s*vazquez/i,
    })

    const headingBox = await heroHeading.boundingBox()

    expect(headingBox).not.toBeNull()
    expect((headingBox?.y ?? 9999) < 650).toBe(true)
    expect((headingBox?.y ?? 9999) + (headingBox?.height ?? 0) <= 844).toBe(true)
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

    await expect(
      page.locator('#projects').getByRole('heading', { level: 3 })
    ).toHaveCount(3)
    await expect(
      page.locator('#writing').getByRole('heading', { level: 3 })
    ).toHaveCount(3)
  })

  test('supports dark theme on the homepage', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('theme', 'dark')
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.locator(heroSection)).toBeVisible()
    await expect(page.locator('#writing')).toBeVisible()
  })

  test('honors reduced motion on the homepage', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // The global reduced-motion reset forces animation-iteration-count to 1,
    // so the decorative marquee (and any other looping motion) stops repeating.
    const infiniteAnimations = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll('*')).filter(
          (el) => getComputedStyle(el).animationIterationCount === 'infinite'
        ).length
    )

    expect(infiniteAnimations).toBe(0)
  })
})
