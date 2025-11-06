import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/content/route'

// Mock the content API
vi.mock('@/lib/api/content', () => ({
  getAllContent: vi.fn(),
  getContentByCategory: vi.fn(),
}))

describe('Content API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/content', () => {
    it('should return all content when no category is specified', async () => {
      const { getAllContent } = await import('@/lib/api/content')
      const mockContent = [
        {
          slug: 'test-1',
          title: 'Test 1',
          description: 'Description 1',
          category: 'fundamentals',
          readingTime: '5 min read',
          order: 1,
        },
        {
          slug: 'test-2',
          title: 'Test 2',
          description: 'Description 2',
          category: 'fundamentals',
          readingTime: '10 min read',
          order: 2,
        },
      ]

      vi.mocked(getAllContent).mockResolvedValue(mockContent)

      const request = new NextRequest('http://localhost:3000/api/content')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockContent)
      expect(data.meta.total).toBe(2)
      expect(data.meta.timestamp).toBeDefined()
      expect(getAllContent).toHaveBeenCalledTimes(1)
    })

    it('should return filtered content when category is specified', async () => {
      const { getContentByCategory } = await import('@/lib/api/content')
      const mockContent = [
        {
          slug: 'test-1',
          title: 'Test 1',
          description: 'Description 1',
          category: 'advanced',
          readingTime: '5 min read',
          order: 1,
        },
      ]

      vi.mocked(getContentByCategory).mockResolvedValue(mockContent)

      const request = new NextRequest(
        'http://localhost:3000/api/content?category=advanced'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockContent)
      expect(data.meta.total).toBe(1)
      expect(getContentByCategory).toHaveBeenCalledWith('advanced')
    })

    it('should handle errors gracefully', async () => {
      const { getAllContent } = await import('@/lib/api/content')
      vi.mocked(getAllContent).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/content')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database error')
    })

    it('should handle non-Error exceptions', async () => {
      const { getAllContent } = await import('@/lib/api/content')
      vi.mocked(getAllContent).mockRejectedValue('Unknown error')

      const request = new NextRequest('http://localhost:3000/api/content')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch content')
    })
  })
})
