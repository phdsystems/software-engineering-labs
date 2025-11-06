import { describe, it, expect } from 'vitest'
import { cn, slugify, formatDate, calculateReadingTime, truncate } from '@/lib/utils'

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    })

    it('should merge Tailwind classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    })

    it('should handle empty inputs', () => {
      expect(cn()).toBe('')
    })

    it('should handle undefined and null', () => {
      expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
    })
  })

  describe('slugify', () => {
    it('should convert text to slug', () => {
      expect(slugify('Hello World')).toBe('hello-world')
    })

    it('should remove special characters', () => {
      expect(slugify('Hello @#$ World!')).toBe('hello-world')
    })

    it('should replace spaces with hyphens', () => {
      expect(slugify('foo   bar   baz')).toBe('foo-bar-baz')
    })

    it('should handle underscores', () => {
      expect(slugify('foo_bar_baz')).toBe('foo-bar-baz')
    })

    it('should trim leading and trailing hyphens', () => {
      expect(slugify('-foo-bar-')).toBe('foo-bar')
    })

    it('should handle already slugified text', () => {
      expect(slugify('already-a-slug')).toBe('already-a-slug')
    })

    it('should handle empty string', () => {
      expect(slugify('')).toBe('')
    })

    it('should handle CamelCase', () => {
      expect(slugify('CamelCaseText')).toBe('camelcasetext')
    })
  })

  describe('formatDate', () => {
    it('should format Date object', () => {
      const date = new Date('2024-01-15')
      const formatted = formatDate(date)
      expect(formatted).toContain('January')
      expect(formatted).toContain('15')
      expect(formatted).toContain('2024')
    })

    it('should format date string', () => {
      const formatted = formatDate('2024-01-15')
      expect(formatted).toContain('January')
      expect(formatted).toContain('15')
      expect(formatted).toContain('2024')
    })

    it('should handle different date formats', () => {
      const formatted = formatDate('2024-12-25')
      expect(formatted).toContain('December')
      expect(formatted).toContain('25')
    })
  })

  describe('calculateReadingTime', () => {
    it('should calculate reading time correctly', () => {
      const content = Array(200).fill('word').join(' ')
      expect(calculateReadingTime(content)).toBe(1)
    })

    it('should round up reading time', () => {
      const content = Array(250).fill('word').join(' ')
      expect(calculateReadingTime(content)).toBe(2)
    })

    it('should handle empty content', () => {
      expect(calculateReadingTime('')).toBe(1)
    })

    it('should handle single word', () => {
      expect(calculateReadingTime('word')).toBe(1)
    })

    it('should handle long content', () => {
      const content = Array(1000).fill('word').join(' ')
      expect(calculateReadingTime(content)).toBe(5)
    })

    it('should handle content with multiple spaces', () => {
      const content = 'word   word   word'
      expect(calculateReadingTime(content)).toBe(1)
    })
  })

  describe('truncate', () => {
    it('should truncate long text', () => {
      const text = 'a'.repeat(200)
      const result = truncate(text, 100)
      expect(result).toHaveLength(103) // 100 + '...'
      expect(result.endsWith('...')).toBe(true)
    })

    it('should not truncate short text', () => {
      const text = 'Short text'
      expect(truncate(text, 100)).toBe(text)
    })

    it('should use default length of 150', () => {
      const text = 'a'.repeat(200)
      const result = truncate(text)
      expect(result).toHaveLength(153) // 150 + '...'
    })

    it('should handle text at exact length', () => {
      const text = 'a'.repeat(150)
      expect(truncate(text, 150)).toBe(text)
    })

    it('should handle empty string', () => {
      expect(truncate('')).toBe('')
    })

    it('should trim whitespace before adding ellipsis', () => {
      const text = 'word '.repeat(50)
      const result = truncate(text, 100)
      expect(result.endsWith('...')).toBe(true)
      expect(result.includes('  ...')).toBe(false)
    })
  })
})
