import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { TableOfContents } from '@/components/markdown/table-of-contents'
import type { TOCItem } from '@/types'

describe('TableOfContents Component', () => {
  const mockTOCItems: TOCItem[] = [
    { slug: 'introduction', title: 'Introduction', level: 2 },
    { slug: 'getting-started', title: 'Getting Started', level: 2 },
    { slug: 'installation', title: 'Installation', level: 3 },
    { slug: 'configuration', title: 'Configuration', level: 3 },
    { slug: 'advanced', title: 'Advanced Topics', level: 2 },
  ]

  let mockIntersectionObserver: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockIntersectionObserver = vi.fn()
    mockIntersectionObserver.mockReturnValue({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })

    global.IntersectionObserver = mockIntersectionObserver as any
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render "On This Page" heading', () => {
    render(<TableOfContents items={mockTOCItems} />)
    expect(screen.getByText('On This Page')).toBeInTheDocument()
  })

  it('should render all TOC items', () => {
    render(<TableOfContents items={mockTOCItems} />)

    expect(screen.getByText('Introduction')).toBeInTheDocument()
    expect(screen.getByText('Getting Started')).toBeInTheDocument()
    expect(screen.getByText('Installation')).toBeInTheDocument()
    expect(screen.getByText('Configuration')).toBeInTheDocument()
    expect(screen.getByText('Advanced Topics')).toBeInTheDocument()
  })

  it('should render links with correct href', () => {
    render(<TableOfContents items={mockTOCItems} />)

    const introLink = screen.getByText('Introduction').closest('a')
    expect(introLink).toHaveAttribute('href', '#introduction')

    const gettingStartedLink = screen.getByText('Getting Started').closest('a')
    expect(gettingStartedLink).toHaveAttribute('href', '#getting-started')
  })

  it('should apply pl-4 class to level 3 items', () => {
    render(<TableOfContents items={mockTOCItems} />)

    const installationLink = screen.getByText('Installation').closest('a')
    expect(installationLink).toHaveClass('pl-4')

    const configurationLink = screen.getByText('Configuration').closest('a')
    expect(configurationLink).toHaveClass('pl-4')
  })

  it('should not apply pl-4 class to level 2 items', () => {
    render(<TableOfContents items={mockTOCItems} />)

    const introductionLink = screen.getByText('Introduction').closest('a')
    expect(introductionLink).not.toHaveClass('pl-4')
  })

  it('should render nothing when items array is empty', () => {
    const { container } = render(<TableOfContents items={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('should set up IntersectionObserver', () => {
    render(<TableOfContents items={mockTOCItems} />)

    expect(mockIntersectionObserver).toHaveBeenCalled()
  })

  it('should observe DOM elements for TOC items', () => {
    const mockObserve = vi.fn()
    mockIntersectionObserver.mockReturnValue({
      observe: mockObserve,
      disconnect: vi.fn(),
    })

    // Create mock elements
    mockTOCItems.forEach((item) => {
      const element = document.createElement('div')
      element.id = item.slug
      document.body.appendChild(element)
    })

    render(<TableOfContents items={mockTOCItems} />)

    // Should have called observe for each item that exists in DOM
    expect(mockObserve).toHaveBeenCalled()

    // Clean up
    mockTOCItems.forEach((item) => {
      const element = document.getElementById(item.slug)
      if (element) document.body.removeChild(element)
    })
  })

  it('should disconnect observer on unmount', () => {
    const mockDisconnect = vi.fn()
    mockIntersectionObserver.mockReturnValue({
      observe: vi.fn(),
      disconnect: mockDisconnect,
    })

    const { unmount } = render(<TableOfContents items={mockTOCItems} />)
    unmount()

    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('should render with hover styles', () => {
    render(<TableOfContents items={mockTOCItems} />)

    const link = screen.getByText('Introduction').closest('a')
    expect(link).toHaveClass('hover:text-foreground')
  })

  it('should apply transition colors', () => {
    render(<TableOfContents items={mockTOCItems} />)

    const link = screen.getByText('Introduction').closest('a')
    expect(link).toHaveClass('transition-colors')
  })

  it('should handle single item', () => {
    const singleItem: TOCItem[] = [
      { slug: 'only-item', title: 'Only Item', level: 2 },
    ]

    render(<TableOfContents items={singleItem} />)
    expect(screen.getByText('Only Item')).toBeInTheDocument()
  })

  it('should render nav element', () => {
    const { container } = render(<TableOfContents items={mockTOCItems} />)

    const nav = container.querySelector('nav')
    expect(nav).toBeInTheDocument()
    expect(nav).toHaveClass('space-y-1')
  })

  it('should set active ID when intersection observer triggers', async () => {
    let observerCallback: IntersectionObserverCallback = () => {}
    const mockObserve = vi.fn()
    const mockDisconnect = vi.fn()

    mockIntersectionObserver.mockImplementation((callback) => {
      observerCallback = callback
      return {
        observe: mockObserve,
        disconnect: mockDisconnect,
        unobserve: vi.fn(),
      }
    })

    // Create mock elements
    mockTOCItems.forEach((item) => {
      const element = document.createElement('div')
      element.id = item.slug
      document.body.appendChild(element)
    })

    render(<TableOfContents items={mockTOCItems} />)

    // Simulate intersection
    const mockEntry: Partial<IntersectionObserverEntry> = {
      isIntersecting: true,
      target: document.getElementById('introduction')!,
    }

    observerCallback([mockEntry as IntersectionObserverEntry], {} as IntersectionObserver)

    // Wait for state update and re-render
    await waitFor(() => {
      const introLink = screen.getByText('Introduction').closest('a')
      expect(introLink).toHaveClass('font-medium')
      expect(introLink).toHaveClass('text-foreground')
    })

    // Clean up
    mockTOCItems.forEach((item) => {
      const element = document.getElementById(item.slug)
      if (element) document.body.removeChild(element)
    })
  })

  it('should only highlight active section', async () => {
    let observerCallback: IntersectionObserverCallback = () => {}
    const mockObserve = vi.fn()
    const mockDisconnect = vi.fn()

    mockIntersectionObserver.mockImplementation((callback) => {
      observerCallback = callback
      return {
        observe: mockObserve,
        disconnect: mockDisconnect,
        unobserve: vi.fn(),
      }
    })

    // Create mock elements
    mockTOCItems.forEach((item) => {
      const element = document.createElement('div')
      element.id = item.slug
      document.body.appendChild(element)
    })

    render(<TableOfContents items={mockTOCItems} />)

    // Simulate intersection with 'getting-started'
    const mockEntry: Partial<IntersectionObserverEntry> = {
      isIntersecting: true,
      target: document.getElementById('getting-started')!,
    }

    observerCallback([mockEntry as IntersectionObserverEntry], {} as IntersectionObserver)

    // Wait for state update and re-render
    await waitFor(() => {
      const gettingStartedLink = screen.getByText('Getting Started').closest('a')
      expect(gettingStartedLink).toHaveClass('font-medium')
      expect(gettingStartedLink).toHaveClass('text-foreground')

      const introLink = screen.getByText('Introduction').closest('a')
      expect(introLink).not.toHaveClass('font-medium')
      expect(introLink).toHaveClass('text-muted-foreground')
    })

    // Clean up
    mockTOCItems.forEach((item) => {
      const element = document.getElementById(item.slug)
      if (element) document.body.removeChild(element)
    })
  })

  it('should not update active ID when not intersecting', async () => {
    let observerCallback: IntersectionObserverCallback = () => {}
    const mockObserve = vi.fn()
    const mockDisconnect = vi.fn()

    mockIntersectionObserver.mockImplementation((callback) => {
      observerCallback = callback
      return {
        observe: mockObserve,
        disconnect: mockDisconnect,
        unobserve: vi.fn(),
      }
    })

    // Create mock elements
    mockTOCItems.forEach((item) => {
      const element = document.createElement('div')
      element.id = item.slug
      document.body.appendChild(element)
    })

    render(<TableOfContents items={mockTOCItems} />)

    // Simulate non-intersecting entry
    const mockEntry: Partial<IntersectionObserverEntry> = {
      isIntersecting: false,
      target: document.getElementById('introduction')!,
    }

    observerCallback([mockEntry as IntersectionObserverEntry], {} as IntersectionObserver)

    // Wait a bit to ensure no state update occurs
    await new Promise((resolve) => setTimeout(resolve, 100))

    // No link should be active (all should be muted)
    const introLink = screen.getByText('Introduction').closest('a')
    expect(introLink).toHaveClass('text-muted-foreground')

    // Clean up
    mockTOCItems.forEach((item) => {
      const element = document.getElementById(item.slug)
      if (element) document.body.removeChild(element)
    })
  })
})
