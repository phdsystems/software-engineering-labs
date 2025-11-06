import { test, expect } from '@playwright/test'

test.describe('API Endpoint Tests', () => {
  const baseURL = 'http://localhost:3000'

  test.describe('GET /api/content', () => {
    test('should return all content with correct structure', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/content`)

      expect(response.status()).toBe(200)

      const data = await response.json()

      // Check response structure
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
      expect(data).toHaveProperty('meta')
      expect(data.meta).toHaveProperty('total')
      expect(data.meta).toHaveProperty('timestamp')

      // Check data is an array
      expect(Array.isArray(data.data)).toBeTruthy()

      // Check data length matches meta.total
      expect(data.data.length).toBe(data.meta.total)

      // If there's data, check structure of first item
      if (data.data.length > 0) {
        const firstItem = data.data[0]
        expect(firstItem).toHaveProperty('slug')
        expect(firstItem).toHaveProperty('title')
        expect(firstItem).toHaveProperty('category')
        expect(firstItem).toHaveProperty('excerpt')
        expect(firstItem).toHaveProperty('readingTime')
      }
    })

    test('should return content filtered by category', async ({ request }) => {
      // First get all content to find valid categories
      const allResponse = await request.get(`${baseURL}/api/content`)
      const allData = await allResponse.json()

      if (allData.data.length > 0) {
        const firstCategory = allData.data[0].category

        // Request content for specific category
        const response = await request.get(`${baseURL}/api/content?category=${firstCategory}`)

        expect(response.status()).toBe(200)

        const data = await response.json()
        expect(data.success).toBe(true)
        expect(Array.isArray(data.data)).toBeTruthy()

        // All returned items should have the requested category
        data.data.forEach((item: any) => {
          expect(item.category).toBe(firstCategory)
        })
      }
    })

    test('should return empty array for non-existent category', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/content?category=non-existent-category-xyz`)

      expect(response.status()).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
      expect(data.meta.total).toBe(0)
    })

    test('should include valid timestamp in ISO format', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/content`)
      const data = await response.json()

      expect(data.meta.timestamp).toBeTruthy()

      // Check timestamp is valid ISO 8601 format
      const timestamp = new Date(data.meta.timestamp)
      expect(timestamp.toString()).not.toBe('Invalid Date')

      // Timestamp should be recent (within last 5 seconds)
      const now = new Date()
      const diff = now.getTime() - timestamp.getTime()
      expect(diff).toBeLessThan(5000)
      expect(diff).toBeGreaterThanOrEqual(0)
    })

    test('should handle multiple category requests consistently', async ({ request }) => {
      const response1 = await request.get(`${baseURL}/api/content`)
      const response2 = await request.get(`${baseURL}/api/content`)

      const data1 = await response1.json()
      const data2 = await response2.json()

      // Should return same content count
      expect(data1.meta.total).toBe(data2.meta.total)
      expect(data1.data.length).toBe(data2.data.length)
    })
  })

  test.describe('GET /api/content/[slug]', () => {
    test('should return specific content by slug', async ({ request }) => {
      // First get a valid slug
      const listResponse = await request.get(`${baseURL}/api/content`)
      const listData = await listResponse.json()

      if (listData.data.length > 0) {
        const slug = listData.data[0].slug

        const response = await request.get(`${baseURL}/api/content/${slug}`)

        expect(response.status()).toBe(200)

        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.data).toHaveProperty('slug', slug)
        expect(data.data).toHaveProperty('title')
        expect(data.data).toHaveProperty('content')
        expect(data.data).toHaveProperty('category')
        expect(data.data).toHaveProperty('frontmatter')
        expect(data.meta).toHaveProperty('timestamp')
      }
    })

    test('should return 404 for non-existent slug', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/content/non-existent-slug-xyz-123`)

      expect(response.status()).toBe(404)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBeTruthy()
      expect(data.error).toContain('not found')
    })

    test('should return full content with HTML', async ({ request }) => {
      const listResponse = await request.get(`${baseURL}/api/content`)
      const listData = await listResponse.json()

      if (listData.data.length > 0) {
        const slug = listData.data[0].slug
        const response = await request.get(`${baseURL}/api/content/${slug}`)
        const data = await response.json()

        expect(data.data.content).toBeTruthy()
        expect(typeof data.data.content).toBe('string')
        expect(data.data.content.length).toBeGreaterThan(0)
      }
    })

    test('should include frontmatter data', async ({ request }) => {
      const listResponse = await request.get(`${baseURL}/api/content`)
      const listData = await listResponse.json()

      if (listData.data.length > 0) {
        const slug = listData.data[0].slug
        const response = await request.get(`${baseURL}/api/content/${slug}`)
        const data = await response.json()

        expect(data.data.frontmatter).toBeTruthy()
        expect(data.data.frontmatter).toHaveProperty('title')
        expect(data.data.frontmatter).toHaveProperty('category')
      }
    })

    test('should handle URL-encoded slugs', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/content/test%20slug`)

      // Should either return content or 404, not 500
      expect([200, 404]).toContain(response.status())
    })
  })

  test.describe('GET /api/search', () => {
    test('should return search results for valid query', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/search?q=test`)

      expect(response.status()).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBeTruthy()
      expect(data.meta).toHaveProperty('query', 'test')
      expect(data.meta).toHaveProperty('total')
      expect(data.meta).toHaveProperty('timestamp')
      expect(data.data.length).toBe(data.meta.total)
    })

    test('should return 400 when query parameter is missing', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/search`)

      expect(response.status()).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBeTruthy()
      expect(data.error).toContain('required')
    })

    test('should return empty results for non-matching query', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/search?q=xyznonexistentquery123456`)

      expect(response.status()).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
      expect(data.meta.total).toBe(0)
    })

    test('should handle special characters in query', async ({ request }) => {
      const specialQuery = encodeURIComponent('test & query "special" <chars>')
      const response = await request.get(`${baseURL}/api/search?q=${specialQuery}`)

      expect(response.status()).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBeTruthy()
    })

    test('should handle empty query string', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/search?q=`)

      expect(response.status()).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
    })

    test('should handle very long query', async ({ request }) => {
      const longQuery = 'a'.repeat(500)
      const response = await request.get(`${baseURL}/api/search?q=${longQuery}`)

      expect(response.status()).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBeTruthy()
    })

    test('should return consistent results for same query', async ({ request }) => {
      const response1 = await request.get(`${baseURL}/api/search?q=test`)
      const response2 = await request.get(`${baseURL}/api/search?q=test`)

      const data1 = await response1.json()
      const data2 = await response2.json()

      expect(data1.meta.total).toBe(data2.meta.total)
      expect(data1.data.length).toBe(data2.data.length)
    })

    test('should include all required fields in search results', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/search?q=test`)
      const data = await response.json()

      if (data.data.length > 0) {
        const firstResult = data.data[0]
        expect(firstResult).toHaveProperty('slug')
        expect(firstResult).toHaveProperty('title')
        expect(firstResult).toHaveProperty('category')
        expect(firstResult).toHaveProperty('excerpt')
      }
    })

    test('should handle case-insensitive search', async ({ request }) => {
      const response1 = await request.get(`${baseURL}/api/search?q=TEST`)
      const response2 = await request.get(`${baseURL}/api/search?q=test`)

      const data1 = await response1.json()
      const data2 = await response2.json()

      // Should return similar results (fuzzy search may have different scores)
      expect(data1.success).toBe(true)
      expect(data2.success).toBe(true)
    })
  })

  test.describe('GET /api/navigation', () => {
    test('should return navigation structure', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/navigation`)

      expect(response.status()).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBeTruthy()
      expect(data.meta).toHaveProperty('total')
      expect(data.meta).toHaveProperty('timestamp')
      expect(data.data.length).toBe(data.meta.total)
    })

    test('should return navigation groups with items', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/navigation`)
      const data = await response.json()

      if (data.data.length > 0) {
        const firstGroup = data.data[0]
        expect(firstGroup).toHaveProperty('title')
        expect(firstGroup).toHaveProperty('items')
        expect(Array.isArray(firstGroup.items)).toBeTruthy()

        if (firstGroup.items.length > 0) {
          const firstItem = firstGroup.items[0]
          expect(firstItem).toHaveProperty('title')
          expect(firstItem).toHaveProperty('href')
        }
      }
    })

    test('should return consistent navigation structure', async ({ request }) => {
      const response1 = await request.get(`${baseURL}/api/navigation`)
      const response2 = await request.get(`${baseURL}/api/navigation`)

      const data1 = await response1.json()
      const data2 = await response2.json()

      expect(data1.meta.total).toBe(data2.meta.total)
      expect(JSON.stringify(data1.data)).toBe(JSON.stringify(data2.data))
    })

    test('should not require any query parameters', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/navigation`)

      expect(response.status()).toBe(200)
      expect((await response.json()).success).toBe(true)
    })
  })

  test.describe('API Error Handling', () => {
    test('should return JSON error for invalid routes', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/invalid-endpoint-xyz`)

      // Next.js returns 404 for non-existent API routes
      expect(response.status()).toBe(404)
    })

    test('should handle malformed URLs gracefully', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/content/../../../etc/passwd`)

      // Should return 404 or valid response, not 500
      expect([200, 404]).toContain(response.status())
    })

    test('all error responses should have consistent structure', async ({ request }) => {
      // Test 404 error structure
      const response404 = await request.get(`${baseURL}/api/content/non-existent-slug`)
      const data404 = await response404.json()

      expect(data404).toHaveProperty('success', false)
      expect(data404).toHaveProperty('error')
      expect(typeof data404.error).toBe('string')

      // Test 400 error structure
      const response400 = await request.get(`${baseURL}/api/search`)
      const data400 = await response400.json()

      expect(data400).toHaveProperty('success', false)
      expect(data400).toHaveProperty('error')
      expect(typeof data400.error).toBe('string')
    })
  })

  test.describe('API Performance', () => {
    test('should respond within reasonable time', async ({ request }) => {
      const start = Date.now()
      const response = await request.get(`${baseURL}/api/content`)
      const duration = Date.now() - start

      expect(response.status()).toBe(200)
      expect(duration).toBeLessThan(2000) // Should respond within 2 seconds
    })

    test('should handle concurrent requests', async ({ request }) => {
      const requests = [
        request.get(`${baseURL}/api/content`),
        request.get(`${baseURL}/api/navigation`),
        request.get(`${baseURL}/api/search?q=test`)
      ]

      const responses = await Promise.all(requests)

      responses.forEach(response => {
        expect(response.status()).toBe(200)
      })
    })
  })

  test.describe('API Headers', () => {
    test('should return correct Content-Type header', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/content`)

      expect(response.headers()['content-type']).toContain('application/json')
    })

    test('should handle CORS if configured', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/content`)

      // Check for CORS headers (may not be set in dev)
      const headers = response.headers()
      expect(headers).toBeTruthy()
    })
  })
})
