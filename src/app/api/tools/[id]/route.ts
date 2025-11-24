import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { getToolBySlug, updateTool, deleteTool, incrementToolViews } from '@/lib/db/tools'
import { isFavorited } from '@/lib/db/favorites'
import { isAdmin } from '@/lib/auth/admin'
import { logger } from '@/lib/utils/logger'
import { z } from 'zod'

// GET /api/tools/[id] - Get a single tool
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const tool = await getToolBySlug(id)

    if (!tool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      )
    }

    // Increment view count asynchronously
    incrementToolViews(tool.id).catch((error) => logger.serverError(error, { toolId: tool.id }))

    // Check if the current user has favorited this tool
    let userFavorited = false
    if (session?.user?.id) {
      userFavorited = await isFavorited(session.user.id, tool.id)
    }

    return NextResponse.json({ ...tool, isFavorited: userFavorited })
  } catch (error) {
    logger.serverError(error instanceof Error ? error : String(error), { endpoint: 'GET /api/tools/[id]' })
    return NextResponse.json(
      { error: 'Failed to fetch tool' },
      { status: 500 }
    )
  }
}

// PATCH /api/tools/[id] - Update a tool
const updateToolSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  documentation: z.string().optional(),
  image_url: z.string().url().optional(),
  categoryId: z.string().optional(),
  platformIds: z.array(z.string()).optional(),
  is_public: z.boolean().optional(),
  is_featured: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let existingTool
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the tool to check ownership
    const { id } = await params
    existingTool = await getToolBySlug(id)

    if (!existingTool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      )
    }

    if (existingTool.userId !== session.user.id) {
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
          { error: 'Only admins can feature tools' },
          { status: 403 }
        )
      }
    }

    const validated = updateToolSchema.parse(body)

    const updatedTool = await updateTool(existingTool.id, validated)

    return NextResponse.json(updatedTool)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    logger.serverError(error instanceof Error ? error : String(error), {
      endpoint: 'PATCH /api/tools/[id]',
      toolId: existingTool?.id
    })
    return NextResponse.json(
      { error: 'Failed to update tool' },
      { status: 500 }
    )
  }
}

// DELETE /api/tools/[id] - Delete a tool
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let existingTool
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the tool to check ownership
    const { id } = await params
    existingTool = await getToolBySlug(id)

    if (!existingTool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      )
    }

    if (existingTool.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    await deleteTool(existingTool.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.serverError(error instanceof Error ? error : String(error), {
      endpoint: 'DELETE /api/tools/[id]',
      toolId: existingTool?.id
    })
    return NextResponse.json(
      { error: 'Failed to delete tool' },
      { status: 500 }
    )
  }
}
