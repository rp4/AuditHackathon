import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { logger } from '@/lib/utils/logger'

// GET /api/users/[id] - Get user profile (by ID or username)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try to find by username first, then by ID - only return active users
    const user = await prisma.user.findFirst({
      where: {
        AND: [
          {
            OR: [
              { username: id },
              { id: id }
            ]
          },
          { isDeleted: false } // Only return active users
        ]
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        linkedin_url: true,
        linkedin_visible: true,
        website: true,
        company: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    logger.serverError(error instanceof Error ? error : String(error), { endpoint: 'GET /api/users/[id]' })
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}
