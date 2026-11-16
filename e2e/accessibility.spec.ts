import { test, expect } from '@playwright/test'

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy on homepage', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('h1')).toHaveCount(1)

    const mainCount = await page.evaluate(() => document.querySelectorAll('main').length)
    expect(mainCount).toBe(1)
  })

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/')

    // The skip link is first in the tab order, then the header's links.
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // With nothing focused, activeElement is the body, so name the tags that count.
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName)
    expect(['A', 'BUTTON']).toContain(focusedTag)
  })

  test('should have alt text on images', async ({ page }) => {
    await page.goto('/')

    const images = page.locator('img')
    const imageCount = await images.count()
    expect(imageCount).toBeGreaterThan(0)

    // An empty alt marks a decorative image. A missing one reads as null.
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      expect(alt, await img.getAttribute('src') ?? `image ${i}`).not.toBeNull()
    }
  })

  test('should have accessible names on buttons', async ({ page }) => {
    await page.goto('/')

    const buttons = page.locator('button:visible')
    const buttonCount = await buttons.count()

    for (let i = 0; i < buttonCount; i++) {
      await expect(buttons.nth(i)).toHaveAccessibleName(/\S/)
    }
  })
})
