import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'

describe('Input Component', () => {
  it('should render input element', () => {
    render(<Input placeholder="Enter text" />)
    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toBeInTheDocument()
  })

  it('should render with specified type', () => {
    render(<Input type="email" data-testid="email-input" />)
    const input = screen.getByTestId('email-input')
    expect(input).toHaveAttribute('type', 'email')
  })

  it('should handle user input', async () => {
    const user = userEvent.setup()
    render(<Input data-testid="text-input" />)
    const input = screen.getByTestId('text-input') as HTMLInputElement

    await user.type(input, 'Hello, World!')
    expect(input.value).toBe('Hello, World!')
  })

  it('should apply custom className', () => {
    render(<Input className="custom-class" data-testid="custom-input" />)
    const input = screen.getByTestId('custom-input')
    expect(input).toHaveClass('custom-class')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled data-testid="disabled-input" />)
    const input = screen.getByTestId('disabled-input')
    expect(input).toBeDisabled()
  })

  it('should display placeholder text', () => {
    render(<Input placeholder="Search..." />)
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('should forward ref correctly', () => {
    const ref = { current: null } as React.RefObject<HTMLInputElement>
    render(<Input ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('should handle different input types', () => {
    const { rerender } = render(<Input type="text" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'text')

    rerender(<Input type="password" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'password')

    rerender(<Input type="number" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'number')
  })
})
