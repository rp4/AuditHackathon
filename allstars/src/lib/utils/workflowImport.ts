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

interface ProcessedWorkflow {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  layoutApplied: boolean
}

/**
 * Process imported workflow data:
 * 1. Auto-layout nodes if positions are missing
 * 2. Normalize all node types to 'step'
 * 3. Normalize all edge styles to consistent defaults
 */
export function processImportedWorkflow(
  nodesInput: WorkflowNodeInput[] = [],
  edgesInput: WorkflowEdgeInput[] = [],
  options?: { forceLayout?: boolean }
): ProcessedWorkflow {
  // Handle empty inputs
  if (nodesInput.length === 0) {
    return { nodes: [], edges: [], layoutApplied: false }
  }

  // Normalize edges first (independent of nodes)
  const normalizedEdges = normalizeEdges(edgesInput)

  // Check if layout is needed (or forced, e.g. for agent-generated workflows)
  const needsLayout = options?.forceLayout || nodesNeedLayout(nodesInput)

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
