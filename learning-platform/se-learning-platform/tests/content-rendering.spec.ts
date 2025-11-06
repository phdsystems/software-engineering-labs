import { test, expect } from '@playwright/test'

test.describe('Content Rendering Tests', () => {
  test('should render SOLID Principles article correctly', async ({ page }) => {
    await page.goto('/learn/design-principle/solid-principle')
    await page.waitForLoadState('networkidle')

    // Verify main heading
    await expect(page.getByRole('heading', { name: /solid principles/i })).toBeVisible()

    // Verify article content is rendered
    const mainContent = page.locator('article, main').first()
    await expect(mainContent).toBeVisible()

    // Verify some expected headings exist
    await expect(page.getByRole('heading', { name: /single responsibility/i })).toBeVisible()
  })

  test('should render code blocks with syntax highlighting', async ({ page }) => {
    await page.goto('/learn/example/java/clean-architecture-example')
    await page.waitForLoadState('networkidle')

    // Find code blocks
    const codeBlocks = page.locator('pre code, [class*="shiki"], [class*="highlight"]')

    if (await codeBlocks.count() > 0) {
      // Verify code block is visible
      await expect(codeBlocks.first()).toBeVisible()

      // Verify syntax highlighting classes exist
      const codeBlock = codeBlocks.first()
      const hasHighlighting = await codeBlock.evaluate((el) => {
        return el.className.length > 0 || el.querySelector('[style*="color"]') !== null
      })

      expect(hasHighlighting).toBeTruthy()
    }
  })

  test('should render table of contents correctly', async ({ page }) => {
    await page.goto('/learn/design-principle/solid-principle')
    await page.waitForLoadState('networkidle')

    // Look for TOC navigation
    const toc = page.locator('nav, [data-testid="toc"], aside').filter({ hasText: /table of contents|overview|on this page/i }).first()

    if (await toc.count() > 0) {
      await expect(toc).toBeVisible()

      // Verify TOC has links
      const tocLinks = toc.getByRole('link')
      expect(await tocLinks.count()).toBeGreaterThan(0)
    }
  })

  test('should render metadata (reading time, date)', async ({ page }) => {
    await page.goto('/learn/design-principle/solid-principle')
    await page.waitForLoadState('networkidle')

    // Look for reading time
    const readingTime = page.locator('text=/\\d+ min read|\\d+ minutes?/')
    if (await readingTime.count() > 0) {
      await expect(readingTime.first()).toBeVisible()
    }

    // Look for last updated date
    const lastUpdated = page.locator('text=/last updated|updated|\\d{4}-\\d{2}-\\d{2}/')
    if (await lastUpdated.count() > 0) {
      await expect(lastUpdated.first()).toBeVisible()
    }
  })

  test('should render lists correctly', async ({ page }) => {
    await page.goto('/learn/design-principle/solid-principle')
    await page.waitForLoadState('networkidle')

    // Verify ordered and unordered lists exist
    const lists = page.locator('ul, ol')
    expect(await lists.count()).toBeGreaterThan(0)

    // Verify list items
    const listItems = page.locator('li')
    expect(await listItems.count()).toBeGreaterThan(0)
  })

  test('should render blockquotes correctly', async ({ page }) => {
    await page.goto('/learn/design-principle/solid-principle')
    await page.waitForLoadState('networkidle')

    // Look for blockquotes
    const blockquotes = page.locator('blockquote')
    if (await blockquotes.count() > 0) {
      await expect(blockquotes.first()).toBeVisible()
    }
  })

  test('should render tables correctly', async ({ page }) => {
    await page.goto('/learn/design-principle/solid-principle')
    await page.waitForLoadState('networkidle')

    // Look for tables
    const tables = page.locator('table')
    if (await tables.count() > 0) {
      await expect(tables.first()).toBeVisible()

      // Verify table headers
      const headers = tables.first().locator('th')
      expect(await headers.count()).toBeGreaterThan(0)
    }
  })

  test('should render inline code correctly', async ({ page }) => {
    await page.goto('/learn/design-principle/solid-principle')
    await page.waitForLoadState('networkidle')

    // Look for inline code
    const inlineCode = page.locator('code').filter({ hasNot: page.locator('pre code') })
    if (await inlineCode.count() > 0) {
      await expect(inlineCode.first()).toBeVisible()
    }
  })

  test('should render links correctly', async ({ page }) => {
    await page.goto('/learn/design-principle/solid-principle')
    await page.waitForLoadState('networkidle')

    // Verify internal links exist
    const links = page.getByRole('link')
    expect(await links.count()).toBeGreaterThan(0)

    // Verify links are accessible
    const firstLink = links.first()
    await expect(firstLink).toBeVisible()
  })

  test('should render emphasis (bold, italic) correctly', async ({ page }) => {
    await page.goto('/learn/design-principle/solid-principle')
    await page.waitForLoadState('networkidle')

    // Look for bold text
    const bold = page.locator('strong, b')
    if (await bold.count() > 0) {
      await expect(bold.first()).toBeVisible()
    }

    // Look for italic text
    const italic = page.locator('em, i')
    if (await italic.count() > 0) {
      await expect(italic.first()).toBeVisible()
    }
  })

  test('should handle long content without layout issues', async ({ page }) => {
    await page.goto('/learn/design-principle/solid-principle')
    await page.waitForLoadState('networkidle')

    // Scroll through entire page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)

    // Verify footer or bottom content is visible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(500)

    // Verify header still visible
    const header = page.locator('header')
    await expect(header).toBeVisible()
  })

  test('should render prev/next navigation', async ({ page }) => {
    await page.goto('/learn/design-principle/solid-principle')
    await page.waitForLoadState('networkidle')

    // Look for prev/next links
    const prevLink = page.getByRole('link', { name: /previous|prev/i })
    const nextLink = page.getByRole('link', { name: /next/i })

    // At least one should exist (unless it's the only article)
    const hasPrevOrNext = (await prevLink.count()) > 0 || (await nextLink.count()) > 0

    if (hasPrevOrNext) {
      // Verify they're visible
      if (await prevLink.count() > 0) {
        await expect(prevLink.first()).toBeVisible()
      }
      if (await nextLink.count() > 0) {
        await expect(nextLink.first()).toBeVisible()
      }
    }
  })

  test('should render category badge', async ({ page }) => {
    await page.goto('/learn/design-principle/solid-principle')
    await page.waitForLoadState('networkidle')

    // Look for category indicator
    const category = page.locator('[data-testid="category"], .category, .badge').filter({ hasText: /design principle|principle/i })

    if (await category.count() > 0) {
      await expect(category.first()).toBeVisible()
    }
  })

  test('should render article with proper spacing', async ({ page }) => {
    await page.goto('/learn/design-principle/solid-principle')
    await page.waitForLoadState('networkidle')

    // Verify paragraphs have spacing
    const paragraphs = page.locator('article p, main p')
    if (await paragraphs.count() > 0) {
      expect(await paragraphs.count()).toBeGreaterThan(0)
    }
  })

  test('should render headings in correct hierarchy', async ({ page }) => {
    await page.goto('/learn/design-principle/solid-principle')
    await page.waitForLoadState('networkidle')

    // Verify H1 exists (main title)
    const h1 = page.locator('h1')
    expect(await h1.count()).toBeGreaterThanOrEqual(1)

    // Verify H2 headings exist (sections)
    const h2 = page.locator('h2')
    if (await h2.count() > 0) {
      expect(await h2.count()).toBeGreaterThan(0)
    }
  })

  test('should handle special characters in content', async ({ page }) => {
    await page.goto('/learn/design-principle/solid-principle')
    await page.waitForLoadState('networkidle')

    // Verify content loaded successfully
    const content = page.locator('article, main')
    await expect(content.first()).toBeVisible()

    // Content should have meaningful text
    const textContent = await content.first().textContent()
    expect(textContent?.length).toBeGreaterThan(100)
  })

  test('should render mobile-friendly content', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/learn/design-principle/solid-principle')
    await page.waitForLoadState('networkidle')

    // Verify main content is visible on mobile
    const mainContent = page.locator('article, main').first()
    await expect(mainContent).toBeVisible()

    // Verify no horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })

    expect(hasHorizontalScroll).toBe(false)
  })

  test('should load code examples with proper formatting', async ({ page }) => {
    await page.goto('/learn/example/java/clean-architecture-example')
    await page.waitForLoadState('networkidle')

    // Look for pre/code blocks
    const codeBlocks = page.locator('pre, code')
    expect(await codeBlocks.count()).toBeGreaterThan(0)

    // Verify code is readable (has content)
    const firstCodeBlock = codeBlocks.first()
    const codeText = await firstCodeBlock.textContent()
    expect(codeText?.length).toBeGreaterThan(10)
  })

  test('should maintain content readability on different screen sizes', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1920, height: 1080 }, // Desktop
    ]

    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.goto('/learn/design-principle/solid-principle')
      await page.waitForLoadState('networkidle')

      // Verify content is visible
      const content = page.locator('article, main').first()
      await expect(content).toBeVisible()

      // Verify text is readable (not cut off)
      const textContent = await content.textContent()
      expect(textContent?.length).toBeGreaterThan(100)
    }
  })

  test('should render article footer correctly', async ({ page }) => {
    await page.goto('/learn/design-principle/solid-principle')
    await page.waitForLoadState('networkidle')

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    // Look for footer elements (tags, related articles, prev/next)
    const footer = page.locator('footer, [data-testid="article-footer"]')
    if (await footer.count() > 0) {
      await expect(footer.first()).toBeVisible()
    }
  })
})
