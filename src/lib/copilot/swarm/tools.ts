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
    name: 'update_step',
    description:
      'Update a single step (node) in a workflow. Patches only the provided fields — other nodes and fields are preserved. Owner only.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'Workflow slug',
        },
        nodeId: {
          type: 'string',
          description: 'The node ID of the step to update',
        },
        label: { type: 'string', description: 'New step label' },
        description: { type: 'string', description: 'New step description' },
        instructions: {
          type: 'string',
          description: 'New step instructions (supports markdown)',
        },
      },
      required: ['slug', 'nodeId'],
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
    name: 'execute_steps',
    description:
      'Execute one or more workflow steps using AI sub-agents. For parallel-ready steps, all run concurrently. Each result is sent to the canvas for user review. The user must approve each step before you continue.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        swarmId: {
          type: 'string',
          description: 'The swarm/workflow ID',
        },
        nodeIds: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Node IDs of the steps to execute. Pass all nextSteps from get_execution_plan — they will run in parallel if multiple.',
        },
      },
      required: ['swarmId', 'nodeIds'],
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
