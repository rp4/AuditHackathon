import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { getSwarmBySlug, updateSwarm, deleteSwarm, incrementSwarmViews } from '@/lib/db/swarms'
import { isFavorited } from '@/lib/db/favorites'
import { isAdmin } from '@/lib/auth/admin'
import { logger } from '@/lib/utils/logger'
import { z } from 'zod'

// GET /api/swarms/[id] - Get a single swarm
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const swarm = await getSwarmBySlug(id)

    if (!swarm) {
      return NextResponse.json(
        { error: 'Swarm not found' },
        { status: 404 }
      )
    }

    // Increment view count asynchronously
    incrementSwarmViews(swarm.id).catch((error) => logger.serverError(error, { swarmId: swarm.id }))

    // Check if the current user has favorited this swarm
    let userFavorited = false
    if (session?.user?.id) {
      userFavorited = await isFavorited(session.user.id, swarm.id)
    }

    return NextResponse.json({ ...swarm, isFavorited: userFavorited })
  } catch (error) {
    logger.serverError(error instanceof Error ? error : String(error), { endpoint: 'GET /api/swarms/[id]' })
    return NextResponse.json(
      { error: 'Failed to fetch swarm' },
      { status: 500 }
    )
  }
}

// PATCH /api/swarms/[id] - Update a swarm
const updateSwarmSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  workflowNodes: z.string().optional(),
  workflowEdges: z.string().optional(),
  workflowMetadata: z.string().optional(),
  image_url: z.string().url().optional(),
  categoryId: z.string().optional(),
  is_public: z.boolean().optional(),
  is_featured: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let existingSwarm
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    existingSwarm = await getSwarmBySlug(id)

    if (!existingSwarm) {
      return NextResponse.json(
        { error: 'Swarm not found' },
        { status: 404 }
      )
    }

    if (existingSwarm.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // If user is trying to update is_featured, verify they are an admin
    if (body.is_featured !== undefined) {
      const userIsAdmin = await isAdmin()
      if (!userIsAdmin) {
        return NextResponse.json(
          { error: 'Only admins can feature swarms' },
          { status: 403 }
        )
      }
    }

    const validated = updateSwarmSchema.parse(body)

    const updatedSwarm = await updateSwarm(existingSwarm.id, validated)

    return NextResponse.json(updatedSwarm)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    logger.serverError(error instanceof Error ? error : String(error), {
      endpoint: 'PATCH /api/swarms/[id]',
      swarmId: existingSwarm?.id
    })
    return NextResponse.json(
      { error: 'Failed to update swarm' },
      { status: 500 }
    )
  }
}

// DELETE /api/swarms/[id] - Delete a swarm
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let existingSwarm
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    existingSwarm = await getSwarmBySlug(id)

    if (!existingSwarm) {
      return NextResponse.json(
        { error: 'Swarm not found' },
        { status: 404 }
      )
    }

    if (existingSwarm.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    await deleteSwarm(existingSwarm.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.serverError(error instanceof Error ? error : String(error), {
      endpoint: 'DELETE /api/swarms/[id]',
      swarmId: existingSwarm?.id
    })
    return NextResponse.json(
      { error: 'Failed to delete swarm' },
      { status: 500 }
    )
  }
}
