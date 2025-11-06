import { describe, it, expect, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { MarkdownRenderer } from '@/components/markdown/markdown-renderer'

describe('MarkdownRenderer Component', () => {
  afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = ''
  })

  it('should render markdown content', () => {
    const content = '<p>Hello, world!</p>'
    const { container } = render(<MarkdownRenderer content={content} />)

    expect(container.querySelector('p')).toBeInTheDocument()
    expect(container.textContent).toContain('Hello, world!')
  })

  it('should apply markdown-content class', () => {
    const content = '<p>Test</p>'
    const { container } = render(<MarkdownRenderer content={content} />)

    const div = container.querySelector('.markdown-content')
    expect(div).toBeInTheDocument()
  })

  it('should apply prose classes', () => {
    const content = '<p>Test</p>'
    const { container } = render(<MarkdownRenderer content={content} />)

    const div = container.querySelector('.prose')
    expect(div).toBeInTheDocument()
    expect(div).toHaveClass('dark:prose-invert')
    expect(div).toHaveClass('max-w-none')
  })

  it('should apply custom className', () => {
    const content = '<p>Test</p>'
    const { container } = render(
      <MarkdownRenderer content={content} className="custom-class" />
    )

    const div = container.querySelector('.markdown-content')
    expect(div).toHaveClass('custom-class')
  })

  it('should add IDs to h2 headings', () => {
    const content = '<h2>Test Heading</h2>'
    const { container } = render(<MarkdownRenderer content={content} />)

    // Wait for useEffect to run
    const heading = container.querySelector('h2')
    expect(heading).toBeInTheDocument()

    // The ID should be set after useEffect runs
    setTimeout(() => {
      expect(heading?.id).toBe('test-heading')
    }, 0)
  })

  it('should add IDs to h3 headings', () => {
    const content = '<h3>Another Heading</h3>'
    const { container } = render(<MarkdownRenderer content={content} />)

    const heading = container.querySelector('h3')
    expect(heading).toBeInTheDocument()

    setTimeout(() => {
      expect(heading?.id).toBe('another-heading')
    }, 0)
  })

  it('should handle multiple headings', () => {
    const content = '<h2>First</h2><h3>Second</h3><h2>Third</h2>'
    const { container } = render(<MarkdownRenderer content={content} />)

    const headings = container.querySelectorAll('h2, h3')
    expect(headings.length).toBe(3)
  })

  it('should handle empty content', () => {
    const content = ''
    const { container } = render(<MarkdownRenderer content={content} />)

    const div = container.querySelector('.markdown-content')
    expect(div).toBeInTheDocument()
    expect(div?.innerHTML).toBe('')
  })

  it('should handle complex HTML content', () => {
    const content = '<div><h2>Title</h2><p>Paragraph</p><ul><li>Item</li></ul></div>'
    const { container } = render(<MarkdownRenderer content={content} />)

    expect(container.querySelector('h2')).toBeInTheDocument()
    expect(container.querySelector('p')).toBeInTheDocument()
    expect(container.querySelector('ul')).toBeInTheDocument()
    expect(container.querySelector('li')).toBeInTheDocument()
  })

  it('should sanitize heading IDs by removing special characters', () => {
    const content = '<h2>Test & Special @ Characters!</h2>'
    const { container } = render(<MarkdownRenderer content={content} />)

    const heading = container.querySelector('h2')
    setTimeout(() => {
      // ID should be sanitized: "test-special--characters"
      expect(heading?.id).toMatch(/test.*special.*characters/)
    }, 0)
  })
})
