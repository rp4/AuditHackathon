import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/copilot/sessions/[id]
 * Get a specific chat session with its messages
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const copilotSession = await prisma.copilotSession.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      title: true,
      model: true,
      createdAt: true,
      updatedAt: true,
      messages: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          role: true,
          content: true,
          attachments: true,
          toolCalls: true,
          createdAt: true,
        },
      },
    },
  })

  if (!copilotSession) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  return NextResponse.json({
    ...copilotSession,
    messages: copilotSession.messages.map((m) => ({
      ...m,
      attachments: m.attachments ? JSON.parse(m.attachments) : null,
      toolCalls: m.toolCalls ? JSON.parse(m.toolCalls) : null,
    })),
  })
}

/**
 * PATCH /api/copilot/sessions/[id]
 * Update a chat session (e.g., rename)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { title } = body

    const copilotSession = await prisma.copilotSession.updateMany({
      where: { id, userId: session.user.id },
      data: { title: title || 'Chat Session' },
    })

    if (copilotSession.count === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json({
      id,
      title: title || 'Chat Session',
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Update session error:', error)
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/copilot/sessions/[id]
 * Delete a chat session and all its messages (cascade)
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    const deleted = await prisma.copilotSession.deleteMany({
      where: { id, userId: session.user.id },
    })

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, deletedId: id })
  } catch (error) {
    console.error('Delete session error:', error)
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    )
  }
}
