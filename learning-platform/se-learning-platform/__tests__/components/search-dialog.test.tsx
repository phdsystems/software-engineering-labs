import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchDialog } from '@/components/search/search-dialog'
import type { ContentListItem } from '@/types'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('SearchDialog Component', () => {
  const mockContent: ContentListItem[] = [
    {
      slug: 'solid-principles',
      title: 'SOLID Principles',
      description: 'Learn about SOLID design principles',
      category: 'design-patterns',
      metadata: {
        readingTime: 10,
        difficulty: 'intermediate',
        tags: ['solid', 'design', 'principles'],
        lastModified: '2025-01-01',
      },
    },
    {
      slug: 'clean-architecture',
      title: 'Clean Architecture',
      description: 'Understanding clean architecture patterns',
      category: 'architecture',
      metadata: {
        readingTime: 15,
        difficulty: 'advanced',
        tags: ['architecture', 'clean', 'patterns'],
        lastModified: '2025-01-02',
      },
    },
    {
      slug: 'microservices',
      title: 'Microservices Architecture',
      description: 'Building scalable microservices',
      category: 'architecture',
      metadata: {
        readingTime: 20,
        difficulty: 'advanced',
        tags: ['microservices', 'distributed'],
        lastModified: '2025-01-03',
      },
    },
  ]

  beforeEach(() => {
    mockPush.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render dialog with search input', () => {
    render(<SearchDialog content={mockContent} />)

    // Dialog should be closed initially
    expect(screen.queryByPlaceholderText(/search documentation/i)).not.toBeInTheDocument()
  })

  it('should open dialog with Cmd+K keyboard shortcut', async () => {
    const user = userEvent.setup()
    render(<SearchDialog content={mockContent} />)

    // Trigger Cmd+K
    await user.keyboard('{Meta>}k{/Meta}')

    // Dialog should be open
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search documentation/i)).toBeInTheDocument()
    })
  })

  it('should open dialog with Ctrl+K keyboard shortcut', async () => {
    const user = userEvent.setup()
    render(<SearchDialog content={mockContent} />)

    // Trigger Ctrl+K
    await user.keyboard('{Control>}k{/Control}')

    // Dialog should be open
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search documentation/i)).toBeInTheDocument()
    })
  })

  it('should display placeholder text when no query entered', async () => {
    const user = userEvent.setup()
    render(<SearchDialog content={mockContent} />)

    await user.keyboard('{Meta>}k{/Meta}')

    await waitFor(() => {
      expect(screen.getByText(/start typing to search documentation/i)).toBeInTheDocument()
    })
  })

  it('should display popular topics when no query entered', async () => {
    const user = userEvent.setup()
    render(<SearchDialog content={mockContent} />)

    await user.keyboard('{Meta>}k{/Meta}')

    await waitFor(() => {
      expect(screen.getByText('Popular topics:')).toBeInTheDocument()
      expect(screen.getByText('SOLID')).toBeInTheDocument()
      expect(screen.getByText('Clean Architecture')).toBeInTheDocument()
      expect(screen.getByText('Design Patterns')).toBeInTheDocument()
      expect(screen.getByText('Microservices')).toBeInTheDocument()
      expect(screen.getByText('CQRS')).toBeInTheDocument()
    })
  })

  it('should search when user types in input', async () => {
    const user = userEvent.setup()
    render(<SearchDialog content={mockContent} />)

    await user.keyboard('{Meta>}k{/Meta}')

    const input = await screen.findByPlaceholderText(/search documentation/i)
    await user.type(input, 'solid')

    await waitFor(() => {
      expect(screen.getByText('SOLID Principles')).toBeInTheDocument()
    })
  })

  it('should display search results with metadata', async () => {
    const user = userEvent.setup()
    render(<SearchDialog content={mockContent} />)

    await user.keyboard('{Meta>}k{/Meta}')

    const input = await screen.findByPlaceholderText(/search documentation/i)
    await user.type(input, 'architecture')

    await waitFor(
      () => {
        expect(screen.getByText('Clean Architecture')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    expect(screen.getByText('Understanding clean architecture patterns')).toBeInTheDocument()
    expect(screen.getByText(/15 min read/)).toBeInTheDocument()
  })

  it('should limit results to 10 items', async () => {
    const largeContentList: ContentListItem[] = Array.from({ length: 20 }, (_, i) => ({
      slug: `item-${i}`,
      title: `Test Item ${i}`,
      description: 'Test description',
      category: 'test',
      metadata: {
        readingTime: 5,
        difficulty: 'beginner',
        tags: ['test'],
        lastModified: '2025-01-01',
      },
    }))

    const user = userEvent.setup()
    render(<SearchDialog content={largeContentList} />)

    await user.keyboard('{Meta>}k{/Meta}')

    const input = await screen.findByPlaceholderText(/search documentation/i)
    await user.type(input, 'test')

    await waitFor(() => {
      const results = screen.getAllByText(/Test Item \d+/)
      expect(results.length).toBeLessThanOrEqual(10)
    })
  })

  it('should display "no results" message when search returns nothing', async () => {
    const user = userEvent.setup()
    render(<SearchDialog content={mockContent} />)

    await user.keyboard('{Meta>}k{/Meta}')

    const input = await screen.findByPlaceholderText(/search documentation/i)
    await user.type(input, 'nonexistent query xyz')

    await waitFor(() => {
      expect(screen.getByText(/no results found for "nonexistent query xyz"/i)).toBeInTheDocument()
    })
  })

  it('should navigate to selected result and close dialog', async () => {
    const user = userEvent.setup()
    render(<SearchDialog content={mockContent} />)

    await user.keyboard('{Meta>}k{/Meta}')

    const input = await screen.findByPlaceholderText(/search documentation/i)
    await user.type(input, 'solid')

    const result = await screen.findByText('SOLID Principles')
    await user.click(result)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/learn/solid-principles')
      expect(screen.queryByPlaceholderText(/search documentation/i)).not.toBeInTheDocument()
    })
  })

  it('should clear query and results when dialog closes', async () => {
    const user = userEvent.setup()
    render(<SearchDialog content={mockContent} />)

    // Open dialog
    await user.keyboard('{Meta>}k{/Meta}')

    const input = await screen.findByPlaceholderText(/search documentation/i)
    await user.type(input, 'solid')

    await waitFor(() => {
      expect(screen.getByText('SOLID Principles')).toBeInTheDocument()
    })

    // Close dialog with Escape
    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/search documentation/i)).not.toBeInTheDocument()
    })

    // Reopen dialog
    await user.keyboard('{Meta>}k{/Meta}')

    await waitFor(() => {
      const reopenedInput = screen.getByPlaceholderText(/search documentation/i)
      expect(reopenedInput).toHaveValue('')
      expect(screen.queryByText('SOLID Principles')).not.toBeInTheDocument()
    })
  })

  it('should handle popular topic click', async () => {
    const user = userEvent.setup()
    render(<SearchDialog content={mockContent} />)

    await user.keyboard('{Meta>}k{/Meta}')

    const solidButton = await screen.findByRole('button', { name: 'SOLID' })
    await user.click(solidButton)

    await waitFor(() => {
      expect(screen.getByText('SOLID Principles')).toBeInTheDocument()
    })
  })

  it('should display category with spaces instead of dashes', async () => {
    const user = userEvent.setup()
    render(<SearchDialog content={mockContent} />)

    await user.keyboard('{Meta>}k{/Meta}')

    const input = await screen.findByPlaceholderText(/search documentation/i)
    await user.type(input, 'solid')

    await waitFor(() => {
      expect(screen.getByText('design patterns')).toBeInTheDocument()
    })
  })

  it('should render search icon', async () => {
    const user = userEvent.setup()
    render(<SearchDialog content={mockContent} />)

    await user.keyboard('{Meta>}k{/Meta}')

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search documentation/i)
      expect(searchInput.parentElement).toBeInTheDocument()
    })
  })

  it('should auto-focus search input when dialog opens', async () => {
    const user = userEvent.setup()
    render(<SearchDialog content={mockContent} />)

    await user.keyboard('{Meta>}k{/Meta}')

    await waitFor(() => {
      const input = screen.getByPlaceholderText(/search documentation/i)
      expect(input).toHaveFocus()
    })
  })

  it('should clear results when query is cleared', async () => {
    const user = userEvent.setup()
    render(<SearchDialog content={mockContent} />)

    await user.keyboard('{Meta>}k{/Meta}')

    const input = await screen.findByPlaceholderText(/search documentation/i)
    await user.type(input, 'solid')

    await waitFor(() => {
      expect(screen.getByText('SOLID Principles')).toBeInTheDocument()
    })

    await user.clear(input)

    await waitFor(() => {
      expect(screen.queryByText('SOLID Principles')).not.toBeInTheDocument()
      expect(screen.getByText(/start typing to search documentation/i)).toBeInTheDocument()
    })
  })
})
