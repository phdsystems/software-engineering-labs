import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MobileNav } from '@/components/layout/mobile-nav'

describe('MobileNav Component', () => {
  it('should render SE Learning brand', () => {
    render(<MobileNav />)
    expect(screen.getByText('SE Learning')).toBeInTheDocument()
  })

  it('should render navigation section', () => {
    render(<MobileNav />)
    expect(screen.getByText('Navigation')).toBeInTheDocument()
    expect(screen.getByText('Learn Home')).toBeInTheDocument()
  })

  it('should render Learn Home link with correct href', () => {
    render(<MobileNav />)
    const learnHomeLink = screen.getByText('Learn Home').closest('a')
    expect(learnHomeLink).toHaveAttribute('href', '/learn')
  })

  it('should render categories section', () => {
    render(<MobileNav />)
    expect(screen.getByText('Categories')).toBeInTheDocument()
  })

  it('should render all category links', () => {
    render(<MobileNav />)

    expect(screen.getByText('Design Principles')).toBeInTheDocument()
    expect(screen.getByText('Design Patterns')).toBeInTheDocument()
    expect(screen.getByText('Architecture Patterns')).toBeInTheDocument()
    expect(screen.getByText('Code Examples')).toBeInTheDocument()
  })

  it('should have correct href for Design Principles', () => {
    render(<MobileNav />)
    const link = screen.getByText('Design Principles').closest('a')
    expect(link).toHaveAttribute('href', '/learn/design-principle/overview')
  })

  it('should have correct href for Design Patterns', () => {
    render(<MobileNav />)
    const link = screen.getByText('Design Patterns').closest('a')
    expect(link).toHaveAttribute('href', '/learn/design-pattern/overview')
  })

  it('should have correct href for Architecture Patterns', () => {
    render(<MobileNav />)
    const link = screen.getByText('Architecture Patterns').closest('a')
    expect(link).toHaveAttribute('href', '/learn/architecture-pattern/overview')
  })

  it('should have correct href for Code Examples', () => {
    render(<MobileNav />)
    const link = screen.getByText('Code Examples').closest('a')
    expect(link).toHaveAttribute('href', '/learn/example/overview')
  })

  it('should render learning paths section', () => {
    render(<MobileNav />)
    expect(screen.getByText('Learning Paths')).toBeInTheDocument()
  })

  it('should render all learning path links', () => {
    render(<MobileNav />)

    expect(screen.getByText('Beginner (0-2 years)')).toBeInTheDocument()
    expect(screen.getByText('Intermediate (2-5 years)')).toBeInTheDocument()
    expect(screen.getByText('Senior (5+ years)')).toBeInTheDocument()
  })

  it('should have correct href for Beginner path', () => {
    render(<MobileNav />)
    const link = screen.getByText('Beginner (0-2 years)').closest('a')
    expect(link).toHaveAttribute('href', '/learn?path=beginner')
  })

  it('should have correct href for Intermediate path', () => {
    render(<MobileNav />)
    const link = screen.getByText('Intermediate (2-5 years)').closest('a')
    expect(link).toHaveAttribute('href', '/learn?path=intermediate')
  })

  it('should have correct href for Senior path', () => {
    render(<MobileNav />)
    const link = screen.getByText('Senior (5+ years)').closest('a')
    expect(link).toHaveAttribute('href', '/learn?path=advanced')
  })

  it('should render icons for navigation items', () => {
    const { container } = render(<MobileNav />)
    const svgIcons = container.querySelectorAll('svg')
    // At least one icon (brand icon + navigation icons)
    expect(svgIcons.length).toBeGreaterThan(1)
  })

  it('should have brand logo icon', () => {
    const { container } = render(<MobileNav />)
    const brandIcon = container.querySelector('.text-primary')
    expect(brandIcon).toBeInTheDocument()
  })
})
