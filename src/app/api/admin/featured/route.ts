import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'

// GET /api/admin/featured - Get all featured swarms and available swarms
export async function GET(request: NextRequest) {
  const authError = await requireAdminApi()
  if (authError) return authError

  try {
    // Get currently featured swarms
    const featuredSwarms = await prisma.swarm.findMany({
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

    // Get all public swarms for selection
    const availableSwarms = await prisma.swarm.findMany({
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
      take: 100 // Limit to top 100 swarms
    })

    return NextResponse.json({
      featured: featuredSwarms,
      available: availableSwarms
    })
  } catch (error) {
    console.error('Error fetching featured swarms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch featured swarms' },
      { status: 500 }
    )
  }
}

// POST /api/admin/featured - Update featured swarms
const updateFeaturedSchema = z.object({
  swarmIds: z.array(z.string()).max(3, 'Maximum 3 featured swarms allowed')
})

export async function POST(request: NextRequest) {
  const authError = await requireAdminApi()
  if (authError) return authError

  try {
    const body = await request.json()
    const { swarmIds } = updateFeaturedSchema.parse(body)

    // Start a transaction to update featured status
    await prisma.$transaction(async (tx) => {
      // First, unfeature all swarms
      await tx.swarm.updateMany({
        where: { is_featured: true },
        data: { is_featured: false }
      })

      // Then feature the selected swarms
      if (swarmIds.length > 0) {
        await tx.swarm.updateMany({
          where: {
            id: { in: swarmIds },
            isDeleted: false,
            is_public: true
          },
          data: { is_featured: true }
        })
      }
    })

    // Get the updated featured swarms
    const featuredSwarms = await prisma.swarm.findMany({
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
      featured: featuredSwarms
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating featured swarms:', error)
    return NextResponse.json(
      { error: 'Failed to update featured swarms' },
      { status: 500 }
    )
  }
}
