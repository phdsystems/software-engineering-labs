import { describe, it, expect } from 'vitest'
import {
  getAllContent,
  getContentBySlug,
  getContentByCategory,
  getCategories,
} from '@/lib/api/content'

describe('Metadata Validation Integration Tests', () => {
  describe('Reading Time Metadata', () => {
    it('should have valid reading time for all content', async () => {
      const allContent = await getAllContent()

      allContent.forEach(item => {
        expect(item.metadata.readingTime).toBeDefined()
        expect(typeof item.metadata.readingTime).toBe('number')
        expect(item.metadata.readingTime).toBeGreaterThanOrEqual(0)
        expect(item.metadata.readingTime).toBeLessThan(1000) // Reasonable upper limit
      })
    })

    it('should calculate reading time proportional to content length', async () => {
      const allContent = await getAllContent()

      if (allContent.length >= 2) {
        // Get two content items
        const content1 = await getContentBySlug(allContent[0].slug)
        const content2 = await getContentBySlug(allContent[1].slug)

        if (content1 && content2) {
          const length1 = content1.content.length
          const length2 = content2.content.length

          const time1 = content1.metadata.readingTime
          const time2 = content2.metadata.readingTime

          // Both should have reading time > 0
          expect(time1).toBeGreaterThan(0)
          expect(time2).toBeGreaterThan(0)

          // Longer content should generally have higher reading time
          // (allowing for some variance due to code blocks, formatting, etc.)
          if (length1 > length2 * 2) {
            expect(time1).toBeGreaterThanOrEqual(time2 * 0.5)
          }
        }
      }
    })

    it('should have consistent reading time between list and detail views', async () => {
      const allContent = await getAllContent()

      if (allContent.length > 0) {
        const firstItem = allContent[0]
        const content = await getContentBySlug(firstItem.slug)

        if (content) {
          expect(content.metadata.readingTime).toBe(firstItem.metadata.readingTime)
        }
      }
    })

    it('should have non-zero reading time for non-trivial content', async () => {
      const allContent = await getAllContent()

      // Find guide files (should have substantial content)
      const guides = allContent.filter(item => item.slug.includes('-guide'))

      if (guides.length > 0) {
        const guide = await getContentBySlug(guides[0].slug)

        if (guide) {
          // Guides should have meaningful content
          expect(guide.metadata.readingTime).toBeGreaterThan(0)
        }
      }
    })
  })

  describe('Last Updated Metadata', () => {
    it('should have valid date format for all content', async () => {
      const allContent = await getAllContent()

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/

      allContent.forEach(item => {
        expect(item.metadata.lastUpdated).toBeDefined()
        expect(typeof item.metadata.lastUpdated).toBe('string')
        expect(item.metadata.lastUpdated).toMatch(dateRegex)
      })
    })

    it('should have parseable dates', async () => {
      const allContent = await getAllContent()

      allContent.forEach(item => {
        const date = new Date(item.metadata.lastUpdated)

        // Should be a valid date
        expect(date instanceof Date).toBe(true)
        expect(isNaN(date.getTime())).toBe(false)

        // Should be a reasonable date (after 2020, before 2030)
        const year = date.getFullYear()
        expect(year).toBeGreaterThanOrEqual(2020)
        expect(year).toBeLessThan(2030)
      })
    })

    it('should have consistent lastUpdated between list and detail', async () => {
      const allContent = await getAllContent()

      if (allContent.length > 0) {
        const firstItem = allContent[0]
        const content = await getContentBySlug(firstItem.slug)

        if (content) {
          expect(content.metadata.lastUpdated).toBe(firstItem.metadata.lastUpdated)
        }
      }
    })

    it('should reflect file modification times', async () => {
      const allContent = await getAllContent()

      allContent.forEach(item => {
        const date = new Date(item.metadata.lastUpdated)

        // Should not be in the future
        expect(date.getTime()).toBeLessThanOrEqual(Date.now())
      })
    })
  })

  describe('Difficulty Metadata', () => {
    it('should have valid difficulty levels when present', async () => {
      const allContent = await getAllContent()
      const validDifficulties = ['beginner', 'intermediate', 'advanced']

      allContent.forEach(item => {
        if (item.metadata.difficulty) {
          expect(validDifficulties).toContain(item.metadata.difficulty)
        }
      })
    })

    it('should maintain difficulty consistency between views', async () => {
      const allContent = await getAllContent()

      // Find content with difficulty set
      const withDifficulty = allContent.find(item => item.metadata.difficulty)

      if (withDifficulty) {
        const content = await getContentBySlug(withDifficulty.slug)

        if (content) {
          expect(content.metadata.difficulty).toBe(withDifficulty.metadata.difficulty)
        }
      }
    })

    it('should categorize foundation content appropriately', async () => {
      const foundationContent = await getContentByCategory('0-foundation')

      if (foundationContent.length > 0) {
        foundationContent.forEach(item => {
          if (item.metadata.difficulty) {
            // Foundation content should generally be beginner or intermediate
            expect(['beginner', 'intermediate']).toContain(item.metadata.difficulty)
          }
        })
      }
    })

    it('should categorize advanced patterns appropriately', async () => {
      const allContent = await getAllContent()

      // Find advanced patterns (CQRS, Event Sourcing, etc.)
      const advancedPatterns = allContent.filter(item =>
        item.slug.includes('cqrs') ||
        item.slug.includes('event-sourcing') ||
        item.slug.includes('microservices')
      )

      if (advancedPatterns.length > 0) {
        advancedPatterns.forEach(item => {
          if (item.metadata.difficulty) {
            // Advanced patterns should be marked as intermediate or advanced
            expect(['intermediate', 'advanced']).toContain(item.metadata.difficulty)
          }
        })
      }
    })
  })

  describe('Tags Metadata', () => {
    it('should have valid tags array when present', async () => {
      const allContent = await getAllContent()

      for (const item of allContent) {
        const content = await getContentBySlug(item.slug)

        if (content?.metadata.tags) {
          expect(Array.isArray(content.metadata.tags)).toBe(true)

          content.metadata.tags.forEach(tag => {
            expect(typeof tag).toBe('string')
            expect(tag.length).toBeGreaterThan(0)
          })
        }
      }
    })

    it('should have relevant tags for design patterns', async () => {
      const allContent = await getAllContent()
      const designPatterns = allContent.filter(item =>
        item.slug.includes('3-design/design-pattern')
      )

      if (designPatterns.length > 0) {
        for (const pattern of designPatterns) {
          const content = await getContentBySlug(pattern.slug)

          if (content?.metadata.tags && content.metadata.tags.length > 0) {
            // Design patterns should have relevant tags
            const hasRelevantTag = content.metadata.tags.some(tag =>
              tag.toLowerCase().includes('pattern') ||
              tag.toLowerCase().includes('design') ||
              tag.toLowerCase().includes('oop') ||
              tag.toLowerCase().includes('gof')
            )

            expect(hasRelevantTag).toBe(true)
            break
          }
        }
      }
    })

    it('should have no duplicate tags', async () => {
      const allContent = await getAllContent()

      for (const item of allContent) {
        const content = await getContentBySlug(item.slug)

        if (content?.metadata.tags && content.metadata.tags.length > 1) {
          const uniqueTags = new Set(content.metadata.tags)

          expect(uniqueTags.size).toBe(content.metadata.tags.length)
        }
      }
    })
  })

  describe('Category Metadata', () => {
    it('should have valid category for all content', async () => {
      const allContent = await getAllContent()

      const validCategories = [
        '0-foundation',
        '1-planning',
        '2-analysis',
        '3-design',
        '4-development',
        '5-testing',
        '6-deployment',
        '7-maintenance',
        'assets',
        'guide'
      ]

      allContent.forEach(item => {
        expect(item.category).toBeDefined()

        // Should be a valid category or match SDLC pattern
        const isValid =
          validCategories.includes(item.category) ||
          item.category.match(/^\d-[a-z-]+$/)

        expect(isValid).toBe(true)
      })
    })

    it('should have consistent category info', async () => {
      const categories = await getCategories()

      categories.forEach(category => {
        expect(category.slug).toBeDefined()
        expect(category.title).toBeDefined()
        expect(category.count).toBeGreaterThan(0)

        // Count should be a positive integer
        expect(Number.isInteger(category.count)).toBe(true)
      })
    })

    it('should match content count with category count', async () => {
      const categories = await getCategories()

      for (const category of categories) {
        const categoryContent = await getContentByCategory(category.slug)

        expect(categoryContent.length).toBe(category.count)
      }
    })

    it('should have human-readable category titles', async () => {
      const categories = await getCategories()

      categories.forEach(category => {
        // Title should be capitalized and readable
        expect(category.title.length).toBeGreaterThan(0)

        // First letter should be uppercase
        expect(category.title[0]).toBe(category.title[0].toUpperCase())
      })
    })
  })

  describe('Slug Metadata', () => {
    it('should have valid slug format for all content', async () => {
      const allContent = await getAllContent()

      allContent.forEach(item => {
        // Slug should not be empty
        expect(item.slug.length).toBeGreaterThan(0)

        // Should not have leading/trailing slashes
        expect(item.slug).not.toMatch(/^\//)
        expect(item.slug).not.toMatch(/\/$/)

        // Should not have .md extension
        expect(item.slug).not.toContain('.md')

        // Should not have double slashes
        expect(item.slug).not.toContain('//')

        // Should use kebab-case (lowercase with hyphens)
        const parts = item.slug.split('/')
        parts.forEach(part => {
          expect(part).toMatch(/^[a-z0-9-]+$/)
        })
      })
    })

    it('should have unique slugs across all content', async () => {
      const allContent = await getAllContent()
      const slugs = allContent.map(item => item.slug)
      const uniqueSlugs = new Set(slugs)

      expect(uniqueSlugs.size).toBe(slugs.length)
    })

    it('should have slug that matches file path structure', async () => {
      const allContent = await getAllContent()

      allContent.forEach(item => {
        // Slug should start with category
        expect(item.slug.startsWith(item.category)).toBe(true)

        // Slug should be properly formatted relative path
        const slugParts = item.slug.split('/')
        expect(slugParts[0]).toBe(item.category)
      })
    })
  })

  describe('Title and Description Metadata', () => {
    it('should have non-empty title for all content', async () => {
      const allContent = await getAllContent()

      allContent.forEach(item => {
        expect(item.title).toBeDefined()
        expect(typeof item.title).toBe('string')
        expect(item.title.length).toBeGreaterThan(0)

        // Title should not be placeholder
        expect(item.title.toLowerCase()).not.toBe('untitled')
        expect(item.title.toLowerCase()).not.toBe('todo')
      })
    })

    it('should have description for all content', async () => {
      const allContent = await getAllContent()

      allContent.forEach(item => {
        expect(item.description).toBeDefined()
        expect(typeof item.description).toBe('string')
        // Description may be empty, which is acceptable
      })
    })

    it('should have meaningful descriptions for guides', async () => {
      const allContent = await getAllContent()
      const guides = allContent.filter(item => item.slug.includes('-guide'))

      if (guides.length > 0) {
        guides.forEach(guide => {
          // Guides should have descriptions
          expect(guide.description.length).toBeGreaterThan(0)
        })
      }
    })

    it('should have title matching H1 in content', async () => {
      const allContent = await getAllContent()

      if (allContent.length > 0) {
        const firstItem = allContent[0]
        const content = await getContentBySlug(firstItem.slug)

        if (content) {
          // Title from list should match content title
          expect(content.title).toBe(firstItem.title)

          // Title should appear in content
          expect(content.content).toContain(content.title)
        }
      }
    })
  })

  describe('Navigation Metadata', () => {
    it('should have valid prev/next when present', async () => {
      const allContent = await getAllContent()

      for (const item of allContent) {
        const content = await getContentBySlug(item.slug)

        if (content) {
          // If prev exists, should be a valid slug
          if (content.prev) {
            expect(typeof content.prev).toBe('string')
            expect(content.prev.length).toBeGreaterThan(0)

            // Should be fetchable
            const prevContent = await getContentBySlug(content.prev)
            expect(prevContent).toBeDefined()
          }

          // If next exists, should be a valid slug
          if (content.next) {
            expect(typeof content.next).toBe('string')
            expect(content.next.length).toBeGreaterThan(0)

            // Should be fetchable
            const nextContent = await getContentBySlug(content.next)
            expect(nextContent).toBeDefined()
          }

          // Stop after checking one
          if (content.prev || content.next) break
        }
      }
    })

    it('should have bidirectional navigation links', async () => {
      const allContent = await getAllContent()

      for (const item of allContent) {
        const content = await getContentBySlug(item.slug)

        if (content?.next) {
          const nextContent = await getContentBySlug(content.next)

          if (nextContent?.prev) {
            // Next item's prev should point back to current
            expect(nextContent.prev).toBe(item.slug)
          }

          // Stop after checking one
          break
        }
      }
    })
  })

  describe('Related Content Metadata', () => {
    it('should have valid related array', async () => {
      const allContent = await getAllContent()

      for (const item of allContent) {
        const content = await getContentBySlug(item.slug)

        if (content) {
          expect(Array.isArray(content.related)).toBe(true)

          if (content.related.length > 0) {
            content.related.forEach(relatedSlug => {
              expect(typeof relatedSlug).toBe('string')
              expect(relatedSlug.length).toBeGreaterThan(0)
            })
          }
        }
      }
    })

    it('should have no duplicate related items', async () => {
      const allContent = await getAllContent()

      for (const item of allContent) {
        const content = await getContentBySlug(item.slug)

        if (content?.related && content.related.length > 1) {
          const uniqueRelated = new Set(content.related)

          expect(uniqueRelated.size).toBe(content.related.length)
        }
      }
    })

    it('should not self-reference in related', async () => {
      const allContent = await getAllContent()

      for (const item of allContent) {
        const content = await getContentBySlug(item.slug)

        if (content?.related && content.related.length > 0) {
          expect(content.related).not.toContain(item.slug)
        }
      }
    })
  })

  describe('Comprehensive Metadata Validation', () => {
    it('should have complete metadata structure for all content', async () => {
      const allContent = await getAllContent()

      allContent.forEach(item => {
        // List view required fields
        expect(item).toHaveProperty('slug')
        expect(item).toHaveProperty('category')
        expect(item).toHaveProperty('title')
        expect(item).toHaveProperty('description')
        expect(item).toHaveProperty('metadata')

        // Metadata required fields
        expect(item.metadata).toHaveProperty('readingTime')
        expect(item.metadata).toHaveProperty('lastUpdated')
      })
    })

    it('should have complete metadata for detail view', async () => {
      const allContent = await getAllContent()

      if (allContent.length > 0) {
        const content = await getContentBySlug(allContent[0].slug)

        if (content) {
          // Detail view required fields
          expect(content).toHaveProperty('slug')
          expect(content).toHaveProperty('category')
          expect(content).toHaveProperty('title')
          expect(content).toHaveProperty('description')
          expect(content).toHaveProperty('content')
          expect(content).toHaveProperty('toc')
          expect(content).toHaveProperty('metadata')
          expect(content).toHaveProperty('related')

          // Metadata extended fields
          expect(content.metadata).toHaveProperty('readingTime')
          expect(content.metadata).toHaveProperty('lastUpdated')
        }
      }
    })
  })
})
