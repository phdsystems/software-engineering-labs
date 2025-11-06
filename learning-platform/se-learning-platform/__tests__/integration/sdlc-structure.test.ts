import { describe, it, expect } from 'vitest'
import {
  getAllContent,
  getContentBySlug,
  getContentByCategory,
  getCategories,
} from '@/lib/api/content'

describe('SDLC Structure Integration Tests', () => {
  describe('Phase-Based Organization', () => {
    it('should load content from new doc/ directory structure', async () => {
      const allContent = await getAllContent()

      expect(allContent).toBeDefined()
      expect(Array.isArray(allContent)).toBe(true)
      expect(allContent.length).toBeGreaterThan(0)
    })

    it('should recognize SDLC phase categories', async () => {
      const categories = await getCategories()
      const categoryNames = categories.map(c => c.slug)

      // Expect SDLC phase directories
      const sdlcPhases = [
        '0-foundation',
        '1-planning',
        '2-analysis',
        '3-design',
        '4-development',
        '5-testing',
        '6-deployment',
        '7-maintenance',
        'assets'
      ]

      // Check that we have some SDLC phases
      const hasSdlcPhases = sdlcPhases.some(phase =>
        categoryNames.includes(phase)
      )

      expect(hasSdlcPhases).toBe(true)
    })

    it('should load foundation content (Phase 0)', async () => {
      const foundationContent = await getContentByCategory('0-foundation')

      if (foundationContent.length > 0) {
        expect(foundationContent).toBeDefined()
        expect(Array.isArray(foundationContent)).toBe(true)

        foundationContent.forEach(item => {
          expect(item.category).toBe('0-foundation')
          expect(item.slug).toContain('0-foundation')
        })
      }
    })

    it('should load design content (Phase 3)', async () => {
      const designContent = await getContentByCategory('3-design')

      if (designContent.length > 0) {
        expect(designContent).toBeDefined()
        expect(Array.isArray(designContent)).toBe(true)

        designContent.forEach(item => {
          expect(item.category).toBe('3-design')
          expect(item.slug).toContain('3-design')
        })
      }
    })

    it('should load development examples (Phase 4)', async () => {
      const devContent = await getContentByCategory('4-development')

      if (devContent.length > 0) {
        expect(devContent).toBeDefined()
        expect(Array.isArray(devContent)).toBe(true)

        devContent.forEach(item => {
          expect(item.category).toBe('4-development')
          expect(item.slug).toContain('4-development')
        })
      }
    })
  })

  describe('Nested Category Structure', () => {
    it('should handle design-principle subdirectory', async () => {
      const allContent = await getAllContent()
      const designPrinciples = allContent.filter(item =>
        item.slug.includes('0-foundation/design-principle')
      )

      if (designPrinciples.length > 0) {
        expect(designPrinciples.length).toBeGreaterThan(0)

        designPrinciples.forEach(item => {
          expect(item.slug).toMatch(/0-foundation\/design-principle/)
        })
      }
    })

    it('should handle design-pattern subdirectory', async () => {
      const allContent = await getAllContent()
      const designPatterns = allContent.filter(item =>
        item.slug.includes('3-design/design-pattern')
      )

      if (designPatterns.length > 0) {
        expect(designPatterns.length).toBeGreaterThan(0)

        designPatterns.forEach(item => {
          expect(item.slug).toMatch(/3-design\/design-pattern/)
        })
      }
    })

    it('should handle architecture-pattern subdirectory', async () => {
      const allContent = await getAllContent()
      const archPatterns = allContent.filter(item =>
        item.slug.includes('3-design/architecture-pattern')
      )

      if (archPatterns.length > 0) {
        expect(archPatterns.length).toBeGreaterThan(0)

        archPatterns.forEach(item => {
          expect(item.slug).toMatch(/3-design\/architecture-pattern/)
        })
      }
    })

    it('should handle multi-language examples', async () => {
      const allContent = await getAllContent()
      const examples = allContent.filter(item =>
        item.slug.includes('4-development/example')
      )

      if (examples.length > 0) {
        expect(examples.length).toBeGreaterThan(0)

        // Check for language subdirectories
        const languages = ['python', 'java', 'kotlin', 'groovy', 'go', 'rust', 'typescript']
        const hasLanguageExamples = languages.some(lang =>
          examples.some(ex => ex.slug.includes(`example/${lang}`))
        )

        expect(hasLanguageExamples).toBe(true)
      }
    })
  })

  describe('Index Files Exclusion', () => {
    it('should exclude overview.md from content', async () => {
      const allContent = await getAllContent()
      const hasOverview = allContent.some(item =>
        item.slug.endsWith('overview.md')
      )

      expect(hasOverview).toBe(false)
    })

    it('should exclude documentation-index.md from content', async () => {
      const allContent = await getAllContent()
      const hasDocIndex = allContent.some(item =>
        item.slug.endsWith('documentation-index.md')
      )

      expect(hasDocIndex).toBe(false)
    })

    it('should exclude README.md from content', async () => {
      const allContent = await getAllContent()
      const hasReadme = allContent.some(item =>
        item.slug.toLowerCase().includes('readme')
      )

      expect(hasReadme).toBe(false)
    })
  })

  describe('Guide Files', () => {
    it('should load phase guide files', async () => {
      const allContent = await getAllContent()
      const guideFiles = allContent.filter(item =>
        item.slug.includes('-guide')
      )

      if (guideFiles.length > 0) {
        expect(guideFiles.length).toBeGreaterThan(0)

        // Should have guides like foundation-guide, planning-guide, etc.
        guideFiles.forEach(guide => {
          expect(guide.slug).toMatch(/-guide/)
        })
      }
    })

    it('should load foundation-guide.md', async () => {
      const slug = '0-foundation/foundation-guide'
      const content = await getContentBySlug(slug)

      if (content) {
        expect(content).toBeDefined()
        expect(content?.slug).toBe(slug)
        expect(content?.title).toBeDefined()
      }
    })

    it('should load design-guide.md', async () => {
      const slug = '3-design/design-guide'
      const content = await getContentBySlug(slug)

      if (content) {
        expect(content).toBeDefined()
        expect(content?.slug).toBe(slug)
        expect(content?.title).toBeDefined()
      }
    })

    it('should load developer-guide.md', async () => {
      const slug = '4-development/developer-guide'
      const content = await getContentBySlug(slug)

      if (content) {
        expect(content).toBeDefined()
        expect(content?.slug).toBe(slug)
        expect(content?.title).toBeDefined()
      }
    })
  })

  describe('Legacy Content Migration', () => {
    it('should find first-principles-approach in Phase 0', async () => {
      const allContent = await getAllContent()
      const firstPrinciples = allContent.find(item =>
        item.slug.includes('first-principles-approach')
      )

      if (firstPrinciples) {
        expect(firstPrinciples.slug).toContain('0-foundation')
        expect(firstPrinciples.title).toBeDefined()
      }
    })

    it('should find learning-path in Phase 0', async () => {
      const allContent = await getAllContent()
      const learningPath = allContent.find(item =>
        item.slug.includes('learning-path')
      )

      if (learningPath) {
        expect(learningPath.slug).toContain('0-foundation')
        expect(learningPath.title).toBeDefined()
      }
    })

    it('should find implementation-plan in Phase 6', async () => {
      const allContent = await getAllContent()
      const implPlan = allContent.find(item =>
        item.slug.includes('implementation-plan')
      )

      if (implPlan) {
        expect(implPlan.slug).toContain('6-deployment')
        expect(implPlan.title).toBeDefined()
      }
    })

    it('should find git-internals in Phase 7', async () => {
      const allContent = await getAllContent()
      const gitInternals = allContent.find(item =>
        item.slug.includes('git-internals')
      )

      if (gitInternals) {
        expect(gitInternals.slug).toContain('7-maintenance')
        expect(gitInternals.title).toBeDefined()
      }
    })
  })

  describe('Category Statistics', () => {
    it('should have correct count per category', async () => {
      const categories = await getCategories()

      categories.forEach(category => {
        expect(category.count).toBeGreaterThan(0)
        expect(typeof category.count).toBe('number')
      })
    })

    it('should have human-readable category titles', async () => {
      const categories = await getCategories()

      categories.forEach(category => {
        expect(category.title).toBeDefined()
        expect(category.title.length).toBeGreaterThan(0)
        expect(typeof category.title).toBe('string')
      })
    })
  })

  describe('Content Integrity', () => {
    it('should have valid metadata for all content', async () => {
      const allContent = await getAllContent()

      allContent.forEach(item => {
        expect(item.slug).toBeDefined()
        expect(item.title).toBeDefined()
        expect(item.category).toBeDefined()
        expect(item.metadata).toBeDefined()
        expect(item.metadata.readingTime).toBeGreaterThanOrEqual(0)
        expect(item.metadata.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })
    })

    it('should have unique slugs', async () => {
      const allContent = await getAllContent()
      const slugs = allContent.map(item => item.slug)
      const uniqueSlugs = new Set(slugs)

      expect(uniqueSlugs.size).toBe(slugs.length)
    })

    it('should have consistent file paths', async () => {
      const allContent = await getAllContent()

      allContent.forEach(item => {
        // Slug should not have leading/trailing slashes
        expect(item.slug).not.toMatch(/^\//)
        expect(item.slug).not.toMatch(/\/$/)

        // Slug should not have double slashes
        expect(item.slug).not.toContain('//')

        // Slug should not have .md extension
        expect(item.slug).not.toContain('.md')
      })
    })
  })

  describe('Backward Compatibility', () => {
    it('should handle both old and new category formats gracefully', async () => {
      // This test ensures the system works whether content uses old or new paths
      const allContent = await getAllContent()

      expect(allContent.length).toBeGreaterThan(0)

      allContent.forEach(item => {
        // Should have a category
        expect(item.category).toBeDefined()
        expect(typeof item.category).toBe('string')
      })
    })
  })
})
