import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/search/route'

// Mock the content API
vi.mock('@/lib/api/content', () => ({
  searchContent: vi.fn(),
}))

describe('Search API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/search', () => {
    it('should return search results when query is provided', async () => {
      const { searchContent } = await import('@/lib/api/content')
      const mockResults = [
        {
          slug: 'react-hooks',
          title: 'React Hooks',
          description: 'Learn about React Hooks',
          category: 'fundamentals',
          readingTime: '10 min read',
          order: 1,
        },
        {
          slug: 'react-components',
          title: 'React Components',
          description: 'Understanding React Components',
          category: 'fundamentals',
          readingTime: '15 min read',
          order: 2,
        },
      ]

      vi.mocked(searchContent).mockResolvedValue(mockResults)

      const request = new NextRequest(
        'http://localhost:3000/api/search?q=react'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockResults)
      expect(data.meta.query).toBe('react')
      expect(data.meta.total).toBe(2)
      expect(data.meta.timestamp).toBeDefined()
      expect(searchContent).toHaveBeenCalledWith('react')
    })

    it('should return 400 when query parameter is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/search')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Query parameter "q" is required')
    })

    it('should return empty results when no matches found', async () => {
      const { searchContent } = await import('@/lib/api/content')
      vi.mocked(searchContent).mockResolvedValue([])

      const request = new NextRequest(
        'http://localhost:3000/api/search?q=nonexistent'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
      expect(data.meta.total).toBe(0)
    })

    it('should handle errors gracefully', async () => {
      const { searchContent } = await import('@/lib/api/content')
      vi.mocked(searchContent).mockRejectedValue(new Error('Search engine error'))

      const request = new NextRequest(
        'http://localhost:3000/api/search?q=test'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Search engine error')
    })

    it('should handle non-Error exceptions', async () => {
      const { searchContent } = await import('@/lib/api/content')
      vi.mocked(searchContent).mockRejectedValue('Unknown error')

      const request = new NextRequest(
        'http://localhost:3000/api/search?q=test'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Search failed')
    })
  })
})
