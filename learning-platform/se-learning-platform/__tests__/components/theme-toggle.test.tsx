import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from '@/components/layout/theme-toggle'

// Mock next-themes
const mockSetTheme = vi.fn()
vi.mock('next-themes', () => ({
  useTheme: () => ({
    setTheme: mockSetTheme,
    theme: 'light',
  }),
}))

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render theme toggle button', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button).toBeInTheDocument()
  })

  it('should display sun and moon icons', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button).toBeInTheDocument()
    // Icons are SVG elements rendered by lucide-react
    const svgElements = button.querySelectorAll('svg')
    expect(svgElements.length).toBeGreaterThan(0)
  })

  it('should open dropdown menu on click', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    await user.click(button)

    expect(screen.getByText('Light')).toBeInTheDocument()
    expect(screen.getByText('Dark')).toBeInTheDocument()
    expect(screen.getByText('System')).toBeInTheDocument()
  })

  it('should set theme to light when Light is clicked', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    await user.click(button)

    const lightOption = screen.getByText('Light')
    await user.click(lightOption)

    expect(mockSetTheme).toHaveBeenCalledWith('light')
  })

  it('should set theme to dark when Dark is clicked', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    await user.click(button)

    const darkOption = screen.getByText('Dark')
    await user.click(darkOption)

    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })

  it('should set theme to system when System is clicked', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    await user.click(button)

    const systemOption = screen.getByText('System')
    await user.click(systemOption)

    expect(mockSetTheme).toHaveBeenCalledWith('system')
  })
})
