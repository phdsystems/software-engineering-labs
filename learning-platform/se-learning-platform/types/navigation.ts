// Navigation types for SE Learning System

export interface NavItem {
  title: string
  slug: string
  icon?: string
  children?: NavItem[]
  isExternal?: boolean
}

export interface NavigationGroup {
  category: string
  categorySlug: string
  description?: string
  items: NavItem[]
}

export interface Breadcrumb {
  title: string
  href: string
}

export interface LearningPath {
  id: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedHours: number
  modules: LearningPathModule[]
  tags: string[]
}

export interface LearningPathModule {
  id: string
  title: string
  description: string
  contentSlugs: string[] // Array of content slugs in order
  required: boolean
}

export interface UserProgress {
  completedContent: string[] // Array of completed content slugs
  bookmarkedContent: string[] // Array of bookmarked content slugs
  currentPath?: string // Current learning path ID
  lastViewed?: {
    slug: string
    timestamp: string
  }
}
