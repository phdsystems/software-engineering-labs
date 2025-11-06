'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { TOCItem } from '@/types'
import { cn } from '@/lib/utils'

interface MobileTOCProps {
  items: TOCItem[]
}

export function MobileTOC({ items }: MobileTOCProps) {
  const [open, setOpen] = useState(false)

  if (items.length === 0) {
    return null
  }

  const handleClick = (slug: string) => {
    // Close the sheet
    setOpen(false)
    // Scroll to the section
    setTimeout(() => {
      const element = document.getElementById(slug)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  return (
    <div className="lg:hidden fixed bottom-4 right-4 z-50">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button size="icon" className="h-12 w-12 rounded-full shadow-lg">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px]">
          <SheetHeader>
            <SheetTitle>On This Page</SheetTitle>
          </SheetHeader>
          <nav className="mt-6 space-y-1">
            {items.map((item) => (
              <button
                key={item.slug}
                onClick={() => handleClick(item.slug)}
                className={cn(
                  'block w-full text-left text-sm transition-colors hover:text-foreground py-2',
                  item.level === 3 && 'pl-4',
                  'text-muted-foreground'
                )}
              >
                {item.title}
              </button>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
