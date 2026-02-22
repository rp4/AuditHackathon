/**
 * Multi-Agent Orchestrator
 *
 * The orchestrator handles all AuditSwarm workflow operations directly via
 * SwarmToolRouter (Prisma), and can delegate to specialized sub-agents:
 * - Wrangler: Bluth demo data tools (via MCP)
 * - Analyzer: Python code execution
 *
 * Same streamMessage() signature as ADKAgent — drop-in replacement.
 * Frontend requires zero changes.
 */

import {
  GoogleGenAI,
  FunctionCallingConfigMode,
  type Content,
  type PartUnion,
} from '@google/genai'
import { ADKAgent, type HistoryMessage } from './client'
import { SwarmToolRouter } from '../swarm/tool-router'
import {
  createBluthMCPClient,
  type BluthMCPClient,
} from '../mcp/bluth-client'
import {
  ORCHESTRATOR_MODEL,
  DELEGATE_TO_DECLARATION,
  getOrchestratorSystemInstruction,
  SWARM_TOOL_DECLARATIONS,
  WRANGLER_FUNCTION_DECLARATIONS,
  getWranglerSystemInstruction,
  ANALYZER_MODEL,
  getAnalyzerSystemInstruction,
} from './agents'
import { trackUsage, type UserContext } from '@/lib/copilot/services/usage-tracking'
import type { GeminiModel, StreamChunk, FileAttachment } from '@/lib/copilot/types'

type SubAgentName = 'wrangler' | 'analyzer'

interface MultiAgentConfig {
  model: GeminiModel
  userId: string
  userEmail: string
  sessionId?: string
  canvasMode?: boolean
  runMode?: { swarmId: string; swarmSlug: string }
}

export class MultiAgentOrchestrator {
  private config: MultiAgentConfig
  private swarmRouter: SwarmToolRouter
  private bluthClient: BluthMCPClient

  constructor(config: MultiAgentConfig) {
    this.config = config
    this.swarmRouter = new SwarmToolRouter(config.userId, {
      canvasMode: config.canvasMode,
    })
    this.bluthClient = createBluthMCPClient()
  }

  private get userContext(): UserContext {
    return {
      userId: this.config.userId,
      userEmail: this.config.userEmail,
    }
  }

  private createSubAgent(agentName: SubAgentName): ADKAgent {
    const { sessionId } = this.config
    const userContext = this.userContext
    switch (agentName) {
      case 'wrangler':
        return new ADKAgent({
          model: this.config.model,
          systemInstruction: getWranglerSystemInstruction(),
          functionDeclarations: WRANGLER_FUNCTION_DECLARATIONS,
          toolRouter: (name, args) => this.bluthClient.callTool(name, args),
          userContext,
          sessionId,
        })
      case 'analyzer':
        return new ADKAgent({
          model: ANALYZER_MODEL,
          systemInstruction: getAnalyzerSystemInstruction(),
          functionDeclarations: [],
          toolRouter: async () => ({ success: false, error: 'No tools available' }),
          codeExecution: true,
          userContext,
          sessionId,
        })
      default:
        throw new Error(`Unknown agent: ${agentName}`)
    }
  }

  /**
   * Stream a message through the multi-agent orchestrator.
   * Same signature as ADKAgent.streamMessage() — drop-in replacement.
   */
  async *streamMessage(
    content: string,
    attachments?: FileAttachment[],
    history?: HistoryMessage[]
  ): AsyncGenerator<StreamChunk> {
    try {
      yield* this.runOrchestratorLoop(content, attachments, history)
    } catch (error) {
      console.error('Multi-agent orchestrator error:', error)
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'An error occurred',
      }
    }
  }

  /**
   * Orchestrator loop that handles Swarm tool calls directly and delegates
   * to sub-agents (wrangler, analyzer) via delegate_to.
   */
  private async *runOrchestratorLoop(
    content: string,
    attachments?: FileAttachment[],
    history?: HistoryMessage[]
  ): AsyncGenerator<StreamChunk> {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('API key required')

    const genai = new GoogleGenAI({ apiKey })

    // Build conversation history for orchestrator
    const conversationHistory: Content[] = (history || []).map((msg) => ({
      role: msg.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: msg.content }],
    }))

    // Build message parts (text + inline file data)
    const messageParts: PartUnion[] = []
    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
        if (att.data) {
          messageParts.push({
            inlineData: { data: att.data, mimeType: att.mimeType },
          })
        }
      }
    }
    messageParts.push({ text: content })

    const chat = genai.chats.create({
      model: ORCHESTRATOR_MODEL,
      config: {
        systemInstruction: getOrchestratorSystemInstruction({
          canvasMode: this.config.canvasMode,
          runMode: this.config.runMode,
        }),
        tools: [
          {
            functionDeclarations: [
              ...SWARM_TOOL_DECLARATIONS,
              DELEGATE_TO_DECLARATION,
            ],
          },
        ],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.AUTO,
          },
        },
      },
      history: conversationHistory,
    })

    this._lastResponse = await chat.sendMessage({ message: messageParts })
    this.trackOrchestratorResponse(this._lastResponse)

    while (true) {
      const response = this._lastResponse
      const candidate = response.candidates?.[0]
      if (!candidate?.content?.parts) break

      let handledFunctionCall = false

      for (const part of candidate.content.parts) {
        // Handle orchestrator text
        if (part.text) {
          yield { type: 'text', content: part.text }
        }

        // Handle function calls
        if (part.functionCall) {
          handledFunctionCall = true
          const fc = part.functionCall
          const toolName = fc.name || ''
          const toolArgs = (fc.args as Record<string, unknown>) || {}

          if (toolName === 'delegate_to') {
            // === DELEGATION PATH ===
            yield* this.handleDelegation(
              chat,
              toolArgs as { agent: string; task: string },
              content,
              history
            )
          } else {
            // === SWARM TOOL PATH ===
            yield* this.handleSwarmToolCall(chat, toolName, toolArgs)
          }

          // Break to re-enter while loop — _lastResponse is updated by the handler
          break
        }
      }

      // Continue only if there was a function call
      if (!handledFunctionCall) break
    }

    yield { type: 'done' }
  }

  /**
   * Handle a direct Swarm tool call (list_workflows, get_workflow, etc.)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async *handleSwarmToolCall(
    chat: any,
    toolName: string,
    toolArgs: Record<string, unknown>
  ): AsyncGenerator<StreamChunk> {
    const toolCallId = crypto.randomUUID()

    // Yield tool_call (running)
    yield {
      type: 'tool_call',
      toolCall: {
        id: toolCallId,
        name: toolName,
        arguments: toolArgs,
        status: 'running',
      },
    }

    // Call Swarm tool via Prisma
    const result = await this.swarmRouter.callTool(toolName, toolArgs)

    const resultStr = result.success
      ? JSON.stringify(result.result, null, 2)
      : `Error: ${result.error}`

    // Yield tool_result
    yield {
      type: 'tool_result',
      toolCall: {
        id: toolCallId,
        name: toolName,
        arguments: toolArgs,
        result: resultStr,
        status: result.success ? 'completed' : 'error',
      },
    }

    // Send function response back to the chat
    const functionResponseData = result.success
      ? typeof result.result === 'object'
        ? (result.result as Record<string, unknown>)
        : { output: result.result }
      : { error: result.error }

    const nextResponse = await chat.sendMessage({
      message: {
        functionResponse: {
          name: toolName,
          response: functionResponseData,
        },
      },
    })
    this.trackOrchestratorResponse(nextResponse)

    // Store for the outer loop to pick up on next iteration
    this._lastResponse = nextResponse
  }

  /**
   * Handle delegate_to function call — run a sub-agent and stream its chunks.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async *handleDelegation(
    chat: any,
    args: { agent: string; task: string },
    originalContent: string,
    history?: HistoryMessage[]
  ): AsyncGenerator<StreamChunk> {
    const agentName = args.agent as SubAgentName
    const task = args.task || originalContent

    // Validate agent name
    if (!['wrangler', 'analyzer'].includes(agentName)) {
      const nextResponse = await chat.sendMessage({
        message: {
          functionResponse: {
            name: 'delegate_to',
            response: {
              error: `Unknown agent "${agentName}". Available agents: wrangler, analyzer. For workflow operations, use your tools directly.`,
            },
          },
        },
      })
      this.trackOrchestratorResponse(nextResponse)
      this._lastResponse = nextResponse
      return
    }

    // Yield delegation tool_call so UI shows which agent is working
    const delegationId = crypto.randomUUID()
    yield {
      type: 'tool_call',
      toolCall: {
        id: delegationId,
        name: `delegate_to:${agentName}`,
        arguments: { task },
        status: 'running',
      },
    }

    // Run the sub-agent
    let accumulatedText = ''
    let delegationError: string | null = null

    try {
      const subAgent = this.createSubAgent(agentName)

      for await (const chunk of subAgent.streamMessage(
        task,
        undefined,
        history
      )) {
        if (chunk.type !== 'done' && chunk.type !== 'error') {
          yield chunk
        }
        if (chunk.type === 'text') {
          accumulatedText += chunk.content || ''
        }
        if (chunk.type === 'error') {
          delegationError = chunk.error || 'Sub-agent error'
        }
      }

      await subAgent.close()
    } catch (error) {
      delegationError =
        error instanceof Error ? error.message : 'Delegation failed'
    }

    // Yield delegation completion
    yield {
      type: 'tool_result',
      toolCall: {
        id: delegationId,
        name: `delegate_to:${agentName}`,
        arguments: { task },
        result: delegationError
          ? `Error: ${delegationError}`
          : '(completed)',
        status: delegationError ? 'error' : 'completed',
      },
    }

    // Send function response back to orchestrator
    const functionResponseData = delegationError
      ? { error: delegationError }
      : {
          result:
            accumulatedText || '(no response from agent)',
        }

    const nextResponse = await chat.sendMessage({
      message: {
        functionResponse: {
          name: 'delegate_to',
          response: functionResponseData,
        },
      },
    })
    this.trackOrchestratorResponse(nextResponse)
    this._lastResponse = nextResponse
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _lastResponse: any = null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private trackOrchestratorResponse(response: any): void {
    const usage = response.usageMetadata
    if (!usage) return
    trackUsage({
      userId: this.config.userId,
      userEmail: this.config.userEmail,
      model: ORCHESTRATOR_MODEL,
      promptTokens: usage.promptTokenCount || 0,
      outputTokens: usage.candidatesTokenCount || 0,
      totalTokens: usage.totalTokenCount || 0,
      sessionId: this.config.sessionId,
    })
  }

  async close(): Promise<void> {
    // No persistent resources to clean up
  }
}

/**
 * Create a MultiAgentOrchestrator instance
 */
export function createMultiAgentOrchestrator(config: {
  model?: GeminiModel
  userId: string
  userEmail: string
  sessionId?: string
  canvasMode?: boolean
  runMode?: { swarmId: string; swarmSlug: string }
}): MultiAgentOrchestrator {
  return new MultiAgentOrchestrator({
    model: config.model || 'gemini-3-flash-preview',
    userId: config.userId,
    userEmail: config.userEmail,
    sessionId: config.sessionId,
    canvasMode: config.canvasMode,
    runMode: config.runMode,
  })
}
