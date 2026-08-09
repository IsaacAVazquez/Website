import { test, expect } from '@playwright/test'

// Catalog97Header renders the seven destinations in catalog97Nav.ts on every
// viewport. The links wrap on phones instead of moving behind a menu.
const NAV_LABELS = [
  'Home',
  'Work',
  'Writing',
  'Dashboards',
  'About',
  'Résumé',
  'Contact',
]

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Isaac Vazquez/)
  })

  test('should display hero section', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('.c97-page')).toBeVisible()
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: /i build tools that make hard problems easier to act on/i,
      })
    ).toBeVisible()
  })

  test('should have functional desktop navigation', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link')).toHaveText(
      NAV_LABELS
    )
  })

  test('should have functional mobile navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const navigation = page.getByRole('navigation', { name: 'Main' })
    await expect(navigation.getByRole('link')).toHaveText(NAV_LABELS)
    await expect(navigation.getByRole('link', { name: 'Work' })).toBeVisible()
  })

  test('shows the Catalog 97 hero and primary CTAs', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: /i build tools that make hard problems easier to act on/i,
      })
    ).toBeVisible()
    // The primary CTAs sit directly under the hero claim.
    await expect(page.getByRole('link', { name: /see the work/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /start a conversation/i }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: /selected work/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /recent writing/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /search the site/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /theme:/i })).toBeVisible()
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

    const skipLink = page.getByRole('link', { name: /skip to main content/i })
    await expect(skipLink).toBeVisible()
  })

  test('keeps the hero heading in the initial mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const heroHeading = page.getByRole('heading', {
      level: 1,
      name: /i build tools that make hard problems easier to act on/i,
    })
    await expect(heroHeading).toBeVisible()

    // The whole heading box must fit inside the initial 844px viewport —
    // asserting only `y < 844` would pass for any heading near the top.
    const headingBox = await heroHeading.boundingBox()
    expect(headingBox).not.toBeNull()
    expect(headingBox!.y).toBeGreaterThanOrEqual(0)
    expect(headingBox!.y + headingBox!.height).toBeLessThanOrEqual(844)

    // The primary "See the work" CTA is present in the hero.
    await expect(page.getByRole('link', { name: /see the work/i }).first()).toBeVisible()
  })

  test('keeps the header utilities and primary action usable at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 })
    await page.goto('/')

    const navigation = page.getByRole('navigation', { name: 'Main' })
    await expect(navigation.getByRole('button', { name: /search the site/i })).toBeVisible()
    await expect(navigation.getByRole('button', { name: /theme:/i })).toBeVisible()

    const controls = navigation.locator('a, button')
    const boxes = await controls.evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect()
        return {
          label: element.getAttribute('aria-label') ?? element.textContent?.trim() ?? '',
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        }
      })
    )

    for (let leftIndex = 0; leftIndex < boxes.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < boxes.length; rightIndex += 1) {
        const left = boxes[leftIndex]
        const right = boxes[rightIndex]
        const overlaps =
          Math.min(left.right, right.right) > Math.max(left.left, right.left) &&
          Math.min(left.bottom, right.bottom) > Math.max(left.top, right.top)
        expect(overlaps, `${left.label} overlaps ${right.label}`).toBe(false)
      }
    }

    const layout = await page.evaluate(() => {
      const action = document.querySelector<HTMLAnchorElement>('main a[href="/portfolio"]')
      const actionRect = action?.getBoundingClientRect()
      return {
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        actionBottom: actionRect ? actionRect.bottom : null,
        viewportHeight: window.innerHeight,
      }
    })

    expect(layout.hasHorizontalOverflow).toBe(false)
    expect(layout.actionBottom).not.toBeNull()
    expect(layout.actionBottom as number).toBeLessThanOrEqual(layout.viewportHeight)
  })

  test('shows the Catalog 97 sections and their links', async ({ page }) => {
    await page.goto('/')

    const selectedWork = page.locator('section').filter({
      has: page.getByRole('heading', { name: /selected work/i }),
    })
    const recentWriting = page.locator('section').filter({
      has: page.getByRole('heading', { name: /recent writing/i }),
    })

    await expect(selectedWork).toBeVisible()
    await expect(recentWriting).toBeVisible()
    await expect(page.getByRole('heading', { name: /live dashboards/i })).toBeVisible()
    expect(await selectedWork.locator('a[href^="/portfolio/"]').count()).toBeGreaterThan(0)
    expect(await recentWriting.locator('a[href^="/writing/"]').count()).toBeGreaterThan(0)
  })

  test('supports dark theme on the homepage', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('theme', 'dark')
    })

    await page.goto('/')

    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.locator('.c97-page')).toBeVisible()
    await expect(page.getByRole('heading', { name: /recent writing/i })).toBeVisible()
  })

  test('keeps homepage content visible when reduced motion is requested', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    // Count-ups and the sparkline draw-in are decorative; with reduced motion
    // the hero must still render finished content (not stay hidden or at zero).
    await expect(page.locator('.c97-page')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /selected work/i })
    ).toBeVisible()
  })
})
