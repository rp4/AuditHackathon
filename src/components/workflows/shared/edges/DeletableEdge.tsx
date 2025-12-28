'use client'

import { FC, useCallback, useState } from 'react'
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  useReactFlow
} from 'reactflow'
import { X } from 'lucide-react'

export const DeletableEdge: FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) => {
  const { setEdges } = useReactFlow()
  const [isHovered, setIsHovered] = useState(false)
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const onEdgeClick = useCallback(
    (evt: React.MouseEvent) => {
      evt.stopPropagation()
      setEdges((edges) => edges.filter((edge) => edge.id !== id))
    },
    [id, setEdges]
  )

  return (
    <>
      {/* Invisible wider path for hover detection */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={20}
        stroke="transparent"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ cursor: 'pointer' }}
      />
      {/* Visible edge */}
      <path
        d={edgePath}
        fill="none"
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: style.stroke || '#6366f1',
          strokeWidth: style.strokeWidth || 2,
          strokeDasharray: style.strokeDasharray || '5,5',
          pointerEvents: 'none',
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <button
            className={`w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-opacity shadow-md ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={onEdgeClick}
            title="Delete connection"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
