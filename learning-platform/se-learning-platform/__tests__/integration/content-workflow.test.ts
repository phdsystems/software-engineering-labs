import { describe, it, expect } from 'vitest'
import {
  getAllContent,
  getContentBySlug,
  getContentByCategory,
  getRelatedContent,
} from '@/lib/api/content'

describe('Content Workflow Integration Tests', () => {
  describe('Full Content Retrieval Workflow', () => {
    it('should retrieve all content, filter by category, and get individual items', async () => {
      // Step 1: Get all content
      const allContent = await getAllContent()

      expect(allContent).toBeDefined()
      expect(Array.isArray(allContent)).toBe(true)
      expect(allContent.length).toBeGreaterThan(0)

      // Step 2: Filter by category
      if (allContent.length > 0) {
        const firstItem = allContent[0]
        const categoryContent = await getContentByCategory(firstItem.category)

        expect(categoryContent).toBeDefined()
        expect(Array.isArray(categoryContent)).toBe(true)
        expect(categoryContent.length).toBeGreaterThan(0)

        // All items should belong to the same category
        categoryContent.forEach(item => {
          expect(item.category).toBe(firstItem.category)
        })

        // Step 3: Get individual content
        const content = await getContentBySlug(firstItem.slug)

        expect(content).toBeDefined()
        expect(content?.slug).toBe(firstItem.slug)
        expect(content?.category).toBe(firstItem.category)
        expect(content?.title).toBeDefined()
        expect(content?.content).toBeDefined()
      }
    })

    it('should navigate from list to detail and back', async () => {
      const allContent = await getAllContent()

      if (allContent.length > 1) {
        const firstSlug = allContent[0].slug
        const secondSlug = allContent[1].slug

        // Navigate to first content
        const firstContent = await getContentBySlug(firstSlug)

        expect(firstContent).toBeDefined()
        expect(firstContent?.slug).toBe(firstSlug)

        // Navigate to second content
        const secondContent = await getContentBySlug(secondSlug)

        expect(secondContent).toBeDefined()
        expect(secondContent?.slug).toBe(secondSlug)

        // Both should have complete metadata
        expect(firstContent?.metadata).toBeDefined()
        expect(secondContent?.metadata).toBeDefined()
      }
    })

    it('should handle prev/next navigation correctly', async () => {
      const allContent = await getAllContent()

      if (allContent.length > 2) {
        // Get a middle item (not first or last)
        const middleIndex = Math.floor(allContent.length / 2)
        const middleSlug = allContent[middleIndex].slug

        const content = await getContentBySlug(middleSlug)

        if (content) {
          expect(content.prev).toBeDefined()
          expect(content.next).toBeDefined()

          // Verify prev points to previous item
          if (content.prev) {
            const prevContent = await getContentBySlug(content.prev)
            expect(prevContent).toBeDefined()
            expect(prevContent?.slug).toBe(content.prev)
          }

          // Verify next points to next item
          if (content.next) {
            const nextContent = await getContentBySlug(content.next)
            expect(nextContent).toBeDefined()
            expect(nextContent?.slug).toBe(content.next)
          }
        }
      }
    })
  })

  describe('Category Traversal Workflow', () => {
    it('should retrieve all items in a category and navigate between them', async () => {
      const categories = ['0-foundation', '3-design', '4-development']

      for (const category of categories) {
        const categoryContent = await getContentByCategory(category)

        if (categoryContent.length > 1) {
          // Get first and second items
          const firstSlug = categoryContent[0].slug
          const secondSlug = categoryContent[1].slug

          const firstContent = await getContentBySlug(firstSlug)
          const secondContent = await getContentBySlug(secondSlug)

          expect(firstContent).toBeDefined()
          expect(secondContent).toBeDefined()

          // Both should belong to same category
          expect(firstContent?.category).toBe(category)
          expect(secondContent?.category).toBe(category)
        }
      }
    })

    it('should maintain consistent metadata across category items', async () => {
      const allContent = await getAllContent()

      if (allContent.length > 0) {
        const firstItem = allContent[0]
        const categoryContent = await getContentByCategory(firstItem.category)

        categoryContent.forEach(item => {
          expect(item.metadata).toBeDefined()
          expect(item.metadata.readingTime).toBeGreaterThanOrEqual(0)
          expect(item.metadata.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
          expect(typeof item.title).toBe('string')
          expect(typeof item.slug).toBe('string')
        })
      }
    })
  })

  describe('Related Content Workflow', () => {
    it('should retrieve related content when available', async () => {
      const allContent = await getAllContent()

      for (const item of allContent) {
        const content = await getContentBySlug(item.slug)

        if (content && content.related && content.related.length > 0) {
          const relatedContent = await getRelatedContent(item.slug)

          expect(relatedContent).toBeDefined()
          expect(Array.isArray(relatedContent)).toBe(true)

          // Related slugs should match
          const relatedSlugs = relatedContent.map(r => r.slug)
          content.related.forEach(relatedSlug => {
            expect(relatedSlugs).toContain(relatedSlug)
          })

          // Stop after finding one with related content
          break
        }
      }
    })

    it('should handle items without related content gracefully', async () => {
      const allContent = await getAllContent()

      if (allContent.length > 0) {
        const firstSlug = allContent[0].slug
        const relatedContent = await getRelatedContent(firstSlug)

        expect(relatedContent).toBeDefined()
        expect(Array.isArray(relatedContent)).toBe(true)
        // May be empty, but should be an array
      }
    })
  })

  describe('Table of Contents Workflow', () => {
    it('should generate TOC for content with headings', async () => {
      const allContent = await getAllContent()

      // Find content likely to have headings
      const guides = allContent.filter(item =>
        item.slug.includes('-guide')
      )

      if (guides.length > 0) {
        for (const guide of guides) {
          const content = await getContentBySlug(guide.slug)

          if (content) {
            expect(content.toc).toBeDefined()
            expect(Array.isArray(content.toc)).toBe(true)

            // If TOC has items, verify structure
            if (content.toc && content.toc.length > 0) {
              content.toc.forEach(item => {
                expect(item.id).toBeDefined()
                expect(item.text).toBeDefined()
                expect(item.level).toBeGreaterThanOrEqual(2)
                expect(item.level).toBeLessThanOrEqual(6)
              })

              // Stop after verifying one
              break
            }
          }
        }
      }
    })
  })

  describe('Reading Time Calculation Workflow', () => {
    it('should calculate reading time for all content', async () => {
      const allContent = await getAllContent()

      allContent.forEach(item => {
        expect(item.metadata.readingTime).toBeDefined()
        expect(typeof item.metadata.readingTime).toBe('number')
        expect(item.metadata.readingTime).toBeGreaterThanOrEqual(0)
      })
    })

    it('should have consistent reading time between list and detail', async () => {
      const allContent = await getAllContent()

      if (allContent.length > 0) {
        const firstItem = allContent[0]
        const content = await getContentBySlug(firstItem.slug)

        if (content) {
          expect(content.metadata.readingTime).toBe(firstItem.metadata.readingTime)
        }
      }
    })
  })

  describe('Multiple Phase Workflow', () => {
    it('should navigate across multiple phases sequentially', async () => {
      const phases = ['0-foundation', '1-planning', '3-design', '4-development']
      const visitedContent: string[] = []

      for (const phase of phases) {
        const categoryContent = await getContentByCategory(phase)

        if (categoryContent.length > 0) {
          const firstSlug = categoryContent[0].slug
          const content = await getContentBySlug(firstSlug)

          expect(content).toBeDefined()
          expect(content?.category).toBe(phase)

          visitedContent.push(firstSlug)
        }
      }

      // Should have visited at least one phase
      expect(visitedContent.length).toBeGreaterThan(0)
    })

    it('should support jumping between unrelated phases', async () => {
      const foundation = await getContentByCategory('0-foundation')
      const deployment = await getContentByCategory('6-deployment')

      if (foundation.length > 0 && deployment.length > 0) {
        // Jump from foundation to deployment
        const foundationContent = await getContentBySlug(foundation[0].slug)
        const deploymentContent = await getContentBySlug(deployment[0].slug)

        expect(foundationContent).toBeDefined()
        expect(deploymentContent).toBeDefined()

        expect(foundationContent?.category).toBe('0-foundation')
        expect(deploymentContent?.category).toBe('6-deployment')
      }
    })
  })

  describe('Content Consistency Workflow', () => {
    it('should have consistent data between getAllContent and getContentBySlug', async () => {
      const allContent = await getAllContent()

      if (allContent.length > 0) {
        const firstItem = allContent[0]
        const content = await getContentBySlug(firstItem.slug)

        if (content) {
          expect(content.slug).toBe(firstItem.slug)
          expect(content.category).toBe(firstItem.category)
          expect(content.title).toBe(firstItem.title)
          expect(content.metadata.lastUpdated).toBe(firstItem.metadata.lastUpdated)
        }
      }
    })

    it('should maintain data integrity across multiple retrievals', async () => {
      const allContent = await getAllContent()

      if (allContent.length > 0) {
        const firstSlug = allContent[0].slug

        // Retrieve same content twice
        const content1 = await getContentBySlug(firstSlug)
        const content2 = await getContentBySlug(firstSlug)

        expect(content1).toBeDefined()
        expect(content2).toBeDefined()

        // Should return same data
        expect(content1?.slug).toBe(content2?.slug)
        expect(content1?.title).toBe(content2?.title)
        expect(content1?.content).toBe(content2?.content)
      }
    })
  })

  describe('Edge Case Workflows', () => {
    it('should handle single-item categories', async () => {
      const allContent = await getAllContent()

      // Find categories with single items
      const categoryCount: Record<string, number> = {}

      allContent.forEach(item => {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + 1
      })

      const singleItemCategories = Object.entries(categoryCount)
        .filter(([_, count]) => count === 1)
        .map(([category, _]) => category)

      if (singleItemCategories.length > 0) {
        const category = singleItemCategories[0]
        const categoryContent = await getContentByCategory(category)

        expect(categoryContent.length).toBe(1)

        const content = await getContentBySlug(categoryContent[0].slug)

        expect(content).toBeDefined()
        // Single item might not have prev/next
      }
    })

    it('should handle first and last items navigation', async () => {
      const allContent = await getAllContent()

      if (allContent.length > 1) {
        // First item
        const firstContent = await getContentBySlug(allContent[0].slug)

        expect(firstContent).toBeDefined()
        expect(firstContent?.prev).toBeUndefined()
        expect(firstContent?.next).toBeDefined()

        // Last item
        const lastContent = await getContentBySlug(allContent[allContent.length - 1].slug)

        expect(lastContent).toBeDefined()
        expect(lastContent?.prev).toBeDefined()
        expect(lastContent?.next).toBeUndefined()
      }
    })
  })
})
