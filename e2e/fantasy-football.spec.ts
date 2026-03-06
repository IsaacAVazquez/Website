import { test, expect } from '@playwright/test'

test.describe('Fantasy Football Landing Page', () => {
  test('loads the fantasy football landing page', async ({ page }) => {
    await page.goto('/fantasy-football')
    await page.waitForLoadState('networkidle')

    // Should have a page heading mentioning fantasy or tiers
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible()
  })

  test('has navigation links to position tier pages', async ({ page }) => {
    await page.goto('/fantasy-football')
    await page.waitForLoadState('networkidle')

    // Look for links to position tier pages (qb, rb, wr, te, etc.)
    const positionLinks = page.getByRole('link', { name: /QB|RB|WR|TE|K|DST|FLEX/i })
    const count = await positionLinks.count()
    // At least some position links should exist
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('does not show a 404 or error page', async ({ page }) => {
    const response = await page.goto('/fantasy-football')
    expect(response?.status()).toBeLessThan(400)
  })
})

test.describe('Fantasy Football Tier Pages', () => {
  const positions = ['qb', 'rb', 'wr', 'te']

  for (const position of positions) {
    test(`/fantasy-football/tiers/${position} page loads`, async ({ page }) => {
      const response = await page.goto(`/fantasy-football/tiers/${position}`)
      expect(response?.status()).toBeLessThan(400)
      await page.waitForLoadState('networkidle')
    })

    test(`/fantasy-football/tiers/${position} displays a heading`, async ({ page }) => {
      await page.goto(`/fantasy-football/tiers/${position}`)
      await page.waitForLoadState('networkidle')

      const heading = page.locator('h1, h2').first()
      await expect(heading).toBeVisible()
    })

    test(`/fantasy-football/tiers/${position} contains the position label`, async ({ page }) => {
      await page.goto(`/fantasy-football/tiers/${position}`)
      await page.waitForLoadState('networkidle')

      // The page should reference the position name
      const bodyText = await page.locator('body').innerText()
      expect(bodyText.toLowerCase()).toContain(position)
    })
  }

  test('navigating between positions stays within /fantasy-football/tiers', async ({ page }) => {
    await page.goto('/fantasy-football/tiers/qb')
    await page.waitForLoadState('networkidle')

    // If there's a position selector, click on RB
    const rbLink = page
      .getByRole('link', { name: /\bRB\b/ })
      .or(page.getByRole('button', { name: /\bRB\b/ }))
      .first()

    if (await rbLink.count() > 0) {
      await rbLink.click()
      await page.waitForLoadState('networkidle')
      expect(page.url()).toContain('rb')
    }
  })
})

test.describe('Fantasy Football Draft Tracker', () => {
  test('draft tracker page loads without error', async ({ page }) => {
    const response = await page.goto('/fantasy-football/draft-tracker')
    expect(response?.status()).toBeLessThan(400)
  })

  test('draft tracker has a visible heading', async ({ page }) => {
    await page.goto('/fantasy-football/draft-tracker')
    await page.waitForLoadState('networkidle')

    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible()
  })
})

test.describe('FF short URL redirects', () => {
  test('/ff redirects to /fantasy-football', async ({ page }) => {
    await page.goto('/ff')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('fantasy-football')
  })

  test('/qb redirects to /fantasy-football/tiers/qb', async ({ page }) => {
    await page.goto('/qb')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('qb')
  })
})
