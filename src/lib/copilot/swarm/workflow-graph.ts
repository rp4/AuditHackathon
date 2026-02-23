/**
 * Graph utilities for workflow execution ordering.
 *
 * Provides topological sort (Kahn's algorithm) and next-step computation
 * for determining execution order in workflow DAGs.
 */

interface GraphNode {
  id: string
}

interface GraphEdge {
  source: string
  target: string
}

interface TopologicalResult {
  /** Nodes in topological order (respects dependencies) */
  order: string[]
  /** Groups of nodes that can execute in parallel (same "level" in the DAG) */
  parallelGroups: string[][]
  /** True if the graph contains cycles (some nodes excluded from order) */
  hasCycles: boolean
}

/**
 * Compute topological order of nodes using Kahn's algorithm.
 * Also tracks parallel groups (nodes at the same depth level).
 */
export function computeTopologicalOrder(
  nodes: GraphNode[],
  edges: GraphEdge[]
): TopologicalResult {
  const nodeIds = new Set(nodes.map((n) => n.id))

  // Build in-degree map and adjacency list
  const inDegree = new Map<string, number>()
  const adj = new Map<string, string[]>()

  for (const id of nodeIds) {
    inDegree.set(id, 0)
    adj.set(id, [])
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
    adj.get(edge.source)?.push(edge.target)
  }

  // Kahn's algorithm with level tracking
  const order: string[] = []
  const parallelGroups: string[][] = []
  let queue = [...inDegree.entries()]
    .filter(([, deg]) => deg === 0)
    .map(([id]) => id)

  while (queue.length > 0) {
    parallelGroups.push([...queue])
    order.push(...queue)

    const nextQueue: string[] = []
    for (const nodeId of queue) {
      for (const neighbor of adj.get(nodeId) || []) {
        const newDeg = (inDegree.get(neighbor) || 1) - 1
        inDegree.set(neighbor, newDeg)
        if (newDeg === 0) nextQueue.push(neighbor)
      }
    }
    queue = nextQueue
  }

  return {
    order,
    parallelGroups,
    hasCycles: order.length < nodeIds.size,
  }
}

/**
 * Compute the "frontier" of next available steps: uncompleted nodes
 * whose upstream dependencies are all completed.
 */
export function computeNextSteps(
  topologicalOrder: string[],
  completedSet: Set<string>,
  edges: GraphEdge[]
): string[] {
  const nextSteps: string[] = []

  for (const nodeId of topologicalOrder) {
    if (completedSet.has(nodeId)) continue
    const upstreams = edges.filter((e) => e.target === nodeId).map((e) => e.source)
    if (upstreams.every((u) => completedSet.has(u))) {
      nextSteps.push(nodeId)
    }
  }

  return nextSteps
}
