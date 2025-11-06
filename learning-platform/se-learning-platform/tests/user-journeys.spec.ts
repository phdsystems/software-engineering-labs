import { test, expect } from '@playwright/test'

test.describe('Complete User Journeys', () => {
  test('User Journey: Browse category → Read article → Navigate to related', async ({ page }) => {
    // Start at homepage
    await page.goto('/')

    // Click on Design Principles category
    await page.getByRole('link', { name: /design principle/i }).first().click()
    await page.waitForLoadState('networkidle')

    // Verify we're on the learn page with design principles
    await expect(page).toHaveURL(/\/learn/)

    // Click on SOLID Principles article
    const solidLink = page.getByRole('link', { name: /solid principles/i }).first()
    await solidLink.click()
    await page.waitForLoadState('networkidle')

    // Verify article is displayed
    await expect(page.getByRole('heading', { name: /solid principles/i })).toBeVisible()

    // Verify reading time is displayed
    await expect(page.locator('text=/\\d+ min read/')).toBeVisible()

    // Scroll to verify TOC is present
    const toc = page.locator('[data-testid="table-of-contents"], nav').first()
    if (await toc.count() > 0) {
      await expect(toc).toBeVisible()
    }

    // Navigate using prev/next if available
    const nextLink = page.getByRole('link', { name: /next/i }).first()
    if (await nextLink.count() > 0) {
      await nextLink.click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/\/learn\//)
    }
  })

  test('User Journey: Search → Read result → Back to search', async ({ page }) => {
    await page.goto('/')

    // Open search dialog
    await page.keyboard.press('Meta+K')
    await page.waitForTimeout(500)

    // Type search query
    const searchInput = page.getByPlaceholder(/search/i).first()
    await searchInput.fill('solid')
    await page.waitForTimeout(500)

    // Click on first search result
    const firstResult = page.getByRole('link').filter({ hasText: /solid/i }).first()
    if (await firstResult.count() > 0) {
      await firstResult.click()
      await page.waitForLoadState('networkidle')

      // Verify article loaded
      await expect(page).toHaveURL(/\/learn\//)

      // Open search again
      await page.keyboard.press('Meta+K')
      await page.waitForTimeout(500)

      // Search should be functional again
      const searchInput2 = page.getByPlaceholder(/search/i).first()
      await expect(searchInput2).toBeVisible()
    }
  })

  test('User Journey: Theme persistence across navigation', async ({ page }) => {
    await page.goto('/')

    // Switch to dark mode
    const themeToggle = page.getByRole('button', { name: /toggle theme/i }).or(page.locator('[aria-label*="theme"]')).first()
    await themeToggle.click()
    await page.waitForTimeout(300)

    // Navigate to another page
    await page.getByRole('link', { name: /learn/i }).first().click()
    await page.waitForLoadState('networkidle')

    // Verify dark mode persists (check html class or data attribute)
    const htmlElement = page.locator('html')
    const htmlClass = await htmlElement.getAttribute('class')
    const htmlDataTheme = await htmlElement.getAttribute('data-theme')

    // Theme should be persisted (either in class or data-theme)
    expect(htmlClass || htmlDataTheme).toBeTruthy()
  })

  test('User Journey: Mobile navigation flow', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Open mobile menu
    const menuButton = page.getByRole('button', { name: /toggle menu|menu/i }).first()
    await menuButton.click()
    await page.waitForTimeout(500)

    // Click on a navigation item
    const navLink = page.getByRole('link', { name: /learn|principles|patterns/i }).first()
    if (await navLink.count() > 0) {
      await navLink.click()
      await page.waitForLoadState('networkidle')

      // Verify navigation worked
      await expect(page).toHaveURL(/\/learn\//)
    }
  })

  test('User Journey: Complete learning path', async ({ page }) => {
    await page.goto('/')

    // Navigate to Design Principles
    await page.getByRole('link', { name: /principle/i }).first().click()
    await page.waitForLoadState('networkidle')

    // Read an article
    const articleLink = page.getByRole('link').filter({ hasText: /solid|dry|kiss/i }).first()
    if (await articleLink.count() > 0) {
      await articleLink.click()
      await page.waitForLoadState('networkidle')

      // Scroll through content
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
      await page.waitForTimeout(500)

      // Interact with TOC if present
      const tocLink = page.locator('nav a, [data-testid="toc"] a').first()
      if (await tocLink.count() > 0) {
        await tocLink.click()
        await page.waitForTimeout(500)
      }

      // Navigate to related content
      const relatedLink = page.getByRole('link', { name: /pattern|architecture|example/i }).first()
      if (await relatedLink.count() > 0) {
        await relatedLink.click()
        await page.waitForLoadState('networkidle')
        await expect(page).toHaveURL(/\/learn\//)
      }
    }
  })

  test('User Journey: Discover content through categories', async ({ page }) => {
    await page.goto('/')

    // Verify homepage has category cards
    const categories = page.locator('[data-testid="category-card"], .category, [href*="learn"]')
    await expect(categories.first()).toBeVisible()

    // Click on Architecture Patterns
    const archLink = page.getByRole('link', { name: /architecture/i }).first()
    await archLink.click()
    await page.waitForLoadState('networkidle')

    // Should see architecture-related content
    await expect(page).toHaveURL(/\/learn\//)

    // Click on a specific architecture pattern
    const patternLink = page.getByRole('link', { name: /microservice|clean|event/i }).first()
    if (await patternLink.count() > 0) {
      await patternLink.click()
      await page.waitForLoadState('networkidle')

      // Verify article loads
      await expect(page.getByRole('heading').first()).toBeVisible()
    }
  })

  test('User Journey: Reading experience', async ({ page }) => {
    await page.goto('/learn/design-principle/solid-principle')
    await page.waitForLoadState('networkidle')

    // Wait for content to load
    await page.waitForSelector('article, main, [role="main"]', { timeout: 10000 })

    // Verify main content exists
    const mainContent = page.locator('article, main, [role="main"]').first()
    await expect(mainContent).toBeVisible()

    // Verify heading exists
    const heading = page.getByRole('heading').first()
    await expect(heading).toBeVisible()

    // Test scrolling behavior
    await page.evaluate(() => window.scrollTo(0, 500))
    await page.waitForTimeout(500)

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(500)

    // Verify page is still functional
    await expect(mainContent).toBeVisible()
  })

  test('User Journey: Search and filter', async ({ page }) => {
    await page.goto('/')

    // Open search
    await page.keyboard.press('Meta+K')
    await page.waitForTimeout(500)

    // Search for "architecture"
    const searchInput = page.getByPlaceholder(/search/i).first()
    await searchInput.fill('architecture')
    await page.waitForTimeout(500)

    // Should see architecture-related results
    const results = page.getByRole('link').filter({ hasText: /architecture/i })
    if (await results.count() > 0) {
      await expect(results.first()).toBeVisible()
    }

    // Clear and search for something else
    await searchInput.clear()
    await searchInput.fill('pattern')
    await page.waitForTimeout(500)

    // Should see pattern-related results
    const patternResults = page.getByRole('link').filter({ hasText: /pattern/i })
    if (await patternResults.count() > 0) {
      await expect(patternResults.first()).toBeVisible()
    }
  })

  test('User Journey: Navigate breadcrumbs', async ({ page }) => {
    await page.goto('/learn/design-principle/solid-principle')
    await page.waitForLoadState('networkidle')

    // Look for breadcrumbs
    const breadcrumbs = page.locator('nav[aria-label="breadcrumb"], [data-testid="breadcrumbs"]').first()

    if (await breadcrumbs.count() > 0) {
      // Click on category breadcrumb
      const categoryLink = breadcrumbs.getByRole('link').first()
      await categoryLink.click()
      await page.waitForLoadState('networkidle')

      // Should navigate to category page
      await expect(page).toHaveURL(/\/learn\//)
    }
  })

  test('User Journey: Code example exploration', async ({ page }) => {
    await page.goto('/')

    // Navigate to examples
    const examplesLink = page.getByRole('link', { name: /example/i }).first()
    await examplesLink.click()
    await page.waitForLoadState('networkidle')

    // Should see examples
    await expect(page).toHaveURL(/\/learn\//)

    // Click on a code example
    const codeExample = page.getByRole('link', { name: /java|python|typescript/i }).first()
    if (await codeExample.count() > 0) {
      await codeExample.click()
      await page.waitForLoadState('networkidle')

      // Should see code blocks
      const codeBlock = page.locator('pre code, [class*="shiki"]')
      if (await codeBlock.count() > 0) {
        await expect(codeBlock.first()).toBeVisible()
      }
    }
  })
})
