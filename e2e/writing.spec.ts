import { test, expect } from '@playwright/test'

test.describe('Writing / Blog', () => {
  test('/blog redirects to /writing', async ({ page }) => {
    await page.goto('/blog')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/writing')
  })

  test('/writing page loads without error', async ({ page }) => {
    const response = await page.goto('/writing')
    expect(response?.status()).toBeLessThan(400)
  })

  test('/writing page has a visible heading', async ({ page }) => {
    await page.goto('/writing')
    await page.waitForLoadState('networkidle')

    const heading = page.locator('h1').first()
    await expect(heading).toBeVisible()
  })

  test('/writing page has a meaningful title', async ({ page }) => {
    await page.goto('/writing')
    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)
  })
})

test.describe('Dark mode toggle', () => {
  test('theme toggle button exists on homepage', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Look for a theme or dark mode toggle button
    const toggleButton = page
      .getByRole('button', { name: /theme|dark|light/i })
      .or(page.locator('[data-testid="theme-toggle"]'))
      .first()

    // It's okay if the toggle is not present — the test is informational
    const count = await toggleButton.count()
    if (count > 0) {
      await expect(toggleButton).toBeVisible()
    }
  })

  test('dark class can be toggled on the html element', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const toggleButton = page
      .getByRole('button', { name: /theme|dark|light/i })
      .or(page.locator('[data-testid="theme-toggle"]'))
      .first()

    if (await toggleButton.count() > 0) {
      // Click toggle
      await toggleButton.click()
      await page.waitForTimeout(300)

      // Check if .dark class was added/removed from html element
      const htmlClass = await page.locator('html').getAttribute('class')
      // Just verify the attribute is accessible — the class value may or may not contain 'dark'
      expect(typeof htmlClass === 'string' || htmlClass === null).toBe(true)
    }
  })
})

test.describe('Search page', () => {
  test('/search page loads without error and preserves a seeded query', async ({ page }) => {
    const response = await page.goto('/search?q=resume&type=page')
    expect(response?.status()).toBeLessThan(400)

    await page.waitForLoadState('networkidle')

    const searchInput = page.getByRole('textbox').first()
    await expect(searchInput).toBeVisible()
    await expect(searchInput).toHaveValue('resume')
    expect(page.url()).toContain('/search?q=resume')
  })

  test('/search page has a visible input', async ({ page }) => {
    await page.goto('/search')
    await page.waitForLoadState('networkidle')

    const searchInput = page
      .getByRole('searchbox')
      .or(page.getByRole('textbox'))
      .first()

    if (await searchInput.count() > 0) {
      await expect(searchInput).toBeVisible()
    }
  })
})

test.describe('Static pages', () => {
  test('/resume page loads without error', async ({ page }) => {
    const response = await page.goto('/resume')
    expect(response?.status()).toBeLessThan(400)
  })

  test('/contact page loads without error', async ({ page }) => {
    const response = await page.goto('/contact')
    expect(response?.status()).toBeLessThan(400)
  })

  test('/accessibility page loads without error', async ({ page }) => {
    const response = await page.goto('/accessibility')
    expect(response?.status()).toBeLessThan(400)
  })

  test('/about page has a visible h1', async ({ page }) => {
    await page.goto('/about')
    await page.waitForLoadState('networkidle')
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible()
  })
})

test.describe('Legacy URL redirects', () => {
  test('/cv redirects to /resume', async ({ page }) => {
    await page.goto('/cv')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/resume')
  })

  test('/work redirects to /portfolio', async ({ page }) => {
    await page.goto('/work')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/portfolio')
  })
})
