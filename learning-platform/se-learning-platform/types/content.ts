// Content types for SE Learning System

export type ContentCategory =
  | 'design-principle'
  | 'design-pattern'
  | 'architecture-pattern'
  | 'guide'
  | 'example'

export type ProgrammingLanguage =
  | 'python'
  | 'java'
  | 'kotlin'
  | 'groovy'
  | 'typescript'
  | 'go'
  | 'rust'

export interface TOCItem {
  id: string
  title: string
  level: number // 1-6 (h1-h6)
  children?: TOCItem[]
}

export interface ContentMetadata {
  readingTime: number // in minutes
  lastUpdated: string // ISO 8601 date
  tags: string[]
  languages?: ProgrammingLanguage[] // For multi-language examples
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  version?: string
}

export interface Content {
  slug: string // e.g., "design-principle/solid-principle"
  category: ContentCategory
  title: string
  description: string
  content: string // Markdown content
  toc: TOCItem[]
  metadata: ContentMetadata
  related: string[] // Related content slugs
  prev?: string // Previous content slug (for navigation)
  next?: string // Next content slug (for navigation)
}

export interface ContentListItem {
  slug: string
  category: ContentCategory
  title: string
  description: string
  metadata: Pick<ContentMetadata, 'readingTime' | 'lastUpdated' | 'difficulty'>
}

export interface CategoryInfo {
  slug: ContentCategory
  title: string
  description: string
  icon: string // Icon name or emoji
  count: number // Number of articles in category
}
