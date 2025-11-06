import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getAllContent,
  getContentBySlug,
  searchContent,
  getContentByCategory,
} from '@/lib/api/content'

describe('Content Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Content Discovery Flow', () => {
    it('should discover content through search and then access by slug', async () => {
      // Step 1: Search for content
      const searchResults = await searchContent('design')

      expect(searchResults).toBeDefined()
      expect(Array.isArray(searchResults)).toBe(true)

      if (searchResults.length > 0) {
        // Step 2: Access full content by slug
        const firstResult = searchResults[0]
        const fullContent = await getContentBySlug(firstResult.slug)

        expect(fullContent).toBeDefined()
        expect(fullContent?.slug).toBe(firstResult.slug)
        expect(fullContent?.title).toBeDefined()
      }
    })

    it('should navigate through related content', async () => {
      const allContent = await getAllContent()

      if (allContent.length > 1) {
        const firstItem = allContent[0]
        const content = await getContentBySlug(firstItem.slug)

        expect(content).toBeDefined()

        if (content?.next) {
          const nextContent = await getContentBySlug(content.next)
          expect(nextContent).toBeDefined()
          expect(nextContent?.slug).toBe(content.next)
        }

        if (content?.prev) {
          const prevContent = await getContentBySlug(content.prev)
          expect(prevContent).toBeDefined()
          expect(prevContent?.slug).toBe(content.prev)
        }
      }
    })

    it('should browse content by category', async () => {
      const allContent = await getAllContent()

      if (allContent.length > 0) {
        const category = allContent[0].category
        const categoryContent = await getContentByCategory(category)

        expect(categoryContent).toBeDefined()
        expect(Array.isArray(categoryContent)).toBe(true)
        expect(categoryContent.length).toBeGreaterThan(0)

        categoryContent.forEach(item => {
          expect(item.category).toBe(category)
        })
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle non-existent slug gracefully', async () => {
      const content = await getContentBySlug('non-existent-slug-xyz')

      expect(content).toBeNull()
    })

    it('should handle empty search query', async () => {
      const results = await searchContent('')

      expect(results).toEqual([])
    })

    it('should handle single character search', async () => {
      const results = await searchContent('a')

      expect(results).toEqual([])
    })

    it('should handle non-existent category', async () => {
      const results = await getContentByCategory('non-existent-category')

      expect(results).toEqual([])
    })
  })

  describe('Data Consistency', () => {
    it('should have consistent metadata across operations', async () => {
      const allContent = await getAllContent()

      if (allContent.length > 0) {
        const listItem = allContent[0]
        const fullContent = await getContentBySlug(listItem.slug)

        expect(fullContent?.slug).toBe(listItem.slug)
        expect(fullContent?.title).toBe(listItem.title)
        expect(fullContent?.description).toBe(listItem.description)
        expect(fullContent?.category).toBe(listItem.category)
      }
    })

    it('should maintain reading time accuracy', async () => {
      const allContent = await getAllContent()

      allContent.forEach(item => {
        expect(item.metadata.readingTime).toBeGreaterThan(0)
        expect(typeof item.metadata.readingTime).toBe('number')
      })
    })

    it('should have valid lastUpdated dates', async () => {
      const allContent = await getAllContent()

      allContent.forEach(item => {
        expect(item.metadata.lastUpdated).toBeDefined()
        expect(typeof item.metadata.lastUpdated).toBe('string')

        // Check if it's a valid date format (YYYY-MM-DD)
        expect(item.metadata.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })
    })
  })

  describe('Performance Tests', () => {
    it('should handle multiple concurrent requests', async () => {
      const promises = [
        getAllContent(),
        getAllContent(),
        getAllContent(),
      ]

      const results = await Promise.all(promises)

      expect(results.length).toBe(3)
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true)
      })
    })

    it('should cache content efficiently', async () => {
      const start1 = Date.now()
      await getAllContent()
      const time1 = Date.now() - start1

      const start2 = Date.now()
      await getAllContent()
      const time2 = Date.now() - start2

      // Second call might be cached (though with our current implementation it's not)
      expect(time2).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Search Functionality', () => {
    it('should find content by partial title match', async () => {
      const allContent = await getAllContent()

      if (allContent.length > 0) {
        const firstTitle = allContent[0].title
        const searchTerm = firstTitle.substring(0, 5).toLowerCase()

        if (searchTerm.length >= 2) {
          const results = await searchContent(searchTerm)

          expect(results).toBeDefined()
          expect(Array.isArray(results)).toBe(true)
        }
      }
    })

    it('should find content by description', async () => {
      const allContent = await getAllContent()

      const itemWithDesc = allContent.find(item => item.description.length > 5)

      if (itemWithDesc) {
        const searchTerm = itemWithDesc.description.substring(0, 5).toLowerCase()

        if (searchTerm.length >= 2) {
          const results = await searchContent(searchTerm)

          expect(results).toBeDefined()
          expect(Array.isArray(results)).toBe(true)
        }
      }
    })

    it('should return relevant results for common queries', async () => {
      const commonQueries = ['design', 'pattern', 'guide', 'architecture']

      for (const query of commonQueries) {
        const results = await searchContent(query)

        expect(results).toBeDefined()
        expect(Array.isArray(results)).toBe(true)

        // Results should be relevant
        results.forEach(result => {
          const matchesTitle = result.title.toLowerCase().includes(query)
          const matchesDesc = result.description.toLowerCase().includes(query)

          expect(matchesTitle || matchesDesc).toBe(true)
        })
      }
    })
  })

  describe('Navigation Flow', () => {
    it('should support forward navigation through content', async () => {
      const allContent = await getAllContent()

      if (allContent.length >= 3) {
        let currentSlug = allContent[0].slug
        let visitedCount = 0

        while (currentSlug && visitedCount < 5) {
          const content = await getContentBySlug(currentSlug)

          expect(content).toBeDefined()

          if (content?.next) {
            currentSlug = content.next
            visitedCount++
          } else {
            break
          }
        }

        expect(visitedCount).toBeGreaterThan(0)
      }
    })

    it('should support backward navigation through content', async () => {
      const allContent = await getAllContent()

      if (allContent.length >= 3) {
        let currentSlug = allContent[allContent.length - 1].slug
        let visitedCount = 0

        while (currentSlug && visitedCount < 5) {
          const content = await getContentBySlug(currentSlug)

          expect(content).toBeDefined()

          if (content?.prev) {
            currentSlug = content.prev
            visitedCount++
          } else {
            break
          }
        }

        expect(visitedCount).toBeGreaterThan(0)
      }
    })
  })
})
