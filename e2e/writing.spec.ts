import { test, expect } from '@playwright/test'

// all-projects.spec.ts loads every page route and asserts one h1, one main, a
// real title, and a working theme toggle, so this file holds only the checks
// that are specific to a route.
test.describe('Writing / Blog', () => {
  test('/blog redirects to /writing', async ({ page }) => {
    await page.goto('/blog')
    await expect(page).toHaveURL(/\/writing/)
  })
})

test.describe('Search page', () => {
  test('/search page loads without error and preserves a seeded query', async ({ page }) => {
    const response = await page.goto('/search?q=resume&type=page')
    expect(response?.status()).toBeLessThan(400)

    const searchInput = page.getByRole('textbox').first()
    await expect(searchInput).toBeVisible()
    await expect(searchInput).toHaveValue('resume')
    expect(page.url()).toContain('/search?q=resume')
  })
})

test.describe('Legacy URL redirects', () => {
  test('/cv redirects to /resume', async ({ page }) => {
    await page.goto('/cv')
    await expect(page).toHaveURL(/\/resume/)
  })

  test('/work redirects to /portfolio', async ({ page }) => {
    await page.goto('/work')
    await expect(page).toHaveURL(/\/portfolio/)
  })
})
