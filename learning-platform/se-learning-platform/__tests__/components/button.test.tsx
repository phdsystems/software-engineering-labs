import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('should handle click events', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<Button onClick={handleClick}>Click me</Button>)

    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should not trigger click when disabled', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<Button disabled onClick={handleClick}>Disabled</Button>)

    await user.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('should render with default variant', () => {
    const { container } = render(<Button>Default</Button>)
    const button = container.querySelector('button')
    expect(button?.className).toContain('bg-primary')
  })

  it('should render with outline variant', () => {
    const { container } = render(<Button variant="outline">Outline</Button>)
    const button = container.querySelector('button')
    expect(button?.className).toContain('border')
  })

  it('should render with ghost variant', () => {
    const { container } = render(<Button variant="ghost">Ghost</Button>)
    const button = container.querySelector('button')
    expect(button?.className).toContain('hover:bg-accent')
  })

  it('should render with small size', () => {
    const { container } = render(<Button size="sm">Small</Button>)
    const button = container.querySelector('button')
    expect(button?.className).toContain('h-8')
  })

  it('should render with large size', () => {
    const { container } = render(<Button size="lg">Large</Button>)
    const button = container.querySelector('button')
    expect(button?.className).toContain('h-10')
  })

  it('should render with icon size', () => {
    const { container } = render(<Button size="icon">+</Button>)
    const button = container.querySelector('button')
    expect(button?.className).toContain('h-9')
    expect(button?.className).toContain('w-9')
  })

  it('should merge custom className', () => {
    const { container } = render(<Button className="custom-class">Custom</Button>)
    const button = container.querySelector('button')
    expect(button?.className).toContain('custom-class')
  })

  it('should support type attribute', () => {
    render(<Button type="submit">Submit</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('should render children correctly', () => {
    render(
      <Button>
        <span>Icon</span>
        <span>Text</span>
      </Button>
    )
    expect(screen.getByText('Icon')).toBeInTheDocument()
    expect(screen.getByText('Text')).toBeInTheDocument()
  })
})
