import dagre from '@dagrejs/dagre'
import type {
  WorkflowNode,
  WorkflowEdge,
  WorkflowNodeInput,
  WorkflowEdgeInput
} from '@/types/workflow'

// Default style constants (matching WorkflowDesigner.tsx and DeletableEdge.tsx)
const DEFAULT_EDGE_STYLE = {
  stroke: '#6366f1',      // indigo-500
  strokeWidth: 2,
  strokeDasharray: '5,5'  // dashed
} as const

const DEFAULT_NODE_TYPE = 'step' as const
const DEFAULT_EDGE_TYPE = 'deletable' as const

// Layout configuration
interface LayoutOptions {
  direction?: 'LR' | 'TB'
  nodeWidth?: number
  nodeHeight?: number
  horizontalSpacing?: number
  verticalSpacing?: number
}

const DEFAULT_LAYOUT_OPTIONS: Required<LayoutOptions> = {
  direction: 'LR',
  nodeWidth: 300,
  nodeHeight: 120,
  horizontalSpacing: 50,
  verticalSpacing: 100
}

/**
 * Check if any nodes are missing position data
 * Accepts any array of objects with optional position field
 */
export function nodesNeedLayout(nodes: Array<{ position?: { x: number; y: number } }>): boolean {
  if (nodes.length === 0) return false

  return nodes.some(node =>
    !node.position ||
    typeof node.position.x !== 'number' ||
    typeof node.position.y !== 'number'
  )
}

/**
 * Apply dagre auto-layout to nodes based on edge connections
 * Returns nodes with calculated positions
 */
export function applyDagreLayout(
  nodes: WorkflowNodeInput[],
  edges: WorkflowEdgeInput[],
  options: LayoutOptions = {}
): WorkflowNode[] {
  if (nodes.length === 0) return []

  const opts = { ...DEFAULT_LAYOUT_OPTIONS, ...options }

  // Create dagre graph
  const g = new dagre.graphlib.Graph()

  g.setGraph({
    rankdir: opts.direction,
    nodesep: opts.horizontalSpacing,
    ranksep: opts.verticalSpacing,
    marginx: 50,
    marginy: 50
  })

  g.setDefaultEdgeLabel(() => ({}))

  // Add nodes to graph
  nodes.forEach(node => {
    g.setNode(node.id, {
      width: opts.nodeWidth,
      height: opts.nodeHeight
    })
  })

  // Add edges to graph (only if both endpoints exist)
  edges.forEach(edge => {
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target)
    }
  })

  // Run layout algorithm
  dagre.layout(g)

  // Extract positions and normalize nodes
  return nodes.map(node => {
    const nodeWithPosition = g.node(node.id)

    return {
      id: node.id,
      type: DEFAULT_NODE_TYPE,
      position: {
        // dagre returns center position, adjust for React Flow (top-left origin)
        x: Math.round(nodeWithPosition.x - opts.nodeWidth / 2),
        y: Math.round(nodeWithPosition.y - opts.nodeHeight / 2)
      },
      data: {
        label: node.data.label,
        description: node.data.description,
        instructions: node.data.instructions,
        linkedAgentUrl: node.data.linkedAgentUrl,
        skills: node.data.skills,
        outputs: node.data.outputs
      }
    }
  })
}

/**
 * Normalize nodes - apply consistent type and preserve positions
 * Use when positions are already provided
 */
export function normalizeNodes(nodes: WorkflowNodeInput[]): WorkflowNode[] {
  return nodes.map(node => ({
    id: node.id,
    type: DEFAULT_NODE_TYPE,
    position: {
      x: node.position?.x ?? 0,
      y: node.position?.y ?? 0
    },
    data: {
      label: node.data.label,
      description: node.data.description,
      instructions: node.data.instructions,
      linkedAgentUrl: node.data.linkedAgentUrl,
      skills: node.data.skills,
      outputs: node.data.outputs
    }
  }))
}

/**
 * Normalize edges - strip custom styles and apply consistent defaults
 */
export function normalizeEdges(edges: WorkflowEdgeInput[]): WorkflowEdge[] {
  return edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: DEFAULT_EDGE_TYPE,
    animated: true,
    style: { ...DEFAULT_EDGE_STYLE }
  }))
}
