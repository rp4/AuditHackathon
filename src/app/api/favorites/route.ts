import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { getUserFavorites, addFavorite, removeFavorite, isFavorited } from '@/lib/db/favorites'
import { prisma } from '@/lib/prisma/client'
import { logger } from '@/lib/utils/logger'
import { z } from 'zod'

// GET /api/favorites - Get user's favorited swarms
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const result = await getUserFavorites(session.user.id, limit, offset)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    )
  }
}

// POST /api/favorites - Add a swarm to favorites
const favoriteSchema = z.object({
  swarmId: z.string(),
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
    const { swarmId } = favoriteSchema.parse(body)

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

    // Check if already favorited
    const alreadyFavorited = await isFavorited(session.user.id, swarmId)
    if (alreadyFavorited) {
      return NextResponse.json(
        { error: 'Already favorited' },
        { status: 400 }
      )
    }

    const favorite = await addFavorite(session.user.id, swarmId)

    return NextResponse.json(favorite, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    logger.serverError(error instanceof Error ? error : String(error), { endpoint: 'POST /api/favorites' })
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    )
  }
}

// DELETE /api/favorites - Remove a swarm from favorites
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

    await removeFavorite(session.user.id, swarmId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing favorite:', error)
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    )
  }
}
