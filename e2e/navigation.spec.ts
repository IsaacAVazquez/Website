import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should navigate through the header destinations', async ({ page }, testInfo) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    if (testInfo.project.name.includes('Mobile')) {
      await page.getByRole('button', { name: /open navigation menu/i }).click()
      const mobileNav = page.getByLabel('Mobile navigation')
      await expect(mobileNav.getByRole('link', { name: /^Home$/i })).toBeVisible()
      await expect(mobileNav.getByRole('link', { name: /^Projects$/i })).toBeVisible()
      await expect(mobileNav.getByRole('link', { name: /^Investments$/i })).toBeVisible()
      await expect(mobileNav.getByRole('link', { name: /^Resume$/i })).toBeVisible()
      await expect(mobileNav.getByRole('link', { name: /^Contact$/i })).toBeVisible()
      await expect(mobileNav.getByRole('link', { name: /^Writing$/i })).toHaveCount(0)
      return
    }

    const desktopNav = page.getByLabel('Primary navigation')
    await expect(desktopNav.getByRole('link', { name: /^Home$/i })).toBeVisible()
    await expect(desktopNav.getByRole('link', { name: /^About$/i })).toBeVisible()
    await expect(desktopNav.getByRole('link', { name: /^Projects$/i })).toBeVisible()
    await expect(desktopNav.getByRole('link', { name: /^Investments$/i })).toBeVisible()
    await expect(desktopNav.getByRole('link', { name: /^Resume$/i })).toBeVisible()
    await expect(desktopNav.getByRole('link', { name: /^Contact$/i })).toBeVisible()
    await expect(desktopNav.getByRole('link', { name: /^Writing$/i })).toHaveCount(0)

    await desktopNav.getByRole('link', { name: /^Projects$/i }).click()
    await expect(page).toHaveURL(/.*portfolio/)

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.getByLabel('Primary navigation').getByRole('link', { name: /^About$/i }).click()
    await expect(page).toHaveURL(/.*about/)

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.getByLabel('Primary navigation').getByRole('link', { name: /^Investments$/i }).click()
    await expect(page).toHaveURL(/.*investments/)

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.getByLabel('Primary navigation').getByRole('link', { name: /^Resume$/i }).click()
    await expect(page).toHaveURL(/.*resume/)

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.getByLabel('Primary navigation').getByRole('link', { name: /^Contact$/i }).click()
    await expect(page).toHaveURL(/.*contact/)
  })

  test('should keep the active destination marked in desktop navigation', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('Mobile'), 'Desktop-only navigation assertion')

    await page.goto('/portfolio')
    await page.waitForLoadState('networkidle')

    await expect(page.getByLabel('Primary navigation').getByRole('link', { name: 'Projects' })).toHaveAttribute('aria-current', 'page')
  })

  test('should navigate using browser back button', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('Mobile'), 'Desktop header coverage only')
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.getByLabel('Primary navigation').getByRole('link', { name: /^About$/i }).click()
    await expect(page).toHaveURL(/.*about/)

    await page.goBack()
    await expect(page).toHaveURL('http://localhost:3000/')
  })

  test('should expose Home in the mobile menu and avoid horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /open navigation menu/i }).click()

    const mobileNav = page.getByLabel('Mobile navigation')
    await expect(mobileNav.getByRole('link', { name: 'Home' })).toBeVisible()
    await expect(mobileNav.getByRole('link', { name: 'Writing' })).toHaveCount(0)
    await mobileNav.getByRole('link', { name: 'Projects' }).click()
    await expect(page).toHaveURL(/.*portfolio/)

    const hasOverflow = await page.evaluate(() => {
      const viewportWidth = document.documentElement.clientWidth
      return document.documentElement.scrollWidth > viewportWidth + 1
    })

    expect(hasOverflow).toBe(false)
  })
})
