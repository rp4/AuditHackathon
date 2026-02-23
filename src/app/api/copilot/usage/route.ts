import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import {
  getUserDetail,
  getCurrentMonthSpend,
  getUserLimit,
} from '@/lib/copilot/services/usage-tracking'

/**
 * GET /api/copilot/usage
 * Get the current user's API usage summary and records.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const userEmail = session.user.email || ''

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate') || undefined
  const endDate = searchParams.get('endDate') || undefined

  try {
    const [detail, currentMonth, limitConfig] = await Promise.all([
      getUserDetail(userId, startDate, endDate),
      getCurrentMonthSpend(userId),
      getUserLimit(userId),
    ])

    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    return NextResponse.json({
      userId,
      userEmail,
      currentMonth: {
        spend: currentMonth.cost,
        totalTokens: currentMonth.totalTokens,
        limit: limitConfig?.monthlyLimit ?? null,
        remaining: limitConfig
          ? Math.max(0, limitConfig.monthlyLimit - currentMonth.cost)
          : null,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      },
      records: detail.records,
    })
  } catch (error) {
    console.error('Usage API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    )
  }
}
