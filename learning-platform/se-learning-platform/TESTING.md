# Testing Guide - SE Learning Platform

**Date:** 2025-10-21
**Version:** 1.0

## Overview

This document describes the comprehensive testing strategy for the SE Learning Platform, including unit tests, end-to-end tests, accessibility tests, and API tests.

## Test Stack

- **Unit Testing**: Vitest + React Testing Library
- **E2E Testing**: Playwright (5 browsers)
- **Accessibility Testing**: axe-core/playwright
- **API Testing**: Playwright request context
- **Coverage Reporting**: Vitest v8 provider

## Test Statistics

| Test Type | Count | Files | Coverage |
|-----------|-------|-------|----------|
| Unit Tests | 52 | 2 | Utils, Components |
| E2E Tests | 44 | 6 | Core flows + Edge cases |
| Accessibility Tests | 20 | 1 | WCAG 2.1 AA |
| API Tests | 35 | 1 | 4 endpoints |
| **Total** | **151** | **10** | **Comprehensive** |

## Quick Start

```bash
# Run all unit tests
bun run test:unit

# Run all E2E tests
bun run test:e2e

# Run all tests (unit + E2E)
bun run test:all

# Run with UI
bun run test:unit:ui
bun run test:e2e:ui

# Generate coverage report
bun run test:unit:coverage
```

## Directory Structure

```
se-learning-platform/
├── __tests__/              # Unit tests (Vitest)
│   ├── lib/
│   │   └── utils.test.ts   # Utility function tests (38 tests)
│   └── components/
│       └── button.test.tsx # Component tests (14 tests)
├── tests/                  # E2E tests (Playwright)
│   ├── homepage.spec.ts    # Homepage tests
│   ├── navigation.spec.ts  # Navigation tests
│   ├── content.spec.ts     # Content rendering tests
│   ├── search.spec.ts      # Search functionality tests
│   ├── mobile.spec.ts      # Mobile responsiveness tests
│   ├── edge-cases.spec.ts  # Edge case tests (13 tests)
│   ├── accessibility.spec.ts # A11y tests (20 tests)
│   └── api.spec.ts         # API endpoint tests (35 tests)
├── vitest.config.ts        # Vitest configuration
├── vitest.setup.ts         # Test environment setup
└── playwright.config.ts    # Playwright configuration
```

## Unit Tests (Vitest)

### Running Unit Tests

```bash
# Watch mode (default)
bun run test:unit

# Run once
vitest run

# With UI
bun run test:unit:ui

# Coverage report
bun run test:unit:coverage
```

### Coverage Areas

#### Utility Functions (`__tests__/lib/utils.test.ts`)
- **cn()** - 5 tests - className merging utility
- **slugify()** - 8 tests - text to slug conversion
- **formatDate()** - 3 tests - date formatting
- **calculateReadingTime()** - 6 tests - reading time calculation
- **truncate()** - 6 tests - text truncation

#### Components (`__tests__/components/button.test.tsx`)
- Rendering with text
- Click event handling
- Disabled state behavior
- Variant testing (default, outline, ghost, secondary, destructive, link)
- Size testing (default, sm, lg, icon)
- Custom className merging
- Type attribute support
- Children rendering

### Writing Unit Tests

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

describe('Component Name', () => {
  it('should describe expected behavior', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<Component onClick={handleClick} />)

    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledOnce()
  })
})
```

## E2E Tests (Playwright)

### Running E2E Tests

```bash
# All browsers (Chromium, Firefox, WebKit, Mobile)
bun run test:e2e

# Headed mode (visible browser)
bun run test:e2e:headed

# Interactive UI mode
bun run test:e2e:ui

# Specific file
npx playwright test tests/homepage.spec.ts

# Specific browser
npx playwright test --project=chromium

# Show report
bun run test:e2e:report
```

### E2E Test Coverage

#### Core User Flows
- **Homepage** (`homepage.spec.ts`)
  - Page loads successfully
  - Hero section displays
  - Navigation visible
  - Search functionality
  - Theme switching

- **Navigation** (`navigation.spec.ts`)
  - Learn page navigation
  - Category navigation
  - Mobile menu functionality
  - Breadcrumb navigation
  - Active link highlighting

- **Content** (`content.spec.ts`)
  - Article rendering
  - Code syntax highlighting
  - Table of contents
  - Reading time display
  - Category badges

- **Search** (`search.spec.ts`)
  - Keyboard shortcut (⌘K)
  - Search input focus
  - Search results display
  - Search result navigation
  - Empty state handling

- **Mobile** (`mobile.spec.ts`)
  - Responsive layout
  - Mobile navigation
  - Touch interactions
  - Viewport adaptations

#### Edge Cases (`edge-cases.spec.ts`)
- 404 page handling
- Invalid routes
- Empty search queries
- Very long search queries
- Special characters in search
- Rapid theme switching
- Same page navigation
- Browser back/forward
- Viewport resize
- Slow network conditions
- Multiple rapid searches
- Keyboard-only navigation
- Missing images

### Browser Coverage

Tests run on 5 different browsers:
- Chromium (Desktop)
- Firefox (Desktop)
- WebKit (Desktop)
- Mobile Chrome (Android)
- Mobile Safari (iOS)

### Writing E2E Tests

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test('should describe expected behavior', async ({ page }) => {
    await page.goto('/')

    const element = page.locator('selector')
    await expect(element).toBeVisible()

    await element.click()
    await expect(page).toHaveURL(/expected-url/)
  })
})
```

## Accessibility Tests

### Running Accessibility Tests

```bash
# All a11y tests
npx playwright test tests/accessibility.spec.ts

# Specific test
npx playwright test tests/accessibility.spec.ts -g "keyboard accessible"
```

### Coverage Areas

Tests validate **WCAG 2.1 AA compliance**:

1. **Automated Scans**
   - Homepage violations
   - Learn page violations
   - Content page violations
   - Color contrast (WCAG AA)

2. **Keyboard Navigation**
   - Tab order
   - Focus indicators
   - Skip to main content
   - Keyboard-only navigation
   - Focus trap in modals

3. **ARIA & Semantics**
   - ARIA labels
   - Landmark regions
   - Heading hierarchy
   - Form labels
   - Button accessible names

4. **Screen Reader Support**
   - Alt text for images
   - Descriptive link text
   - Page language attribute
   - Descriptive page titles

5. **Mobile Accessibility**
   - Mobile menu ARIA
   - Touch target sizes
   - Responsive navigation

6. **Content Accessibility**
   - Readable without CSS
   - Semantic HTML
   - Proper document structure

### Accessibility Standards

All tests validate against:
- WCAG 2.0 Level A
- WCAG 2.0 Level AA
- WCAG 2.1 Level A
- WCAG 2.1 Level AA

### Fixing Accessibility Issues

When tests fail, check:
1. Missing ARIA labels
2. Poor color contrast
3. Broken keyboard navigation
4. Missing alt text
5. Improper heading hierarchy
6. Focus management issues

## API Tests

### Running API Tests

```bash
# All API tests
npx playwright test tests/api.spec.ts

# Specific endpoint
npx playwright test tests/api.spec.ts -g "GET /api/content"
```

### Endpoint Coverage

#### GET /api/content
Tests (5):
- Returns all content with correct structure
- Filters by category parameter
- Returns empty array for non-existent category
- Includes valid ISO timestamps
- Consistent results across requests

Response structure:
```typescript
{
  success: true,
  data: ContentListItem[],
  meta: {
    total: number,
    timestamp: string
  }
}
```

#### GET /api/content/[slug]
Tests (5):
- Returns specific content by slug
- Returns 404 for non-existent slug
- Includes full content HTML
- Includes frontmatter data
- Handles URL-encoded slugs

Response structure:
```typescript
{
  success: true,
  data: Content,
  meta: {
    timestamp: string
  }
}
```

#### GET /api/search
Tests (8):
- Returns results for valid query
- Returns 400 when query parameter missing
- Returns empty results for non-matching query
- Handles special characters
- Handles empty query string
- Handles very long queries
- Consistent results for same query
- Includes all required fields
- Case-insensitive search

Query parameters:
- `q` (required): Search query string

Response structure:
```typescript
{
  success: true,
  data: ContentListItem[],
  meta: {
    query: string,
    total: number,
    timestamp: string
  }
}
```

#### GET /api/navigation
Tests (4):
- Returns navigation structure
- Includes navigation groups with items
- Consistent structure across requests
- No query parameters required

Response structure:
```typescript
{
  success: true,
  data: NavigationGroup[],
  meta: {
    total: number,
    timestamp: string
  }
}
```

### Error Response Structure

All errors return consistent structure:
```typescript
{
  success: false,
  error: string
}
```

Status codes:
- `200` - Success
- `400` - Bad Request (missing/invalid parameters)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

### Performance Tests

API tests validate:
- Response time < 2 seconds
- Concurrent request handling
- Correct Content-Type headers

## WSL Limitations

**Important**: E2E tests cannot run in WSL due to Next.js dev server networking issues.

### Working Environments
✅ Native Linux/macOS
✅ GitHub Actions / GitLab CI
✅ Docker containers
✅ Windows native (not WSL)

### WSL Symptoms
- `net::ERR_ABORTED` errors
- Dev server timeout
- Port conflicts

### Workaround
Run tests in:
- GitHub Actions (recommended for CI/CD)
- Docker container
- Native Windows with Node.js
- Cloud VM (DigitalOcean, AWS EC2)

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run test:unit

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: npx playwright install --with-deps
      - run: bun run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Coverage Reports

### Generate Coverage

```bash
# Unit test coverage
bun run test:unit:coverage

# View HTML report
open coverage/index.html
```

Coverage is configured to exclude:
- `node_modules/`
- `tests/`
- `**/*.config.ts`
- `**/*.config.js`
- `.next/`

## Best Practices

### Unit Tests
1. Test behavior, not implementation
2. Use Testing Library queries (`getByRole`, `getByText`)
3. Mock external dependencies
4. Test edge cases and error states
5. Keep tests isolated and independent

### E2E Tests
1. Test real user workflows
2. Use data-testid sparingly (prefer semantic queries)
3. Wait for network idle on navigation
4. Test across multiple browsers
5. Keep tests deterministic (no flaky tests)

### Accessibility Tests
1. Run automated scans on all pages
2. Test keyboard navigation manually
3. Verify with screen readers
4. Check color contrast
5. Validate ARIA usage

### API Tests
1. Test success and error paths
2. Validate response structure
3. Check status codes
4. Test edge cases (empty, large, special chars)
5. Verify performance requirements

## Debugging Tests

### Unit Tests

```bash
# Debug in browser
bun run test:unit:ui

# Run single test
vitest run -t "test name pattern"

# Watch mode
vitest
```

### E2E Tests

```bash
# Debug mode (headed + slow)
npx playwright test --debug

# Headed mode (visible browser)
npx playwright test --headed

# UI mode (interactive)
bun run test:e2e:ui

# Trace viewer (after test)
npx playwright show-trace trace.zip
```

### Accessibility Tests

```bash
# Run specific a11y test
npx playwright test tests/accessibility.spec.ts -g "keyboard"

# Check violations in detail
npx playwright test tests/accessibility.spec.ts --headed
```

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "Element not found"
**Solution**: Add proper wait conditions (`waitForLoadState`, `waitForSelector`)

**Issue**: Flaky tests (intermittent failures)
**Solution**: Add explicit waits, avoid hardcoded timeouts, check for race conditions

**Issue**: Coverage not generated
**Solution**: Ensure `vitest.config.ts` has coverage provider configured

**Issue**: Playwright browsers not installed
**Solution**: Run `npx playwright install`

**Issue**: WSL E2E tests fail
**Solution**: Use native OS, Docker, or CI/CD environment

## Contributing

When adding new features:

1. **Write tests first** (TDD recommended)
2. **Maintain coverage** (aim for >80%)
3. **Test edge cases** (empty states, errors, large inputs)
4. **Add accessibility tests** for new UI components
5. **Update this documentation** if adding new test types

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

*Last Updated: 2025-10-21*
*Version: 1.0*
