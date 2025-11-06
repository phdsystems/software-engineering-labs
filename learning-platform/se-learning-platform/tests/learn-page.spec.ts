import { test, expect } from '@playwright/test'

test.describe('Learn Page', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/learn')
    await expect(page.getByText('Learn Software Engineering')).toBeVisible()
  })

  test('should display category cards', async ({ page }) => {
    await page.goto('/learn')

    // Check for main categories
    await expect(page.getByText('Getting Started')).toBeVisible()
    await expect(page.getByText('Design Principles')).toBeVisible()
    await expect(page.getByText('Design Patterns')).toBeVisible()
    await expect(page.getByText('Architecture Patterns')).toBeVisible()
    await expect(page.getByText('Examples')).toBeVisible()
  })

  test('should display learning paths', async ({ page }) => {
    await page.goto('/learn')

    await expect(page.getByText('Beginner (0-2 years)')).toBeVisible()
    await expect(page.getByText('Intermediate (2-5 years)')).toBeVisible()
    await expect(page.getByText('Advanced (5+ years)')).toBeVisible()
  })

  test('should have sidebar navigation', async ({ page }) => {
    await page.goto('/learn')

    // Sidebar should be visible on desktop
    await expect(page.locator('aside').first()).toBeVisible()
  })

  test('should navigate to category', async ({ page }) => {
    await page.goto('/learn')

    await page.getByRole('link', { name: /Design Principles/ }).first().click()
    await expect(page).toHaveURL(/\/learn\/design-principle/)
  })
})
