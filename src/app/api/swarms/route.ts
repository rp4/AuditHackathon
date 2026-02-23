import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { getSwarms, createSwarm } from '@/lib/db/swarms'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'
import { requireAuth, handleApiError } from '@/lib/api/helpers'

/**
 * Generate a unique slug by appending a number if the base slug already exists
 */
async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug
  let counter = 1

  // Check for slug uniqueness, append number if needed
  while (await prisma.swarm.findFirst({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

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

    // Allow CDN/browser caching for public, unauthenticated browse queries
    if (!session && !userIdOrUsername && !searchParams.get('search')) {
      return NextResponse.json(result, {
        headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=15' },
      })
    }

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
  categoryId: z.string().min(1, "Category is required"),
  is_public: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const body = await request.json()
    const validated = createSwarmSchema.parse(body)

    // Generate a unique slug (appending number if slug already exists)
    const uniqueSlug = await generateUniqueSlug(validated.slug)

    const swarm = await createSwarm({
      ...validated,
      slug: uniqueSlug,
      userId,
    })

    return NextResponse.json(swarm, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'create workflow')
  }
}
