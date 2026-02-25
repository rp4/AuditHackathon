"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { getCategoryColor } from "@/lib/utils/categoryColors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Upload,
  Loader2,
  AlertCircle,
  ChevronLeft,
  FileUp,
  ClipboardPaste,
  Download,
} from "lucide-react"
import { toast } from "sonner"
import type { Node, Edge } from 'reactflow'
import { processImportedWorkflow } from "@/lib/utils/workflowImport"
import { parseWorkflowJson } from "@/lib/utils/parseWorkflowJson"
import { downloadJson } from "@/lib/utils/downloadJson"
import { useCategories } from "@/hooks/useSwarms"
import { WorkflowWorkspace } from "@/components/workflows/WorkflowWorkspace"
import { NodeEditorPanel } from "@/components/workflows/shared/NodeEditorPanel"

export default function CreatePage() {
  const [loading] = useState(false)
  const [error, setError] = useState("")
  const { data: categories = [] } = useCategories()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [pastedJson, setPastedJson] = useState("")
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  // Workflow state
  const [workflowNodes, setWorkflowNodes] = useState<Node[]>([])
  const [workflowEdges, setWorkflowEdges] = useState<Edge[]>([])

  // File input ref for JSON import
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Clear node selection if the selected node is deleted
  useEffect(() => {
    if (selectedNodeId && !workflowNodes.find(n => n.id === selectedNodeId)) {
      setSelectedNodeId(null)
    }
  }, [workflowNodes, selectedNodeId])

  const handleNodesChange = useCallback((nodes: Node[]) => {
    setWorkflowNodes(nodes)
  }, [])

  const handleEdgesChange = useCallback((edges: Edge[]) => {
    setWorkflowEdges(edges)
  }, [])

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id)
  }, [])

  const handleDeselectNode = useCallback(() => {
    setSelectedNodeId(null)
  }, [])

  const handleNodeUpdate = useCallback((nodeId: string, field: string, value: string) => {
    setWorkflowNodes(prev =>
      prev.map(node =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, [field]: value } }
          : node
      )
    )
  }, [])

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault()
    setError("")

    if (!formData.name || !formData.description || !selectedCategoryId) {
      setError("Name, description, and category are required")
      return
    }

    toast.info('Save is not available in standalone demo mode')
  }

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryId(prev => prev === categoryId ? "" : categoryId)
  }

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = parseWorkflowJson(event.target?.result as string)

        if (parsed.name && !formData.name) {
          setFormData(prev => ({ ...prev, name: parsed.name! }))
        }
        if (parsed.description && !formData.description) {
          setFormData(prev => ({ ...prev, description: parsed.description! }))
        }

        const { nodes, edges, layoutApplied } = processImportedWorkflow(parsed.rawNodes, parsed.rawEdges)
        setWorkflowNodes(nodes)
        setWorkflowEdges(edges)

        if (layoutApplied) {
          toast.success('Workflow imported and auto-laid out')
        } else {
          toast.success('Workflow imported successfully')
        }
      } catch (err) {
        console.error('Error parsing JSON:', err)
        toast.error('Failed to parse JSON file')
      }
    }
    reader.readAsText(file)

    // Reset the input so the same file can be selected again
    e.target.value = ''
  }

  const handlePasteJSON = () => {
    if (!pastedJson.trim()) {
      toast.error('Please paste JSON code')
      return
    }

    try {
      const parsed = parseWorkflowJson(pastedJson)

      if (parsed.name && !formData.name) {
        setFormData(prev => ({ ...prev, name: parsed.name! }))
      }
      if (parsed.description && !formData.description) {
        setFormData(prev => ({ ...prev, description: parsed.description! }))
      }

      const { nodes, edges, layoutApplied } = processImportedWorkflow(parsed.rawNodes, parsed.rawEdges)
      setWorkflowNodes(nodes)
      setWorkflowEdges(edges)
      setImportDialogOpen(false)
      setPastedJson("")

      if (layoutApplied) {
        toast.success('Workflow imported and auto-laid out')
      } else {
        toast.success('Workflow imported successfully')
      }
    } catch (err) {
      console.error('Error parsing JSON:', err)
      toast.error('Failed to parse JSON. Please check the format.')
    }
  }

  const handleExport = () => {
    const exportData = {
      version: '1.0',
      data: {
        workflows: [{
          name: formData.name || 'Exported Workflow',
          description: formData.description || '',
          diagramJson: {
            nodes: workflowNodes.map(n => ({
              id: n.id,
              type: n.type,
              position: n.position,
              data: {
                label: n.data.label,
                description: n.data.description,
                instructions: n.data.instructions,
              }
            })),
            edges: workflowEdges.map(e => ({
              id: e.id,
              source: e.source,
              target: e.target
            })),
            metadata: {}
          }
        }]
      }
    }

    downloadJson(exportData, `workflow-${new Date().toISOString().slice(0, 10)}.json`)
    toast.success('Workflow exported')
  }

  const selectedNode = selectedNodeId
    ? workflowNodes.find(n => n.id === selectedNodeId) || null
    : null

  const headerLeft = (
    <Link href="/browse">
      <Button variant="ghost" size="sm" className="text-stone-600 hover:text-stone-900 hover:bg-stone-100">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back
      </Button>
    </Link>
  )

  const headerRight = (
    <>
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            className="text-stone-600 border-stone-200 hover:bg-stone-50"
          >
            <FileUp className="mr-2 h-4 w-4" />
            Import JSON
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Workflow JSON</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Option 1: Upload File */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Upload JSON File</Label>
              <div
                className="border-2 border-dashed border-stone-200 rounded-lg p-6 text-center hover:border-stone-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp className="h-8 w-8 mx-auto mb-2 text-stone-400" />
                <p className="text-sm text-stone-600">Click to select a JSON file</p>
                <p className="text-xs text-stone-400 mt-1">or drag and drop</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={(e) => {
                  handleImportJSON(e)
                  setImportDialogOpen(false)
                }}
                className="hidden"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-stone-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-stone-500">or</span>
              </div>
            </div>

            {/* Option 2: Paste JSON */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Paste JSON Code</Label>
              <Textarea
                placeholder='{"version": "1.0", "data": {"workflows": [...]}}'
                value={pastedJson}
                onChange={(e) => setPastedJson(e.target.value)}
                className="font-mono text-xs h-48 bg-stone-50"
              />
              <Button
                onClick={handlePasteJSON}
                disabled={!pastedJson.trim()}
                className="w-full bg-brand-500 hover:bg-brand-600 text-black"
              >
                <ClipboardPaste className="mr-2 h-4 w-4" />
                Import Pasted JSON
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={workflowNodes.length === 0}
        className="text-stone-600 border-stone-200 hover:bg-stone-50"
      >
        <Download className="mr-2 h-4 w-4" />
        Download JSON
      </Button>
    </>
  )

  // Banner content
  const bannerContent = (
    <div className="shrink-0 border-b border-stone-200 bg-white px-6 py-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm mb-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div className="flex items-start gap-4">
        {/* Name + Description */}
        <div className="flex-1 min-w-0 space-y-2">
          <Input
            id="name"
            placeholder="Workflow name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={loading}
            className="text-lg font-semibold h-9 bg-transparent border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-brand-500 focus:ring-brand-500/20"
          />
          <Textarea
            id="description"
            placeholder="Describe your workflow template..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={loading}
            rows={2}
            className="text-sm bg-transparent border-stone-200 text-stone-700 placeholder:text-stone-400 focus:border-brand-500 focus:ring-brand-500/20 resize-none"
          />
        </div>

        {/* Category + Create */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex flex-col gap-1">
            {categories.map((category: any) => (
              <Badge
                key={category.id}
                variant="outline"
                className={`cursor-pointer text-xs transition-all ${getCategoryColor(category.name, selectedCategoryId === category.id)} ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => !loading && toggleCategory(category.id)}
              >
                {category.name}
              </Badge>
            ))}
          </div>

          <div className="h-6 w-px bg-stone-200" />

          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.name || !formData.description || !selectedCategoryId}
            size="sm"
            className="bg-brand-500 hover:bg-brand-600 text-white shadow-md"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Create
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )

  // Sidebar reserved for node/step details only
  const nodeDetailSidebar = selectedNode ? (
    <NodeEditorPanel
      node={selectedNode}
      onClose={handleDeselectNode}
      onUpdateField={handleNodeUpdate}
      readOnly={loading}
    />
  ) : null

  return (
    <WorkflowWorkspace
      nodes={workflowNodes}
      edges={workflowEdges}
      onNodesChange={handleNodesChange}
      onEdgesChange={handleEdgesChange}
      readOnly={loading}
      bannerContent={bannerContent}
      sidebarContent={nodeDetailSidebar}
      sidebarOpen={!!selectedNodeId}
      headerLeft={headerLeft}
      headerRight={headerRight}
      selectedNodeId={selectedNodeId}
      onNodeClick={handleNodeClick}
    />
  )
}
