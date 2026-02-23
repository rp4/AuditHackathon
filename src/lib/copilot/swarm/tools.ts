import type { FunctionDeclaration } from '@google/genai'

/**
 * Tool declarations for the AuditSwarm workflow operations.
 * These replace the AuditCanvas MCP tools (query_data, suggest_change, etc.)
 * with direct Prisma-backed workflow operations.
 */
export const SWARM_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'list_workflows',
    description:
      "List the current user's own workflow templates. Returns name, description, category, stats (views, downloads, rating).",
    parametersJsonSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search query for workflow name or description',
        },
        categorySlug: {
          type: 'string',
          description: 'Filter by category slug',
        },
        limit: {
          type: 'number',
          description: 'Max results to return (default 20)',
        },
        sortBy: {
          type: 'string',
          enum: ['recent', 'popular', 'rating'],
          description: 'Sort order (default: recent)',
        },
      },
    },
  },
  {
    name: 'get_workflow',
    description:
      'Get a workflow template by slug with full node/edge data, step descriptions, instructions, and metadata.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'Workflow slug identifier',
        },
      },
      required: ['slug'],
    },
  },
  {
    name: 'create_workflow',
    description:
      'Create a new workflow template with nodes (steps), edges (dependencies), and metadata. Returns the created workflow slug.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Workflow name',
        },
        description: {
          type: 'string',
          description: 'Workflow description',
        },
        categorySlug: {
          type: 'string',
          description: 'Category slug to assign the workflow to',
        },
        nodes: {
          type: 'array',
          description:
            'Array of workflow step nodes. Each node: { id: string, type: "step", position: { x, y }, data: { label, description?, instructions? } }',
          items: { type: 'object' },
        },
        edges: {
          type: 'array',
          description:
            'Array of edges connecting nodes. Each edge: { id: string, source: nodeId, target: nodeId }',
          items: { type: 'object' },
        },
        metadata: {
          type: 'object',
          description:
            'Workflow metadata object, e.g. { phase: "planning", standard: "IIA", framework: "COSO" }',
        },
      },
      required: ['name', 'description', 'nodes'],
    },
  },
  {
    name: 'update_workflow',
    description:
      'Update an existing workflow template. Only the owner can update their own workflows.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'Workflow slug to update',
        },
        name: { type: 'string', description: 'New name' },
        description: { type: 'string', description: 'New description' },
        nodes: {
          type: 'array',
          description: 'Updated nodes array',
          items: { type: 'object' },
        },
        edges: {
          type: 'array',
          description: 'Updated edges array',
          items: { type: 'object' },
        },
        metadata: { type: 'object', description: 'Updated metadata' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'get_favorites',
    description: "Get the current user's favorited workflow templates.",
    parametersJsonSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'toggle_favorite',
    description: 'Favorite or unfavorite a workflow template.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        swarmId: {
          type: 'string',
          description: 'The Swarm ID to favorite or unfavorite',
        },
      },
      required: ['swarmId'],
    },
  },
  {
    name: 'get_workflow_progress',
    description:
      "Get the current user's progress on a workflow — which steps are completed, topological execution order, next available steps (frontier), and dependency edges.",
    parametersJsonSchema: {
      type: 'object',
      properties: {
        swarmId: {
          type: 'string',
          description: 'The swarm/workflow ID',
        },
      },
      required: ['swarmId'],
    },
  },
  {
    name: 'save_step_result',
    description:
      'Send an AI-generated result for a workflow step to the edit page for user review. The result will pre-populate the step\'s result field — the user must click "Approve & Continue" to confirm, save, and proceed to the next step.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        swarmId: {
          type: 'string',
          description: 'The swarm/workflow ID',
        },
        nodeId: {
          type: 'string',
          description: 'The step node ID',
        },
        result: {
          type: 'string',
          description: 'The AI-generated result content for this step',
        },
        completed: {
          type: 'boolean',
          description: 'Whether to mark the step as completed (default: true)',
        },
      },
      required: ['swarmId', 'nodeId', 'result'],
    },
  },
  {
    name: 'get_step_context',
    description:
      "Get detailed context for a workflow step including its label, description, instructions, upstream dependencies, and the user's completed upstream results.",
    parametersJsonSchema: {
      type: 'object',
      properties: {
        swarmId: {
          type: 'string',
          description: 'The swarm/workflow ID',
        },
        nodeId: {
          type: 'string',
          description: 'The step node ID to get context for',
        },
      },
      required: ['swarmId', 'nodeId'],
    },
  },
  {
    name: 'get_execution_plan',
    description:
      'Get a complete execution plan for a workflow including topological step order, parallel groups, dependency graph, completion status, and recommended next steps. Use this at the start of run mode and after each step is approved to determine what to work on next.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        swarmId: {
          type: 'string',
          description: 'The swarm/workflow ID',
        },
      },
      required: ['swarmId'],
    },
  },
  {
    name: 'submit_to_judge',
    description:
      'Submit compiled audit findings from the completed workflow to the Judge for evaluation and scoring against the known issues database. Call this AFTER all workflow steps are completed and you have compiled the findings into a report. The user must confirm before you call this tool.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        reportContent: {
          type: 'string',
          description:
            'The full compiled audit findings report from the completed workflow. Include all issues discovered across all steps with their titles, severities, and summaries.',
        },
      },
      required: ['reportContent'],
    },
  },
]
