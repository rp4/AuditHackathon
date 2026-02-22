import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma/client'

/**
 * GET /api/copilot/step-results?swarmId=xxx
 * Returns the current user's step results for a workflow (progress overview).
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const swarmId = request.nextUrl.searchParams.get('swarmId')
  if (!swarmId) {
    return NextResponse.json({ error: 'swarmId is required' }, { status: 400 })
  }

  const swarm = await prisma.swarm.findUnique({
    where: { id: swarmId },
    select: { id: true, name: true, workflowNodes: true, userId: true },
  })

  if (!swarm) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
  }

  if (swarm.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden: only the workflow owner can access step results' }, { status: 403 })
  }

  let nodes: Array<{ id: string; data?: { label?: string } }> = []
  try { nodes = JSON.parse(swarm.workflowNodes || '[]') } catch { /* empty */ }

  const stepResults = await prisma.stepResult.findMany({
    where: { userId: session.user.id, swarmId },
    select: {
      nodeId: true,
      result: true,
      completed: true,
      completedAt: true,
      updatedAt: true,
    },
  })

  const resultMap = new Map(stepResults.map((r) => [r.nodeId, r] as const))
  const completedCount = stepResults.filter((r) => r.completed).length

  return NextResponse.json({
    workflowId: swarm.id,
    workflowName: swarm.name,
    totalSteps: nodes.length,
    completedSteps: completedCount,
    progress: nodes.length > 0 ? Math.round((completedCount / nodes.length) * 100) : 0,
    steps: nodes.map((node) => {
      const result = resultMap.get(node.id)
      return {
        nodeId: node.id,
        label: node.data?.label || node.id,
        completed: result?.completed || false,
        completedAt: result?.completedAt || null,
        hasResult: !!result?.result,
        lastUpdated: result?.updatedAt || null,
      }
    }),
  })
}
