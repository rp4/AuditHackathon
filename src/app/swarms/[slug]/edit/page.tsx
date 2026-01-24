'use client'

import { use, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  Loader2,
  Save,
  PanelRightClose,
  PanelRight,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useSwarm, useUpdateSwarm, useCategories } from '@/hooks/useSwarms'
import { getCategoryColor } from '@/lib/utils/categoryColors'
import { WorkflowDesigner } from '@/components/workflows/shared/WorkflowDesigner'
import type { Node, Edge } from 'reactflow'

export default function EditSwarmPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { data: swarm, isLoading: loadingSwarm } = useSwarm(resolvedParams.slug)
  const { data: categories = [], isLoading: loadingCategories } = useCategories()
  const updateSwarm = useUpdateSwarm(resolvedParams.slug)

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
  })

  // Workflow state
  const [workflowNodes, setWorkflowNodes] = useState<Node[]>([])
  const [workflowEdges, setWorkflowEdges] = useState<Edge[]>([])

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Populate form when swarm loads
  useEffect(() => {
    if (swarm) {
      setFormData({
        name: swarm.name,
        description: swarm.description,
        categoryId: swarm.categoryId || '',
      })

      // Parse workflow data
      try {
        if (swarm.workflowNodes) {
          setWorkflowNodes(JSON.parse(swarm.workflowNodes))
        }
        if (swarm.workflowEdges) {
          setWorkflowEdges(JSON.parse(swarm.workflowEdges))
        }
      } catch (e) {
        console.error('Error parsing workflow data:', e)
      }
    }
  }, [swarm])

  const handleNodesChange = useCallback((nodes: Node[]) => {
    setWorkflowNodes(nodes)
  }, [])

  const handleEdgesChange = useCallback((edges: Edge[]) => {
    setWorkflowEdges(edges)
  }, [])

  const toggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categoryId: prev.categoryId === categoryId ? '' : categoryId,
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the form errors')
      return
    }

    updateSwarm.mutate(
      {
        name: formData.name,
        description: formData.description,
        categoryId: formData.categoryId || undefined,
        workflowNodes: JSON.stringify(workflowNodes),
        workflowEdges: JSON.stringify(workflowEdges),
        is_public: true,
      },
      {
        onSuccess: (data) => {
          toast.success('Swarm updated successfully!')
          router.push(`/swarms/${data.slug}`)
        },
        onError: (error: any) => {
          toast.error(error.message || 'Failed to update swarm')
        },
      }
    )
  }

  // Loading state
  if (loadingSwarm) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  // Access denied state
  if (!isAuthenticated || !swarm) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-stone-800">Access Denied</h1>
          <p className="text-stone-500">You need to be signed in and own this swarm to edit it</p>
          <Link href={`/swarms/${resolvedParams.slug}`}>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Swarm
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Not authorized state
  if (swarm.userId !== user?.id) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-stone-800">Not Authorized</h1>
          <p className="text-stone-500">You don't have permission to edit this swarm</p>
          <Link href={`/swarms/${resolvedParams.slug}`}>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Swarm
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const nodeCount = workflowNodes.length
  const hasErrors = Object.keys(errors).length > 0

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-stone-50">
      {/* Compact Header */}
      <header className="h-14 border-b border-stone-200 bg-white/80 backdrop-blur-xl flex items-center justify-between px-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href={`/swarms/${resolvedParams.slug}`}>
            <Button variant="ghost" size="sm" className="text-stone-600 hover:text-stone-900 hover:bg-stone-100">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-3">
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
              readOnly={updateSwarm.isPending}
            />
          </div>

          {/* Empty state overlay */}
          {nodeCount === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-4 max-w-md px-8">
                <div className="h-20 w-20 mx-auto rounded-2xl bg-white border border-stone-200 shadow-sm flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-stone-300" />
                </div>
                <h3 className="text-xl font-semibold text-stone-600">No Workflow Yet</h3>
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
            {hasErrors && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Please fix the form errors</span>
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
                disabled={updateSwarm.isPending}
                className={`bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-amber-500/20 ${
                  errors.name ? 'border-red-500' : ''
                }`}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
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
                disabled={updateSwarm.isPending}
                rows={4}
                className={`bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-amber-500/20 resize-none ${
                  errors.description ? 'border-red-500' : ''
                }`}
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-stone-700 text-sm font-medium">Category</Label>
              <div className="flex flex-wrap gap-2">
                {loadingCategories ? (
                  <p className="text-sm text-stone-400">Loading categories...</p>
                ) : (
                  categories.map((category: any) => (
                    <Badge
                      key={category.id}
                      variant="outline"
                      className={`cursor-pointer transition-all ${getCategoryColor(category.name, formData.categoryId === category.id)} ${updateSwarm.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                      onClick={() => !updateSwarm.isPending && toggleCategory(category.id)}
                    >
                      {category.name}
                    </Badge>
                  ))
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-stone-200">
              <Button
                onClick={handleSubmit}
                disabled={updateSwarm.isPending || !formData.name || !formData.description}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg shadow-amber-200"
              >
                {updateSwarm.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
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
