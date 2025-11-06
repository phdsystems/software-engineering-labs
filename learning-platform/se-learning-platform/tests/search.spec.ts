import { test, expect } from '@playwright/test'

test.describe('Search Functionality', () => {
  test('should open search with keyboard shortcut', async ({ page }) => {
    await page.goto('/')

    // Press Cmd+K (or Ctrl+K)
    await page.keyboard.press('Meta+K')

    // Search dialog should be visible
    await expect(page.getByPlaceholder(/Search documentation/)).toBeVisible()
  })

  test('should display search button in header', async ({ page }) => {
    await page.goto('/')

    await page.setViewportSize({ width: 1280, height: 720 })

    // Desktop search button
    await expect(page.getByText('Search...')).toBeVisible()
    await expect(page.getByText('⌘K')).toBeVisible()
  })

  test('should perform search and show results', async ({ page }) => {
    await page.goto('/')

    // Open search
    await page.keyboard.press('Meta+K')

    // Type search query
    await page.getByPlaceholder(/Search documentation/).fill('SOLID')

    // Wait for results
    await page.waitForTimeout(500)

    // Results should appear
    const results = page.locator('button').filter({ hasText: /SOLID/ })
    await expect(results.first()).toBeVisible()
  })

  test('should navigate to result on click', async ({ page }) => {
    await page.goto('/')

    // Open search
    await page.keyboard.press('Meta+K')

    // Search
    await page.getByPlaceholder(/Search documentation/).fill('SOLID')
    await page.waitForTimeout(500)

    // Click first result
    const firstResult = page.locator('button').filter({ hasText: /SOLID/ }).first()
    await firstResult.click()

    // Should navigate
    await page.waitForTimeout(500)
    await expect(page).toHaveURL(/\/learn\//)
  })

  test('should show popular topics when empty', async ({ page }) => {
    await page.goto('/')

    await page.keyboard.press('Meta+K')

    // Popular topics should be visible
    await expect(page.getByText('Popular topics:')).toBeVisible()
    await expect(page.getByText('SOLID')).toBeVisible()
    await expect(page.getByText('Clean Architecture')).toBeVisible()
  })

  test('should show no results message', async ({ page }) => {
    await page.goto('/')

    await page.keyboard.press('Meta+K')

    // Search for something that doesn't exist
    await page.getByPlaceholder(/Search documentation/).fill('xyzabc123nonexistent')
    await page.waitForTimeout(500)

    await expect(page.getByText(/No results found/)).toBeVisible()
  })

  test('should close search on escape', async ({ page }) => {
    await page.goto('/')

    // Open search
    await page.keyboard.press('Meta+K')
    await expect(page.getByPlaceholder(/Search documentation/)).toBeVisible()

    // Close with Escape
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)

    // Should be closed
    await expect(page.getByPlaceholder(/Search documentation/)).not.toBeVisible()
  })
})
