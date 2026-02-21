"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
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
import dynamic from 'next/dynamic'

const WorkflowDesigner = dynamic(
  () => import('@/components/workflows/shared/WorkflowDesigner').then(mod => ({ default: mod.WorkflowDesigner })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    ),
  }
)
import {
  Upload,
  Loader2,
  AlertCircle,
  ChevronLeft,
  PanelRightClose,
  PanelRight,
  Sparkles,
  FileUp,
  ClipboardPaste,
  Download,
  LogIn
} from "lucide-react"
import { toast } from "sonner"
import type { Node, Edge } from 'reactflow'
import { useRef } from "react"
import { processImportedWorkflow } from "@/lib/utils/workflowImport"
import { parseWorkflowJson } from "@/lib/utils/parseWorkflowJson"
import { downloadJson } from "@/lib/utils/downloadJson"
import { useCategories } from "@/hooks/useSwarms"

const DRAFT_WORKFLOW_KEY = 'draft-swarm-workflow'

export default function UploadPage() {
  const router = useRouter()
  const { user, isAuthenticated, signIn } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { data: categories = [] } = useCategories()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [pastedJson, setPastedJson] = useState("")
  const [showSignInDialog, setShowSignInDialog] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  // Workflow state
  const [workflowNodes, setWorkflowNodes] = useState<Node[]>([])
  const [workflowEdges, setWorkflowEdges] = useState<Edge[]>([])

  // File input ref for JSON import
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Restore draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_WORKFLOW_KEY)
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)
        if (draft.formData) {
          setFormData(draft.formData)
        }
        if (draft.workflowNodes) {
          setWorkflowNodes(draft.workflowNodes)
        }
        if (draft.workflowEdges) {
          setWorkflowEdges(draft.workflowEdges)
        }
        if (draft.selectedCategoryId) {
          setSelectedCategoryId(draft.selectedCategoryId)
        }
        // Clear the draft after restoring
        localStorage.removeItem(DRAFT_WORKFLOW_KEY)
        toast.success('Your previous draft has been restored')
      } catch (err) {
        console.error('Error restoring draft:', err)
        localStorage.removeItem(DRAFT_WORKFLOW_KEY)
      }
    }
  }, [])

  const handleNodesChange = useCallback((nodes: Node[]) => {
    setWorkflowNodes(nodes)
  }, [])

  const handleEdgesChange = useCallback((edges: Edge[]) => {
    setWorkflowEdges(edges)
  }, [])

  const saveDraftToLocalStorage = () => {
    const draft = {
      formData,
      workflowNodes,
      workflowEdges,
      selectedCategoryId,
    }
    localStorage.setItem(DRAFT_WORKFLOW_KEY, JSON.stringify(draft))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name || !formData.description || !selectedCategoryId) {
      setError("Name, description, and category are required")
      return
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      // Save draft to localStorage before prompting sign-in
      saveDraftToLocalStorage()
      setShowSignInDialog(true)
      return
    }

    setLoading(true)

    try {
      // Generate slug from name
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")

      const response = await fetch("/api/swarms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          slug,
          description: formData.description,
          workflowNodes: JSON.stringify(workflowNodes),
          workflowEdges: JSON.stringify(workflowEdges),
          workflowMetadata: JSON.stringify({}),
          categoryId: selectedCategoryId || undefined,
          is_public: true,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create swarm")
      }

      // Clear any saved draft on successful save
      localStorage.removeItem(DRAFT_WORKFLOW_KEY)

      // Redirect to the new swarm page
      router.push(`/swarms/${data.slug}`)
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
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

    downloadJson(exportData, `workflow-${new Date().toISOString().slice(0, 10)}.json`)
    toast.success('Workflow exported')
  }

  const nodeCount = workflowNodes.length

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-stone-50">
      {/* Compact Header */}
      <header className="h-14 border-b border-stone-200 bg-white/80 backdrop-blur-xl flex items-center justify-between px-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/browse">
            <Button variant="ghost" size="sm" className="text-stone-600 hover:text-stone-900 hover:bg-stone-100">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-3">
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
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black"
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

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-stone-600 hover:text-stone-900 hover:bg-stone-100"
          >
            {sidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <main className="flex-1 relative bg-stone-100">
          {/* Subtle grid background pattern */}
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
              readOnly={loading}
            />
          </div>

          {/* Empty state overlay */}
          {nodeCount === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-4 max-w-md px-8">
                <div className="h-20 w-20 mx-auto rounded-2xl bg-white border border-stone-200 shadow-sm flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-stone-300" />
                </div>
                <h3 className="text-xl font-semibold text-stone-600">Start Building</h3>
                <p className="text-stone-500 text-sm leading-relaxed">
                  Click the "Add Step" button above to create your first workflow node.
                  Connect nodes to define the flow of your audit process.
                </p>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-80' : 'w-0'
          } transition-all duration-300 ease-out overflow-hidden border-l border-stone-200 bg-white shrink-0`}
        >
          <div className="w-80 h-full overflow-y-auto p-5 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Swarm Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-stone-700 text-sm font-medium">
                Swarm Name <span className="text-amber-600">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., SOC 2 Control Testing"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={loading}
                className="bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-amber-500/20"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-stone-700 text-sm font-medium">
                Description <span className="text-amber-600">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your workflow template..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={loading}
                rows={4}
                className="bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-amber-500/20 resize-none"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-stone-700 text-sm font-medium">Category <span className="text-amber-600">*</span></Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category.id}
                    variant="outline"
                    className={`cursor-pointer transition-all ${getCategoryColor(category.name, selectedCategoryId === category.id)} ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => !loading && toggleCategory(category.id)}
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Create Button */}
            <div className="pt-4 border-t border-stone-200">
              <Button
                onClick={handleSubmit}
                disabled={loading || !formData.name || !formData.description || !selectedCategoryId}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg shadow-amber-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Create Swarm
                  </>
                )}
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* Sign In Dialog */}
      <Dialog open={showSignInDialog} onOpenChange={setShowSignInDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to save your workflow</DialogTitle>
            <DialogDescription className="text-stone-500">
              Your workflow has been saved locally. Sign in to publish it to the community.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={() => signIn('/create')}
              className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign in with LinkedIn
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSignInDialog(false)}
              className="w-full"
            >
              Continue editing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
