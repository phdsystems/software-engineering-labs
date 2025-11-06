'use client'

import Link from 'next/link'
import { Book, Search, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './theme-toggle'
import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { MobileNav } from './mobile-nav'

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Book className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">SE Learning</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/learn"
            className="transition-colors hover:text-foreground/80 text-foreground"
          >
            Learn
          </Link>
          <Link
            href="/learn/design-principle/overview"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Principles
          </Link>
          <Link
            href="/learn/design-pattern/overview"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Patterns
          </Link>
          <Link
            href="/learn/architecture-pattern/overview"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Architecture
          </Link>
          <Link
            href="/learn/example/overview"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Examples
          </Link>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-2">
          {/* Search Button */}
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex items-center space-x-2"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="text-sm text-muted-foreground">Search...</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          {/* Mobile Search */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <MobileNav />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Search Dialog - Will implement in Week 3 */}
      {/* <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} /> */}
    </header>
  )
}
