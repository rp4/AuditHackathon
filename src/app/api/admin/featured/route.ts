import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'

// GET /api/admin/featured - Get all featured tools and available tools
export async function GET(request: NextRequest) {
  const authError = await requireAdminApi()
  if (authError) return authError

  try {
    // Get currently featured tools
    const featuredTools = await prisma.tool.findMany({
      where: {
        is_featured: true,
        isDeleted: false,
        is_public: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image_url: true,
        views_count: true,
        favorites_count: true,
        rating_avg: true,
        user: {
          select: {
            name: true,
            username: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Get all public tools for selection
    const availableTools = await prisma.tool.findMany({
      where: {
        isDeleted: false,
        is_public: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        is_featured: true,
        views_count: true,
        favorites_count: true,
        rating_avg: true,
        user: {
          select: {
            name: true,
            username: true
          }
        }
      },
      orderBy: [
        { favorites_count: 'desc' },
        { views_count: 'desc' }
      ],
      take: 100 // Limit to top 100 tools
    })

    return NextResponse.json({
      featured: featuredTools,
      available: availableTools
    })
  } catch (error) {
    console.error('Error fetching featured tools:', error)
    return NextResponse.json(
      { error: 'Failed to fetch featured tools' },
      { status: 500 }
    )
  }
}

// POST /api/admin/featured - Update featured tools
const updateFeaturedSchema = z.object({
  toolIds: z.array(z.string()).max(3, 'Maximum 3 featured tools allowed')
})

export async function POST(request: NextRequest) {
  const authError = await requireAdminApi()
  if (authError) return authError

  try {
    const body = await request.json()
    const { toolIds } = updateFeaturedSchema.parse(body)

    // Start a transaction to update featured status
    await prisma.$transaction(async (tx) => {
      // First, unfeature all tools
      await tx.tool.updateMany({
        where: { is_featured: true },
        data: { is_featured: false }
      })

      // Then feature the selected tools
      if (toolIds.length > 0) {
        await tx.tool.updateMany({
          where: {
            id: { in: toolIds },
            isDeleted: false,
            is_public: true
          },
          data: { is_featured: true }
        })
      }
    })

    // Get the updated featured tools
    const featuredTools = await prisma.tool.findMany({
      where: {
        is_featured: true,
        isDeleted: false,
        is_public: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image_url: true,
        user: {
          select: {
            name: true,
            username: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      featured: featuredTools
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating featured tools:', error)
    return NextResponse.json(
      { error: 'Failed to update featured tools' },
      { status: 500 }
    )
  }
}