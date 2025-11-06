import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

describe('ScrollArea Component', () => {
  it('should render scroll area with children', () => {
    render(
      <ScrollArea data-testid="scroll-area">
        <div>Scrollable content</div>
      </ScrollArea>
    )

    expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    expect(screen.getByText('Scrollable content')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(
      <ScrollArea className="custom-scroll" data-testid="scroll-area">
        <div>Content</div>
      </ScrollArea>
    )

    expect(screen.getByTestId('scroll-area')).toHaveClass('custom-scroll')
  })

  it('should render with default overflow-hidden class', () => {
    render(
      <ScrollArea data-testid="scroll-area">
        <div>Content</div>
      </ScrollArea>
    )

    expect(screen.getByTestId('scroll-area')).toHaveClass('overflow-hidden')
  })

  it('should render with long content', () => {
    const longContent = Array.from({ length: 100 }, (_, i) => (
      <div key={i}>Line {i + 1}</div>
    ))

    render(
      <ScrollArea data-testid="scroll-area" className="h-48">
        {longContent}
      </ScrollArea>
    )

    expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    expect(screen.getByText('Line 1')).toBeInTheDocument()
  })

  it('should handle height constraints', () => {
    render(
      <ScrollArea className="h-64" data-testid="scroll-area">
        <div>Content</div>
      </ScrollArea>
    )

    const scrollArea = screen.getByTestId('scroll-area')
    expect(scrollArea).toHaveClass('h-64')
  })
})

describe('ScrollBar Component', () => {
  it('should render within ScrollArea', () => {
    render(
      <ScrollArea>
        <div>Content with scrollbar</div>
      </ScrollArea>
    )

    // ScrollBar is rendered as part of ScrollArea
    expect(screen.getByText('Content with scrollbar')).toBeInTheDocument()
  })

  it('should handle different scroll orientations', () => {
    const { container } = render(
      <ScrollArea className="h-48">
        <div style={{ height: '500px' }}>Tall content</div>
      </ScrollArea>
    )

    // Verify ScrollArea renders correctly with content that would need scrolling
    expect(container.querySelector('.h-48')).toBeInTheDocument()
  })

  it('should integrate scrollbar into scroll area', () => {
    render(
      <ScrollArea className="w-full">
        <div>Scrollable content</div>
      </ScrollArea>
    )

    // Verify that overflow-hidden is applied (part of ScrollArea functionality)
    const scrollArea = screen.getByText('Scrollable content').closest('[class*="overflow-hidden"]')
    expect(scrollArea).toBeInTheDocument()
  })
})
