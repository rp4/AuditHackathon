'use client'

import { memo, useCallback, useState } from 'react'
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow'
import { FileText, Settings2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArtifactNodeConfigForm } from '../forms/ArtifactNodeConfigForm'
import { Button } from '@/components/ui/button'

export interface ArtifactNodeData {
  label: string
  description?: string
  instructions?: string
  linkedAgentUrl?: string
  readOnly?: boolean
  isSelected?: boolean
  [key: string]: unknown
}

export const ArtifactNode = memo((props: NodeProps<ArtifactNodeData>) => {
  const { data, id } = props
  const { setNodes, setEdges } = useReactFlow()
  const readOnly = data.readOnly || false
  const isSelected = data.isSelected || false
  const [showConfigForm, setShowConfigForm] = useState(false)

  const onDelete = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id))
    setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id))
  }, [id, setNodes, setEdges])

  const handleConfigure = useCallback(() => {
    setShowConfigForm(true)
  }, [])

  const handleSaveConfig = useCallback((configData: {
    label: string
    description?: string
    instructions?: string
    linkedAgentUrl?: string
  }) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                label: configData.label,
                description: configData.description,
                instructions: configData.instructions,
                linkedAgentUrl: configData.linkedAgentUrl,
              },
            }
          : node
      )
    )
    setShowConfigForm(false)
  }, [id, setNodes])

  return (
    <>
      <div
        className={cn(
          'relative min-w-[280px] max-w-[320px] rounded-lg border-2 bg-white shadow-lg transition-all hover:shadow-xl',
          'cursor-pointer group',
          isSelected
            ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-amber-200/50'
            : 'border-gray-300'
        )}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="!bg-gray-400 !w-3 !h-3"
          style={{ left: -7 }}
        />

        {/* Delete button */}
        {!readOnly && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md z-10"
            title="Delete node"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}

        <div className="p-4">
          {/* Header with icon and title */}
          <div className="flex items-start gap-3 mb-2">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                {data.label || 'New Artifact'}
              </h3>
            </div>
          </div>

          {/* Description */}
          {data.description && (
            <p className="text-xs text-gray-600 line-clamp-2 mb-3">
              {data.description}
            </p>
          )}

          {/* Configure button */}
          {!readOnly && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleConfigure}
                className="h-6 px-2"
              >
                <Settings2 className="h-3 w-3 mr-1" />
                Configure
              </Button>
            </div>
          )}
        </div>

        <Handle
          type="source"
          position={Position.Right}
          className="!bg-gray-400 !w-3 !h-3"
          style={{ right: -7 }}
        />
      </div>

      {/* Configuration Dialog */}
      <Dialog open={showConfigForm} onOpenChange={setShowConfigForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configure Artifact Node</DialogTitle>
            <DialogDescription>
              Edit the name, description, and instructions for this artifact
            </DialogDescription>
          </DialogHeader>
          <ArtifactNodeConfigForm
            initialData={{
              label: data.label,
              description: data.description,
              instructions: data.instructions,
              linkedAgentUrl: data.linkedAgentUrl,
            }}
            onSave={handleSaveConfig}
            onCancel={() => setShowConfigForm(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
})

ArtifactNode.displayName = 'ArtifactNode'
