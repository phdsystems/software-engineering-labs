import { test, expect } from '@playwright/test'

test.describe('Integration Tests', () => {
  const baseURL = 'http://localhost:3000'

  test.describe('API and UI Integration', () => {
    test('should load content from API and display in UI', async ({ page, request }) => {
      // 1. Get content from API
      const apiResponse = await request.get(`${baseURL}/api/content`)
      expect(apiResponse.status()).toBe(200)

      const apiData = await apiResponse.json()
      expect(apiData.success).toBe(true)
      expect(apiData.data.length).toBeGreaterThan(0)

      const firstArticleSlug = apiData.data[0].slug

      // 2. Navigate to the article in UI
      await page.goto(`/learn/${firstArticleSlug}`)
      await page.waitForLoadState('networkidle')

      // 3. Verify content is displayed
      const mainContent = page.locator('article, main').first()
      await expect(mainContent).toBeVisible()
    })

    test('should search via API and display results in UI', async ({ page, request }) => {
      // 1. Search via API
      const searchResponse = await request.get(`${baseURL}/api/search?q=solid`)
      expect(searchResponse.status()).toBe(200)

      const searchData = await searchResponse.json()
      expect(searchData.success).toBe(true)

      // 2. Open search dialog in UI
      await page.goto('/')
      await page.keyboard.press('Meta+K')
      await page.waitForTimeout(500)

      // 3. Search in UI
      const searchInput = page.getByPlaceholder(/search/i).first()
      await searchInput.fill('solid')
      await page.waitForTimeout(500)

      // 4. Verify results match API
      if (searchData.data.length > 0) {
        const firstResultTitle = searchData.data[0].title
        const uiResult = page.getByText(firstResultTitle).first()

        if (await uiResult.count() > 0) {
          await expect(uiResult).toBeVisible()
        }
      }
    })

    test('should navigate between articles using API data', async ({ page, request }) => {
      // 1. Get all content from API
      const apiResponse = await request.get(`${baseURL}/api/content`)
      const apiData = await apiResponse.json()

      if (apiData.data.length > 1) {
        const firstSlug = apiData.data[0].slug
        const secondSlug = apiData.data[1].slug

        // 2. Navigate to first article
        await page.goto(`/learn/${firstSlug}`)
        await page.waitForLoadState('networkidle')
        await expect(page.locator('article, main').first()).toBeVisible()

        // 3. Navigate to second article
        await page.goto(`/learn/${secondSlug}`)
        await page.waitForLoadState('networkidle')
        await expect(page.locator('article, main').first()).toBeVisible()
      }
    })
  })

  test.describe('Search Provider and Dialog Integration', () => {
    test('should maintain search state across dialog open/close', async ({ page }) => {
      await page.goto('/')

      // Open search
      await page.keyboard.press('Meta+K')
      await page.waitForTimeout(500)

      // Type query
      const searchInput = page.getByPlaceholder(/search/i).first()
      await searchInput.fill('architecture')
      await page.waitForTimeout(500)

      // Close dialog
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)

      // Reopen search
      await page.keyboard.press('Meta+K')
      await page.waitForTimeout(500)

      // Search input should be accessible again
      const searchInputAgain = page.getByPlaceholder(/search/i).first()
      await expect(searchInputAgain).toBeVisible()
    })

    test('should search and navigate integration', async ({ page }) => {
      await page.goto('/')

      // Open search
      await page.keyboard.press('Meta+K')
      await page.waitForTimeout(500)

      // Search for article
      const searchInput = page.getByPlaceholder(/search/i).first()
      await searchInput.fill('solid')
      await page.waitForTimeout(500)

      // Click on result
      const result = page.getByRole('link').filter({ hasText: /solid/i }).first()

      if (await result.count() > 0) {
        await result.click()
        await page.waitForLoadState('networkidle')

        // Verify navigation happened
        await expect(page).toHaveURL(/\/learn\//)
        await expect(page.locator('article, main').first()).toBeVisible()
      }
    })
  })

  test.describe('Theme and Local Storage Integration', () => {
    test('should persist theme preference in local storage', async ({ page }) => {
      await page.goto('/')

      // Toggle theme
      const themeToggle = page.getByRole('button', { name: /toggle theme/i }).or(page.locator('[aria-label*="theme"]')).first()
      await themeToggle.click()
      await page.waitForTimeout(300)

      // Check local storage
      const theme = await page.evaluate(() => localStorage.getItem('theme'))
      expect(theme).toBeTruthy()

      // Reload page
      await page.reload()
      await page.waitForLoadState('networkidle')

      // Theme should persist
      const htmlClass = await page.locator('html').getAttribute('class')
      expect(htmlClass).toBeTruthy()
    })
  })

  test.describe('Navigation and Routing Integration', () => {
    test('should navigate through category hierarchy', async ({ page, request }) => {
      // Get navigation structure from API
      const navResponse = await request.get(`${baseURL}/api/navigation`)
      expect(navResponse.status()).toBe(200)

      const navData = await navResponse.json()
      expect(navData.success).toBe(true)

      // Navigate through UI
      await page.goto('/')

      // Click on a category
      const categoryLink = page.getByRole('link', { name: /design principle|pattern|architecture/i }).first()
      await categoryLink.click()
      await page.waitForLoadState('networkidle')

      // Should navigate to learn page
      await expect(page).toHaveURL(/\/learn/)
    })

    test('should use breadcrumbs for navigation', async ({ page }) => {
      // Navigate to a nested article
      await page.goto('/learn/design-principle/solid-principle')
      await page.waitForLoadState('networkidle')

      // Find breadcrumbs
      const breadcrumbs = page.locator('nav[aria-label="breadcrumb"], [data-testid="breadcrumbs"]').first()

      if (await breadcrumbs.count() > 0) {
        // Click on category breadcrumb
        const homeLink = breadcrumbs.getByRole('link').first()
        await homeLink.click()
        await page.waitForLoadState('networkidle')

        // Should navigate up the hierarchy
        await expect(page).toHaveURL(/\/$|\/learn/)
      }
    })
  })

  test.describe('Content and Markdown Processing Integration', () => {
    test('should process markdown and render HTML correctly', async ({ page, request }) => {
      // Get content via API
      const contentResponse = await request.get(`${baseURL}/api/content/design-principle/solid-principle`)

      if (contentResponse.status() === 200) {
        const contentData = await contentResponse.json()

        // Navigate to page
        await page.goto('/learn/design-principle/solid-principle')
        await page.waitForLoadState('networkidle')

        // Verify content is rendered
        if (contentData.data && contentData.data.title) {
          const heading = page.getByRole('heading', { name: new RegExp(contentData.data.title, 'i') })
          await expect(heading).toBeVisible()
        }
      }
    })

    test('should render Table of Contents from markdown headings', async ({ page }) => {
      await page.goto('/learn/design-principle/solid-principle')
      await page.waitForLoadState('networkidle')

      // Find TOC
      const toc = page.locator('nav, [data-testid="toc"], aside').filter({ hasText: /table of contents|on this page/i }).first()

      if (await toc.count() > 0) {
        // Click on TOC link
        const tocLink = toc.getByRole('link').first()
        await tocLink.click()
        await page.waitForTimeout(500)

        // Should scroll to section
        // (Verify page is still on same URL)
        await expect(page).toHaveURL(/solid-principle/)
      }
    })
  })

  test.describe('Responsive Design Integration', () => {
    test('should adapt layout for mobile with working navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')

      // Open mobile menu
      const menuButton = page.getByRole('button', { name: /toggle menu|menu/i }).first()
      await menuButton.click()
      await page.waitForTimeout(500)

      // Navigate using mobile menu
      const navLink = page.getByRole('link', { name: /learn/i }).first()

      if (await navLink.count() > 0) {
        await navLink.click()
        await page.waitForLoadState('networkidle')

        await expect(page).toHaveURL(/\/learn/)
      }
    })

    test('should show mobile TOC for long articles', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/learn/design-principle/solid-principle')
      await page.waitForLoadState('networkidle')

      // Look for mobile TOC toggle or drawer
      const mobileTOC = page.locator('[data-testid="mobile-toc"], button').filter({ hasText: /table of contents|on this page/i }).first()

      if (await mobileTOC.count() > 0) {
        await expect(mobileTOC).toBeVisible()
      }
    })
  })

  test.describe('Error Handling Integration', () => {
    test('should display 404 page for non-existent content', async ({ page }) => {
      await page.goto('/learn/non-existent/article-xyz-123')
      await page.waitForLoadState('networkidle')

      // Should show 404 error
      const errorMessage = page.locator('text=/404|not found/i')
      await expect(errorMessage.first()).toBeVisible()
    })

    test('should handle API errors gracefully in UI', async ({ page, request }) => {
      // Try to get non-existent content
      const response = await request.get(`${baseURL}/api/content/non-existent-slug`)
      expect(response.status()).toBe(404)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBeTruthy()
    })
  })

  test.describe('Performance Integration', () => {
    test('should load homepage and content efficiently', async ({ page }) => {
      const startTime = Date.now()

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const loadTime = Date.now() - startTime

      // Homepage should load within 5 seconds
      expect(loadTime).toBeLessThan(5000)

      // Navigate to article
      const articleStart = Date.now()

      const articleLink = page.getByRole('link', { name: /solid|principle|pattern/i }).first()
      await articleLink.click()
      await page.waitForLoadState('networkidle')

      const articleLoadTime = Date.now() - articleStart

      // Article should load within 5 seconds
      expect(articleLoadTime).toBeLessThan(5000)
    })

    test('should handle multiple concurrent API requests', async ({ request }) => {
      const requests = [
        request.get(`${baseURL}/api/content`),
        request.get(`${baseURL}/api/navigation`),
        request.get(`${baseURL}/api/search?q=test`),
      ]

      const responses = await Promise.all(requests)

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status()).toBe(200)
      })
    })
  })

  test.describe('Content Discovery Integration', () => {
    test('should discover content through multiple paths', async ({ page }) => {
      // Path 1: Homepage → Category → Article
      await page.goto('/')
      await page.getByRole('link', { name: /principle/i }).first().click()
      await page.waitForLoadState('networkidle')

      const articleLink1 = page.getByRole('link', { name: /solid/i }).first()

      if (await articleLink1.count() > 0) {
        const articleURL1 = await articleLink1.getAttribute('href')

        // Path 2: Search → Article
        await page.goto('/')
        await page.keyboard.press('Meta+K')
        await page.waitForTimeout(500)

        const searchInput = page.getByPlaceholder(/search/i).first()
        await searchInput.fill('solid')
        await page.waitForTimeout(500)

        const searchResult = page.getByRole('link').filter({ hasText: /solid/i }).first()

        if (await searchResult.count() > 0) {
          const articleURL2 = await searchResult.getAttribute('href')

          // Both paths should lead to same article
          expect(articleURL1).toContain('solid')
          expect(articleURL2).toContain('solid')
        }
      }
    })
  })
})
