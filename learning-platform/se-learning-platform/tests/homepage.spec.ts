import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/SE Learning System/)
  })

  test('should display header with logo and navigation', async ({ page }) => {
    await page.goto('/')

    // Check logo
    await expect(page.getByText('SE Learning')).toBeVisible()

    // Check navigation links
    await expect(page.getByRole('link', { name: 'Learn' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Principles' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Patterns' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Architecture' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Examples' })).toBeVisible()
  })

  test('should display hero section', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText(/Software Engineering from First Principles/)).toBeVisible()
  })

  test('should display learning paths', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText(/Beginner.*0-2 years/)).toBeVisible()
    await expect(page.getByText(/Intermediate.*2-5 years/)).toBeVisible()
    await expect(page.getByText(/Advanced.*5\+ years/)).toBeVisible()
  })

  test('should have theme toggle', async ({ page }) => {
    await page.goto('/')

    // Theme toggle button should be visible
    const themeToggle = page.locator('button').filter({ has: page.locator('svg') }).first()
    await expect(themeToggle).toBeVisible()
  })

  test('should navigate to learn page', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: 'Learn', exact: true }).click()
    await expect(page).toHaveURL('/learn')
    await expect(page.getByText('Learn Software Engineering')).toBeVisible()
  })
})
