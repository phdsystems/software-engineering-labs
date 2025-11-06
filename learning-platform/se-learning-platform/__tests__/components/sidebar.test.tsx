import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sidebar } from '@/components/layout/sidebar'
import type { NavigationGroup } from '@/types'

// Mock next/navigation
const mockUsePathname = vi.fn()
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}))

describe('Sidebar Component', () => {
  const mockNavigation: NavigationGroup[] = [
    {
      category: 'fundamentals',
      title: 'Fundamentals',
      description: 'Core concepts and basics',
      items: [
        { slug: 'intro', title: 'Introduction', order: 1 },
        { slug: 'basics', title: 'Basics', order: 2 },
      ],
    },
    {
      category: 'advanced',
      title: 'Advanced',
      items: [
        { slug: 'patterns', title: 'Design Patterns', order: 1 },
        { slug: 'architecture', title: 'Architecture', order: 2 },
      ],
    },
  ]

  beforeEach(() => {
    mockUsePathname.mockReturnValue('/learn/intro')
  })

  it('should render navigation groups', () => {
    render(<Sidebar navigation={mockNavigation} />)

    expect(screen.getByText('fundamentals')).toBeInTheDocument()
    expect(screen.getByText('advanced')).toBeInTheDocument()
  })

  it('should render group description when provided', () => {
    render(<Sidebar navigation={mockNavigation} />)

    expect(screen.getByText('Core concepts and basics')).toBeInTheDocument()
  })

  it('should render all navigation items', () => {
    render(<Sidebar navigation={mockNavigation} />)

    expect(screen.getByText('Introduction')).toBeInTheDocument()
    expect(screen.getByText('Basics')).toBeInTheDocument()
    expect(screen.getByText('Design Patterns')).toBeInTheDocument()
    expect(screen.getByText('Architecture')).toBeInTheDocument()
  })

  it('should have correct href for navigation items', () => {
    render(<Sidebar navigation={mockNavigation} />)

    const introLink = screen.getByText('Introduction').closest('a')
    expect(introLink).toHaveAttribute('href', '/learn/intro')

    const basicsLink = screen.getByText('Basics').closest('a')
    expect(basicsLink).toHaveAttribute('href', '/learn/basics')
  })

  it('should highlight active navigation item', () => {
    mockUsePathname.mockReturnValue('/learn/intro')

    render(<Sidebar navigation={mockNavigation} />)

    const introLink = screen.getByText('Introduction').closest('a')
    expect(introLink).toHaveClass('bg-primary')
    expect(introLink).toHaveClass('text-primary-foreground')
    expect(introLink).toHaveClass('font-medium')
  })

  it('should not highlight inactive navigation items', () => {
    mockUsePathname.mockReturnValue('/learn/intro')

    render(<Sidebar navigation={mockNavigation} />)

    const basicsLink = screen.getByText('Basics').closest('a')
    expect(basicsLink).toHaveClass('text-muted-foreground')
    expect(basicsLink).not.toHaveClass('bg-primary')
  })

  it('should render empty sidebar when navigation is empty', () => {
    const { container } = render(<Sidebar navigation={[]} />)

    const nav = container.querySelector('nav')
    expect(nav).toBeInTheDocument()
    expect(nav?.children.length).toBe(0)
  })

  it('should apply hover styles to links', () => {
    render(<Sidebar navigation={mockNavigation} />)

    const basicsLink = screen.getByText('Basics').closest('a')
    expect(basicsLink).toHaveClass('hover:bg-accent')
    expect(basicsLink).toHaveClass('hover:text-accent-foreground')
  })

  it('should have transition-colors class for smooth transitions', () => {
    render(<Sidebar navigation={mockNavigation} />)

    const introLink = screen.getByText('Introduction').closest('a')
    expect(introLink).toHaveClass('transition-colors')
  })

  it('should render as aside element', () => {
    const { container } = render(<Sidebar navigation={mockNavigation} />)

    const aside = container.querySelector('aside')
    expect(aside).toBeInTheDocument()
  })

  it('should have hidden and lg:block classes for responsive behavior', () => {
    const { container } = render(<Sidebar navigation={mockNavigation} />)

    const aside = container.querySelector('aside')
    expect(aside).toHaveClass('hidden')
    expect(aside).toHaveClass('lg:block')
  })

  it('should render multiple groups correctly', () => {
    const navigation: NavigationGroup[] = [
      {
        category: 'group1',
        title: 'Group 1',
        items: [{ slug: 'item1', title: 'Item 1', order: 1 }],
      },
      {
        category: 'group2',
        title: 'Group 2',
        items: [{ slug: 'item2', title: 'Item 2', order: 1 }],
      },
      {
        category: 'group3',
        title: 'Group 3',
        items: [{ slug: 'item3', title: 'Item 3', order: 1 }],
      },
    ]

    render(<Sidebar navigation={navigation} />)

    expect(screen.getByText('group1')).toBeInTheDocument()
    expect(screen.getByText('group2')).toBeInTheDocument()
    expect(screen.getByText('group3')).toBeInTheDocument()
  })
})
