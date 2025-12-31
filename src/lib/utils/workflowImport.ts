import type {
  WorkflowNode,
  WorkflowEdge,
  WorkflowNodeInput,
  WorkflowEdgeInput
} from '@/types/workflow'
import {
  nodesNeedLayout,
  applyDagreLayout,
  normalizeNodes,
  normalizeEdges
} from './workflowLayout'

export type { WorkflowNodeInput, WorkflowEdgeInput }

export interface ProcessedWorkflow {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  layoutApplied: boolean
}

/**
 * Process imported workflow data:
 * 1. Auto-layout nodes if positions are missing
 * 2. Normalize all node types to 'artifact'
 * 3. Normalize all edge styles to consistent defaults
 */
export function processImportedWorkflow(
  nodesInput: WorkflowNodeInput[] = [],
  edgesInput: WorkflowEdgeInput[] = []
): ProcessedWorkflow {
  // Handle empty inputs
  if (nodesInput.length === 0) {
    return { nodes: [], edges: [], layoutApplied: false }
  }

  // Normalize edges first (independent of nodes)
  const normalizedEdges = normalizeEdges(edgesInput)

  // Check if layout is needed
  const needsLayout = nodesNeedLayout(nodesInput)

  let normalizedNodes: WorkflowNode[]

  if (needsLayout) {
    // Apply dagre layout - also normalizes nodes
    normalizedNodes = applyDagreLayout(nodesInput, edgesInput)
  } else {
    // Just normalize - preserve existing positions
    normalizedNodes = normalizeNodes(nodesInput)
  }

  return {
    nodes: normalizedNodes,
    edges: normalizedEdges,
    layoutApplied: needsLayout
  }
}

/**
 * Validate that all edge references point to existing nodes
 */
export function validateEdgeReferences(
  nodes: WorkflowNodeInput[],
  edges: WorkflowEdgeInput[]
): { valid: boolean; errors: string[] } {
  const nodeIds = new Set(nodes.map(n => n.id))
  const errors: string[] = []

  edges.forEach(edge => {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge "${edge.id}" references non-existent source node "${edge.source}"`)
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge "${edge.id}" references non-existent target node "${edge.target}"`)
    }
  })

  return { valid: errors.length === 0, errors }
}
