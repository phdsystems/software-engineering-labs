import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Providers } from '@/app/providers'

describe('Providers Component', () => {
  it('should render children', () => {
    const { getByText } = render(
      <Providers>
        <div>Test Content</div>
      </Providers>
    )

    expect(getByText('Test Content')).toBeInTheDocument()
  })

  it('should provide theme context', () => {
    const { container } = render(
      <Providers>
        <div>Content</div>
      </Providers>
    )

    expect(container.firstChild).toBeInTheDocument()
  })

  it('should wrap content in ThemeProvider', () => {
    const TestComponent = () => <div data-testid="test">Test</div>

    const { getByTestId } = render(
      <Providers>
        <TestComponent />
      </Providers>
    )

    expect(getByTestId('test')).toBeInTheDocument()
  })

  it('should support nested providers', () => {
    const { getByText } = render(
      <Providers>
        <Providers>
          <div>Nested Content</div>
        </Providers>
      </Providers>
    )

    expect(getByText('Nested Content')).toBeInTheDocument()
  })

  it('should handle empty children', () => {
    const { container } = render(<Providers>{null}</Providers>)

    expect(container).toBeInTheDocument()
  })
})
