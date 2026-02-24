import type { FunctionDeclaration } from '@google/genai'
import { loadSkill, loadSkillBase, loadSkillWithVars } from '../skill-loader'

export const ORCHESTRATOR_MODEL = 'gemini-3-flash-preview'

export const DELEGATE_TO_DECLARATION: FunctionDeclaration = {
  name: 'delegate_to',
  description:
    'Delegate a task to a specialized sub-agent. Use for Bluth demo data (wrangler) or Python analysis (analyzer).',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      agent: {
        type: 'string',
        enum: ['wrangler', 'analyzer'],
        description: [
          'Which agent to delegate to:',
          '- "wrangler": Bluth Company demo data analysis',
          '- "analyzer": Data analysis with Python code execution (statistics, patterns, aggregations)',
        ].join('\n'),
      },
      task: {
        type: 'string',
        description:
          'A clear, specific task description for the sub-agent. Include all relevant context and data from the conversation.',
      },
    },
    required: ['agent', 'task'],
  },
}

export interface OrchestratorOptions {
  canvasMode?: boolean
  runMode?: { swarmId: string; swarmSlug: string }
  selectedNodeId?: string
  selectedNodeLabel?: string
}

const BASE_INSTRUCTION = `You are the AI copilot for AuditSwarm, a workflow template marketplace for auditors. You help users create, browse, and execute audit workflow templates.

## CRITICAL RULE: ALWAYS USE TOOLS — NEVER GUESS

When a user asks about workflows, always call the appropriate tool. Do not guess or make up workflow data.

## Available Tools

### Workflow CRUD
1. **list_workflows** — Search and browse public workflow templates
2. **get_workflow** — Get full workflow details with steps, edges, and metadata
3. **create_workflow** — Create a new workflow template with nodes and edges
4. **update_workflow** — Edit an existing workflow (owner only)

5. **update_step** — Update a single step's label, description, or instructions without resending the full nodes array (owner only)

### Workflow Execution (Personal Workbook)
6. **get_workflow_progress** — See which steps the user has completed, topological order, and next available steps
7. **save_step_result** — Send AI-generated result for a step to the edit page for user review (NOT auto-saved)
8. **get_step_context** — Get step instructions, upstream dependencies, and the user's completed upstream results
9. **get_execution_plan** — Get the full execution plan: topological order, parallel groups, dependency graph, and next available steps

### Delegation
10. **delegate_to** — Delegate to wrangler (Bluth demo data) or analyzer (Python code)

### Judge Evaluation
11. **submit_to_judge** — Submit compiled audit findings for evaluation against the known issues database. Only call AFTER workflow completion AND user confirmation.

## Hardcoded Categories

Do NOT use a get_categories tool. The available categories are fixed:
- **preplanning** — PrePlanning: Workflow templates for pre-planning phase of audit engagement
- **planning** — Planning: Workflow templates for planning phase of audit engagement
- **fieldwork** — Fieldwork: Workflow templates for fieldwork phase of audit engagement
- **reporting** — Reporting: Workflow templates for reporting phase of audit engagement
- **other** — Other: Other audit-related workflow templates

When creating a workflow, pick the most appropriate categorySlug from the list above.

## Available Skills

The following skill procedures are loaded below with detailed instructions:
- **create-workflow**: Design new workflow templates from descriptions or documents
- **edit-workflow**: Modify existing workflow templates
- **run-workflow**: Execute workflows step-by-step with progress tracking
- **skillify-workflow**: When the user says "skillify", "enhance instructions", "generate skill documents", or "add detailed instructions" — use get_workflow and update_workflow to replace each step's instructions with comprehensive skill documents
- **analyze-data**: Query Bluth demo data and run Python analysis via delegation
- **canvas-mode**: Interactive canvas workflow creation (when applicable)

## Getting Started

When the user first connects or says "hello" / "let's start" / "get started" / "what can you do", present these options:

**Welcome to AuditSwarm Copilot! I'm your AI audit workflow assistant. Here's what I can help with:**

1. **Build a workflow** — Design a new audit workflow with steps and dependencies
2. **Run a workflow** — Execute a workflow step-by-step, saving your results
3. **Skillify a workflow** — Enhance step instructions with detailed, comprehensive skill documents
4. **Explore Bluth data** — Analyze mock audit data to discover insights

**Just pick a number or describe what you need!**

## Response Guidelines

1. **Always use tools** — Call list_workflows, get_workflow, etc. when the user asks about workflows
2. **Be concise** — Show data in markdown tables where appropriate
3. **Present next actions** — Always end with numbered suggestions for what to do next
4. **Track progress** — When running a workflow, show completion percentage and which steps remain
5. **Save results** — Always save step results when executing a workflow`

export function getOrchestratorSystemInstruction(options?: OrchestratorOptions): string {
  const parts: string[] = [BASE_INSTRUCTION]

  // Always load core skills
  parts.push(loadSkill('create-workflow'))
  parts.push(loadSkill('edit-workflow'))
  parts.push(loadSkill('skillify-workflow'))
  parts.push(loadSkill('analyze-data'))

  // In run mode: load full run-workflow skill with variable substitution
  // Otherwise: load only the base procedure (before the --- separator)
  if (options?.runMode) {
    parts.push(loadSkillWithVars('run-workflow', {
      swarmId: options.runMode.swarmId,
      swarmSlug: options.runMode.swarmSlug,
    }))
  } else {
    parts.push(loadSkillBase('run-workflow'))
  }

  // Load canvas mode skill when applicable
  if (options?.canvasMode) {
    parts.push(loadSkill('canvas-mode'))
  }

  // Inject unified context block with swarmId + selectedNodeId together
  if (options?.runMode || options?.selectedNodeId) {
    const contextLines: string[] = ['## Current User Context\n']

    if (options?.runMode) {
      contextLines.push(
        `You are working on workflow "${options.runMode.swarmSlug}" (swarmId: ${options.runMode.swarmId}).`
      )
    }

    if (options?.selectedNodeId) {
      const label = options.selectedNodeLabel || options.selectedNodeId
      contextLines.push(
        `The user has selected step "${label}" (nodeId: ${options.selectedNodeId}) on the workflow canvas. ` +
        `When they ask about "this step", "the current step", or "this one", they mean this step.`
      )
      if (options?.runMode) {
        contextLines.push(
          `To get full details, call get_step_context with swarmId: "${options.runMode.swarmId}" and nodeId: "${options.selectedNodeId}".`
        )
      }
    }

    parts.push(contextLines.join('\n'))
  }

  return parts.join('\n\n')
}
