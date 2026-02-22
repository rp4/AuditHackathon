import { NextResponse } from 'next/server'
import { requireAuth, handleApiError } from '@/lib/api/helpers'
import {
  getUserDiscoveries,
  getUserDiscoveryCount,
  getUserReportCount,
} from '@/lib/db/audit-issues'
import { prisma } from '@/lib/prisma/client'

export async function GET() {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const [discoveries, totalFound, totalIssues, reportsSubmitted] =
      await Promise.all([
        getUserDiscoveries(userId),
        getUserDiscoveryCount(userId),
        prisma.auditIssue.count({ where: { isActive: true } }),
        getUserReportCount(userId),
      ])

    // Group by category
    const byCategory: Record<string, { found: number; issues: string[] }> = {}
    for (const d of discoveries) {
      const cat = d.issue.category
      if (!byCategory[cat]) byCategory[cat] = { found: 0, issues: [] }
      byCategory[cat].found++
      byCategory[cat].issues.push(d.issue.issueCode)
    }

    return NextResponse.json({
      discoveries,
      totalFound,
      totalIssues,
      reportsSubmitted,
      byCategory,
    })
  } catch (error) {
    return handleApiError(error, 'fetch discoveries')
  }
}
