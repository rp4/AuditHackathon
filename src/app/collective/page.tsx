"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { WorkflowDesigner } from "@/components/workflows/shared/WorkflowDesigner"
import {
  ChevronLeft,
  Sparkles,
  FileUp,
  Wand2,
  Copy,
  Check,
  ClipboardPaste,
  Download,
  Trash2
} from "lucide-react"
import { toast } from "sonner"
import type { Node, Edge } from 'reactflow'
import { processImportedWorkflow } from "@/lib/utils/workflowImport"
import { WORKFLOW_GENERATION_PROMPT } from "@/lib/constants/prompts"

const LOCAL_STORAGE_KEY = 'collective-swarm-workflow'

export default function CollectivePage() {
  const [promptCopied, setPromptCopied] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [pastedJson, setPastedJson] = useState("")

  // Workflow state
  const [workflowNodes, setWorkflowNodes] = useState<Node[]>([])
  const [workflowEdges, setWorkflowEdges] = useState<Edge[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // File input ref for JSON import
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        if (data.nodes) setWorkflowNodes(data.nodes)
        if (data.edges) setWorkflowEdges(data.edges)
      }
    } catch (e) {
      console.warn('Failed to load from localStorage:', e)
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage on change
  useEffect(() => {
    if (!isLoaded) return
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        nodes: workflowNodes,
        edges: workflowEdges
      }))
    } catch (e) {
      console.warn('Failed to save to localStorage:', e)
    }
  }, [workflowNodes, workflowEdges, isLoaded])

  const handleNodesChange = useCallback((nodes: Node[]) => {
    setWorkflowNodes(nodes)
  }, [])

  const handleEdgesChange = useCallback((edges: Edge[]) => {
    setWorkflowEdges(edges)
  }, [])

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        let json = JSON.parse(event.target?.result as string)

        // Handle double-stringified JSON
        if (typeof json === 'string') {
          json = JSON.parse(json)
        }

        let rawNodes: any[] = []
        let rawEdges: any[] = []

        // Handle the export format
        if (json.version && json.data?.workflows?.[0]?.diagramJson) {
          const workflow = json.data.workflows[0]
          rawNodes = workflow.diagramJson.nodes || []
          rawEdges = workflow.diagramJson.edges || []
        }
        // Handle direct nodes/edges format
        else if (json.nodes || json.edges) {
          rawNodes = json.nodes || []
          rawEdges = json.edges || []
        }
        else {
          toast.error('Invalid workflow format')
          return
        }

        const { nodes, edges, layoutApplied } = processImportedWorkflow(rawNodes, rawEdges)

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
    e.target.value = ''
  }

  const handlePasteJSON = () => {
    if (!pastedJson.trim()) {
      toast.error('Please paste JSON code')
      return
    }

    try {
      let json = JSON.parse(pastedJson)

      // Handle double-stringified JSON
      if (typeof json === 'string') {
        json = JSON.parse(json)
      }

      let rawNodes: any[] = []
      let rawEdges: any[] = []

      // Handle the export format
      if (json.version && json.data?.workflows?.[0]?.diagramJson) {
        const workflow = json.data.workflows[0]
        rawNodes = workflow.diagramJson.nodes || []
        rawEdges = workflow.diagramJson.edges || []
      }
      // Handle direct nodes/edges format
      else if (json.nodes || json.edges) {
        rawNodes = json.nodes || []
        rawEdges = json.edges || []
      }
      else {
        toast.error('Invalid workflow format')
        return
      }

      const { nodes, edges, layoutApplied } = processImportedWorkflow(rawNodes, rawEdges)

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
          name: 'Exported Workflow',
          description: '',
          diagramJson: {
            nodes: workflowNodes.map(n => ({
              id: n.id,
              type: n.type,
              position: n.position,
              data: {
                label: n.data.label,
                description: n.data.description,
                instructions: n.data.instructions,
                linkedAgentUrl: n.data.linkedAgentUrl
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

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workflow-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Workflow exported')
  }

  const handleClear = () => {
    if (workflowNodes.length === 0 && workflowEdges.length === 0) return
    if (confirm('Are you sure you want to clear the canvas? This cannot be undone.')) {
      setWorkflowNodes([])
      setWorkflowEdges([])
      toast.success('Canvas cleared')
    }
  }

  const nodeCount = workflowNodes.length
  const isEmpty = nodeCount === 0

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-stone-50">
      {/* Header */}
      <header className="h-14 border-b border-stone-200 bg-white/80 backdrop-blur-xl flex items-center justify-between px-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-stone-600 hover:text-stone-900 hover:bg-stone-100">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Home
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-stone-900">Collective Swarm</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* AI Prompt Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-amber-600 border-amber-200 hover:bg-amber-50"
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Prompt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>AI Workflow Generation Prompt</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(WORKFLOW_GENERATION_PROMPT)
                      setPromptCopied(true)
                      setTimeout(() => setPromptCopied(false), 2000)
                      toast.success('Prompt copied to clipboard')
                    }}
                    className="mr-6"
                  >
                    {promptCopied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Prompt
                      </>
                    )}
                  </Button>
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-stone-500 mt-2">
                Copy this prompt and paste it into your AI assistant (Claude, ChatGPT, etc.) along with your audit documents to generate workflow JSON.
              </p>
              <div className="flex-1 overflow-y-auto mt-4">
                <pre className="text-xs bg-stone-50 p-4 rounded-lg whitespace-pre-wrap font-mono border border-stone-200">
                  {WORKFLOW_GENERATION_PROMPT}
                </pre>
              </div>
            </DialogContent>
          </Dialog>

          {/* Import Dialog */}
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-stone-600 border-stone-200 hover:bg-stone-50"
              >
                <FileUp className="mr-2 h-4 w-4" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import Workflow JSON</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* Upload File */}
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

                {/* Paste JSON */}
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
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black"
                  >
                    <ClipboardPaste className="mr-2 h-4 w-4" />
                    Import Pasted JSON
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isEmpty}
            className="text-stone-600 border-stone-200 hover:bg-stone-50 disabled:opacity-50"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>

          {/* Clear Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={isEmpty}
            className="text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      </header>

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
            nodes={workflowNodes}
            edges={workflowEdges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            readOnly={false}
          />
        </div>

        {/* Empty state overlay */}
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center space-y-4 max-w-md px-8">
              <div className="h-20 w-20 mx-auto rounded-2xl bg-white border border-stone-200 shadow-sm flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-stone-300" />
              </div>
              <h3 className="text-xl font-semibold text-stone-600">Start Building</h3>
              <p className="text-stone-500 text-sm leading-relaxed">
                Click the &quot;Add Artifact&quot; button above to create your first workflow step,
                or use the &quot;Prompt&quot; button to generate a workflow with AI.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
