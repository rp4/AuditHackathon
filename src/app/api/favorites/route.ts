import { NextRequest, NextResponse } from 'next/server'
import { getUserFavorites, addFavorite, removeFavorite, isFavorited } from '@/lib/db/favorites'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'
import { requireAuth, handleApiError } from '@/lib/api/helpers'

// GET /api/favorites - Get user's favorited swarms
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const result = await getUserFavorites(userId, limit, offset)

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error, 'fetch favorites')
  }
}

// POST /api/favorites - Add a swarm to favorites
const favoriteSchema = z.object({
  swarmId: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

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
    const alreadyFavorited = await isFavorited(userId, swarmId)
    if (alreadyFavorited) {
      return NextResponse.json(
        { error: 'Already favorited' },
        { status: 400 }
      )
    }

    const favorite = await addFavorite(userId, swarmId)

    return NextResponse.json(favorite, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'add favorite')
  }
}

// DELETE /api/favorites - Remove a swarm from favorites
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const { searchParams } = new URL(request.url)
    const swarmId = searchParams.get('swarmId')

    if (!swarmId) {
      return NextResponse.json(
        { error: 'swarmId is required' },
        { status: 400 }
      )
    }

    await removeFavorite(userId, swarmId)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, 'remove favorite')
  }
}
