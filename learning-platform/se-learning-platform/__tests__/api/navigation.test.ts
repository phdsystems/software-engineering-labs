import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/navigation/route'

// Mock the content API
vi.mock('@/lib/api/content', () => ({
  getNavigation: vi.fn(),
}))

describe('Navigation API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/navigation', () => {
    it('should return navigation structure', async () => {
      const { getNavigation } = await import('@/lib/api/content')
      const mockNavigation = [
        {
          category: 'fundamentals',
          title: 'Fundamentals',
          items: [
            {
              slug: 'intro',
              title: 'Introduction',
              order: 1,
            },
            {
              slug: 'basics',
              title: 'Basics',
              order: 2,
            },
          ],
        },
        {
          category: 'advanced',
          title: 'Advanced Topics',
          items: [
            {
              slug: 'patterns',
              title: 'Design Patterns',
              order: 1,
            },
          ],
        },
      ]

      vi.mocked(getNavigation).mockResolvedValue(mockNavigation)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockNavigation)
      expect(data.meta.total).toBe(2)
      expect(data.meta.timestamp).toBeDefined()
      expect(getNavigation).toHaveBeenCalledTimes(1)
    })

    it('should return empty navigation when no content exists', async () => {
      const { getNavigation } = await import('@/lib/api/content')
      vi.mocked(getNavigation).mockResolvedValue([])

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
      expect(data.meta.total).toBe(0)
    })

    it('should handle errors gracefully', async () => {
      const { getNavigation } = await import('@/lib/api/content')
      vi.mocked(getNavigation).mockRejectedValue(new Error('File system error'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('File system error')
    })

    it('should handle non-Error exceptions', async () => {
      const { getNavigation } = await import('@/lib/api/content')
      vi.mocked(getNavigation).mockRejectedValue('Unknown error')

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch navigation')
    })
  })
})
