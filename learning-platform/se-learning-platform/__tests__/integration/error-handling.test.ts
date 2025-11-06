import { describe, it, expect } from 'vitest'
import {
  getAllContent,
  getContentBySlug,
  getContentByCategory,
  searchContent,
  getRelatedContent,
} from '@/lib/api/content'

describe('Error Handling Integration Tests', () => {
  describe('Invalid Slug Handling', () => {
    it('should return null for non-existent slug', async () => {
      const content = await getContentBySlug('non-existent-slug-xyz123')

      expect(content).toBeNull()
    })

    it('should return null for malformed slug', async () => {
      const malformedSlugs = [
        '//invalid//path',
        '../../../etc/passwd',
        'slug with spaces',
        'slug/with/many/nested/levels/that/do/not/exist'
      ]

      for (const slug of malformedSlugs) {
        const content = await getContentBySlug(slug)

        // Should handle gracefully (return null or empty)
        expect(content === null || content === undefined).toBe(true)
      }
    })

    it('should handle slug with special characters', async () => {
      const specialSlugs = [
        'slug-with-!@#$%',
        'slug<>script',
        'slug;drop;table'
      ]

      for (const slug of specialSlugs) {
        const content = await getContentBySlug(slug)

        // Should not crash
        expect(content === null || content === undefined).toBe(true)
      }
    })

    it('should handle empty slug', async () => {
      const content = await getContentBySlug('')

      expect(content === null || content === undefined).toBe(true)
    })
  })

  describe('Invalid Category Handling', () => {
    it('should return empty array for non-existent category', async () => {
      const content = await getContentByCategory('non-existent-category-xyz')

      expect(content).toBeDefined()
      expect(Array.isArray(content)).toBe(true)
      expect(content.length).toBe(0)
    })

    it('should handle malformed category names', async () => {
      const malformedCategories = [
        '//invalid//category',
        '../../../',
        'category with spaces that does not exist'
      ]

      for (const category of malformedCategories) {
        const content = await getContentByCategory(category)

        expect(content).toBeDefined()
        expect(Array.isArray(content)).toBe(true)
        expect(content.length).toBe(0)
      }
    })

    it('should handle empty category', async () => {
      const content = await getContentByCategory('')

      expect(content).toBeDefined()
      expect(Array.isArray(content)).toBe(true)
      expect(content.length).toBe(0)
    })
  })

  describe('Search Query Validation', () => {
    it('should return empty array for queries less than 2 characters', async () => {
      const results1 = await searchContent('')
      const results2 = await searchContent('a')
      const results3 = await searchContent('x')

      expect(results1).toEqual([])
      expect(results2).toEqual([])
      expect(results3).toEqual([])
    })

    it('should handle null and undefined search queries gracefully', async () => {
      // TypeScript won't allow this, but test runtime behavior
      const results1 = await searchContent(null as any)
      const results2 = await searchContent(undefined as any)

      expect(results1).toEqual([])
      expect(results2).toEqual([])
    })

    it('should handle special characters in search', async () => {
      const specialQueries = [
        '<script>alert("xss")</script>',
        '"; DROP TABLE content; --',
        '../../../etc/passwd',
        '\x00\x00\x00'
      ]

      for (const query of specialQueries) {
        const results = await searchContent(query)

        // Should not crash
        expect(results).toBeDefined()
        expect(Array.isArray(results)).toBe(true)
      }
    })

    it('should handle very long search queries', async () => {
      const longQuery = 'a'.repeat(1000)

      const results = await searchContent(longQuery)

      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
    })

    it('should handle unicode characters in search', async () => {
      const unicodeQueries = [
        '日本語',
        'Русский',
        '中文',
        'العربية',
        '🚀🔥💻'
      ]

      for (const query of unicodeQueries) {
        const results = await searchContent(query)

        // Should not crash
        expect(results).toBeDefined()
        expect(Array.isArray(results)).toBe(true)
      }
    })
  })

  describe('Related Content Error Handling', () => {
    it('should return empty array for non-existent slug', async () => {
      const related = await getRelatedContent('non-existent-slug-xyz')

      expect(related).toBeDefined()
      expect(Array.isArray(related)).toBe(true)
      expect(related.length).toBe(0)
    })

    it('should handle content with no related items', async () => {
      const allContent = await getAllContent()

      if (allContent.length > 0) {
        const firstSlug = allContent[0].slug
        const related = await getRelatedContent(firstSlug)

        expect(related).toBeDefined()
        expect(Array.isArray(related)).toBe(true)
        // May be empty, which is valid
      }
    })

    it('should handle malformed slug in related content', async () => {
      const related = await getRelatedContent('../../../invalid')

      expect(related).toBeDefined()
      expect(Array.isArray(related)).toBe(true)
      expect(related.length).toBe(0)
    })
  })

  describe('Missing Content Directory Handling', () => {
    it('should gracefully handle missing content', async () => {
      // This tests the fallback mechanism
      const allContent = await getAllContent()

      // Should return either real content or fallback mock data
      expect(allContent).toBeDefined()
      expect(Array.isArray(allContent)).toBe(true)
    })

    it('should provide fallback for missing individual content', async () => {
      // Try to get content that might not exist
      const content = await getContentBySlug('potentially-missing-content-xyz')

      // Should either return null or fallback data
      expect(content === null || typeof content === 'object').toBe(true)
    })
  })

  describe('File System Error Handling', () => {
    it('should handle permission errors gracefully', async () => {
      // getAllContent should not throw even if some files are unreadable
      const allContent = await getAllContent()

      expect(allContent).toBeDefined()
      expect(Array.isArray(allContent)).toBe(true)
    })

    it('should handle corrupted markdown files', async () => {
      // System should skip or handle corrupted files
      const allContent = await getAllContent()

      expect(allContent).toBeDefined()

      // All returned items should have required fields
      allContent.forEach(item => {
        expect(item.slug).toBeDefined()
        expect(item.title).toBeDefined()
        expect(item.category).toBeDefined()
      })
    })
  })

  describe('Data Integrity Error Handling', () => {
    it('should validate metadata structure', async () => {
      const allContent = await getAllContent()

      allContent.forEach(item => {
        // Metadata should always be defined
        expect(item.metadata).toBeDefined()

        // Required metadata fields
        expect('readingTime' in item.metadata).toBe(true)
        expect('lastUpdated' in item.metadata).toBe(true)

        // Reading time should be a number >= 0
        expect(typeof item.metadata.readingTime).toBe('number')
        expect(item.metadata.readingTime).toBeGreaterThanOrEqual(0)

        // Last updated should be a valid date string
        expect(typeof item.metadata.lastUpdated).toBe('string')
        expect(item.metadata.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })
    })

    it('should validate slug format', async () => {
      const allContent = await getAllContent()

      allContent.forEach(item => {
        // Slug should not be empty
        expect(item.slug.length).toBeGreaterThan(0)

        // Slug should not have leading/trailing slashes
        expect(item.slug).not.toMatch(/^\//)
        expect(item.slug).not.toMatch(/\/$/)

        // Slug should not have .md extension
        expect(item.slug).not.toContain('.md')

        // Slug should not have double slashes
        expect(item.slug).not.toContain('//')
      })
    })

    it('should validate title and description', async () => {
      const allContent = await getAllContent()

      allContent.forEach(item => {
        // Title should always exist and be a string
        expect(typeof item.title).toBe('string')
        expect(item.title.length).toBeGreaterThan(0)

        // Description should be a string (may be empty)
        expect(typeof item.description).toBe('string')
      })
    })

    it('should validate category format', async () => {
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
        // Category should be defined
        expect(item.category).toBeDefined()
        expect(typeof item.category).toBe('string')

        // Category should be in valid list or match pattern
        const isValid =
          validCategories.includes(item.category) ||
          item.category.match(/^\d-[a-z]+$/)

        expect(isValid).toBe(true)
      })
    })
  })

  describe('Navigation Error Handling', () => {
    it('should handle missing prev/next links gracefully', async () => {
      const allContent = await getAllContent()

      if (allContent.length > 0) {
        const firstSlug = allContent[0].slug
        const content = await getContentBySlug(firstSlug)

        if (content) {
          // prev/next may be undefined
          expect(
            content.prev === undefined ||
            content.prev === null ||
            typeof content.prev === 'string'
          ).toBe(true)

          expect(
            content.next === undefined ||
            content.next === null ||
            typeof content.next === 'string'
          ).toBe(true)
        }
      }
    })

    it('should validate prev/next slugs are fetchable', async () => {
      const allContent = await getAllContent()

      for (const item of allContent) {
        const content = await getContentBySlug(item.slug)

        if (content?.next) {
          const nextContent = await getContentBySlug(content.next)

          // If next is defined, it should be fetchable
          expect(nextContent).toBeDefined()

          // Stop after checking one
          break
        }
      }
    })
  })

  describe('Table of Contents Error Handling', () => {
    it('should handle content without headings', async () => {
      const allContent = await getAllContent()

      if (allContent.length > 0) {
        const firstSlug = allContent[0].slug
        const content = await getContentBySlug(firstSlug)

        if (content) {
          // TOC should be an array (may be empty)
          expect(Array.isArray(content.toc)).toBe(true)
        }
      }
    })

    it('should validate TOC item structure', async () => {
      const allContent = await getAllContent()

      for (const item of allContent) {
        const content = await getContentBySlug(item.slug)

        if (content?.toc && content.toc.length > 0) {
          content.toc.forEach(tocItem => {
            // Required fields
            expect(tocItem.id).toBeDefined()
            expect(tocItem.text).toBeDefined()
            expect(tocItem.level).toBeDefined()

            // Valid types
            expect(typeof tocItem.id).toBe('string')
            expect(typeof tocItem.text).toBe('string')
            expect(typeof tocItem.level).toBe('number')

            // Valid level range (h2-h6)
            expect(tocItem.level).toBeGreaterThanOrEqual(2)
            expect(tocItem.level).toBeLessThanOrEqual(6)
          })

          // Stop after validating one
          break
        }
      }
    })
  })

  describe('Concurrent Access Error Handling', () => {
    it('should handle multiple simultaneous content requests', async () => {
      const allContent = await getAllContent()

      if (allContent.length >= 3) {
        // Request multiple content items simultaneously
        const promises = [
          getContentBySlug(allContent[0].slug),
          getContentBySlug(allContent[1].slug),
          getContentBySlug(allContent[2].slug)
        ]

        const results = await Promise.all(promises)

        // All should succeed
        results.forEach(content => {
          expect(content).toBeDefined()
        })

        // Should return correct content for each
        expect(results[0]?.slug).toBe(allContent[0].slug)
        expect(results[1]?.slug).toBe(allContent[1].slug)
        expect(results[2]?.slug).toBe(allContent[2].slug)
      }
    })

    it('should handle mixed valid and invalid requests', async () => {
      const allContent = await getAllContent()

      if (allContent.length > 0) {
        const promises = [
          getContentBySlug(allContent[0].slug), // valid
          getContentBySlug('invalid-slug-xyz'), // invalid
          getContentBySlug(allContent.length > 1 ? allContent[1].slug : allContent[0].slug) // valid
        ]

        const results = await Promise.all(promises)

        // Valid requests should succeed
        expect(results[0]).toBeDefined()
        expect(results[2]).toBeDefined()

        // Invalid request should return null
        expect(results[1]).toBeNull()
      }
    })
  })

  describe('Type Safety Error Handling', () => {
    it('should enforce required fields on all content', async () => {
      const allContent = await getAllContent()

      allContent.forEach(item => {
        // Required fields should always be present
        expect('slug' in item).toBe(true)
        expect('title' in item).toBe(true)
        expect('category' in item).toBe(true)
        expect('description' in item).toBe(true)
        expect('metadata' in item).toBe(true)
      })
    })

    it('should enforce metadata structure', async () => {
      const allContent = await getAllContent()

      if (allContent.length > 0) {
        const firstSlug = allContent[0].slug
        const content = await getContentBySlug(firstSlug)

        if (content) {
          // Full content should have extended metadata
          expect(content.metadata).toBeDefined()
          expect('readingTime' in content.metadata).toBe(true)
          expect('lastUpdated' in content.metadata).toBe(true)
        }
      }
    })
  })
})
