import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should navigate to About page', async ({ page }) => {
    await page.goto('/')

    // Click About link
    const aboutLink = page.getByRole('link', { name: /about/i }).first()
    await aboutLink.click()

    // Verify URL changed
    await expect(page).toHaveURL(/.*about/)
  })

  test('should navigate to Projects page', async ({ page }) => {
    await page.goto('/')

    // Click Projects link
    const projectsLink = page.getByRole('link', { name: /projects/i }).first()
    await projectsLink.click()

    // Verify URL changed
    await expect(page).toHaveURL(/.*projects/)
  })

  test('should navigate to Resume page', async ({ page }) => {
    await page.goto('/')

    // Click Resume link
    const resumeLink = page.getByRole('link', { name: /resume/i }).first()
    await resumeLink.click()

    // Verify URL changed
    await expect(page).toHaveURL(/.*resume/)
  })

  test('should navigate to Contact page', async ({ page }) => {
    await page.goto('/')

    // Click Contact link
    const contactLink = page.getByRole('link', { name: /contact/i }).first()
    await contactLink.click()

    // Verify URL changed
    await expect(page).toHaveURL(/.*contact/)
  })

  test('should navigate using browser back button', async ({ page }) => {
    await page.goto('/')

    // Navigate to About
    const aboutLink = page.getByRole('link', { name: /about/i }).first()
    await aboutLink.click()
    await expect(page).toHaveURL(/.*about/)

    // Go back
    await page.goBack()
    await expect(page).toHaveURL('/')
  })
})
