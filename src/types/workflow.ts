// Workflow template types for OpenAuditSwarms

export interface WorkflowNode {
  id: string
  type: 'artifact'
  position: { x: number; y: number }
  data: WorkflowNodeData
}

export interface WorkflowNodeData {
  label: string
  description?: string
  instructions?: string
  linkedAgentUrl?: string
  skills?: string[]
  outputs?: string[]
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  type?: string
  animated?: boolean
  style?: {
    stroke?: string
    strokeWidth?: number
    strokeDasharray?: string
  }
}

export interface WorkflowMetadata {
  phase?: string
  standard?: string
  framework?: string
}

// Export format compatible with AuditSwarm-GCP import
export interface WorkflowExport {
  version: string
  data: {
    workflows: Array<{
      name: string
      description?: string
      diagramJson: {
        nodes: WorkflowNode[]
        edges: WorkflowEdge[]
        metadata?: WorkflowMetadata
      }
    }>
  }
}

// Import format (same as export)
export type WorkflowImport = WorkflowExport
