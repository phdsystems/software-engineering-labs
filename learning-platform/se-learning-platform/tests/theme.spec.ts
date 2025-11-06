import { test, expect } from '@playwright/test'

test.describe('Theme Toggle', () => {
  test('should have theme toggle button', async ({ page }) => {
    await page.goto('/')

    // Theme toggle should be visible
    const themeButton = page.locator('button').filter({ has: page.locator('svg') }).nth(1)
    await expect(themeButton).toBeVisible()
  })

  test('should toggle between light and dark themes', async ({ page }) => {
    await page.goto('/')

    // Get initial theme
    const html = page.locator('html')
    const initialClass = await html.getAttribute('class')

    // Click theme toggle
    const themeButton = page.locator('button').filter({ has: page.locator('svg') }).nth(1)
    await themeButton.click()

    // Select light theme from dropdown
    await page.getByText('Light', { exact: true }).click()
    await page.waitForTimeout(300)

    // Check if theme changed
    const lightClass = await html.getAttribute('class')
    expect(lightClass).not.toContain('dark')

    // Switch back to dark
    await themeButton.click()
    await page.getByText('Dark', { exact: true }).click()
    await page.waitForTimeout(300)

    const darkClass = await html.getAttribute('class')
    expect(darkClass).toContain('dark')
  })

  test('should have system theme option', async ({ page }) => {
    await page.goto('/')

    // Click theme toggle
    const themeButton = page.locator('button').filter({ has: page.locator('svg') }).nth(1)
    await themeButton.click()

    // System option should be visible
    await expect(page.getByText('System')).toBeVisible()
  })

  test('should persist theme across page navigation', async ({ page }) => {
    await page.goto('/')

    // Set to light theme
    const themeButton = page.locator('button').filter({ has: page.locator('svg') }).nth(1)
    await themeButton.click()
    await page.getByText('Light', { exact: true }).click()
    await page.waitForTimeout(300)

    // Navigate to another page
    await page.goto('/learn')
    await page.waitForTimeout(300)

    // Theme should still be light
    const html = page.locator('html')
    const htmlClass = await html.getAttribute('class')
    expect(htmlClass).not.toContain('dark')
  })
})
