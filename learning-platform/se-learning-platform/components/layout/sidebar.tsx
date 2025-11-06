'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { NavigationGroup } from '@/types'

interface SidebarProps {
  navigation: NavigationGroup[]
}

export function Sidebar({ navigation }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:block w-64 border-r border-border bg-card">
      <ScrollArea className="h-[calc(100vh-4rem)] py-6 px-4">
        <nav className="space-y-6">
          {navigation.map((group) => (
            <div key={group.category}>
              <h4 className="mb-2 px-2 text-sm font-semibold text-foreground">
                {group.category}
              </h4>
              {group.description && (
                <p className="mb-3 px-2 text-xs text-muted-foreground">
                  {group.description}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === `/learn/${item.slug}`

                  return (
                    <Link
                      key={item.slug}
                      href={`/learn/${item.slug}`}
                      className={cn(
                        'block rounded-md px-3 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      {item.title}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  )
}
