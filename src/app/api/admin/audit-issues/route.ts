import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdminApi } from '@/lib/auth/admin'
import { handleApiError } from '@/lib/api/helpers'
import { getAllIssues, getIssueStats, createIssue } from '@/lib/db/audit-issues'

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdminApi()
    if (adminCheck) return adminCheck

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined
    const severity = searchParams.get('severity') || undefined

    const [issues, stats] = await Promise.all([
      getAllIssues({ category, severity }),
      getIssueStats(),
    ])

    return NextResponse.json({ issues, stats })
  } catch (error) {
    return handleApiError(error, 'fetch audit issues')
  }
}

const createIssueSchema = z.object({
  issueCode: z.string().min(1).max(20),
  title: z.string().min(1).max(300),
  description: z.string().min(1),
  category: z.string().min(1),
  severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
  financialImpact: z.number().optional(),
  dataSource: z.string().optional(),
  evidence: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdminApi()
    if (adminCheck) return adminCheck

    const body = await request.json()
    const validated = createIssueSchema.parse(body)

    const issue = await createIssue(validated)

    return NextResponse.json(issue, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'create audit issue')
  }
}
