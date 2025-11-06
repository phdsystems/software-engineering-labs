'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CodeBlockProps {
  children: React.ReactNode
  language?: string
  code?: string
}

export function CodeBlock({ children, language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const textToCopy = code || (typeof children === 'string' ? children : '')

    if (textToCopy) {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="relative group">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 bg-background/80 hover:bg-background"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      {language && (
        <div className="absolute left-3 top-2 text-xs text-muted-foreground font-mono">
          {language}
        </div>
      )}
      <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-4 pt-10">
        {children}
      </pre>
    </div>
  )
}
