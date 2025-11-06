import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

describe('Tabs Component', () => {
  const TabsExample = () => (
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Content 1</TabsContent>
      <TabsContent value="tab2">Content 2</TabsContent>
      <TabsContent value="tab3">Content 3</TabsContent>
    </Tabs>
  )

  it('should render tabs with triggers and content', () => {
    render(<TabsExample />)

    expect(screen.getByText('Tab 1')).toBeInTheDocument()
    expect(screen.getByText('Tab 2')).toBeInTheDocument()
    expect(screen.getByText('Tab 3')).toBeInTheDocument()
  })

  it('should display default tab content', () => {
    render(<TabsExample />)

    expect(screen.getByText('Content 1')).toBeInTheDocument()
  })

  it('should switch tabs on click', async () => {
    const user = userEvent.setup()
    render(<TabsExample />)

    const tab2 = screen.getByText('Tab 2')
    await user.click(tab2)

    expect(screen.getByText('Content 2')).toBeInTheDocument()
  })

  it('should apply custom className to TabsList', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList className="custom-list" data-testid="tabs-list">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>
    )

    expect(screen.getByTestId('tabs-list')).toHaveClass('custom-list')
  })

  it('should apply custom className to TabsTrigger', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" className="custom-trigger" data-testid="trigger">
            Tab 1
          </TabsTrigger>
        </TabsList>
      </Tabs>
    )

    expect(screen.getByTestId('trigger')).toHaveClass('custom-trigger')
  })

  it('should apply custom className to TabsContent', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" className="custom-content" data-testid="content">
          Content
        </TabsContent>
      </Tabs>
    )

    expect(screen.getByTestId('content')).toHaveClass('custom-content')
  })

  it('should disable tab when disabled prop is true', async () => {
    const user = userEvent.setup()
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2" disabled>Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )

    const disabledTab = screen.getByText('Tab 2')
    await user.click(disabledTab)

    // Content should still be Content 1
    expect(screen.getByText('Content 1')).toBeInTheDocument()
  })
})
