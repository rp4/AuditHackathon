'use client'

import { useCallback } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  ConnectionMode,
  ReactFlowProvider,
  BackgroundVariant,
  applyNodeChanges,
  applyEdgeChanges
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StepNode } from './nodes/StepNode'
import { DeletableEdge } from './edges/DeletableEdge'
import { WorkflowErrorBoundary } from './WorkflowErrorBoundary'

const defaultNodeTypes: NodeTypes = {
  step: StepNode,
  artifact: StepNode  // Legacy support for existing data
}

const defaultEdgeTypes = {
  deletable: DeletableEdge
}

export interface WorkflowDesignerProps {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: (nodes: Node[]) => void
  onEdgesChange: (edges: Edge[]) => void
  onNodeClick?: (event: React.MouseEvent, node: Node) => void
  readOnly?: boolean
  saveButton?: React.ReactNode
  selectedNodeId?: string | null
}

function WorkflowDesignerInner({
  nodes: controlledNodes,
  edges: controlledEdges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  readOnly = false,
  saveButton,
  selectedNodeId
}: WorkflowDesignerProps) {
  const nodes = controlledNodes
  const edges = controlledEdges

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdges = addEdge({
        ...params,
        type: 'deletable',
        animated: true,
        style: {
          stroke: '#6366f1',
          strokeWidth: 2,
          strokeDasharray: '5,5'
        }
      }, edges)
      onEdgesChange(newEdges)
    },
    [edges, onEdgesChange]
  )

  // Add a new step node
  const handleAddStep = useCallback(() => {
    const gridSize = 20
    const nodeWidth = 300
    const nodeSpacing = 100

    let maxX = 0
    let avgY = 200

    if (nodes.length > 0) {
      maxX = Math.max(...nodes.map(n => n.position.x + nodeWidth))
      avgY = nodes.reduce((sum, n) => sum + n.position.y, 0) / nodes.length
    }

    const position = {
      x: Math.round((maxX + nodeSpacing) / gridSize) * gridSize,
      y: Math.round(avgY / gridSize) * gridSize
    }

    const newNode: Node = {
      id: `step_${Date.now()}`,
      type: 'step',
      position,
      data: {
        label: 'New Step',
        description: '',
        instructions: '',
        linkedAgentUrl: '',
        readOnly: false
      }
    }

    onNodesChange([...nodes, newNode])
  }, [nodes, onNodesChange])

  const handleNodesChange = useCallback(
    (changes: any) => {
      const updatedNodes = applyNodeChanges(changes, nodes)
      onNodesChange(updatedNodes)
    },
    [nodes, onNodesChange]
  )

  const handleEdgesChange = useCallback(
    (changes: any) => {
      const updatedEdges = applyEdgeChanges(changes, edges)
      onEdgesChange(updatedEdges)
    },
    [edges, onEdgesChange]
  )

  return (
    <div className="flex w-full" style={{ height: '100%', minHeight: '600px' }}>
      <div className="flex-1" style={{ height: '100%' }}>
        <ReactFlow
          nodes={nodes.map(n => ({ ...n, data: { ...n.data, readOnly, isSelected: n.id === selectedNodeId } }))}
          edges={edges}
          onNodesChange={readOnly ? undefined : handleNodesChange}
          onEdgesChange={readOnly ? undefined : handleEdgesChange}
          onConnect={readOnly ? undefined : onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={defaultNodeTypes}
          edgeTypes={defaultEdgeTypes}
          connectionMode={ConnectionMode.Loose}
          deleteKeyCode={readOnly ? [] : ['Delete', 'Backspace']}
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
          elementsSelectable={!readOnly}
          fitView
          fitViewOptions={{
            padding: 0.2,
            includeHiddenNodes: false
          }}
          snapToGrid={true}
          snapGrid={[20, 20]}
          defaultViewport={{ x: 50, y: 200, zoom: 1 }}
          className={readOnly ? "bg-gray-50" : "bg-slate-50"}
          style={{ width: '100%', height: '100%' }}
        >
          <Background
            color={readOnly ? "#d1d5db" : "#3b82f6"}
            gap={20}
            variant={BackgroundVariant.Dots}
            size={readOnly ? 1 : 1.5}
          />
          <Controls />
          <MiniMap
            nodeColor="#6366f1"
            nodeStrokeWidth={3}
            zoomable
            pannable
            position="bottom-right"
          />

          {/* Top-left: Add Step button (only in edit mode) */}
          {!readOnly && (
            <Panel position="top-left" className="m-2">
              <Button onClick={handleAddStep} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Step
              </Button>
            </Panel>
          )}

          {/* Top-right: Save button */}
          {saveButton && (
            <Panel position="top-right" className="m-2">
              {saveButton}
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  )
}

export function WorkflowDesigner(props: WorkflowDesignerProps) {
  return (
    <WorkflowErrorBoundary>
      <ReactFlowProvider>
        <WorkflowDesignerInner {...props} />
      </ReactFlowProvider>
    </WorkflowErrorBoundary>
  )
}
