import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/copilot/sessions/[id]/messages
 * Fetch messages for a session
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const copilotSession = await prisma.copilotSession.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  })

  if (!copilotSession) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const messages = await prisma.copilotMessage.findMany({
    where: { sessionId: id },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      role: true,
      content: true,
      attachments: true,
      toolCalls: true,
      createdAt: true,
    },
  })

  return NextResponse.json({
    messages: messages.map((m) => ({
      ...m,
      attachments: m.attachments ? JSON.parse(m.attachments) : null,
      toolCalls: m.toolCalls ? JSON.parse(m.toolCalls) : null,
    })),
  })
}

/**
 * POST /api/copilot/sessions/[id]/messages
 * Save a new message to a session
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const copilotSession = await prisma.copilotSession.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  })

  if (!copilotSession) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const { role, content, attachments, toolCalls } = body

    if (!role || !content) {
      return NextResponse.json(
        { error: 'role and content are required' },
        { status: 400 }
      )
    }

    const message = await prisma.copilotMessage.create({
      data: {
        sessionId: id,
        role,
        content,
        attachments: attachments ? JSON.stringify(attachments) : null,
        toolCalls: toolCalls ? JSON.stringify(toolCalls) : null,
      },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    })

    await prisma.copilotSession.update({
      where: { id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Save message error:', error)
    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 }
    )
  }
}
