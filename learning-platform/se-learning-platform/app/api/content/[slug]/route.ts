import { NextRequest, NextResponse } from 'next/server'
import { getContentBySlug } from '@/lib/api/content'
import type { ApiResponse, Content } from '@/types'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const content = await getContentBySlug(slug)

    if (!content) {
      const response: ApiResponse = {
        success: false,
        error: 'Content not found'
      }

      return NextResponse.json(response, { status: 404 })
    }

    const response: ApiResponse<Content> = {
      success: true,
      data: content,
      meta: {
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
