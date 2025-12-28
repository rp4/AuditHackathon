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
import { WorkflowDesigner } from "@/components/workflows/shared/WorkflowDesigner"
import {
  Upload,
  Loader2,
  AlertCircle,
  ChevronLeft,
  PanelRightClose,
  PanelRight,
  Sparkles,
  FileUp
} from "lucide-react"
import { toast } from "sonner"
import type { Node, Edge } from 'reactflow'
import { useRef } from "react"

export default function UploadPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  // Workflow state
  const [workflowNodes, setWorkflowNodes] = useState<Node[]>([])
  const [workflowEdges, setWorkflowEdges] = useState<Edge[]>([])

  // File input ref for JSON import
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && user !== undefined) {
      router.push("/")
    }
  }, [isAuthenticated, user, router])

  // Load categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesRes = await fetch("/api/categories")

        if (categoriesRes.ok) {
          const data = await categoriesRes.json()
          setCategories(data)
        }
      } catch (err) {
        console.error("Error fetching data:", err)
      }
    }

    fetchData()
  }, [])

  const handleNodesChange = useCallback((nodes: Node[]) => {
    setWorkflowNodes(nodes)
  }, [])

  const handleEdgesChange = useCallback((edges: Edge[]) => {
    setWorkflowEdges(edges)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name || !formData.description || !selectedCategoryId) {
      setError("Name, description, and category are required")
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
        const json = JSON.parse(event.target?.result as string)

        // Handle the export format from the detail page
        if (json.version && json.data?.workflows?.[0]?.diagramJson) {
          const workflow = json.data.workflows[0]
          const { nodes, edges } = workflow.diagramJson

          if (Array.isArray(nodes)) {
            setWorkflowNodes(nodes)
          }
          if (Array.isArray(edges)) {
            setWorkflowEdges(edges)
          }

          // Optionally populate name and description from the workflow
          if (workflow.name && !formData.name) {
            setFormData(prev => ({ ...prev, name: workflow.name }))
          }
          if (workflow.description && !formData.description) {
            setFormData(prev => ({ ...prev, description: workflow.description }))
          }

          toast.success('Workflow imported successfully')
        }
        // Handle direct nodes/edges format
        else if (json.nodes && json.edges) {
          if (Array.isArray(json.nodes)) {
            setWorkflowNodes(json.nodes)
          }
          if (Array.isArray(json.edges)) {
            setWorkflowEdges(json.edges)
          }
          toast.success('Workflow imported successfully')
        }
        else {
          toast.error('Invalid workflow format')
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

  if (!isAuthenticated) {
    return null
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="text-stone-600 border-stone-200 hover:bg-stone-50"
          >
            <FileUp className="mr-2 h-4 w-4" />
            Import JSON
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportJSON}
            className="hidden"
          />

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
                  Click the "Add Artifact" button above to create your first workflow node.
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
    </div>
  )
}
