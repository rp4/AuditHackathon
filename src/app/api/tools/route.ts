import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { getTools, createTool } from '@/lib/db/tools'
import { z } from 'zod'

// GET /api/tools - List tools with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)

    const userIdOrUsername = searchParams.get('userId') || undefined

    // Check if this is the user's own profile
    // Need to handle both direct ID match and username match
    let isOwnProfile = false
    if (session?.user?.id && userIdOrUsername) {
      // Direct ID match
      if (session.user.id === userIdOrUsername) {
        isOwnProfile = true
      }
      // Username match - need to check both ways
      else if (session.user.username === userIdOrUsername) {
        isOwnProfile = true
      }
    }

    // Support multiple platformIds and categoryIds (comma-separated)
    const platformIdsParam = searchParams.get('platformIds')
    const categoryIdsParam = searchParams.get('categoryIds')

    const filters = {
      search: searchParams.get('search') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      categoryIds: categoryIdsParam ? categoryIdsParam.split(',') : undefined,
      platformId: searchParams.get('platformId') || undefined,
      platformIds: platformIdsParam ? platformIdsParam.split(',') : undefined,
      userId: userIdOrUsername,
      isFeatured: searchParams.get('featured') === 'true' ? true : undefined,
      // If viewing own profile, show all tools (public and private)
      // Otherwise, only show public tools
      isPublic: isOwnProfile ? undefined : true,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      sortBy: (searchParams.get('sortBy') as any) || 'recent',
      currentUserId: session?.user?.id, // Pass the current user's ID for favorite status
    }

    const result = await getTools(filters)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching tools:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tools' },
      { status: 500 }
    )
  }
}

// POST /api/tools - Create a new tool
const createToolSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().min(1),
  documentation: z.string().optional(),
  image_url: z.string().url().optional(),
  categoryId: z.string().optional(),
  platformIds: z.array(z.string()).min(1),
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
    const validated = createToolSchema.parse(body)

    const tool = await createTool({
      ...validated,
      userId: session.user.id,
    })

    return NextResponse.json(tool, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating tool:', error)
    return NextResponse.json(
      { error: 'Failed to create tool' },
      { status: 500 }
    )
  }
}
