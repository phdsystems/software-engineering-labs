'use client'

import { useEffect } from 'react'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  useEffect(() => {
    // Add IDs to headings for TOC navigation
    const headings = document.querySelectorAll('.markdown-content h2, .markdown-content h3')
    headings.forEach((heading) => {
      const text = heading.textContent || ''
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
      heading.id = id
    })
  }, [content])

  return (
    <div
      className={`markdown-content prose dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
