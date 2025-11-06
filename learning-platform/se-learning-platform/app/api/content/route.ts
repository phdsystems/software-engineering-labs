import { NextRequest, NextResponse } from 'next/server'
import { getAllContent } from '@/lib/api/content'
import type { ApiResponse, ContentListItem } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')

    let content: ContentListItem[]

    if (category) {
      const { getContentByCategory } = await import('@/lib/api/content')
      content = await getContentByCategory(category)
    } else {
      content = await getAllContent()
    }

    const response: ApiResponse<ContentListItem[]> = {
      success: true,
      data: content,
      meta: {
        total: content.length,
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch content'
    }

    return NextResponse.json(response, { status: 500 })
  }
}
