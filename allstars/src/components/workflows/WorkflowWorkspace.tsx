'use client'

import { Sparkles, PanelRightClose, PanelRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'
import type { Node, Edge } from 'reactflow'
import { Loader2 } from 'lucide-react'

const WorkflowDesigner = dynamic(
  () => import('@/components/workflows/shared/WorkflowDesigner').then(mod => ({ default: mod.WorkflowDesigner })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    ),
  }
)

export interface WorkflowWorkspaceProps {
  // Canvas state (controlled)
  nodes: Node[]
  edges: Edge[]
  onNodesChange: (nodes: Node[]) => void
  onEdgesChange: (edges: Edge[]) => void
  readOnly?: boolean

  // Banner (below header, above canvas)
  bannerContent?: React.ReactNode

  // Sidebar (right side)
  sidebarContent?: React.ReactNode
  sidebarOpen?: boolean
  onSidebarToggle?: () => void

  // Header
  headerLeft?: React.ReactNode
  headerRight?: React.ReactNode

  // Node selection
  selectedNodeId?: string | null
  onNodeClick?: (event: React.MouseEvent, node: Node) => void

  // Empty state
  emptyStateTitle?: string
  emptyStateDescription?: string
}

export function WorkflowWorkspace({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  readOnly = false,
  bannerContent,
  sidebarContent,
  sidebarOpen = false,
  onSidebarToggle,
  headerLeft,
  headerRight,
  selectedNodeId,
  onNodeClick,
  emptyStateTitle = 'Start Building',
  emptyStateDescription = 'Click the "Add Step" button above to create your first workflow node. Connect nodes to define the flow of your audit process.',
}: WorkflowWorkspaceProps) {
  const nodeCount = nodes.length
  const showSidebarToggle = onSidebarToggle != null

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-stone-50">
      {/* Header */}
      <header className="h-14 border-b border-stone-200 bg-white/80 backdrop-blur-xl flex items-center justify-between px-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          {headerLeft}
        </div>

        <div className="flex items-center gap-3">
          {headerRight}

          {showSidebarToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSidebarToggle}
              className="text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            >
              {sidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </header>

      {/* Banner */}
      {bannerContent}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <main className="flex-1 relative bg-stone-100">
          {/* Grid background pattern */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `
                linear-gradient(rgba(120,113,108,0.08) 1px, transparent 1px),
                linear-gradient(90deg, rgba(120,113,108,0.08) 1px, transparent 1px)
              `,
              backgroundSize: '24px 24px'
            }}
          />

          {/* Workflow Designer */}
          <div className="absolute inset-0">
            <WorkflowDesigner
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              readOnly={readOnly}
              selectedNodeId={selectedNodeId}
              onNodeClick={onNodeClick}
            />
          </div>

          {/* Empty state overlay */}
          {nodeCount === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-4 max-w-md px-8">
                <div className="h-20 w-20 mx-auto rounded-2xl bg-white border border-stone-200 shadow-sm flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-stone-300" />
                </div>
                <h3 className="text-xl font-semibold text-stone-600">{emptyStateTitle}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">
                  {emptyStateDescription}
                </p>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar */}
        {sidebarContent != null && (
          <aside
            className={`${
              sidebarOpen ? 'w-80' : 'w-0'
            } transition-all duration-300 ease-out overflow-hidden border-l border-stone-200 bg-white shrink-0`}
          >
            <div className="w-80 h-full overflow-y-auto p-5 space-y-6">
              {sidebarContent}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
