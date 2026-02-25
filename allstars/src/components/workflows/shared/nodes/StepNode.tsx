'use client'

import { memo, useCallback } from 'react'
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow'
import { FileText, Trash2, Loader2, Eye, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StepNodeData {
  label: string
  description?: string
  instructions?: string
  readOnly?: boolean
  isSelected?: boolean
  completed?: boolean
  executing?: boolean
  pendingReview?: boolean
  [key: string]: unknown
}

export const StepNode = memo((props: NodeProps<StepNodeData>) => {
  const { data, id } = props
  const { setNodes, setEdges } = useReactFlow()
  const readOnly = data.readOnly || false
  const isSelected = data.isSelected || false
  const executing = data.executing || false
  const pendingReview = data.pendingReview || false
  const completed = !!data.completed

  const onDelete = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id))
    setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id))
  }, [id, setNodes, setEdges])

  return (
    <div
      className={cn(
        'relative min-w-[280px] max-w-[320px] rounded-lg border-2 bg-white shadow-lg transition-all hover:shadow-xl',
        'cursor-pointer group',
        isSelected
          ? 'border-brand-500 ring-2 ring-brand-500/30 shadow-brand-200/50'
          : executing
            ? 'border-brand-500 ring-2 ring-brand-500/20 animate-pulse-ring'
            : pendingReview
              ? 'border-amber-500 ring-2 ring-amber-500/30'
              : completed
                ? 'border-green-500 ring-2 ring-green-500/30'
                : 'border-gray-300'
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-gray-400 !w-3 !h-3"
        style={{ left: -7 }}
      />

      {/* Delete button — hidden in readOnly mode and when node has a status badge */}
      {!readOnly && !executing && !pendingReview && !completed && (
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

      {/* Status badge — upper-right corner */}
      {executing && (
        <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white shadow-md z-10">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        </div>
      )}
      {pendingReview && !executing && (
        <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white shadow-md z-10">
          <Eye className="h-3.5 w-3.5" />
        </div>
      )}
      {completed && !executing && !pendingReview && (
        <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white shadow-md z-10">
          <Check className="h-3.5 w-3.5" />
        </div>
      )}

      <div className="p-4">
        {/* Header with icon and title */}
        <div className="flex items-start gap-3 mb-2">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
              {data.label || 'New Step'}
            </h3>
          </div>
        </div>

        {/* Description */}
        {data.description && (
          <p className="text-xs text-gray-600 line-clamp-2">
            {data.description}
          </p>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-gray-400 !w-3 !h-3"
        style={{ right: -7 }}
      />
    </div>
  )
})

StepNode.displayName = 'StepNode'
