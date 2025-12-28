import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { upsertRating, deleteRating, getSwarmRatings, getUserRating } from '@/lib/db/ratings'
import { prisma } from '@/lib/prisma/client'
import { logger } from '@/lib/utils/logger'
import { z } from 'zod'

// GET /api/ratings - Get ratings for a swarm or user's rating
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const swarmId = searchParams.get('swarmId')
    const checkUser = searchParams.get('checkUser') === 'true'

    if (!swarmId) {
      return NextResponse.json(
        { error: 'swarmId is required' },
        { status: 400 }
      )
    }

    // If checkUser, return the current user's rating for this swarm
    if (checkUser) {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json({ rating: null })
      }

      const rating = await getUserRating(session.user.id, swarmId)
      return NextResponse.json({ rating })
    }

    // Otherwise, return all ratings for the swarm
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const result = await getSwarmRatings(swarmId, limit, offset)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching ratings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    )
  }
}

// POST /api/ratings - Create or update a rating
const ratingSchema = z.object({
  swarmId: z.string(),
  rating: z.number().min(1).max(5),
  review: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { swarmId, rating, review } = ratingSchema.parse(body)

    // Validate that the swarm exists and is not deleted
    const swarm = await prisma.swarm.findUnique({
      where: { id: swarmId },
      select: { id: true, isDeleted: true }
    })

    if (!swarm || swarm.isDeleted) {
      return NextResponse.json(
        { error: 'Swarm not found' },
        { status: 404 }
      )
    }

    const result = await upsertRating(session.user.id, swarmId, rating, review)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    logger.serverError(error instanceof Error ? error : String(error), { endpoint: 'POST /api/ratings' })
    return NextResponse.json(
      { error: 'Failed to create rating' },
      { status: 500 }
    )
  }
}

// DELETE /api/ratings - Delete a rating
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const swarmId = searchParams.get('swarmId')

    if (!swarmId) {
      return NextResponse.json(
        { error: 'swarmId is required' },
        { status: 400 }
      )
    }

    await deleteRating(session.user.id, swarmId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting rating:', error)
    return NextResponse.json(
      { error: 'Failed to delete rating' },
      { status: 500 }
    )
  }
}
