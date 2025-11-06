'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, FileText, Hash } from 'lucide-react'
import Fuse from 'fuse.js'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ContentListItem } from '@/types'

interface SearchDialogProps {
  content: ContentListItem[]
}

export function SearchDialog({ content }: SearchDialogProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ContentListItem[]>([])
  const router = useRouter()

  // Initialize Fuse.js for fuzzy search
  const fuse = new Fuse(content, {
    keys: ['title', 'description', 'category', 'metadata.tags'],
    threshold: 0.3,
    includeScore: true,
  })

  // Keyboard shortcut handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Search handler
  const handleSearch = useCallback((value: string) => {
    setQuery(value)

    if (!value.trim()) {
      setResults([])
      return
    }

    const searchResults = fuse.search(value)
    setResults(searchResults.map(result => result.item).slice(0, 10))
  }, [fuse])

  // Navigate to selected result
  const handleSelect = (item: ContentListItem) => {
    router.push(`/learn/${item.slug}`)
    setOpen(false)
    setQuery('')
    setResults([])
  }

  // Close on escape
  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle className="sr-only">Search</DialogTitle>
        </DialogHeader>

        <div className="flex items-center border-b px-4 pb-4">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Search documentation... (⌘K)"
            className="border-0 shadow-none focus-visible:ring-0 h-11"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
          />
        </div>

        <ScrollArea className="max-h-[400px]">
          {results.length === 0 && query.trim() && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results found for "{query}"
            </div>
          )}

          {results.length === 0 && !query.trim() && (
            <div className="py-8 px-4">
              <p className="text-sm text-muted-foreground mb-4">
                Start typing to search documentation...
              </p>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Popular topics:</p>
                <div className="flex flex-wrap gap-2">
                  {['SOLID', 'Clean Architecture', 'Design Patterns', 'Microservices', 'CQRS'].map((topic) => (
                    <button
                      key={topic}
                      onClick={() => handleSearch(topic)}
                      className="inline-flex items-center rounded-md bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="py-2">
              {results.map((item) => (
                <button
                  key={item.slug}
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-accent transition-colors"
                >
                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm mb-1">{item.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {item.description}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center text-xs text-muted-foreground">
                        <Hash className="h-3 w-3 mr-1" />
                        {item.category.replace('-', ' ')}
                      </span>
                      {item.metadata.readingTime && (
                        <span className="text-xs text-muted-foreground">
                          {item.metadata.readingTime} min read
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
