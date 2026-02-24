/**
 * Step-Executor Agent
 *
 * A focused agent that executes a single workflow step and produces the deliverable.
 * It can delegate to wrangler (Bluth data) or analyzer (Python) sub-agents,
 * but has no workflow navigation tools — it just generates the output.
 *
 * Spawned by the MultiAgentOrchestrator's execute_steps handler.
 */

import { ADKAgent } from '../client'
import { DELEGATE_TO_DECLARATION } from './orchestrator'
import {
  WRANGLER_FUNCTION_DECLARATIONS,
  getWranglerSystemInstruction,
} from './wrangler'
import {
  ANALYZER_MODEL,
  getAnalyzerSystemInstruction,
} from './analyzer'
import type { BluthMCPClient } from '../../mcp/bluth-client'
import type { GeminiModel, StreamChunk } from '@/lib/copilot/types'
import type { UserContext } from '@/lib/copilot/services/usage-tracking'

export interface StepExecutorContext {
  nodeId: string
  label: string
  description?: string
  instructions: string
  upstreamResults: Array<{ label: string; result: string }>
}

function getStepExecutorSystemInstruction(ctx: StepExecutorContext): string {
  const upstreamSection = ctx.upstreamResults.length > 0
    ? ctx.upstreamResults.map(r => `### ${r.label}\n${r.result}`).join('\n\n')
    : '*(No upstream results — this is a root step.)*'

  return `You are a Step-Executor agent for AuditSwarm. Your ONLY job is to execute one workflow step and produce its deliverable.

## Your Step

**Step:** ${ctx.label}
${ctx.description ? `**Description:** ${ctx.description}` : ''}

**Instructions:**
${ctx.instructions || '*(No specific instructions provided. Use your best judgment based on the step label and upstream context.)*'}

## Upstream Context (Results from Previous Steps)

${upstreamSection}

## Available Tools

- **delegate_to** — Delegate to specialized sub-agents:
  - \`"wrangler"\`: Query Bluth Company demo data (employees, vendors, journal entries, bank transactions, projects, etc.). Use when the step involves data analysis, financial review, employee verification, vendor analysis, or any data-dependent task.
  - \`"analyzer"\`: Python code execution for statistical analysis, data aggregation, pattern detection, and visualizations. Use when you need calculations or charts.

## Rules

1. **Produce ONLY the deliverable** requested by the instructions — no preamble, methodology narratives, or "next steps" sections.
2. **If the step involves data analysis** and mentions Bluth Company data, delegate to the wrangler agent FIRST to fetch the relevant data, then incorporate that data into your deliverable.
3. **For statistical analysis**, delegate to the analyzer agent with the data from wrangler.
4. **Use upstream context as input data**, not as a template to expand upon.
5. **Match the output format** to what the instructions request — if they say "verify X", produce verification results; if they say "list Y", produce a list.
6. **NEVER fabricate, invent, or assume data** not present in upstream context or returned by tool calls. If data is insufficient, clearly state "Insufficient data" for missing portions.
7. Keep it **concise and actionable** — an auditor should be able to read the result and immediately understand the findings.

**Now execute this step and produce the deliverable.**`
}

export function createStepExecutor(config: {
  model: GeminiModel
  ctx: StepExecutorContext
  bluthClient: BluthMCPClient
  userContext: UserContext
  sessionId?: string
  onActivity?: (chunk: StreamChunk) => void
}): ADKAgent {
  const { model, ctx, bluthClient, userContext, sessionId, onActivity } = config

  return new ADKAgent({
    model,
    systemInstruction: getStepExecutorSystemInstruction(ctx),
    functionDeclarations: [DELEGATE_TO_DECLARATION],
    toolRouter: async (name, args) => {
      if (name !== 'delegate_to') {
        return { success: false, error: `Unknown tool: ${name}` }
      }

      const agentName = (args.agent as string) || ''
      const task = (args.task as string) || ''

      if (!['wrangler', 'analyzer'].includes(agentName)) {
        return {
          success: false,
          error: `Unknown agent "${agentName}". Available: wrangler, analyzer.`,
        }
      }

      // Stream sub-agent and forward tool calls via onActivity callback
      try {
        let subAgent: ADKAgent

        if (agentName === 'wrangler') {
          subAgent = new ADKAgent({
            model,
            systemInstruction: getWranglerSystemInstruction(),
            functionDeclarations: WRANGLER_FUNCTION_DECLARATIONS,
            toolRouter: (toolName, toolArgs) => bluthClient.callTool(toolName, toolArgs),
            userContext,
            sessionId,
          })
        } else {
          subAgent = new ADKAgent({
            model: ANALYZER_MODEL,
            systemInstruction: getAnalyzerSystemInstruction(),
            functionDeclarations: [],
            toolRouter: async () => ({ success: false, error: 'No tools available' }),
            codeExecution: true,
            userContext,
            sessionId,
          })
        }

        // Stream instead of sendMessage — forward tool activity to the chat
        let text = ''
        for await (const chunk of subAgent.streamMessage(task)) {
          if (chunk.type === 'text') {
            text += chunk.content || ''
          } else if (
            (chunk.type === 'tool_call' || chunk.type === 'tool_result') &&
            chunk.toolCall
          ) {
            onActivity?.(chunk)
          } else if (
            (chunk.type === 'code_execution' || chunk.type === 'code_result') &&
            chunk.codeExecution
          ) {
            onActivity?.(chunk)
          }
          // Ignore 'done' and 'error' from sub-agent
        }
        await subAgent.close()

        return {
          success: true,
          result: text || '(no response from agent)',
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Delegation failed',
        }
      }
    },
    userContext,
    sessionId,
  })
}
