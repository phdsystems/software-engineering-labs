import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

describe('Card Component', () => {
  it('should render basic card', () => {
    const { container } = render(<Card>Card content</Card>)
    expect(container.querySelector('.rounded-xl')).toBeInTheDocument()
  })

  it('should render card with all sections', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Card Content</CardContent>
        <CardFooter>Card Footer</CardFooter>
      </Card>
    )

    expect(screen.getByText('Card Title')).toBeInTheDocument()
    expect(screen.getByText('Card Description')).toBeInTheDocument()
    expect(screen.getByText('Card Content')).toBeInTheDocument()
    expect(screen.getByText('Card Footer')).toBeInTheDocument()
  })

  it('should apply custom className to card', () => {
    const { container } = render(<Card className="custom-class">Content</Card>)
    const card = container.firstChild
    expect(card).toHaveClass('custom-class')
  })

  it('should render card title as div with semibold font', () => {
    render(
      <CardHeader>
        <CardTitle>Test Title</CardTitle>
      </CardHeader>
    )

    const title = screen.getByText('Test Title')
    expect(title.tagName).toBe('DIV')
    expect(title.className).toContain('font-semibold')
  })

  it('should render card description with muted text', () => {
    const { container } = render(
      <CardDescription>Test Description</CardDescription>
    )

    const description = container.querySelector('.text-muted-foreground')
    expect(description).toBeInTheDocument()
  })

  it('should render card header with spacing', () => {
    const { container } = render(
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
    )

    const header = container.querySelector('.flex.flex-col')
    expect(header).toBeInTheDocument()
  })

  it('should render card footer with flex layout', () => {
    const { container } = render(
      <CardFooter>Footer content</CardFooter>
    )

    const footer = container.querySelector('.flex')
    expect(footer).toBeInTheDocument()
  })

  it('should render nested components correctly', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>
            <span>Complex</span> <strong>Title</strong>
          </CardTitle>
        </CardHeader>
      </Card>
    )

    expect(screen.getByText('Complex')).toBeInTheDocument()
    expect(screen.getByText('Title')).toBeInTheDocument()
  })

  it('should maintain background and border styles', () => {
    const { container } = render(<Card>Content</Card>)
    const card = container.firstChild
    expect(card).toHaveClass('bg-card')
    expect(card).toHaveClass('border')
  })
})
