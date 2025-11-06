import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Footer } from '@/components/layout/footer'

describe('Footer Component', () => {
  it('should render footer element', () => {
    render(<Footer />)
    const footer = screen.getByRole('contentinfo')
    expect(footer).toBeInTheDocument()
  })

  it('should display brand name and logo', () => {
    render(<Footer />)
    expect(screen.getByText('SE Learning')).toBeInTheDocument()
  })

  it('should display brand description', () => {
    render(<Footer />)
    expect(
      screen.getByText(/Software engineering education from first principles/i)
    ).toBeInTheDocument()
  })

  it('should display current year in copyright', () => {
    render(<Footer />)
    const currentYear = new Date().getFullYear()
    const copyrightText = `© ${currentYear} PHD Systems & PHD Labs. All rights reserved.`
    expect(screen.getByText(copyrightText)).toBeInTheDocument()
  })

  it('should render learning section links', () => {
    render(<Footer />)
    expect(screen.getByText('First Principles')).toBeInTheDocument()
    expect(screen.getByText('Learning Paths')).toBeInTheDocument()
    expect(screen.getByText('Design Principles')).toBeInTheDocument()
  })

  it('should have correct href for learning links', () => {
    render(<Footer />)
    const firstPrinciplesLink = screen.getByText('First Principles').closest('a')
    expect(firstPrinciplesLink).toHaveAttribute(
      'href',
      '/learn/guide/first-principles-approach'
    )

    const learningPathsLink = screen.getByText('Learning Paths').closest('a')
    expect(learningPathsLink).toHaveAttribute('href', '/learn/guide/learning-path')
  })

  it('should render categories section', () => {
    render(<Footer />)
    // Check for section heading
    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings.some(h => h.textContent === 'Learning')).toBe(true)
  })
})
