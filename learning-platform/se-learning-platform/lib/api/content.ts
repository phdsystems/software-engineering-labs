// Content API Client for SE Learning System
// Phase 1: Mock data from JSON files
// Phase 2: File system reading from doc/ (SDLC structure) ← WE ARE HERE
// Phase 3: Real API calls

import type { Content, ContentListItem, CategoryInfo } from '@/types/content'
import type { NavigationGroup } from '@/types/navigation'
import { readdirSync, readFileSync, statSync, existsSync } from 'fs'
import { join, relative } from 'path'
import { processMarkdown } from '@/lib/markdown'

// Import mock data (fallback)
import mockContentData from '@/data/mock-content.json'
import navigationData from '@/data/navigation.json'

// Updated to point to new SDLC-organized doc structure
const CONTENT_DIR = join(process.cwd(), '..', 'doc')

/**
 * Get all markdown files recursively
 */
function getAllMarkdownFiles(dir: string): string[] {
  const files: string[] = []

  // Check if directory exists
  if (!existsSync(dir)) {
    console.warn(`Content directory does not exist: ${dir}`)
    return files
  }

  function traverse(currentDir: string) {
    const entries = readdirSync(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name)

      if (entry.isDirectory()) {
        traverse(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        // Skip certain files (index files, README, diagram files)
        if (
          entry.name === 'README.md' ||
          entry.name === 'overview.md' ||
          entry.name === 'documentation-index.md' ||
          entry.name.includes('diagram')
        ) {
          continue
        }
        files.push(fullPath)
      }
    }
  }

  traverse(dir)
  return files
}

/**
 * Extract category from file path
 */
function getCategoryFromPath(filePath: string): string {
  const relativePath = relative(CONTENT_DIR, filePath)
  const parts = relativePath.split('/')

  if (parts.length > 1) {
    return parts[0] // First directory is the category
  }

  return 'guide'
}

/**
 * Get slug from file path
 */
function getSlugFromPath(filePath: string): string {
  const relativePath = relative(CONTENT_DIR, filePath)
  return relativePath.replace(/\.md$/, '')
}

/**
 * Get all content items (list view)
 */
export async function getAllContent(): Promise<ContentListItem[]> {
  // Phase 2: Read from file system
  try {
    const files = getAllMarkdownFiles(CONTENT_DIR)
    const content: ContentListItem[] = []

    for (const file of files) {
      const rawContent = readFileSync(file, 'utf-8')
      const { frontmatter, readingTime } = await processMarkdown(rawContent)

      // Extract title from first H1 or frontmatter
      const titleMatch = rawContent.match(/^#\s+(.+)$/m)
      const title = titleMatch ? titleMatch[1] : frontmatter.title || 'Untitled'

      // Extract description
      const descMatch = rawContent.match(/\*\*Purpose:\*\*\s+(.+)/m)
      const description = descMatch ? descMatch[1] : frontmatter.description || ''

      const slug = getSlugFromPath(file)
      const category = getCategoryFromPath(file)
      const stats = statSync(file)

      content.push({
        slug,
        category: category as any,
        title,
        description,
        metadata: {
          readingTime,
          lastUpdated: stats.mtime.toISOString().split('T')[0],
          difficulty: frontmatter.difficulty as any
        }
      })
    }

    return content
  } catch (error) {
    console.error('Error reading content from filesystem:', error)
    // Fallback to mock data
    return mockContentData.map(item => ({
      slug: item.slug,
      category: item.category as any,
      title: item.title,
      description: item.description,
      metadata: {
        readingTime: item.metadata.readingTime,
        lastUpdated: item.metadata.lastUpdated,
        difficulty: item.metadata.difficulty
      }
    }))
  }

  // Phase 3: Real API
  // const response = await fetch('/api/content')
  // return response.json()
}

/**
 * Get single content by slug
 */
export async function getContentBySlug(slug: string): Promise<Content | null> {
  // Phase 2: Read markdown file from file system
  try {
    const filePath = join(CONTENT_DIR, `${slug}.md`)
    const rawContent = readFileSync(filePath, 'utf-8')
    const { content, frontmatter, toc, readingTime } = await processMarkdown(rawContent)

    // Extract title
    const titleMatch = rawContent.match(/^#\s+(.+)$/m)
    const title = titleMatch ? titleMatch[1] : frontmatter.title || 'Untitled'

    // Extract description
    const descMatch = rawContent.match(/\*\*Purpose:\*\*\s+(.+)/m)
    const description = descMatch ? descMatch[1] : frontmatter.description || ''

    // Extract tags from frontmatter or content
    const tags: string[] = frontmatter.tags || []

    const category = getCategoryFromPath(filePath)
    const stats = statSync(filePath)

    // Get all content to find prev/next
    const allContent = await getAllContent()
    const currentIndex = allContent.findIndex(item => item.slug === slug)
    const prev = currentIndex > 0 ? allContent[currentIndex - 1].slug : undefined
    const next = currentIndex < allContent.length - 1 ? allContent[currentIndex + 1].slug : undefined

    return {
      slug,
      category: category as any,
      title,
      description,
      content,
      toc,
      metadata: {
        readingTime,
        lastUpdated: stats.mtime.toISOString().split('T')[0],
        tags,
        difficulty: frontmatter.difficulty as any
      },
      related: [],
      prev,
      next
    }
  } catch (error) {
    console.error(`Error reading content for slug ${slug}:`, error)
    // Fallback to mock data
    const content = mockContentData.find(item => item.slug === slug)

    if (!content) {
      return null
    }

    return {
      ...content,
      category: content.category as any,
      metadata: {
        ...content.metadata,
        difficulty: content.metadata.difficulty as any
      }
    } as Content
  }

  // Phase 3: Real API
  // const response = await fetch(`/api/content/${slug}`)
  // return response.json()
}

/**
 * Get content by category
 */
export async function getContentByCategory(category: string): Promise<ContentListItem[]> {
  const allContent = await getAllContent()
  return allContent.filter(item => item.category === category)
}

/**
 * Get navigation structure
 */
export async function getNavigation(): Promise<NavigationGroup[]> {
  // Phase 1: Return mock navigation
  return navigationData as NavigationGroup[]

  // Phase 2/3: Build from content or fetch from API
}

/**
 * Search content
 */
export async function searchContent(query: string): Promise<ContentListItem[]> {
  if (!query || query.length < 2) {
    return []
  }

  const allContent = await getAllContent()
  const lowerQuery = query.toLowerCase()

  // Phase 1: Simple text search
  return allContent.filter(item =>
    item.title.toLowerCase().includes(lowerQuery) ||
    item.description.toLowerCase().includes(lowerQuery)
  )

  // Phase 2: Use pre-built search index
  // const searchIndex = await getSearchIndex()
  // return searchIndex.search(query)

  // Phase 3: Full-text search with Algolia/Meilisearch
  // const response = await fetch(`/api/search?q=${query}`)
  // return response.json()
}

/**
 * Get category information
 */
export async function getCategories(): Promise<CategoryInfo[]> {
  const allContent = await getAllContent()

  const categories: Record<string, CategoryInfo> = {}

  allContent.forEach(item => {
    if (!categories[item.category]) {
      categories[item.category] = {
        slug: item.category,
        title: item.category.split('-').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        description: '',
        icon: '',
        count: 0
      }
    }
    categories[item.category].count++
  })

  return Object.values(categories)
}

/**
 * Get related content
 */
export async function getRelatedContent(slug: string): Promise<ContentListItem[]> {
  const content = await getContentBySlug(slug)

  if (!content || !content.related || content.related.length === 0) {
    return []
  }

  const allContent = await getAllContent()
  return allContent.filter(item => content.related.includes(item.slug))
}
