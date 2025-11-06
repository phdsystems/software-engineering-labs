import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getAllContent,
  getContentBySlug,
  getContentByCategory,
  searchContent,
  getCategories,
  getRelatedContent,
} from '@/lib/api/content'
import * as fs from 'fs'
import * as path from 'path'

// Mock fs and path modules
vi.mock('fs', () => ({
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
  statSync: vi.fn(),
}))

vi.mock('path', () => ({
  join: vi.fn((...args) => args.join('/')),
  relative: vi.fn((from, to) => to.replace(from + '/', '')),
}))

// Mock markdown processor
vi.mock('@/lib/markdown', () => ({
  processMarkdown: vi.fn(async (content: string) => ({
    content: `<p>${content}</p>`,
    frontmatter: {},
    toc: [],
    readingTime: 5,
  })),
}))

describe('Content API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllContent', () => {
    it('should return content from filesystem', async () => {
      const mockFiles = [
        { name: 'test.md', isFile: () => true, isDirectory: () => false },
      ]

      const mockStat = {
        mtime: new Date('2025-01-01'),
      }

      vi.mocked(fs.readdirSync).mockReturnValue(mockFiles as any)
      vi.mocked(fs.readFileSync).mockReturnValue('# Test Title\n\n**Purpose:** Test description')
      vi.mocked(fs.statSync).mockReturnValue(mockStat as any)

      const result = await getAllContent()

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })

    it('should fallback to mock data on filesystem error', async () => {
      vi.mocked(fs.readdirSync).mockImplementation(() => {
        throw new Error('Filesystem error')
      })

      const result = await getAllContent()

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should skip README.md files', async () => {
      const mockFiles = [
        { name: 'README.md', isFile: () => true, isDirectory: () => false },
        { name: 'test.md', isFile: () => true, isDirectory: () => false },
      ]

      vi.mocked(fs.readdirSync).mockReturnValue(mockFiles as any)
      vi.mocked(fs.readFileSync).mockReturnValue('# Test\n\nContent')
      vi.mocked(fs.statSync).mockReturnValue({ mtime: new Date() } as any)

      await getAllContent()

      // Should only read test.md, not README.md
      expect(fs.readFileSync).toHaveBeenCalledTimes(1)
    })

    it('should skip diagram files', async () => {
      const mockFiles = [
        { name: 'diagram-test.md', isFile: () => true, isDirectory: () => false },
        { name: 'regular.md', isFile: () => true, isDirectory: () => false },
      ]

      vi.mocked(fs.readdirSync).mockReturnValue(mockFiles as any)
      vi.mocked(fs.readFileSync).mockReturnValue('# Test\n\nContent')
      vi.mocked(fs.statSync).mockReturnValue({ mtime: new Date() } as any)

      await getAllContent()

      // Should only read regular.md, not diagram-test.md
      expect(fs.readFileSync).toHaveBeenCalledTimes(1)
    })

    it('should traverse directories recursively', async () => {
      let callCount = 0
      vi.mocked(fs.readdirSync).mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return [
            { name: 'subdir', isFile: () => false, isDirectory: () => true },
          ] as any
        }
        return [
          { name: 'test.md', isFile: () => true, isDirectory: () => false },
        ] as any
      })

      vi.mocked(fs.readFileSync).mockReturnValue('# Test\n\nContent')
      vi.mocked(fs.statSync).mockReturnValue({ mtime: new Date() } as any)

      const result = await getAllContent()

      expect(fs.readdirSync).toHaveBeenCalledTimes(2)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should extract title from H1 heading', async () => {
      const mockFiles = [
        { name: 'test.md', isFile: () => true, isDirectory: () => false },
      ]

      vi.mocked(fs.readdirSync).mockReturnValue(mockFiles as any)
      vi.mocked(fs.readFileSync).mockReturnValue('# Custom Title\n\nContent here')
      vi.mocked(fs.statSync).mockReturnValue({ mtime: new Date() } as any)

      const result = await getAllContent()

      expect(result[0].title).toBe('Custom Title')
    })

    it('should extract description from Purpose field', async () => {
      const mockFiles = [
        { name: 'test.md', isFile: () => true, isDirectory: () => false },
      ]

      vi.mocked(fs.readdirSync).mockReturnValue(mockFiles as any)
      vi.mocked(fs.readFileSync).mockReturnValue('# Title\n\n**Purpose:** This is the purpose')
      vi.mocked(fs.statSync).mockReturnValue({ mtime: new Date() } as any)

      const result = await getAllContent()

      expect(result[0].description).toBe('This is the purpose')
    })
  })

  describe('getContentBySlug', () => {
    it('should return content for valid slug', async () => {
      const mockContent = '# Test Title\n\n**Purpose:** Test description\n\nContent here'

      vi.mocked(fs.readFileSync).mockReturnValue(mockContent)
      vi.mocked(fs.statSync).mockReturnValue({ mtime: new Date('2025-01-01') } as any)

      // Mock getAllContent for prev/next
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'test.md', isFile: () => true, isDirectory: () => false },
      ] as any)

      const result = await getContentBySlug('test-slug')

      expect(result).toBeDefined()
      expect(result?.slug).toBe('test-slug')
      expect(result?.title).toBe('Test Title')
      expect(result?.description).toBe('Test description')
    })

    it('should return null for non-existent slug', async () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('File not found')
      })

      // Mock empty content list
      vi.mocked(fs.readdirSync).mockImplementation(() => {
        throw new Error('Not found')
      })

      const result = await getContentBySlug('non-existent')

      expect(result).toBeNull()
    })

    it('should include table of contents', async () => {
      vi.mocked(fs.readFileSync).mockReturnValue('# Title\n\nContent')
      vi.mocked(fs.statSync).mockReturnValue({ mtime: new Date() } as any)
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'test.md', isFile: () => true, isDirectory: () => false },
      ] as any)

      const result = await getContentBySlug('test')

      expect(result).toBeDefined()
      expect(result?.toc).toBeDefined()
      expect(Array.isArray(result?.toc)).toBe(true)
    })

    it('should calculate prev and next links', async () => {
      const mockFiles = [
        { name: 'first.md', isFile: () => true, isDirectory: () => false },
        { name: 'second.md', isFile: () => true, isDirectory: () => false },
        { name: 'third.md', isFile: () => true, isDirectory: () => false },
      ]

      vi.mocked(fs.readdirSync).mockReturnValue(mockFiles as any)
      vi.mocked(fs.readFileSync).mockReturnValue('# Test\n\nContent')
      vi.mocked(fs.statSync).mockReturnValue({ mtime: new Date() } as any)

      const result = await getContentBySlug('second')

      expect(result).toBeDefined()
      expect(result?.prev).toBeDefined()
      expect(result?.next).toBeDefined()
    })

    it('should not have prev for first item', async () => {
      const mockFiles = [
        { name: 'first.md', isFile: () => true, isDirectory: () => false },
        { name: 'second.md', isFile: () => true, isDirectory: () => false },
      ]

      vi.mocked(fs.readdirSync).mockReturnValue(mockFiles as any)
      vi.mocked(fs.readFileSync).mockReturnValue('# Test\n\nContent')
      vi.mocked(fs.statSync).mockReturnValue({ mtime: new Date() } as any)

      const result = await getContentBySlug('first')

      expect(result?.prev).toBeUndefined()
      expect(result?.next).toBeDefined()
    })

    it('should not have next for last item', async () => {
      const mockFiles = [
        { name: 'first.md', isFile: () => true, isDirectory: () => false },
        { name: 'second.md', isFile: () => true, isDirectory: () => false },
      ]

      vi.mocked(fs.readdirSync).mockReturnValue(mockFiles as any)
      vi.mocked(fs.readFileSync).mockReturnValue('# Test\n\nContent')
      vi.mocked(fs.statSync).mockReturnValue({ mtime: new Date() } as any)

      const result = await getContentBySlug('second')

      expect(result?.prev).toBeDefined()
      expect(result?.next).toBeUndefined()
    })
  })

  describe('getContentByCategory', () => {
    it('should filter content by category', async () => {
      vi.mocked(fs.readdirSync).mockImplementation((dir) => {
        if (String(dir).includes('design-patterns')) {
          return [
            { name: 'solid.md', isFile: () => true, isDirectory: () => false },
          ] as any
        }
        return [
          { name: 'design-patterns', isFile: () => false, isDirectory: () => true },
          { name: 'architecture', isFile: () => false, isDirectory: () => true },
        ] as any
      })

      vi.mocked(fs.readFileSync).mockReturnValue('# Test\n\nContent')
      vi.mocked(fs.statSync).mockReturnValue({ mtime: new Date() } as any)

      const result = await getContentByCategory('design-patterns')

      expect(Array.isArray(result)).toBe(true)
    })

    it('should return empty array for non-existent category', async () => {
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'test.md', isFile: () => true, isDirectory: () => false },
      ] as any)

      vi.mocked(fs.readFileSync).mockReturnValue('# Test\n\nContent')
      vi.mocked(fs.statSync).mockReturnValue({ mtime: new Date() } as any)

      const result = await getContentByCategory('non-existent-category')

      expect(result).toEqual([])
    })
  })

  describe('searchContent', () => {
    it('should return empty array for empty query', async () => {
      const result = await searchContent('')

      expect(result).toEqual([])
    })

    it('should return empty array for query < 2 characters', async () => {
      const result = await searchContent('a')

      expect(result).toEqual([])
    })

    it('should search by title', async () => {
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'solid.md', isFile: () => true, isDirectory: () => false },
      ] as any)

      vi.mocked(fs.readFileSync).mockReturnValue('# SOLID Principles\n\nContent')
      vi.mocked(fs.statSync).mockReturnValue({ mtime: new Date() } as any)

      const result = await searchContent('solid')

      expect(result.length).toBeGreaterThan(0)
      expect(result[0].title).toContain('SOLID')
    })

    it('should search by description', async () => {
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'test.md', isFile: () => true, isDirectory: () => false },
      ] as any)

      vi.mocked(fs.readFileSync).mockReturnValue('# Title\n\n**Purpose:** Design patterns guide')
      vi.mocked(fs.statSync).mockReturnValue({ mtime: new Date() } as any)

      const result = await searchContent('patterns')

      expect(result.length).toBeGreaterThan(0)
      expect(result[0].description).toContain('patterns')
    })

    it('should be case-insensitive', async () => {
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'test.md', isFile: () => true, isDirectory: () => false },
      ] as any)

      vi.mocked(fs.readFileSync).mockReturnValue('# Test Title\n\nContent')
      vi.mocked(fs.statSync).mockReturnValue({ mtime: new Date() } as any)

      const resultLower = await searchContent('test')
      const resultUpper = await searchContent('TEST')

      expect(resultLower.length).toBe(resultUpper.length)
    })
  })

  describe('getCategories', () => {
    it('should return list of categories', async () => {
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'test.md', isFile: () => true, isDirectory: () => false },
      ] as any)

      vi.mocked(fs.readFileSync).mockReturnValue('# Test\n\nContent')
      vi.mocked(fs.statSync).mockReturnValue({ mtime: new Date() } as any)

      const result = await getCategories()

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('slug')
      expect(result[0]).toHaveProperty('title')
      expect(result[0]).toHaveProperty('count')
    })

    it('should format category titles correctly', async () => {
      vi.mocked(fs.readdirSync).mockImplementation(() => {
        return [
          { name: 'test.md', isFile: () => true, isDirectory: () => false },
        ] as any
      })

      vi.mocked(fs.readFileSync).mockReturnValue('# Test\n\nContent')
      vi.mocked(fs.statSync).mockReturnValue({ mtime: new Date() } as any)
      vi.mocked(path.relative).mockReturnValue('design-patterns/test.md')

      const result = await getCategories()

      const category = result.find(c => c.slug === 'design-patterns')
      expect(category?.title).toBe('Design Patterns')
    })

    it('should count items per category', async () => {
      let fileIndex = 0
      vi.mocked(fs.readdirSync).mockImplementation(() => {
        fileIndex++
        if (fileIndex <= 2) {
          return [
            { name: `test${fileIndex}.md`, isFile: () => true, isDirectory: () => false },
          ] as any
        }
        return [] as any
      })

      vi.mocked(fs.readFileSync).mockReturnValue('# Test\n\nContent')
      vi.mocked(fs.statSync).mockReturnValue({ mtime: new Date() } as any)
      vi.mocked(path.relative).mockReturnValue('guide/test.md')

      const result = await getCategories()

      const guideCategory = result.find(c => c.slug === 'guide')
      expect(guideCategory?.count).toBeGreaterThan(0)
    })
  })

  describe('getRelatedContent', () => {
    it('should return empty array when no related content', async () => {
      vi.mocked(fs.readFileSync).mockReturnValue('# Test\n\nContent')
      vi.mocked(fs.statSync).mockReturnValue({ mtime: new Date() } as any)
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'test.md', isFile: () => true, isDirectory: () => false },
      ] as any)

      const result = await getRelatedContent('test')

      expect(result).toEqual([])
    })

    it('should return empty array for non-existent slug', async () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('Not found')
      })

      vi.mocked(fs.readdirSync).mockImplementation(() => {
        throw new Error('Not found')
      })

      const result = await getRelatedContent('non-existent')

      expect(result).toEqual([])
    })
  })
})
