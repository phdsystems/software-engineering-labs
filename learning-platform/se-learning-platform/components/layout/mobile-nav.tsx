'use client'

import Link from 'next/link'
import { Book, FileText, Layers, Code } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

export function MobileNav() {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center space-x-2 px-2">
        <Book className="h-6 w-6 text-primary" />
        <span className="font-bold text-xl">SE Learning</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col space-y-4 px-2">
          <div>
            <h4 className="mb-2 text-sm font-semibold">Navigation</h4>
            <div className="flex flex-col space-y-2">
              <MobileNavLink href="/learn" icon={<Book className="h-4 w-4" />}>
                Learn Home
              </MobileNavLink>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold">Categories</h4>
            <div className="flex flex-col space-y-2">
              <MobileNavLink
                href="/learn/design-principle/overview"
                icon={<FileText className="h-4 w-4" />}
              >
                Design Principles
              </MobileNavLink>
              <MobileNavLink
                href="/learn/design-pattern/overview"
                icon={<Layers className="h-4 w-4" />}
              >
                Design Patterns
              </MobileNavLink>
              <MobileNavLink
                href="/learn/architecture-pattern/overview"
                icon={<Layers className="h-4 w-4" />}
              >
                Architecture Patterns
              </MobileNavLink>
              <MobileNavLink
                href="/learn/example/overview"
                icon={<Code className="h-4 w-4" />}
              >
                Code Examples
              </MobileNavLink>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold">Learning Paths</h4>
            <div className="flex flex-col space-y-2">
              <MobileNavLink href="/learn?path=beginner">
                Beginner (0-2 years)
              </MobileNavLink>
              <MobileNavLink href="/learn?path=intermediate">
                Intermediate (2-5 years)
              </MobileNavLink>
              <MobileNavLink href="/learn?path=advanced">
                Senior (5+ years)
              </MobileNavLink>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

function MobileNavLink({
  href,
  icon,
  children,
}: {
  href: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      {icon}
      <span>{children}</span>
    </Link>
  )
}
