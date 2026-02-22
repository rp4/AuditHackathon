import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma/client'

interface RouteParams {
  params: Promise<{ swarmId: string; nodeId: string }>
}

/**
 * GET /api/copilot/step-results/[swarmId]/[nodeId]
 * Returns the current user's result for a specific step.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { swarmId, nodeId } = await params

  const stepResult = await prisma.stepResult.findUnique({
    where: {
      userId_swarmId_nodeId: {
        userId: session.user.id,
        swarmId,
        nodeId,
      },
    },
    select: {
      id: true,
      result: true,
      completed: true,
      completedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!stepResult) {
    return NextResponse.json({
      nodeId,
      swarmId,
      result: null,
      completed: false,
    })
  }

  return NextResponse.json({
    nodeId,
    swarmId,
    ...stepResult,
  })
}

/**
 * PATCH /api/copilot/step-results/[swarmId]/[nodeId]
 * Upsert a step result for the current user.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { swarmId, nodeId } = await params
  const body = await request.json()
  const { result, completed } = body as { result?: string; completed?: boolean }

  const stepResult = await prisma.stepResult.upsert({
    where: {
      userId_swarmId_nodeId: {
        userId: session.user.id,
        swarmId,
        nodeId,
      },
    },
    create: {
      userId: session.user.id,
      swarmId,
      nodeId,
      result: result || null,
      completed: completed ?? false,
      completedAt: completed ? new Date() : null,
    },
    update: {
      ...(result !== undefined && { result }),
      ...(completed !== undefined && {
        completed,
        completedAt: completed ? new Date() : null,
      }),
    },
    select: {
      id: true,
      result: true,
      completed: true,
      completedAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({
    nodeId,
    swarmId,
    ...stepResult,
  })
}
