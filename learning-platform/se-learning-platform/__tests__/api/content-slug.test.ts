import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/content/[slug]/route'

// Mock the content API
vi.mock('@/lib/api/content', () => ({
  getContentBySlug: vi.fn(),
}))

describe('Content by Slug API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/content/[slug]', () => {
    it('should return content for valid slug', async () => {
      const { getContentBySlug } = await import('@/lib/api/content')
      const mockContent = {
        slug: 'intro-to-react',
        title: 'Introduction to React',
        description: 'Learn the basics of React',
        category: 'fundamentals',
        content: '# Introduction\n\nReact is a JavaScript library...',
        readingTime: '10 min read',
        order: 1,
        headings: [
          { id: 'introduction', text: 'Introduction', level: 1 },
        ],
      }

      vi.mocked(getContentBySlug).mockResolvedValue(mockContent)

      const request = new NextRequest('http://localhost:3000/api/content/intro-to-react')
      const context = { params: Promise.resolve({ slug: 'intro-to-react' }) }
      const response = await GET(request, context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockContent)
      expect(data.meta.timestamp).toBeDefined()
      expect(getContentBySlug).toHaveBeenCalledWith('intro-to-react')
    })

    it('should return 404 when content is not found', async () => {
      const { getContentBySlug } = await import('@/lib/api/content')
      vi.mocked(getContentBySlug).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/content/nonexistent')
      const context = { params: Promise.resolve({ slug: 'nonexistent' }) }
      const response = await GET(request, context)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Content not found')
    })

    it('should handle errors gracefully', async () => {
      const { getContentBySlug } = await import('@/lib/api/content')
      vi.mocked(getContentBySlug).mockRejectedValue(new Error('File read error'))

      const request = new NextRequest('http://localhost:3000/api/content/test')
      const context = { params: Promise.resolve({ slug: 'test' }) }
      const response = await GET(request, context)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('File read error')
    })

    it('should handle non-Error exceptions', async () => {
      const { getContentBySlug } = await import('@/lib/api/content')
      vi.mocked(getContentBySlug).mockRejectedValue('Unknown error')

      const request = new NextRequest('http://localhost:3000/api/content/test')
      const context = { params: Promise.resolve({ slug: 'test' }) }
      const response = await GET(request, context)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch content')
    })
  })
})
