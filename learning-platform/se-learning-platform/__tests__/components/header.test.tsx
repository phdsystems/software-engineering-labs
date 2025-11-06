import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from '@/components/layout/header'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock theme toggle component
vi.mock('@/components/layout/theme-toggle', () => ({
  ThemeToggle: () => <button>Theme Toggle</button>,
}))

// Mock mobile nav component
vi.mock('@/components/layout/mobile-nav', () => ({
  MobileNav: () => <nav>Mobile Navigation</nav>,
}))

describe('Header Component', () => {
  it('should render logo with link to homepage', () => {
    render(<Header />)
    const logo = screen.getByText('SE Learning')
    expect(logo).toBeInTheDocument()
    expect(logo.closest('a')).toHaveAttribute('href', '/')
  })

  it('should render all desktop navigation links', () => {
    render(<Header />)

    const learnLinks = screen.getAllByRole('link', { name: /learn/i })
    const learnNavLink = learnLinks.find(link => link.getAttribute('href') === '/learn')
    expect(learnNavLink).toBeTruthy()

    expect(screen.getByRole('link', { name: /^principles$/i })).toHaveAttribute('href', '/learn/design-principle/overview')
    expect(screen.getByRole('link', { name: /^patterns$/i })).toHaveAttribute('href', '/learn/design-pattern/overview')
    expect(screen.getByRole('link', { name: /^architecture$/i })).toHaveAttribute('href', '/learn/architecture-pattern/overview')
    expect(screen.getByRole('link', { name: /^examples$/i })).toHaveAttribute('href', '/learn/example/overview')
  })

  it('should render desktop search button with keyboard shortcut', () => {
    render(<Header />)
    const searchButton = screen.getByRole('button', { name: /search\.\.\./i })
    expect(searchButton).toBeInTheDocument()
    expect(searchButton).toHaveTextContent('⌘K')
  })

  it('should render mobile search button with accessible name', () => {
    render(<Header />)
    const mobileSearchButton = screen.getByRole('button', { name: /^search$/i })
    expect(mobileSearchButton).toBeInTheDocument()
  })

  it('should render theme toggle component', () => {
    render(<Header />)
    expect(screen.getByText('Theme Toggle')).toBeInTheDocument()
  })

  it('should render mobile menu toggle with accessible name', () => {
    render(<Header />)
    const menuButton = screen.getByRole('button', { name: /toggle menu/i })
    expect(menuButton).toBeInTheDocument()
  })

  it('should have sticky positioning classes', () => {
    const { container } = render(<Header />)
    const header = container.querySelector('header')
    expect(header?.className).toContain('sticky')
    expect(header?.className).toContain('top-0')
  })

  it('should have backdrop blur effect classes', () => {
    const { container } = render(<Header />)
    const header = container.querySelector('header')
    expect(header?.className).toContain('backdrop-blur')
  })

  it('should have border at bottom', () => {
    const { container } = render(<Header />)
    const header = container.querySelector('header')
    expect(header?.className).toContain('border-b')
  })

  it('should handle search button click', async () => {
    const user = userEvent.setup()
    render(<Header />)

    const searchButton = screen.getByRole('button', { name: /search\.\.\./i })
    await user.click(searchButton)

    // Should not throw error (state change happens internally)
    expect(searchButton).toBeInTheDocument()
  })

  it('should handle mobile search button click', async () => {
    const user = userEvent.setup()
    render(<Header />)

    const mobileSearchButton = screen.getByRole('button', { name: /^search$/i })
    await user.click(mobileSearchButton)

    // Should not throw error (state change happens internally)
    expect(mobileSearchButton).toBeInTheDocument()
  })

  it('should have proper z-index for overlay', () => {
    const { container } = render(<Header />)
    const header = container.querySelector('header')
    expect(header?.className).toContain('z-50')
  })

  it('should be responsive with container class', () => {
    const { container } = render(<Header />)
    const headerContent = container.querySelector('.container')
    expect(headerContent).toBeInTheDocument()
  })

  it('should have correct height', () => {
    const { container } = render(<Header />)
    const headerContent = container.querySelector('.h-16')
    expect(headerContent).toBeInTheDocument()
  })

  it('should hide desktop nav on mobile screens', () => {
    const { container } = render(<Header />)
    const desktopNav = container.querySelector('nav.hidden.md\\:flex')
    expect(desktopNav).toBeInTheDocument()
  })

  it('should have accessible logo icon', () => {
    const { container } = render(<Header />)
    const bookIcon = container.querySelector('svg')
    expect(bookIcon).toBeInTheDocument()
  })
})
