import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, handleApiError } from '@/lib/api/helpers'
import { getUserReports } from '@/lib/db/audit-issues'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const result = await getUserReports(userId, limit, offset)

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error, 'fetch audit reports')
  }
}
