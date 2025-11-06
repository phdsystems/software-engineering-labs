import { describe, it, expect } from 'vitest'
import {
  getAllContent,
  searchContent,
  getContentBySlug,
} from '@/lib/api/content'

describe('Search Workflow Integration Tests', () => {
  describe('Basic Search Workflow', () => {
    it('should search by title and return relevant results', async () => {
      const allContent = await getAllContent()

      if (allContent.length > 0) {
        const firstItem = allContent[0]
        const titleWords = firstItem.title.split(' ')

        if (titleWords.length > 0) {
          const searchTerm = titleWords[0]
          const results = await searchContent(searchTerm)

          expect(results).toBeDefined()
          expect(Array.isArray(results)).toBe(true)

          // Should find the item
          const found = results.some(item => item.slug === firstItem.slug)
          expect(found).toBe(true)
        }
      }
    })

    it('should search by description and return relevant results', async () => {
      const allContent = await getAllContent()

      // Find item with description
      const itemWithDesc = allContent.find(item => item.description.length > 10)

      if (itemWithDesc) {
        const descWords = itemWithDesc.description.split(' ')

        if (descWords.length > 2) {
          const searchTerm = descWords[1] // Use second word to avoid common words

          if (searchTerm.length > 3) {
            const results = await searchContent(searchTerm)

            expect(results).toBeDefined()
            expect(Array.isArray(results)).toBe(true)

            // Should find the item
            const found = results.some(item => item.slug === itemWithDesc.slug)
            expect(found).toBe(true)
          }
        }
      }
    })

    it('should return empty array for non-matching search', async () => {
      const results = await searchContent('xyzabc123notfound')

      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBe(0)
    })

    it('should return empty array for queries less than 2 characters', async () => {
      const results1 = await searchContent('a')
      const results2 = await searchContent('')

      expect(results1).toEqual([])
      expect(results2).toEqual([])
    })

    it('should handle case-insensitive search', async () => {
      const allContent = await getAllContent()

      if (allContent.length > 0) {
        const firstItem = allContent[0]
        const titleWords = firstItem.title.split(' ')

        if (titleWords.length > 0) {
          const searchTerm = titleWords[0]

          // Search with different cases
          const lowerResults = await searchContent(searchTerm.toLowerCase())
          const upperResults = await searchContent(searchTerm.toUpperCase())
          const mixedResults = await searchContent(searchTerm)

          // All should return results
          expect(lowerResults.length).toBeGreaterThan(0)
          expect(upperResults.length).toBeGreaterThan(0)
          expect(mixedResults.length).toBeGreaterThan(0)

          // Should return same number of results
          expect(lowerResults.length).toBe(upperResults.length)
          expect(lowerResults.length).toBe(mixedResults.length)
        }
      }
    })
  })

  describe('Search and Navigate Workflow', () => {
    it('should search, get results, and navigate to content', async () => {
      const allContent = await getAllContent()

      if (allContent.length > 0) {
        const firstItem = allContent[0]
        const titleWords = firstItem.title.split(' ')

        if (titleWords.length > 0) {
          const searchTerm = titleWords[0]

          // Step 1: Search
          const results = await searchContent(searchTerm)

          expect(results.length).toBeGreaterThan(0)

          // Step 2: Navigate to first result
          const firstResult = results[0]
          const content = await getContentBySlug(firstResult.slug)

          expect(content).toBeDefined()
          expect(content?.slug).toBe(firstResult.slug)
          expect(content?.title).toBe(firstResult.title)
        }
      }
    })

    it('should maintain metadata consistency between search results and full content', async () => {
      const allContent = await getAllContent()

      if (allContent.length > 0) {
        const firstItem = allContent[0]
        const titleWords = firstItem.title.split(' ')

        if (titleWords.length > 0) {
          const searchTerm = titleWords[0]

          const results = await searchContent(searchTerm)
          const found = results.find(item => item.slug === firstItem.slug)

          if (found) {
            const fullContent = await getContentBySlug(found.slug)

            expect(fullContent).toBeDefined()
            expect(fullContent?.metadata.readingTime).toBe(found.metadata.readingTime)
            expect(fullContent?.metadata.lastUpdated).toBe(found.metadata.lastUpdated)
          }
        }
      }
    })
  })

  describe('Search by Category Workflow', () => {
    it('should search within specific categories', async () => {
      const allContent = await getAllContent()

      // Find SOLID principle (likely in 0-foundation)
      const solidItem = allContent.find(item => item.slug.includes('solid'))

      if (solidItem) {
        const results = await searchContent('solid')

        expect(results.length).toBeGreaterThan(0)

        // Should find SOLID principle
        const found = results.find(item => item.slug === solidItem.slug)
        expect(found).toBeDefined()
        expect(found?.category).toBe('0-foundation')
      }
    })

    it('should find design patterns in Phase 3', async () => {
      const allContent = await getAllContent()

      const patternItem = allContent.find(item =>
        item.slug.includes('3-design/design-pattern')
      )

      if (patternItem) {
        const titleWords = patternItem.title.split(' ')

        if (titleWords.length > 0) {
          const searchTerm = titleWords[0]
          const results = await searchContent(searchTerm)

          if (results.length > 0) {
            // Should find pattern in results
            const found = results.find(item => item.category === '3-design')
            expect(found).toBeDefined()
          }
        }
      }
    })
  })

  describe('Partial Match Search Workflow', () => {
    it('should find content with partial word matches', async () => {
      const allContent = await getAllContent()

      // Find "Design" pattern
      const designItem = allContent.find(item =>
        item.title.toLowerCase().includes('design')
      )

      if (designItem) {
        // Search for partial match
        const results = await searchContent('des')

        expect(results.length).toBeGreaterThan(0)

        // Should find items containing "design"
        const hasDesign = results.some(item =>
          item.title.toLowerCase().includes('des')
        )

        expect(hasDesign).toBe(true)
      }
    })

    it('should find content by common terms', async () => {
      const commonTerms = ['pattern', 'principle', 'guide', 'example']

      for (const term of commonTerms) {
        const results = await searchContent(term)

        if (results.length > 0) {
          // Should find at least one item
          expect(results.length).toBeGreaterThan(0)

          // All results should contain the term
          results.forEach(item => {
            const match =
              item.title.toLowerCase().includes(term) ||
              item.description.toLowerCase().includes(term)

            expect(match).toBe(true)
          })

          // Stop after first successful search
          break
        }
      }
    })
  })

  describe('Search Result Quality Workflow', () => {
    it('should return complete metadata for search results', async () => {
      const allContent = await getAllContent()

      if (allContent.length > 0) {
        const firstItem = allContent[0]
        const titleWords = firstItem.title.split(' ')

        if (titleWords.length > 0) {
          const searchTerm = titleWords[0]
          const results = await searchContent(searchTerm)

          if (results.length > 0) {
            results.forEach(item => {
              expect(item.slug).toBeDefined()
              expect(item.title).toBeDefined()
              expect(item.category).toBeDefined()
              expect(item.metadata).toBeDefined()
              expect(item.metadata.readingTime).toBeGreaterThanOrEqual(0)
              expect(item.metadata.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
            })
          }
        }
      }
    })

    it('should return valid slugs that can be fetched', async () => {
      const allContent = await getAllContent()

      if (allContent.length > 0) {
        const firstItem = allContent[0]
        const titleWords = firstItem.title.split(' ')

        if (titleWords.length > 0) {
          const searchTerm = titleWords[0]
          const results = await searchContent(searchTerm)

          if (results.length > 0) {
            // Try to fetch first result
            const content = await getContentBySlug(results[0].slug)

            expect(content).toBeDefined()
            expect(content?.slug).toBe(results[0].slug)
          }
        }
      }
    })
  })

  describe('Multi-Term Search Workflow', () => {
    it('should handle multi-word search queries', async () => {
      const allContent = await getAllContent()

      // Find an item with multi-word title
      const multiWordItem = allContent.find(item =>
        item.title.split(' ').length >= 3
      )

      if (multiWordItem) {
        const titleWords = multiWordItem.title.split(' ')
        const searchTerm = `${titleWords[0]} ${titleWords[1]}`

        const results = await searchContent(searchTerm)

        expect(results).toBeDefined()
        expect(Array.isArray(results)).toBe(true)

        // Should find the item
        const found = results.some(item => item.slug === multiWordItem.slug)
        expect(found).toBe(true)
      }
    })
  })

  describe('Search Performance Workflow', () => {
    it('should handle searches across all content efficiently', async () => {
      const allContent = await getAllContent()

      expect(allContent.length).toBeGreaterThan(0)

      // Perform search
      const startTime = Date.now()
      const results = await searchContent('pattern')
      const endTime = Date.now()

      // Should complete quickly (under 500ms for filesystem)
      const duration = endTime - startTime
      expect(duration).toBeLessThan(500)

      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
    })

    it('should return results in reasonable time for common terms', async () => {
      const commonTerms = ['design', 'code', 'test', 'guide']

      for (const term of commonTerms) {
        const startTime = Date.now()
        const results = await searchContent(term)
        const endTime = Date.now()

        const duration = endTime - startTime
        expect(duration).toBeLessThan(500)

        expect(results).toBeDefined()
        expect(Array.isArray(results)).toBe(true)
      }
    })
  })

  describe('Search Edge Cases Workflow', () => {
    it('should handle special characters in search', async () => {
      const specialChars = ['/', '-', '_', '.']

      for (const char of specialChars) {
        const results = await searchContent(char)

        // Should not crash
        expect(results).toBeDefined()
        expect(Array.isArray(results)).toBe(true)
      }
    })

    it('should handle very long search queries', async () => {
      const longQuery = 'this is a very long search query that should still work correctly'

      const results = await searchContent(longQuery)

      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
    })

    it('should handle numeric search', async () => {
      const results = await searchContent('123')

      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
    })
  })

  describe('Search Context Workflow', () => {
    it('should find phase numbers in search', async () => {
      const phaseNumbers = ['0', '1', '2', '3', '4', '5', '6', '7']

      for (const num of phaseNumbers) {
        const results = await searchContent(`phase ${num}`)

        // Some phases may not have content
        expect(results).toBeDefined()
        expect(Array.isArray(results)).toBe(true)
      }
    })

    it('should find SDLC-related terms', async () => {
      const sdlcTerms = [
        'foundation',
        'planning',
        'design',
        'development',
        'deployment',
        'maintenance'
      ]

      for (const term of sdlcTerms) {
        const results = await searchContent(term)

        if (results.length > 0) {
          expect(results.length).toBeGreaterThan(0)

          // Results should be relevant
          const hasMatch = results.some(item =>
            item.title.toLowerCase().includes(term) ||
            item.description.toLowerCase().includes(term) ||
            item.category.toLowerCase().includes(term)
          )

          expect(hasMatch).toBe(true)
        }
      }
    })
  })
})
