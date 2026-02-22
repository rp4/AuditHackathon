/**
 * Generic Gemini Agent Runner
 *
 * A configurable single-agent that accepts system instructions, tool declarations,
 * and a tool router via AgentConfig. Used by MultiAgentOrchestrator to run
 * both the orchestrator and sub-agents.
 */

import { GoogleGenAI, FunctionCallingConfigMode, type FunctionDeclaration, type Content, type Tool, type PartUnion } from '@google/genai'
import type { StreamChunk, FileAttachment } from '@/lib/copilot/types'
import { trackUsage, type UserContext } from '@/lib/copilot/services/usage-tracking'

export interface ToolResult {
  success: boolean
  result?: unknown
  error?: string
}

export interface AgentConfig {
  model: string
  systemInstruction: string
  functionDeclarations: FunctionDeclaration[]
  toolRouter: (name: string, args: Record<string, unknown>) => Promise<ToolResult>
  codeExecution?: boolean
  userContext?: UserContext
  sessionId?: string
}

export interface HistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

export class ADKAgent {
  private genai: GoogleGenAI
  private config: AgentConfig
  private conversationHistory: Content[] = []

  constructor(config: AgentConfig) {
    this.config = config

    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY environment variable is required')
    }
    this.genai = new GoogleGenAI({ apiKey })
  }

  /**
   * Send a message and stream the response
   */
  async *streamMessage(
    content: string,
    attachments?: FileAttachment[],
    history?: HistoryMessage[]
  ): AsyncGenerator<StreamChunk> {
    try {
      // Initialize conversation history from passed-in history if provided
      if (history && history.length > 0 && this.conversationHistory.length === 0) {
        this.conversationHistory = history.map((msg) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        }))
      }

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

      // Add user message to history (text-only for history)
      this.conversationHistory.push({
        role: 'user',
        parts: [{ text: content }],
      })

      // Build tools array
      const tools: Tool[] = []
      if (this.config.functionDeclarations.length > 0) {
        tools.push({ functionDeclarations: this.config.functionDeclarations })
      }
      if (this.config.codeExecution) {
        tools.push({ codeExecution: {} })
      }

      const chat = this.genai.chats.create({
        model: this.config.model,
        config: {
          systemInstruction: this.config.systemInstruction,
          tools: tools.length > 0 ? tools : undefined,
          toolConfig: this.config.functionDeclarations.length > 0
            ? {
                functionCallingConfig: {
                  mode: FunctionCallingConfigMode.AUTO,
                },
              }
            : undefined,
        },
        history: this.conversationHistory.slice(0, -1),
      })

      // Send message and handle function calling loop
      let response = await chat.sendMessage({ message: messageParts })
      this.trackResponse(response)

      while (true) {
        const candidate = response.candidates?.[0]
        if (!candidate?.content?.parts) break

        for (const part of candidate.content.parts) {
          if (part.text) {
            yield { type: 'text', content: part.text }
          }

          if (part.executableCode) {
            yield {
              type: 'code_execution',
              codeExecution: {
                code: part.executableCode.code || '',
                language: part.executableCode.language || 'python',
                status: 'running',
              },
            }
          }

          if (part.codeExecutionResult) {
            yield {
              type: 'code_result',
              codeExecution: {
                code: '',
                language: 'python',
                output: part.codeExecutionResult.output || '',
                status: part.codeExecutionResult.outcome === 'OUTCOME_OK' ? 'completed' : 'error',
              },
            }
          }

          if (part.functionCall) {
            const fc = part.functionCall
            const toolCallId = crypto.randomUUID()

            yield {
              type: 'tool_call',
              toolCall: {
                id: toolCallId,
                name: fc.name || 'unknown',
                arguments: (fc.args as Record<string, unknown>) || {},
                status: 'running',
              },
            }

            const toolName = fc.name || ''
            const toolArgs = (fc.args as Record<string, unknown>) || {}
            const result = await this.config.toolRouter(toolName, toolArgs)

            const resultStr = result.success
              ? JSON.stringify(result.result, null, 2)
              : `Error: ${result.error}`

            yield {
              type: 'tool_result',
              toolCall: {
                id: toolCallId,
                name: fc.name || 'unknown',
                arguments: (fc.args as Record<string, unknown>) || {},
                result: resultStr,
                status: result.success ? 'completed' : 'error',
              },
            }

            const functionResponseData = result.success
              ? (typeof result.result === 'object' ? result.result as Record<string, unknown> : { output: result.result })
              : { error: result.error }

            response = await chat.sendMessage({
              message: {
                functionResponse: {
                  name: fc.name,
                  response: functionResponseData,
                },
              },
            })
            this.trackResponse(response)

            break
          }
        }

        const hasFunctionCall = candidate.content.parts.some((p) => p.functionCall)
        if (!hasFunctionCall) break
      }

      // Store final assistant response in history
      const finalCandidate = response.candidates?.[0]
      if (finalCandidate?.content) {
        this.conversationHistory.push({
          role: 'model',
          parts: finalCandidate.content.parts || [],
        })
      }

      yield { type: 'done' }
    } catch (error) {
      console.error('Gemini streaming error:', error)
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'An error occurred',
      }
    }
  }

  /**
   * Send a message and get the complete response (non-streaming)
   */
  async sendMessage(
    content: string,
    attachments?: FileAttachment[],
    history?: HistoryMessage[]
  ): Promise<{ text: string; toolCalls?: { name: string; result: string }[] }> {
    const chunks: StreamChunk[] = []

    for await (const chunk of this.streamMessage(content, attachments, history)) {
      chunks.push(chunk)
    }

    const textContent = chunks
      .filter((c) => c.type === 'text')
      .map((c) => c.content)
      .join('')

    const toolCalls = chunks
      .filter((c) => c.type === 'tool_result' && c.toolCall)
      .map((c) => ({
        name: c.toolCall!.name,
        result: c.toolCall!.result || '',
      }))

    return {
      text: textContent,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private trackResponse(response: any): void {
    const ctx = this.config.userContext
    if (!ctx) return
    const usage = response.usageMetadata
    if (!usage) return
    trackUsage({
      userId: ctx.userId,
      userEmail: ctx.userEmail,
      model: this.config.model,
      promptTokens: usage.promptTokenCount || 0,
      outputTokens: usage.candidatesTokenCount || 0,
      totalTokens: usage.totalTokenCount || 0,
      sessionId: this.config.sessionId,
    })
  }

  async close(): Promise<void> {
    // REST client doesn't need cleanup
  }
}
