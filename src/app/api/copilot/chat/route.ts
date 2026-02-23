import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth/config'
import { createMultiAgentOrchestrator } from '@/lib/copilot/adk/multi-agent'
import { createCharacterAgent, isValidCharacter } from '@/lib/copilot/adk/agents/characters'
import { createJudgeAgent } from '@/lib/copilot/adk/agents/judge'
import { isValidModel } from '@/lib/copilot/gemini/models'
import { checkUserCanSpend } from '@/lib/copilot/services/usage-tracking'
import type { GeminiModel, AgentId } from '@/lib/copilot/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const chatRequestSchema = z.object({
  message: z.string().max(50000).optional(),
  attachments: z.array(z.object({
    data: z.string().max(10_000_000),
    mimeType: z.string(),
    name: z.string().optional(),
  })).max(5).optional(),
  model: z.string().optional(),
  sessionId: z.string().max(100).optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(50000),
  })).max(100).optional(),
  agentId: z.string().max(50).optional(),
  canvasMode: z.boolean().optional(),
  runMode: z.object({
    swarmId: z.string().max(100).regex(/^[a-zA-Z0-9_-]+$/),
    swarmSlug: z.string().max(200).regex(/^[a-z0-9-]+$/),
  }).optional(),
})

/**
 * POST /api/copilot/chat
 * Stream a chat response using ADK with native MCP support.
 * Routes to different agents based on agentId:
 * - 'copilot' (default): MultiAgentOrchestrator
 * - 'judge': Judge agent for scoring audit findings
 * - 'character:*': Bluth Company character agents for interviews
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in again.' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const userEmail = session.user.email || ''

    const raw = await request.json()
    const body = chatRequestSchema.parse(raw)
    const { message, attachments, model = 'gemini-3-flash-preview', sessionId, history = [], agentId = 'copilot', canvasMode, runMode } = body

    if (!message && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: 'Message or attachments required' },
        { status: 400 }
      )
    }

    if (!isValidModel(model)) {
      return NextResponse.json(
        { error: `Invalid model: ${model}` },
        { status: 400 }
      )
    }

    const limitCheck = await checkUserCanSpend(userId)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: `Monthly spending limit reached ($${limitCheck.currentSpend.toFixed(2)} / $${limitCheck.monthlyLimit.toFixed(2)}). Contact your administrator to increase your limit or wait until the next billing cycle resets on the 1st of the month.`,
        },
        { status: 429 }
      )
    }

    // Create the appropriate agent based on agentId
    // All agent types share the same streamMessage + close interface
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let agent: any

    if (agentId === 'judge') {
      agent = await createJudgeAgent({ model, userId, userEmail, sessionId })
    } else if (agentId.startsWith('character:')) {
      const characterId = agentId.replace('character:', '')
      if (!isValidCharacter(characterId)) {
        return NextResponse.json(
          { error: `Unknown character: ${characterId}` },
          { status: 400 }
        )
      }
      agent = createCharacterAgent({ characterId, model, userId, userEmail, sessionId })
    } else {
      // Default: Copilot (MultiAgentOrchestrator)
      agent = createMultiAgentOrchestrator({ model, userId, userEmail, sessionId, canvasMode, runMode })
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of agent.streamMessage(message, attachments, history)) {
            const data = `data: ${JSON.stringify(chunk)}\n\n`
            controller.enqueue(encoder.encode(data))
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        } catch (error) {
          console.error('Streaming error:', error)
          const errorChunk = {
            type: 'error',
            error: error instanceof Error ? error.message : 'Streaming failed',
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`))
        } finally {
          await agent.close()
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Session-Id': sessionId || '',
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
