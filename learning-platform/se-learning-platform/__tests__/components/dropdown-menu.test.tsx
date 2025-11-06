import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

describe('DropdownMenu Component', () => {
  const BasicDropdownMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>Open Menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Item 1</DropdownMenuItem>
        <DropdownMenuItem>Item 2</DropdownMenuItem>
        <DropdownMenuItem>Item 3</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  it('should render trigger button', () => {
    render(<BasicDropdownMenu />)
    expect(screen.getByText('Open Menu')).toBeInTheDocument()
  })

  it('should open menu when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(<BasicDropdownMenu />)

    await user.click(screen.getByText('Open Menu'))

    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
    expect(screen.getByText('Item 3')).toBeInTheDocument()
  })

  it('should handle menu item clicks', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleClick}>Clickable</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )

    await user.click(screen.getByText('Open'))
    await user.click(screen.getByText('Clickable'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should render menu with label', async () => {
    const user = userEvent.setup()
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuItem>Profile</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )

    await user.click(screen.getByText('Open'))
    expect(screen.getByText('My Account')).toBeInTheDocument()
  })

  it('should render menu with separator', async () => {
    const user = userEvent.setup()
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuSeparator data-testid="separator" />
          <DropdownMenuItem>Item 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )

    await user.click(screen.getByText('Open'))
    expect(screen.getByTestId('separator')).toBeInTheDocument()
  })

  it('should render checkbox items', async () => {
    const user = userEvent.setup()
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked={true}>
            Checked Item
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={false}>
            Unchecked Item
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )

    await user.click(screen.getByText('Open'))
    expect(screen.getByText('Checked Item')).toBeInTheDocument()
    expect(screen.getByText('Unchecked Item')).toBeInTheDocument()
  })

  it('should render radio group', async () => {
    const user = userEvent.setup()
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="option1">
            <DropdownMenuRadioItem value="option1">
              Option 1
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="option2">
              Option 2
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )

    await user.click(screen.getByText('Open'))
    expect(screen.getByText('Option 1')).toBeInTheDocument()
    expect(screen.getByText('Option 2')).toBeInTheDocument()
  })

  it('should render keyboard shortcut', async () => {
    const user = userEvent.setup()
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            Save
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )

    await user.click(screen.getByText('Open'))
    expect(screen.getByText('⌘S')).toBeInTheDocument()
  })

  it('should render submenu', async () => {
    const user = userEvent.setup()
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Sub Item 1</DropdownMenuItem>
              <DropdownMenuItem>Sub Item 2</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    )

    await user.click(screen.getByText('Open'))
    expect(screen.getByText('More Options')).toBeInTheDocument()
  })

  it('should support inset prop on menu item', async () => {
    const user = userEvent.setup()
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem inset data-testid="inset-item">
            Inset Item
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )

    await user.click(screen.getByText('Open'))
    expect(screen.getByTestId('inset-item')).toHaveClass('pl-8')
  })

  it('should support inset prop on label', async () => {
    const user = userEvent.setup()
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel inset data-testid="inset-label">
            Inset Label
          </DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>
    )

    await user.click(screen.getByText('Open'))
    expect(screen.getByTestId('inset-label')).toHaveClass('pl-8')
  })

  it('should apply custom className to menu item', async () => {
    const user = userEvent.setup()
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem className="custom-item" data-testid="custom">
            Custom
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )

    await user.click(screen.getByText('Open'))
    expect(screen.getByTestId('custom')).toHaveClass('custom-item')
  })

  it('should render grouped menu items', async () => {
    const user = userEvent.setup()
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem>Group Item 1</DropdownMenuItem>
            <DropdownMenuItem>Group Item 2</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )

    await user.click(screen.getByText('Open'))
    expect(screen.getByText('Group Item 1')).toBeInTheDocument()
    expect(screen.getByText('Group Item 2')).toBeInTheDocument()
  })
})
