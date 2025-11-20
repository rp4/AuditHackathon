import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { getTools, createTool } from '@/lib/db/tools'
import { z } from 'zod'

// GET /api/tools - List tools with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const filters = {
      search: searchParams.get('search') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      platformId: searchParams.get('platformId') || undefined,
      userId: searchParams.get('userId') || undefined,
      isFeatured: searchParams.get('featured') === 'true' ? true : undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      sortBy: (searchParams.get('sortBy') as any) || 'recent',
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
