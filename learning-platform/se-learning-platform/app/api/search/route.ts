import { NextRequest, NextResponse } from 'next/server'
import { searchContent } from '@/lib/api/content'
import type { ApiResponse, ContentListItem } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query) {
      const response: ApiResponse = {
        success: false,
        error: 'Query parameter "q" is required'
      }

      return NextResponse.json(response, { status: 400 })
    }

    const results = await searchContent(query)

    const response: ApiResponse<ContentListItem[]> = {
      success: true,
      data: results,
      meta: {
        query,
        total: results.length,
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Search failed'
    }

    return NextResponse.json(response, { status: 500 })
    }
}
