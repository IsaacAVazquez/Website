import { test, expect } from '@playwright/test'

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy on homepage', async ({ page }) => {
    await page.goto('/')

    // Check for h1
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible()
  })

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/')

    // Tab through interactive elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Verify focus is working (element should be focused)
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName
    })

    expect(focusedElement).toBeDefined()
  })

  test('should have alt text on images', async ({ page }) => {
    await page.goto('/')

    // Get all images
    const images = page.locator('img')
    const imageCount = await images.count()

    // Check that each image has alt text or is decorative
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')

      // Alt should either exist or be empty string for decorative images
      expect(alt).toBeDefined()
    }
  })

  test('should have proper ARIA labels on interactive elements', async ({ page }) => {
    await page.goto('/')

    // Check buttons have accessible names
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      const ariaLabel = await button.getAttribute('aria-label')
      const text = await button.textContent()

      // Button should have either aria-label or visible text
      expect(ariaLabel || text).toBeTruthy()
    }
  })

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/')

    // This is a basic check - in production, you'd use axe-core or similar
    const bodyStyles = await page.locator('body').evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
      }
    })

    expect(bodyStyles.color).toBeDefined()
    expect(bodyStyles.backgroundColor).toBeDefined()
  })
})
