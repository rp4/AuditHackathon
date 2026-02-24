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
  evaluateFindings,
} from './agents'
import { createStepExecutor, type StepExecutorContext } from './agents/step-executor'
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
  selectedNodeId?: string
  selectedNodeLabel?: string
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
          selectedNodeId: this.config.selectedNodeId,
          selectedNodeLabel: this.config.selectedNodeLabel,
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

    // Track consecutive failures per tool name — stop after 3
    const consecutiveFailures = new Map<string, number>()
    const MAX_TOOL_FAILURES = 3

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

          // Check if this tool has hit its failure limit
          const failures = consecutiveFailures.get(toolName) || 0
          if (failures >= MAX_TOOL_FAILURES) {
            yield {
              type: 'text',
              content: `\n\nSorry, the tool \`${toolName}\` failed ${MAX_TOOL_FAILURES} times in a row. Skipping further attempts.\n\n`,
            }
            // Tell Gemini the tool is unavailable so it stops retrying
            const nextResponse = await chat.sendMessage({
              message: {
                functionResponse: {
                  name: toolName,
                  response: { error: `Tool "${toolName}" disabled after ${MAX_TOOL_FAILURES} consecutive failures.` },
                },
              },
            })
            this.trackOrchestratorResponse(nextResponse)
            this._lastResponse = nextResponse
            break
          }

          if (toolName === 'execute_steps') {
            // === STEP EXECUTION PATH ===
            yield* this.handleStepExecution(
              chat,
              toolArgs as { swarmId: string; nodeIds: string[] }
            )
          } else if (toolName === 'delegate_to') {
            // === DELEGATION PATH ===
            yield* this.handleDelegation(
              chat,
              toolArgs as { agent: string; task: string },
              content,
              history
            )
          } else if (toolName === 'submit_to_judge') {
            // === JUDGE EVALUATION PATH ===
            yield* this.handleJudgeSubmission(chat, toolArgs)
          } else {
            // === SWARM TOOL PATH ===
            yield* this.handleSwarmToolCall(chat, toolName, toolArgs)
          }

          // Track success/failure from the last tool result
          const lastResult = this._lastToolSuccess
          if (lastResult === false) {
            consecutiveFailures.set(toolName, failures + 1)
          } else {
            consecutiveFailures.set(toolName, 0)
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
    this._lastToolSuccess = result.success

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
   * Handle execute_steps — spawn step-executor sub-agents (in parallel if multiple).
   * Each agent generates a deliverable for one step. Results are streamed to the
   * canvas via step_status chunks for user review.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async *handleStepExecution(
    chat: any,
    args: { swarmId: string; nodeIds: string[] }
  ): AsyncGenerator<StreamChunk> {
    const { swarmId, nodeIds } = args
    const toolCallId = crypto.randomUUID()

    if (!swarmId || !nodeIds || nodeIds.length === 0) {
      const nextResponse = await chat.sendMessage({
        message: {
          functionResponse: {
            name: 'execute_steps',
            response: { error: 'swarmId and nodeIds are required' },
          },
        },
      })
      this.trackOrchestratorResponse(nextResponse)
      this._lastResponse = nextResponse
      this._lastToolSuccess = false
      return
    }

    // Yield tool_call so the chat UI shows execute_steps is running
    yield {
      type: 'tool_call',
      toolCall: {
        id: toolCallId,
        name: 'execute_steps',
        arguments: args,
        status: 'running',
      },
    }

    // 1. Get step context for all steps
    const contexts: Array<{ nodeId: string; context: StepExecutorContext | null; error?: string }> = []
    for (const nodeId of nodeIds) {
      const result = await this.swarmRouter.callTool('get_step_context', { swarmId, nodeId })
      if (result.success && result.result) {
        const data = result.result as {
          step: { nodeId: string; label: string; description?: string; instructions?: string }
          upstreamSteps: Array<{ label: string; result?: string }>
        }
        contexts.push({
          nodeId,
          context: {
            nodeId,
            label: data.step.label,
            description: data.step.description,
            instructions: data.step.instructions || '',
            upstreamResults: (data.upstreamSteps || [])
              .filter(u => u.result)
              .map(u => ({ label: u.label, result: u.result! })),
          },
        })
      } else {
        contexts.push({ nodeId, context: null, error: result.error || 'Failed to get step context' })
      }
    }

    // 2. Yield step_status: executing for all valid steps
    for (const ctx of contexts) {
      if (ctx.context) {
        yield { type: 'step_status', stepStatus: { nodeId: ctx.nodeId, status: 'executing' } }
      }
    }

    // 3. Run step-executors in parallel, streaming tool activity to the chat
    type ExecutorResult = { nodeId: string; label: string; status: 'review' | 'error'; result?: string; error?: string }

    // Shared queue for streaming chunks from parallel executors
    const chunkQueue: StreamChunk[] = []
    let queueResolver: (() => void) | null = null
    let allExecutorsDone = false

    const enqueueChunk = (chunk: StreamChunk) => {
      chunkQueue.push(chunk)
      if (queueResolver) {
        const resolve = queueResolver
        queueResolver = null
        resolve()
      }
    }

    // Start all executors in parallel — each streams tool calls to the queue
    const executorPromises = contexts.map(async (ctx): Promise<ExecutorResult> => {
      if (!ctx.context) {
        return { nodeId: ctx.nodeId, label: ctx.nodeId, status: 'error', error: ctx.error }
      }

      const stepLabel = ctx.context.label

      try {
        const executor = createStepExecutor({
          model: this.config.model,
          ctx: ctx.context,
          bluthClient: this.bluthClient,
          userContext: this.userContext,
          sessionId: this.config.sessionId,
          onActivity: (chunk) => {
            // Forward nested sub-agent tool calls (wrangler/analyzer) tagged with step label
            if (chunk.toolCall) {
              enqueueChunk({
                ...chunk,
                toolCall: { ...chunk.toolCall, stepLabel },
              })
            }
          },
        })

        // Stream the step executor — forward its own tool calls (delegate_to) tagged with step label
        let deliverable = ''
        for await (const chunk of executor.streamMessage('Execute this step and produce the deliverable.')) {
          if ((chunk.type === 'tool_call' || chunk.type === 'tool_result') && chunk.toolCall) {
            enqueueChunk({
              ...chunk,
              toolCall: { ...chunk.toolCall, stepLabel },
            })
          } else if (chunk.type === 'text') {
            deliverable += chunk.content || ''
          }
          // Ignore 'done' and 'error' from sub-agent stream
        }
        await executor.close()

        // Emit step_status: review so the canvas updates immediately
        enqueueChunk({
          type: 'step_status',
          stepStatus: { nodeId: ctx.nodeId, status: 'review', result: deliverable },
        })

        return { nodeId: ctx.nodeId, label: stepLabel, status: 'review', result: deliverable }
      } catch (error) {
        enqueueChunk({
          type: 'step_status',
          stepStatus: { nodeId: ctx.nodeId, status: 'error' },
        })
        return {
          nodeId: ctx.nodeId,
          label: ctx.context?.label || ctx.nodeId,
          status: 'error',
          error: error instanceof Error ? error.message : 'Step execution failed',
        }
      }
    })

    // Signal when all executors are done
    const settledPromise = Promise.allSettled(executorPromises).then(results => {
      allExecutorsDone = true
      if (queueResolver) {
        const resolve = queueResolver
        queueResolver = null
        resolve()
      }
      return results
    })

    // Drain the queue — yields chunks in real-time as executors produce them
    while (!allExecutorsDone || chunkQueue.length > 0) {
      if (chunkQueue.length > 0) {
        yield chunkQueue.shift()!
      } else if (!allExecutorsDone) {
        await new Promise<void>(r => { queueResolver = r })
      }
    }

    // Collect execution results
    const settled = await settledPromise
    const executionResults: ExecutorResult[] = settled.map(outcome =>
      outcome.status === 'fulfilled'
        ? outcome.value
        : { nodeId: 'unknown', label: 'unknown', status: 'error' as const, error: 'Unexpected failure' }
    )

    // 4. Yield tool_result so the chat UI shows completion
    const successCount = executionResults.filter(r => r.status === 'review').length
    const errorCount = executionResults.filter(r => r.status === 'error').length
    const summaryStr = JSON.stringify({
      executed: executionResults.map(r => ({
        nodeId: r.nodeId,
        label: r.label,
        status: r.status,
      })),
      message: errorCount > 0
        ? `${successCount} step(s) executed, ${errorCount} failed. Results sent to canvas for user review.`
        : `${successCount} step(s) executed${successCount > 1 ? ' in parallel' : ''}. Results sent to canvas for user review.`,
    })

    this._lastToolSuccess = errorCount === 0

    yield {
      type: 'tool_result',
      toolCall: {
        id: toolCallId,
        name: 'execute_steps',
        arguments: args,
        result: summaryStr,
        status: errorCount === 0 ? 'completed' : 'error',
      },
    }

    // 5. Send function response back to orchestrator LLM
    const nextResponse = await chat.sendMessage({
      message: {
        functionResponse: {
          name: 'execute_steps',
          response: JSON.parse(summaryStr),
        },
      },
    })
    this.trackOrchestratorResponse(nextResponse)
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

    // Track delegation success/failure
    this._lastToolSuccess = !delegationError

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

  /**
   * Handle submit_to_judge — evaluate compiled findings against the known issues DB.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async *handleJudgeSubmission(
    chat: any,
    toolArgs: Record<string, unknown>
  ): AsyncGenerator<StreamChunk> {
    const toolCallId = crypto.randomUUID()
    const toolName = 'submit_to_judge'

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

    // Call the evaluation pipeline
    const reportContent = toolArgs.reportContent as string
    const result = await evaluateFindings({
      userId: this.config.userId,
      model: this.config.model,
      userContext: this.userContext,
      reportContent,
    })
    this._lastToolSuccess = result.success

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
    this._lastResponse = nextResponse
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _lastResponse: any = null
  private _lastToolSuccess: boolean | null = null

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
  selectedNodeId?: string
  selectedNodeLabel?: string
}): MultiAgentOrchestrator {
  return new MultiAgentOrchestrator({
    model: config.model || 'gemini-3-flash-preview',
    userId: config.userId,
    userEmail: config.userEmail,
    sessionId: config.sessionId,
    canvasMode: config.canvasMode,
    runMode: config.runMode,
    selectedNodeId: config.selectedNodeId,
    selectedNodeLabel: config.selectedNodeLabel,
  })
}
