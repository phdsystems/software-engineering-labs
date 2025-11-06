import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MobileTOC } from '@/components/markdown/mobile-toc'
import type { TOCItem } from '@/types'

describe('MobileTOC Component', () => {
  const mockTOCItems: TOCItem[] = [
    { slug: 'introduction', title: 'Introduction', level: 2 },
    { slug: 'getting-started', title: 'Getting Started', level: 2 },
    { slug: 'installation', title: 'Installation', level: 3 },
    { slug: 'configuration', title: 'Configuration', level: 3 },
    { slug: 'advanced', title: 'Advanced Topics', level: 2 },
  ]

  beforeEach(() => {
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render floating button on mobile', () => {
    render(<MobileTOC items={mockTOCItems} />)

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button.parentElement?.parentElement).toHaveClass('lg:hidden')
  })

  it('should render button with menu icon', () => {
    const { container } = render(<MobileTOC items={mockTOCItems} />)

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('rounded-full')
    expect(button).toHaveClass('shadow-lg')
  })

  it('should not render when items array is empty', () => {
    const { container } = render(<MobileTOC items={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('should open sheet when button is clicked', async () => {
    const user = userEvent.setup()
    render(<MobileTOC items={mockTOCItems} />)

    const button = screen.getByRole('button')
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('On This Page')).toBeInTheDocument()
    })
  })

  it('should display all TOC items in sheet', async () => {
    const user = userEvent.setup()
    render(<MobileTOC items={mockTOCItems} />)

    const button = screen.getByRole('button')
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('Introduction')).toBeInTheDocument()
      expect(screen.getByText('Getting Started')).toBeInTheDocument()
      expect(screen.getByText('Installation')).toBeInTheDocument()
      expect(screen.getByText('Configuration')).toBeInTheDocument()
      expect(screen.getByText('Advanced Topics')).toBeInTheDocument()
    })
  })

  it('should apply pl-4 class to level 3 items', async () => {
    const user = userEvent.setup()
    render(<MobileTOC items={mockTOCItems} />)

    const button = screen.getByRole('button')
    await user.click(button)

    await waitFor(() => {
      const installationButton = screen.getByText('Installation')
      expect(installationButton).toHaveClass('pl-4')

      const configurationButton = screen.getByText('Configuration')
      expect(configurationButton).toHaveClass('pl-4')
    })
  })

  it('should not apply pl-4 class to level 2 items', async () => {
    const user = userEvent.setup()
    render(<MobileTOC items={mockTOCItems} />)

    const button = screen.getByRole('button')
    await user.click(button)

    await waitFor(() => {
      const introductionButton = screen.getByText('Introduction')
      expect(introductionButton).not.toHaveClass('pl-4')

      const gettingStartedButton = screen.getByText('Getting Started')
      expect(gettingStartedButton).not.toHaveClass('pl-4')
    })
  })

  it('should scroll to section when item is clicked', async () => {
    const user = userEvent.setup()

    // Create mock element
    const mockElement = document.createElement('div')
    mockElement.id = 'introduction'
    document.body.appendChild(mockElement)

    render(<MobileTOC items={mockTOCItems} />)

    const menuButton = screen.getByRole('button')
    await user.click(menuButton)

    const introButton = await screen.findByText('Introduction')
    await user.click(introButton)

    // Wait for setTimeout in component
    await waitFor(
      () => {
        expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
          behavior: 'smooth',
          block: 'start',
        })
      },
      { timeout: 200 }
    )

    // Clean up
    document.body.removeChild(mockElement)
  })

  it('should close sheet when item is clicked', async () => {
    const user = userEvent.setup()

    // Create mock element
    const mockElement = document.createElement('div')
    mockElement.id = 'introduction'
    document.body.appendChild(mockElement)

    render(<MobileTOC items={mockTOCItems} />)

    const menuButton = screen.getByRole('button')
    await user.click(menuButton)

    const introButton = await screen.findByText('Introduction')
    await user.click(introButton)

    // Sheet should close
    await waitFor(() => {
      expect(screen.queryByText('On This Page')).not.toBeInTheDocument()
    })

    // Clean up
    document.body.removeChild(mockElement)
  })

  it('should handle clicking item when element does not exist', async () => {
    const user = userEvent.setup()
    render(<MobileTOC items={mockTOCItems} />)

    const menuButton = screen.getByRole('button')
    await user.click(menuButton)

    const introButton = await screen.findByText('Introduction')

    // Should not throw error when element doesn't exist
    await expect(user.click(introButton)).resolves.not.toThrow()
  })

  it('should position button at bottom right', () => {
    const { container } = render(<MobileTOC items={mockTOCItems} />)

    const buttonContainer = container.querySelector('.fixed.bottom-4.right-4')
    expect(buttonContainer).toBeInTheDocument()
    expect(buttonContainer).toHaveClass('z-50')
  })

  it('should render sheet on right side', async () => {
    const user = userEvent.setup()
    render(<MobileTOC items={mockTOCItems} />)

    const button = screen.getByRole('button')
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('On This Page')).toBeInTheDocument()
    })
  })

  it('should render nav element with proper styling', async () => {
    const user = userEvent.setup()
    const { container } = render(<MobileTOC items={mockTOCItems} />)

    const button = screen.getByRole('button')
    await user.click(button)

    await waitFor(() => {
      const nav = container.querySelector('nav')
      expect(nav).toBeInTheDocument()
      expect(nav).toHaveClass('mt-6')
      expect(nav).toHaveClass('space-y-1')
    })
  })

  it('should render buttons with hover styles', async () => {
    const user = userEvent.setup()
    render(<MobileTOC items={mockTOCItems} />)

    const menuButton = screen.getByRole('button')
    await user.click(menuButton)

    await waitFor(() => {
      const tocButton = screen.getByText('Introduction')
      expect(tocButton).toHaveClass('hover:text-foreground')
      expect(tocButton).toHaveClass('transition-colors')
    })
  })

  it('should handle single item', () => {
    const singleItem: TOCItem[] = [{ slug: 'only-item', title: 'Only Item', level: 2 }]

    render(<MobileTOC items={singleItem} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
