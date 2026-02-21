/**
 * Parse workflow JSON from various formats (export format, direct nodes/edges)
 * Handles double-stringified JSON from AI outputs
 */
export interface ParsedWorkflow {
  rawNodes: any[]
  rawEdges: any[]
  name?: string
  description?: string
}

export function parseWorkflowJson(jsonString: string): ParsedWorkflow {
  let json = JSON.parse(jsonString)

  // Handle double-stringified JSON (when AI outputs JSON as a string)
  if (typeof json === 'string') {
    json = JSON.parse(json)
  }

  // Handle the export format from the detail page
  if (json.version && json.data?.workflows?.[0]?.diagramJson) {
    const workflow = json.data.workflows[0]
    return {
      rawNodes: workflow.diagramJson.nodes || [],
      rawEdges: workflow.diagramJson.edges || [],
      name: workflow.name,
      description: workflow.description,
    }
  }

  // Handle direct nodes/edges format
  if (json.nodes || json.edges) {
    return {
      rawNodes: json.nodes || [],
      rawEdges: json.edges || [],
    }
  }

  throw new Error('Invalid workflow format')
}
