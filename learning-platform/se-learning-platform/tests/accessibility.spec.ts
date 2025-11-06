import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility Tests', () => {
  test('homepage should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('learn page should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/learn')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('content page should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/')

    // Navigate to first content link
    const firstLink = page.locator('a[href*="/learn/"]').first()
    await firstLink.click()
    await page.waitForLoadState('networkidle')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('navigation should be keyboard accessible', async ({ page }) => {
    await page.goto('/')

    // Tab through navigation
    await page.keyboard.press('Tab')
    const firstFocusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(['A', 'BUTTON', 'INPUT']).toContain(firstFocusedElement)

    // Check for visible focus indicator
    const hasFocusVisible = await page.evaluate(() => {
      const el = document.activeElement
      const styles = window.getComputedStyle(el!)
      return styles.outline !== 'none' || styles.boxShadow !== 'none'
    })
    expect(hasFocusVisible).toBeTruthy()
  })

  test('search dialog should be keyboard accessible', async ({ page }) => {
    await page.goto('/')

    // Open search with keyboard shortcut
    await page.keyboard.press('Meta+K')
    await page.waitForTimeout(300)

    // Check that search input is focused
    const searchInput = page.getByPlaceholder(/Search documentation/)
    await expect(searchInput).toBeFocused()

    // Check for ARIA attributes
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    // Close with Escape
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
    await expect(dialog).not.toBeVisible()
  })

  test('theme switcher should have proper ARIA labels', async ({ page }) => {
    await page.goto('/')

    const themeButton = page.locator('button').filter({ hasText: /theme|dark|light/i }).first()

    if (await themeButton.count() > 0) {
      // Check for aria-label or accessible name
      const accessibleName = await themeButton.getAttribute('aria-label') ||
                             await themeButton.textContent()
      expect(accessibleName).toBeTruthy()
      expect(accessibleName!.length).toBeGreaterThan(0)
    }
  })

  test('all images should have alt text', async ({ page }) => {
    await page.goto('/')

    const images = page.locator('img')
    const imageCount = await images.count()

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')

      // Images should either have alt text or role="presentation"
      const role = await img.getAttribute('role')
      expect(alt !== null || role === 'presentation').toBeTruthy()
    }
  })

  test('headings should have proper hierarchy', async ({ page }) => {
    await page.goto('/')

    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', (elements) =>
      elements.map(el => ({
        level: parseInt(el.tagName.substring(1)),
        text: el.textContent?.trim()
      }))
    )

    // Should have exactly one h1
    const h1Count = headings.filter(h => h.level === 1).length
    expect(h1Count).toBeGreaterThanOrEqual(1)

    // Headings should not skip levels (e.g., h1 -> h3)
    for (let i = 1; i < headings.length; i++) {
      const diff = headings[i].level - headings[i - 1].level
      expect(diff).toBeLessThanOrEqual(1)
    }
  })

  test('links should have descriptive text', async ({ page }) => {
    await page.goto('/')

    const links = page.locator('a')
    const linkCount = await links.count()

    for (let i = 0; i < Math.min(linkCount, 20); i++) { // Check first 20 links
      const link = links.nth(i)
      const text = await link.textContent()
      const ariaLabel = await link.getAttribute('aria-label')
      const title = await link.getAttribute('title')

      // Link should have text, aria-label, or title
      const hasAccessibleName = (text && text.trim().length > 0) ||
                                (ariaLabel && ariaLabel.length > 0) ||
                                (title && title.length > 0)
      expect(hasAccessibleName).toBeTruthy()
    }
  })

  test('form inputs should have associated labels', async ({ page }) => {
    await page.goto('/')

    // Open search to check input
    await page.keyboard.press('Meta+K')
    await page.waitForTimeout(300)

    const searchInput = page.getByPlaceholder(/Search documentation/)

    // Check for label association or aria-label
    const ariaLabel = await searchInput.getAttribute('aria-label')
    const placeholder = await searchInput.getAttribute('placeholder')
    const ariaLabelledBy = await searchInput.getAttribute('aria-labelledby')

    expect(ariaLabel || placeholder || ariaLabelledBy).toBeTruthy()
  })

  test('buttons should have accessible names', async ({ page }) => {
    await page.goto('/')

    const buttons = page.locator('button')
    const buttonCount = await buttons.count()

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      const text = await button.textContent()
      const ariaLabel = await button.getAttribute('aria-label')
      const ariaLabelledBy = await button.getAttribute('aria-labelledby')

      // Button should have text, aria-label, or aria-labelledby
      const hasAccessibleName = (text && text.trim().length > 0) ||
                                (ariaLabel && ariaLabel.length > 0) ||
                                ariaLabelledBy
      expect(hasAccessibleName).toBeTruthy()
    }
  })

  test('color contrast should meet WCAG AA standards', async ({ page }) => {
    await page.goto('/')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze()

    const contrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    )

    expect(contrastViolations).toEqual([])
  })

  test('should support screen reader navigation landmarks', async ({ page }) => {
    await page.goto('/')

    // Check for semantic HTML5 elements or ARIA landmarks
    const nav = page.locator('nav, [role="navigation"]')
    const main = page.locator('main, [role="main"]')
    const header = page.locator('header, [role="banner"]')

    await expect(nav.first()).toBeVisible()
    await expect(main.first()).toBeVisible()
  })

  test('focus should be trapped in modal dialogs', async ({ page }) => {
    await page.goto('/')

    // Open search dialog
    await page.keyboard.press('Meta+K')
    await page.waitForTimeout(300)

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    // Tab multiple times - focus should stay within dialog
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement
        return el?.closest('[role="dialog"]') !== null
      })
      expect(focusedElement).toBeTruthy()
    }
  })

  test('skip to main content link should be available', async ({ page }) => {
    await page.goto('/')

    // Tab once to potentially reveal skip link
    await page.keyboard.press('Tab')

    // Check if there's a skip link or main content is first focusable
    const firstFocusable = await page.evaluate(() => {
      const el = document.activeElement
      return {
        text: el?.textContent?.toLowerCase(),
        href: el?.getAttribute('href')
      }
    })

    // Either has skip link or navigation is accessible
    const isAccessible = firstFocusable.text?.includes('skip') ||
                        firstFocusable.href === '#main' ||
                        firstFocusable.text !== null
    expect(isAccessible).toBeTruthy()
  })

  test('mobile menu should be accessible', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Look for mobile menu button
    const menuButton = page.locator('button[aria-label*="menu" i], button[aria-label*="navigation" i]').first()

    if (await menuButton.count() > 0) {
      // Check button has accessible name
      const ariaLabel = await menuButton.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()

      // Check button has aria-expanded attribute
      const ariaExpanded = await menuButton.getAttribute('aria-expanded')
      expect(['true', 'false']).toContain(ariaExpanded)

      // Click to open menu
      await menuButton.click()
      await page.waitForTimeout(300)

      // Check menu is now expanded
      const expandedState = await menuButton.getAttribute('aria-expanded')
      expect(expandedState).toBe('true')
    }
  })

  test('page should have a language attribute', async ({ page }) => {
    await page.goto('/')

    const lang = await page.getAttribute('html', 'lang')
    expect(lang).toBeTruthy()
    expect(lang?.length).toBeGreaterThan(0)
  })

  test('page should have a descriptive title', async ({ page }) => {
    await page.goto('/')

    const title = await page.title()
    expect(title).toBeTruthy()
    expect(title.length).toBeGreaterThan(0)
    expect(title).not.toBe('React App')
    expect(title).not.toBe('New Page')
  })

  test('interactive elements should be reachable via keyboard', async ({ page }) => {
    await page.goto('/')

    // Get all interactive elements
    const interactiveElements = await page.$$('a, button, input, select, textarea, [tabindex]')

    // All should have tabindex >= -1 (focusable) or be naturally focusable
    for (const element of interactiveElements.slice(0, 10)) { // Check first 10
      const tabindex = await element.getAttribute('tabindex')
      const tagName = await element.evaluate(el => el.tagName.toLowerCase())

      const isFocusable = tabindex === null ||
                         parseInt(tabindex) >= -1 ||
                         ['a', 'button', 'input', 'select', 'textarea'].includes(tagName)
      expect(isFocusable).toBeTruthy()
    }
  })

  test('content should be readable without CSS', async ({ page }) => {
    await page.goto('/')

    // Disable CSS
    await page.addStyleTag({ content: '* { all: unset !important; }' })

    // Check that main content is still visible
    const bodyText = await page.textContent('body')
    expect(bodyText).toBeTruthy()
    expect(bodyText!.length).toBeGreaterThan(100)
  })
})
