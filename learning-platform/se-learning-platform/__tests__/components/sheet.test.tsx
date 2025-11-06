import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet'

describe('Sheet Component', () => {
  it('should render sheet trigger', () => {
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
      </Sheet>
    )

    expect(screen.getByText('Open')).toBeInTheDocument()
  })

  it('should open sheet when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger>Open Sheet</SheetTrigger>
        <SheetContent>
          <SheetTitle>Sheet Title</SheetTitle>
          <SheetDescription>Sheet Description</SheetDescription>
          <div>Sheet Content</div>
        </SheetContent>
      </Sheet>
    )

    const trigger = screen.getByText('Open Sheet')
    await user.click(trigger)

    expect(await screen.findByText('Sheet Content')).toBeInTheDocument()
  })

  it('should render sheet header', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Test Title</SheetTitle>
            <SheetDescription>Test Description</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByText('Open'))

    expect(await screen.findByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('should render sheet footer', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>
          <SheetTitle>Title</SheetTitle>
          <SheetDescription>Description</SheetDescription>
          <SheetFooter>
            <button>Cancel</button>
            <button>Save</button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByText('Open'))

    expect(await screen.findByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  it('should apply custom className to SheetContent', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent className="custom-class">
          <SheetTitle>Title</SheetTitle>
          <SheetDescription>Description</SheetDescription>
          <div>Content</div>
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByText('Open'))

    const content = await screen.findByText('Content')
    // Check that the parent element has the custom class
    const sheetContent = content.closest('[role="dialog"]')
    expect(sheetContent).toHaveClass('custom-class')
  })

  it('should apply custom className to SheetHeader', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>
          <SheetHeader className="custom-header-class">
            <SheetTitle>Title</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByText('Open'))

    const title = await screen.findByText('Title')
    const header = title.parentElement
    expect(header).toHaveClass('custom-header-class')
  })

  it('should apply custom className to SheetFooter', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>
          <SheetTitle>Title</SheetTitle>
          <SheetDescription>Description</SheetDescription>
          <SheetFooter className="custom-footer-class">
            <button>Action</button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByText('Open'))

    const action = await screen.findByText('Action')
    const footer = action.parentElement
    expect(footer).toHaveClass('custom-footer-class')
  })

  it('should apply custom className to SheetTitle', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>
          <SheetTitle className="custom-title-class">Custom Title</SheetTitle>
          <SheetDescription>Description</SheetDescription>
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByText('Open'))

    const title = await screen.findByText('Custom Title')
    expect(title).toHaveClass('custom-title-class')
  })

  it('should apply custom className to SheetDescription', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>
          <SheetTitle>Title</SheetTitle>
          <SheetDescription className="custom-description-class">
            Custom Description
          </SheetDescription>
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByText('Open'))

    const description = await screen.findByText('Custom Description')
    expect(description).toHaveClass('custom-description-class')
  })

  it('should render close button', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>
          <SheetTitle>Title</SheetTitle>
          <SheetDescription>Description</SheetDescription>
          <div>Content</div>
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByText('Open'))

    await screen.findByText('Content')
    const closeButton = screen.getByRole('button', { name: /close/i })
    expect(closeButton).toBeInTheDocument()
  })

  it('should close sheet when close button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>
          <SheetTitle>Title</SheetTitle>
          <SheetDescription>Description</SheetDescription>
          <div>Content</div>
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByText('Open'))
    await screen.findByText('Content')

    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('should support side="left" variant', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent side="left">
          <SheetTitle>Title</SheetTitle>
          <SheetDescription>Description</SheetDescription>
          <div>Left Side Content</div>
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByText('Open'))

    expect(await screen.findByText('Left Side Content')).toBeInTheDocument()
  })

  it('should support side="right" variant', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent side="right">
          <SheetTitle>Title</SheetTitle>
          <SheetDescription>Description</SheetDescription>
          <div>Right Side Content</div>
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByText('Open'))

    expect(await screen.findByText('Right Side Content')).toBeInTheDocument()
  })

  it('should support side="top" variant', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent side="top">
          <SheetTitle>Title</SheetTitle>
          <SheetDescription>Description</SheetDescription>
          <div>Top Side Content</div>
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByText('Open'))

    expect(await screen.findByText('Top Side Content')).toBeInTheDocument()
  })

  it('should support side="bottom" variant', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent side="bottom">
          <SheetTitle>Title</SheetTitle>
          <SheetDescription>Description</SheetDescription>
          <div>Bottom Side Content</div>
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByText('Open'))

    expect(await screen.findByText('Bottom Side Content')).toBeInTheDocument()
  })

  it('should support controlled state', async () => {
    const user = userEvent.setup()
    const ControlledSheet = () => {
      const [open, setOpen] = React.useState(false)

      return (
        <>
          <button onClick={() => setOpen(true)}>Open Controlled</button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent>
              <SheetTitle>Controlled Title</SheetTitle>
              <SheetDescription>Controlled Description</SheetDescription>
              <div>Controlled Content</div>
            </SheetContent>
          </Sheet>
        </>
      )
    }

    render(<ControlledSheet />)

    await user.click(screen.getByText('Open Controlled'))

    expect(await screen.findByText('Controlled Content')).toBeInTheDocument()
  })

  it('should render SheetClose component', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>
          <SheetTitle>Title</SheetTitle>
          <SheetDescription>Description</SheetDescription>
          <SheetClose asChild>
            <button>Custom Close</button>
          </SheetClose>
        </SheetContent>
      </Sheet>
    )

    await user.click(screen.getByText('Open'))

    const customClose = await screen.findByText('Custom Close')
    expect(customClose).toBeInTheDocument()

    await user.click(customClose)

    expect(screen.queryByText('Custom Close')).not.toBeInTheDocument()
  })
})

// Import React for controlled component test
import * as React from 'react'
