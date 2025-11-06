'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { TOCItem } from '@/types'

interface TableOfContentsProps {
  items: TOCItem[]
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-100px 0px -66%' }
    )

    items.forEach((item) => {
      const element = document.getElementById(item.slug)
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [items])

  if (items.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <p className="font-medium text-sm">On This Page</p>
      <nav className="space-y-1">
        {items.map((item) => (
          <a
            key={item.slug}
            href={`#${item.slug}`}
            className={cn(
              'block text-sm transition-colors hover:text-foreground',
              item.level === 3 && 'pl-4',
              activeId === item.slug
                ? 'font-medium text-foreground'
                : 'text-muted-foreground'
            )}
          >
            {item.title}
          </a>
        ))}
      </nav>
    </div>
  )
}
