import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdminApi } from '@/lib/auth/admin'
import { handleApiError } from '@/lib/api/helpers'
import { updateIssue } from '@/lib/db/audit-issues'

const updateIssueSchema = z.object({
  issueCode: z.string().min(1).max(20).optional(),
  title: z.string().min(1).max(300).optional(),
  description: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  severity: z.enum(['Critical', 'High', 'Medium', 'Low']).optional(),
  financialImpact: z.number().nullable().optional(),
  dataSource: z.string().nullable().optional(),
  evidence: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdminApi()
    if (adminCheck) return adminCheck

    const { id } = await params
    const body = await request.json()
    const validated = updateIssueSchema.parse(body)

    const issue = await updateIssue(id, validated)

    return NextResponse.json(issue)
  } catch (error) {
    return handleApiError(error, 'update audit issue')
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdminApi()
    if (adminCheck) return adminCheck

    const { id } = await params

    // Soft-delete: set isActive to false
    const issue = await updateIssue(id, { isActive: false })

    return NextResponse.json(issue)
  } catch (error) {
    return handleApiError(error, 'delete audit issue')
  }
}
