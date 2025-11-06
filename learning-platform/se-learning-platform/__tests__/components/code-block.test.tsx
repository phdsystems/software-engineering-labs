import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CodeBlock } from '@/components/markdown/code-block'

describe('CodeBlock Component', () => {
  beforeEach(() => {
    // Clear mock calls before each test
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render code block with children', () => {
    render(<CodeBlock>const x = 10;</CodeBlock>)
    expect(screen.getByText('const x = 10;')).toBeInTheDocument()
  })

  it('should render language label when provided', () => {
    render(<CodeBlock language="javascript">const x = 10;</CodeBlock>)
    expect(screen.getByText('javascript')).toBeInTheDocument()
  })

  it('should not render language label when not provided', () => {
    const { container } = render(<CodeBlock>const x = 10;</CodeBlock>)
    const languageLabel = container.querySelector('.font-mono')
    expect(languageLabel).not.toBeInTheDocument()
  })

  it('should render copy button', () => {
    render(<CodeBlock>const x = 10;</CodeBlock>)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('should have copy button with correct styling', () => {
    render(<CodeBlock code="test">test</CodeBlock>)

    const copyButton = screen.getByRole('button')
    expect(copyButton).toHaveClass('h-8')
    expect(copyButton).toHaveClass('w-8')
  })

  it('should render code in pre element', () => {
    const { container } = render(<CodeBlock>const x = 10;</CodeBlock>)

    const pre = container.querySelector('pre')
    expect(pre).toBeInTheDocument()
    expect(pre).toHaveClass('overflow-x-auto')
    expect(pre).toHaveClass('rounded-lg')
  })

  it('should have group hover effect', () => {
    const { container } = render(<CodeBlock>code</CodeBlock>)

    const wrapper = container.querySelector('.group')
    expect(wrapper).toBeInTheDocument()
  })

  it('should position language label correctly', () => {
    const { container } = render(<CodeBlock language="typescript">code</CodeBlock>)

    const langLabel = container.querySelector('.absolute.left-3.top-2')
    expect(langLabel).toBeInTheDocument()
    expect(langLabel).toHaveTextContent('typescript')
  })

  it('should position copy button correctly', () => {
    const { container } = render(<CodeBlock>code</CodeBlock>)

    const buttonWrapper = container.querySelector('.absolute.right-2.top-2')
    expect(buttonWrapper).toBeInTheDocument()
  })

  it('should have opacity transition on copy button', () => {
    const { container } = render(<CodeBlock>code</CodeBlock>)

    const buttonWrapper = container.querySelector('.opacity-0.group-hover\\:opacity-100')
    expect(buttonWrapper).toBeInTheDocument()
  })

  it('should copy children text when copy button is clicked', async () => {
    const user = userEvent.setup()
    render(<CodeBlock>const x = 10;</CodeBlock>)

    const copyButton = screen.getByRole('button')
    await user.click(copyButton)

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const x = 10;')
    })
  })

  it('should copy code prop when provided', async () => {
    const user = userEvent.setup()
    render(<CodeBlock code="const y = 20;">const x = 10;</CodeBlock>)

    const copyButton = screen.getByRole('button')
    await user.click(copyButton)

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const y = 20;')
    })
  })

  it('should show check icon after copy', async () => {
    const user = userEvent.setup()
    const { container } = render(<CodeBlock>const x = 10;</CodeBlock>)

    const copyButton = screen.getByRole('button')
    await user.click(copyButton)

    // Wait for check icon to appear
    const checkIcon = container.querySelector('.text-green-500')
    expect(checkIcon).toBeInTheDocument()
  })

  it('should revert to copy icon after 2 seconds', async () => {
    vi.useFakeTimers()
    const user = userEvent.setup({ delay: null })
    const { container } = render(<CodeBlock>const x = 10;</CodeBlock>)

    const copyButton = screen.getByRole('button')
    await user.click(copyButton)

    // Check icon should be visible
    let checkIcon = container.querySelector('.text-green-500')
    expect(checkIcon).toBeInTheDocument()

    // Fast-forward time by 2 seconds
    vi.advanceTimersByTime(2000)

    // Check icon should be gone, copy icon should be back
    checkIcon = container.querySelector('.text-green-500')
    expect(checkIcon).not.toBeInTheDocument()

    vi.useRealTimers()
  })

  it('should handle copy when children is not a string', async () => {
    const user = userEvent.setup()
    render(
      <CodeBlock>
        <div>complex content</div>
      </CodeBlock>
    )

    const copyButton = screen.getByRole('button')
    await user.click(copyButton)

    // Should not call writeText when children is not a string and no code prop
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled()
  })

  it('should prioritize code prop over children for copying', async () => {
    const user = userEvent.setup()
    render(<CodeBlock code="code prop value">children value</CodeBlock>)

    const copyButton = screen.getByRole('button')
    await user.click(copyButton)

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('code prop value')
    })
    expect(navigator.clipboard.writeText).not.toHaveBeenCalledWith('children value')
  })
})
