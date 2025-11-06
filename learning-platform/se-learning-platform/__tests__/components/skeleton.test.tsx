import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Skeleton } from '@/components/ui/skeleton'

describe('Skeleton Component', () => {
  it('should render skeleton element', () => {
    render(<Skeleton data-testid="skeleton" />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toBeInTheDocument()
  })

  it('should apply default classes', () => {
    render(<Skeleton data-testid="skeleton" />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveClass('animate-pulse')
    expect(skeleton).toHaveClass('rounded-md')
    expect(skeleton).toHaveClass('bg-muted')
  })

  it('should apply custom className', () => {
    render(<Skeleton className="custom-skeleton" data-testid="skeleton" />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveClass('custom-skeleton')
    expect(skeleton).toHaveClass('animate-pulse')
  })

  it('should accept additional HTML attributes', () => {
    render(<Skeleton data-testid="skeleton" aria-label="Loading content" />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveAttribute('aria-label', 'Loading content')
  })

  it('should render with custom dimensions', () => {
    render(<Skeleton className="h-4 w-full" data-testid="skeleton" />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveClass('h-4')
    expect(skeleton).toHaveClass('w-full')
  })

  it('should render as a div element', () => {
    render(<Skeleton data-testid="skeleton" />)
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton.tagName).toBe('DIV')
  })
})
