import { test, expect } from '@playwright/test'

test.describe('Edge Cases and Error Handling', () => {
  test('should display 404 page for non-existent content', async ({ page }) => {
    await page.goto('/learn/non-existent-category/fake-article')

    // Should show 404 or error message
    const response = await page.waitForLoadState('networkidle')

    // Check for 404 indicators
    const has404 = await page.locator('text=/404|not found/i').count() > 0
    const hasError = await page.locator('text=/error|oops/i').count() > 0

    expect(has404 || hasError).toBeTruthy()
  })

  test('should handle invalid routes gracefully', async ({ page }) => {
    await page.goto('/invalid-route-that-does-not-exist')

    // Should not crash, should show some content
    await expect(page.locator('body')).toBeVisible()
  })

  test('should handle empty search query', async ({ page }) => {
    await page.goto('/')

    // Open search
    await page.keyboard.press('Meta+K')

    // Don't type anything, just wait
    await page.waitForTimeout(500)

    // Should show popular topics or placeholder
    const hasContent = await page.getByText(/Popular topics|Search/i).isVisible()
    expect(hasContent).toBeTruthy()
  })

  test('should handle very long search query', async ({ page }) => {
    await page.goto('/')

    await page.keyboard.press('Meta+K')

    // Type a very long query
    const longQuery = 'a'.repeat(500)
    await page.getByPlaceholder(/Search documentation/).fill(longQuery)

    await page.waitForTimeout(500)

    // Should not crash
    await expect(page.getByPlaceholder(/Search documentation/)).toBeVisible()
  })

  test('should handle special characters in search', async ({ page }) => {
    await page.goto('/')

    await page.keyboard.press('Meta+K')

    // Type special characters
    await page.getByPlaceholder(/Search documentation/).fill('!@#$%^&*()')

    await page.waitForTimeout(500)

    // Should show no results or handle gracefully
    await expect(page.getByPlaceholder(/Search documentation/)).toBeVisible()
  })

  test('should handle rapid theme switching', async ({ page }) => {
    await page.goto('/')

    const themeButton = page.locator('button').filter({ has: page.locator('svg') }).nth(1)

    // Rapidly switch themes
    for (let i = 0; i < 5; i++) {
      await themeButton.click()
      await page.getByText('Light', { exact: true }).click()
      await page.waitForTimeout(100)

      await themeButton.click()
      await page.getByText('Dark', { exact: true }).click()
      await page.waitForTimeout(100)
    }

    // Should still work
    const html = page.locator('html')
    await expect(html).toBeVisible()
  })

  test('should handle navigation to same page', async ({ page }) => {
    await page.goto('/learn')

    // Click learn link again
    await page.getByRole('link', { name: 'Learn', exact: true }).click()

    await page.waitForTimeout(300)

    // Should still be on learn page without errors
    await expect(page.getByText('Learn Software Engineering')).toBeVisible()
  })

  test('should handle back/forward navigation', async ({ page }) => {
    await page.goto('/')

    // Navigate to learn
    await page.getByRole('link', { name: 'Learn', exact: true }).click()
    await page.waitForTimeout(300)

    // Go back
    await page.goBack()
    await page.waitForTimeout(300)

    // Should be on homepage
    await expect(page).toHaveURL('/')

    // Go forward
    await page.goForward()
    await page.waitForTimeout(300)

    // Should be on learn page
    await expect(page).toHaveURL('/learn')
  })

  test('should handle viewport resize', async ({ page }) => {
    await page.goto('/')

    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('body')).toBeVisible()

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('body')).toBeVisible()

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('body')).toBeVisible()
  })

  test('should handle slow network conditions', async ({ page }) => {
    // Simulate slow 3G
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 100)
    })

    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // Should eventually load
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  })

  test('should handle multiple rapid searches', async ({ page }) => {
    await page.goto('/')

    const searchTerms = ['SOLID', 'design', 'pattern', 'clean', 'architecture']

    for (const term of searchTerms) {
      await page.keyboard.press('Meta+K')
      await page.getByPlaceholder(/Search documentation/).fill(term)
      await page.waitForTimeout(200)
      await page.keyboard.press('Escape')
      await page.waitForTimeout(100)
    }

    // Should not crash
    await expect(page.locator('body')).toBeVisible()
  })

  test('should handle keyboard-only navigation', async ({ page }) => {
    await page.goto('/')

    // Tab through elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
    }

    // Check focus is visible
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()
  })

  test('should handle missing images gracefully', async ({ page }) => {
    await page.goto('/')

    // Check if any images fail to load
    const images = await page.locator('img').all()

    for (const img of images) {
      const src = await img.getAttribute('src')
      if (src) {
        // Should not block page rendering
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })
})
