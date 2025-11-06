import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypePrettyCode from 'rehype-pretty-code'
import { readFileSync } from 'fs'
import { join } from 'path'
import matter from 'gray-matter'
import readingTime from 'reading-time'
import type { TOCItem } from '@/types'

interface MarkdownResult {
  content: string
  frontmatter: Record<string, any>
  toc: TOCItem[]
  readingTime: number
}

export async function processMarkdown(markdown: string): Promise<MarkdownResult> {
  // Parse frontmatter
  const { data: frontmatter, content: rawContent } = matter(markdown)

  // Extract TOC from markdown
  const toc = extractTOC(rawContent)

  // Calculate reading time
  const readingTimeResult = readingTime(rawContent)

  // Process markdown to HTML
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypePrettyCode, {
      theme: {
        dark: 'github-dark',
        light: 'github-light',
      },
      keepBackground: false,
    })
    .use(rehypeStringify)
    .process(rawContent)

  return {
    content: String(file),
    frontmatter,
    toc,
    readingTime: Math.ceil(readingTimeResult.minutes),
  }
}

function extractTOC(markdown: string): TOCItem[] {
  const toc: TOCItem[] = []
  const lines = markdown.split('\n')

  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)$/)
    if (match) {
      const level = match[1].length
      const title = match[2].replace(/\{#[^}]+\}/, '').trim()
      const slug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')

      toc.push({
        level,
        title,
        slug,
      })
    }
  }

  return toc
}

export function readMarkdownFile(filePath: string): string {
  const fullPath = join(process.cwd(), filePath)
  return readFileSync(fullPath, 'utf8')
}
