import { test, expect, type Locator, type Page } from '@playwright/test'

async function clickAndWaitForURL(page: Page, link: Locator, url: RegExp) {
  await Promise.all([
    page.waitForURL(url, { waitUntil: 'networkidle' }),
    link.click(),
  ])
}

test.describe('Navigation', () => {
  test('should navigate through the Catalog 97 header destinations', async ({ page }) => {
    await page.goto('/')

    const mainNav = page.getByRole('navigation', { name: 'Main' })
    await expect(mainNav.getByRole('link', { name: /^Home$/i })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: /^Work$/i })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: /^Writing$/i })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: /^Dashboards$/i })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: /^About$/i })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: /^Résumé$/i })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: /^Contact$/i })).toBeVisible()

    await clickAndWaitForURL(
      page,
      mainNav.getByRole('link', { name: /^Work$/i }),
      /.*portfolio/
    )

    await page.goto('/')
    await clickAndWaitForURL(
      page,
      page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: /^About$/i }),
      /.*about/
    )

    await page.goto('/')
    await clickAndWaitForURL(
      page,
      page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: /^Dashboards$/i }),
      /.*dashboards/
    )

    await page.goto('/')
    await clickAndWaitForURL(
      page,
      page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: /^Résumé$/i }),
      /.*resume/
    )

    await page.goto('/')
    await clickAndWaitForURL(
      page,
      page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: /^Contact$/i }),
      /.*contact/
    )
  })

  test('should keep the active destination marked in navigation', async ({ page }) => {
    await page.goto('/portfolio')

    await expect(
      page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Work' })
    ).toHaveAttribute('aria-current', 'page')
  })

  test('should navigate using browser back button', async ({ page }) => {
    await page.goto('/')

    await clickAndWaitForURL(
      page,
      page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: /^About$/i }),
      /.*about/
    )

    await page.goBack()
    await expect(page).toHaveURL('/')
  })

  test('should keep wrapped mobile navigation tappable and avoid horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const mobileNav = page.getByRole('navigation', { name: 'Main' })
    await expect(mobileNav.getByRole('link', { name: 'Home' })).toBeVisible()
    await expect(mobileNav.getByRole('link', { name: 'Writing' })).toBeVisible()
    await clickAndWaitForURL(
      page,
      mobileNav.getByRole('link', { name: 'Work' }),
      /.*portfolio/
    )

    const hasOverflow = await page.evaluate(() => {
      const viewportWidth = document.documentElement.clientWidth
      return document.documentElement.scrollWidth > viewportWidth + 1
    })

    expect(hasOverflow).toBe(false)
  })
})
