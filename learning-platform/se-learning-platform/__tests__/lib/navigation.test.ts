import { describe, it, expect } from 'vitest'
import { getNavigation } from '@/lib/api/content'

describe('Navigation API', () => {
  describe('getNavigation', () => {
    it('should return navigation structure', async () => {
      const result = await getNavigation()

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })

    it('should return navigation groups with required fields', async () => {
      const result = await getNavigation()

      expect(result.length).toBeGreaterThan(0)

      result.forEach(group => {
        expect(group).toHaveProperty('title')
        expect(group).toHaveProperty('items')
        expect(Array.isArray(group.items)).toBe(true)
      })
    })

    it('should have navigation items with required fields', async () => {
      const result = await getNavigation()

      const firstGroup = result[0]
      expect(firstGroup.items.length).toBeGreaterThan(0)

      firstGroup.items.forEach(item => {
        expect(item).toHaveProperty('title')
        expect(item).toHaveProperty('href')
        expect(typeof item.title).toBe('string')
        expect(typeof item.href).toBe('string')
      })
    })

    it('should have valid href paths', async () => {
      const result = await getNavigation()

      result.forEach(group => {
        group.items.forEach(item => {
          expect(item.href).toMatch(/^\//)
        })
      })
    })

    it('should support optional icon field', async () => {
      const result = await getNavigation()

      result.forEach(group => {
        group.items.forEach(item => {
          if (item.icon) {
            expect(typeof item.icon).toBe('string')
          }
        })
      })
    })

    it('should support optional badge field', async () => {
      const result = await getNavigation()

      result.forEach(group => {
        group.items.forEach(item => {
          if (item.badge) {
            expect(typeof item.badge).toBe('string')
          }
        })
      })
    })

    it('should support nested items', async () => {
      const result = await getNavigation()

      result.forEach(group => {
        group.items.forEach(item => {
          if (item.items) {
            expect(Array.isArray(item.items)).toBe(true)
            item.items.forEach(subItem => {
              expect(subItem).toHaveProperty('title')
              expect(subItem).toHaveProperty('href')
            })
          }
        })
      })
    })

    it('should have consistent structure across groups', async () => {
      const result = await getNavigation()

      expect(result.length).toBeGreaterThan(0)

      result.forEach(group => {
        expect(typeof group.title).toBe('string')
        expect(Array.isArray(group.items)).toBe(true)
        expect(group.items.length).toBeGreaterThan(0)
      })
    })
  })
})
