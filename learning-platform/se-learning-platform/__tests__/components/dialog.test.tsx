import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

describe('Dialog Component', () => {
  const DialogExample = () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Dialog description text</DialogDescription>
        </DialogHeader>
        <div>Dialog content goes here</div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  it('should render trigger button', () => {
    render(<DialogExample />)
    expect(screen.getByText('Open Dialog')).toBeInTheDocument()
  })

  it('should open dialog when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(<DialogExample />)

    const trigger = screen.getByText('Open Dialog')
    await user.click(trigger)

    expect(screen.getByText('Dialog Title')).toBeInTheDocument()
    expect(screen.getByText('Dialog description text')).toBeInTheDocument()
    expect(screen.getByText('Dialog content goes here')).toBeInTheDocument()
  })

  it('should close dialog when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<DialogExample />)

    // Open dialog
    await user.click(screen.getByText('Open Dialog'))
    expect(screen.getByText('Dialog Title')).toBeInTheDocument()

    // Close dialog using close button (X icon)
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    // Dialog should be closed (content not visible)
    expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument()
  })

  it('should close dialog when Cancel is clicked', async () => {
    const user = userEvent.setup()
    render(<DialogExample />)

    // Open dialog
    await user.click(screen.getByText('Open Dialog'))
    expect(screen.getByText('Dialog Title')).toBeInTheDocument()

    // Close using Cancel button
    await user.click(screen.getByText('Cancel'))

    // Dialog should be closed
    expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument()
  })

  it('should render dialog header with custom className', async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader className="custom-header" data-testid="header">
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )

    await user.click(screen.getByText('Open'))
    const header = screen.getByTestId('header')
    expect(header).toHaveClass('custom-header')
  })

  it('should render dialog footer with custom className', async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogFooter className="custom-footer" data-testid="footer">
            <Button>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )

    await user.click(screen.getByText('Open'))
    const footer = screen.getByTestId('footer')
    expect(footer).toHaveClass('custom-footer')
  })

  it('should render accessible close button with sr-only text', async () => {
    const user = userEvent.setup()
    render(<DialogExample />)

    await user.click(screen.getByText('Open Dialog'))

    const closeButton = screen.getByRole('button', { name: /close/i })
    expect(closeButton).toBeInTheDocument()
  })

  it('should support controlled open state', () => {
    const ControlledDialog = () => (
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Always Open</DialogTitle>
        </DialogContent>
      </Dialog>
    )

    render(<ControlledDialog />)
    expect(screen.getByText('Always Open')).toBeInTheDocument()
  })
})
