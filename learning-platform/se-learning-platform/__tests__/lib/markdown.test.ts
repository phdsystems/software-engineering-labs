import { describe, it, expect } from 'vitest'
import { processMarkdown } from '@/lib/markdown'

describe('Markdown Processing', () => {
  describe('processMarkdown', () => {
    it('should process basic markdown', async () => {
      const markdown = '# Hello World\n\nThis is a paragraph.'
      const result = await processMarkdown(markdown)

      expect(result.content).toContain('<h1')
      expect(result.content).toContain('Hello World')
      expect(result.content).toContain('<p')
      expect(result.content).toContain('This is a paragraph')
    })

    it('should extract frontmatter data', async () => {
      const markdown = `---
title: Test Title
description: Test Description
tags:
  - tag1
  - tag2
---

# Content`

      const result = await processMarkdown(markdown)

      expect(result.frontmatter.title).toBe('Test Title')
      expect(result.frontmatter.description).toBe('Test Description')
      expect(result.frontmatter.tags).toEqual(['tag1', 'tag2'])
    })

    it('should generate table of contents', async () => {
      const markdown = `# Main Title

## Section 1

### Subsection 1.1

## Section 2`

      const result = await processMarkdown(markdown)

      expect(result.toc).toBeDefined()
      expect(result.toc.length).toBeGreaterThan(0)
      expect(result.toc.some(item => item.title === 'Section 1')).toBe(true)
      expect(result.toc.some(item => item.title === 'Section 2')).toBe(true)
    })

    it('should calculate reading time', async () => {
      const markdown = Array(200).fill('word').join(' ')
      const result = await processMarkdown(markdown)

      expect(result.readingTime).toBeGreaterThan(0)
      expect(typeof result.readingTime).toBe('number')
    })

    it('should handle empty markdown', async () => {
      const markdown = ''
      const result = await processMarkdown(markdown)

      expect(result.content).toBeDefined()
      expect(result.frontmatter).toEqual({})
      expect(result.toc).toEqual([])
      expect(result.readingTime).toBe(0)
    })

    it('should process markdown with code blocks', async () => {
      const markdown = `# Code Example

\`\`\`typescript
const hello = "world";
\`\`\`
`

      const result = await processMarkdown(markdown)

      expect(result.content).toContain('<pre')
      expect(result.content).toContain('<code')
    })

    it('should process inline code', async () => {
      const markdown = 'This has `inline code` in it.'
      const result = await processMarkdown(markdown)

      expect(result.content).toContain('<code')
      expect(result.content).toContain('inline code')
    })

    it('should process links', async () => {
      const markdown = '[Link text](https://example.com)'
      const result = await processMarkdown(markdown)

      expect(result.content).toContain('<a')
      expect(result.content).toContain('href="https://example.com"')
      expect(result.content).toContain('Link text')
    })

    it('should process lists', async () => {
      const markdown = `- Item 1
- Item 2
- Item 3`

      const result = await processMarkdown(markdown)

      expect(result.content).toContain('<ul')
      expect(result.content).toContain('<li')
      expect(result.content).toContain('Item 1')
    })

    it('should process blockquotes', async () => {
      const markdown = '> This is a quote'
      const result = await processMarkdown(markdown)

      expect(result.content).toContain('<blockquote')
      expect(result.content).toContain('This is a quote')
    })

    it('should process bold text', async () => {
      const markdown = '**Bold text**'
      const result = await processMarkdown(markdown)

      expect(result.content).toContain('<strong')
      expect(result.content).toContain('Bold text')
    })

    it('should process italic text', async () => {
      const markdown = '*Italic text*'
      const result = await processMarkdown(markdown)

      expect(result.content).toContain('<em')
      expect(result.content).toContain('Italic text')
    })

    it('should process tables', async () => {
      const markdown = `| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |`

      const result = await processMarkdown(markdown)

      expect(result.content).toContain('<table')
      expect(result.content).toContain('<thead')
      expect(result.content).toContain('<tbody')
      expect(result.content).toContain('Header 1')
    })

    it('should handle markdown without frontmatter', async () => {
      const markdown = '# Just Content\n\nNo frontmatter here.'
      const result = await processMarkdown(markdown)

      expect(result.content).toContain('Just Content')
      expect(result.frontmatter).toEqual({})
    })

    it('should handle headings for TOC with title and level', async () => {
      const markdown = '## My Section'
      const result = await processMarkdown(markdown)

      expect(result.toc.length).toBeGreaterThan(0)
      expect(result.toc[0]).toHaveProperty('title')
      expect(result.toc[0]).toHaveProperty('level')
      expect(result.toc[0].title).toBe('My Section')
      expect(result.toc[0].level).toBe(2)
    })

    it('should calculate different reading times for different lengths', async () => {
      const shortMarkdown = 'Short text'
      const longMarkdown = Array(1000).fill('word').join(' ')

      const shortResult = await processMarkdown(shortMarkdown)
      const longResult = await processMarkdown(longMarkdown)

      expect(longResult.readingTime).toBeGreaterThan(shortResult.readingTime)
    })

    it('should handle complex frontmatter', async () => {
      const markdown = `---
title: Complex Title
tags:
  - tag1
  - tag2
metadata:
  difficulty: intermediate
  version: 1.0
---

# Content`

      const result = await processMarkdown(markdown)

      expect(result.frontmatter.metadata).toBeDefined()
      expect(result.frontmatter.metadata.difficulty).toBe('intermediate')
      expect(result.frontmatter.metadata.version).toBe(1.0)
    })

    it('should handle multiple heading levels in TOC', async () => {
      const markdown = `# H1
## H2
### H3
#### H4
## Another H2`

      const result = await processMarkdown(markdown)

      const levels = result.toc.map(item => item.level)
      expect(levels).toContain(2)
      expect(levels).toContain(3)
      // TOC might not include H4, depending on configuration
      expect(result.toc.length).toBeGreaterThan(0)
    })

    it('should process GFM features (strikethrough)', async () => {
      const markdown = '~~Strikethrough text~~'
      const result = await processMarkdown(markdown)

      expect(result.content).toContain('<del')
      expect(result.content).toContain('Strikethrough text')
    })

    it('should process task lists', async () => {
      const markdown = `- [x] Completed task
- [ ] Incomplete task`

      const result = await processMarkdown(markdown)

      expect(result.content).toContain('input')
      expect(result.content).toContain('type="checkbox"')
    })
  })
})
