import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { getSwarms, createSwarm } from '@/lib/db/swarms'
import { z } from 'zod'

// GET /api/swarms - List swarms with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)

    const userIdOrUsername = searchParams.get('userId') || undefined

    // Check if this is the user's own profile
    let isOwnProfile = false
    if (session?.user?.id && userIdOrUsername) {
      if (session.user.id === userIdOrUsername) {
        isOwnProfile = true
      } else if (session.user.username === userIdOrUsername) {
        isOwnProfile = true
      }
    }

    // Support multiple categoryIds (comma-separated)
    const categoryIdsParam = searchParams.get('categoryIds')

    const filters = {
      search: searchParams.get('search') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      categoryIds: categoryIdsParam ? categoryIdsParam.split(',') : undefined,
      userId: userIdOrUsername,
      isFeatured: searchParams.get('featured') === 'true' ? true : undefined,
      isPublic: isOwnProfile ? undefined : true,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      sortBy: (searchParams.get('sortBy') as any) || 'recent',
      currentUserId: session?.user?.id,
    }

    const result = await getSwarms(filters)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching swarms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch swarms' },
      { status: 500 }
    )
  }
}

// POST /api/swarms - Create a new swarm
const createSwarmSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().min(1),
  workflowNodes: z.string().optional(),
  workflowEdges: z.string().optional(),
  workflowMetadata: z.string().optional(),
  image_url: z.string().url().optional(),
  categoryId: z.string().optional(),
  is_public: z.boolean().optional(),
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
    const validated = createSwarmSchema.parse(body)

    const swarm = await createSwarm({
      ...validated,
      userId: session.user.id,
    })

    return NextResponse.json(swarm, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating swarm:', error)
    return NextResponse.json(
      { error: 'Failed to create swarm' },
      { status: 500 }
    )
  }
}
