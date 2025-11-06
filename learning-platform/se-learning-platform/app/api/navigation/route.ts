import { NextResponse } from 'next/server'
import { getNavigation } from '@/lib/api/content'
import type { ApiResponse, NavigationGroup } from '@/types'

export async function GET() {
  try {
    const navigation = await getNavigation()

    const response: ApiResponse<NavigationGroup[]> = {
      success: true,
      data: navigation,
      meta: {
        total: navigation.length,
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch navigation'
    }

    return NextResponse.json(response, { status: 500 })
  }
}
