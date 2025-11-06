// API response types for SE Learning System

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
    timestamp?: string
    [key: string]: unknown
  }
}

export interface SearchResult {
  slug: string
  title: string
  description: string
  category: string
  highlight?: string // Highlighted excerpt from content
  score?: number // Relevance score
}

export interface SearchRequest {
  query: string
  category?: string
  limit?: number
  offset?: number
}

export interface SearchResponse extends ApiResponse<SearchResult[]> {
  meta: {
    query: string
    total: number
    timestamp: string
  }
}
