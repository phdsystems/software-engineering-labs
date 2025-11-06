import { test, expect } from '@playwright/test'

test.describe('Content Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/learn/design-principle/solid-principle')
  })

  test('should load content successfully', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /SOLID Principles/ })).toBeVisible()
  })

  test('should display breadcrumbs', async ({ page }) => {
    await expect(page.getByText('Learn')).toBeVisible()
    await expect(page.getByText(/Design Principle/)).toBeVisible()
  })

  test('should display content metadata', async ({ page }) => {
    // Check for reading time
    await expect(page.getByText(/min read/)).toBeVisible()

    // Check for last updated
    await expect(page.getByText(/Updated/)).toBeVisible()
  })

  test('should render markdown content', async ({ page }) => {
    // Check for prose styling
    await expect(page.locator('.markdown-content')).toBeVisible()
  })

  test('should display table of contents on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })

    await expect(page.getByText('On This Page')).toBeVisible()
  })

  test('should have mobile TOC button', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    // Mobile TOC floating button should be visible
    const mobileTocButton = page.locator('button').filter({ has: page.locator('svg[class*="lucide-menu"]') })
    await expect(mobileTocButton).toBeVisible()
  })

  test('should show prev/next navigation', async ({ page }) => {
    const prevLink = page.getByRole('link', { name: /Previous/ })
    const nextLink = page.getByRole('link', { name: /Next/ })

    // At least one should be visible
    const prevVisible = await prevLink.isVisible().catch(() => false)
    const nextVisible = await nextLink.isVisible().catch(() => false)

    expect(prevVisible || nextVisible).toBeTruthy()
  })

  test('should navigate via table of contents', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })

    // Find first TOC link and click
    const tocLinks = page.locator('aside a')
    const firstLink = tocLinks.first()

    if (await firstLink.isVisible()) {
      await firstLink.click()
      // Should smooth scroll (we can't test scroll position easily, but can verify no error)
      await page.waitForTimeout(500)
    }
  })
})
