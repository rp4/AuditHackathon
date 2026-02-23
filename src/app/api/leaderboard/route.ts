import { NextRequest, NextResponse } from 'next/server'
import { getLeaderboard } from '@/lib/db/audit-issues'
import { handleApiError } from '@/lib/api/helpers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const result = await getLeaderboard(limit, offset)

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    })
  } catch (error) {
    return handleApiError(error, 'fetch leaderboard')
  }
}
