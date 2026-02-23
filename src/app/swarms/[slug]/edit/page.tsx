'use client'

import { use, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  AlertCircle,
  Heart,
  Download,
  Share2,
  Trash2,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAuth } from '@/hooks/useAuth'
import { useSwarm, useUpdateSwarm, useCategories, useToggleFavorite, useDeleteSwarm, useFavorites } from '@/hooks/useSwarms'
import { downloadJson } from '@/lib/utils/downloadJson'
import { getCategoryColor } from '@/lib/utils/categoryColors'
import { WorkflowWorkspace } from '@/components/workflows/WorkflowWorkspace'
import { NodeEditorPanel } from '@/components/workflows/shared/NodeEditorPanel'
import { useRegisterCopilotOptions } from '@/lib/copilot/CopilotOptionsContext'
import { useChatStore } from '@/lib/copilot/stores/chatStore'
import type { Node, Edge } from 'reactflow'

interface StepResultData {
  nodeId: string
  result: string | null
  completed: boolean
  completedAt: string | null
  updatedAt?: string | null
}

export default function EditSwarmPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: swarm, isLoading: loadingSwarm } = useSwarm(resolvedParams.slug)
  const { data: categories = [], isLoading: loadingCategories } = useCategories()
  const updateSwarm = useUpdateSwarm(resolvedParams.slug)
  const toggleFavorite = useToggleFavorite()
  const deleteSwarm = useDeleteSwarm(resolvedParams.slug)
  const { data: favorites } = useFavorites()

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
  })

  // Workflow state
  const [workflowNodes, setWorkflowNodes] = useState<Node[]>([])
  const [workflowEdges, setWorkflowEdges] = useState<Edge[]>([])

  // Step results state
  const [stepResults, setStepResults] = useState<Map<string, StepResultData>>(new Map())
  const [editingResult, setEditingResult] = useState('')
  const [editingCompleted, setEditingCompleted] = useState(false)
  const [savingResult, setSavingResult] = useState(false)
  const [highlightResult, setHighlightResult] = useState(false)
  const [isDraftResult, setIsDraftResult] = useState(false)
  const draftLoadedRef = useRef(false)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [localFavorited, setLocalFavorited] = useState<boolean | null>(null)

  // Initialize local favorite state when swarm loads
  useEffect(() => {
    if (swarm && localFavorited === null) {
      const initialFavorited = swarm.isFavorited || favorites?.swarms?.some((f: any) => f.id === swarm.id) || false
      setLocalFavorited(initialFavorited)
    }
  }, [swarm, favorites, localFavorited])

  const isFavorited = localFavorited === true

  const handleFavorite = () => {
    if (!swarm) return
    const wasFavorited = isFavorited
    setLocalFavorited(!isFavorited)

    toggleFavorite.mutate(
      { swarmId: swarm.id, isFavorited },
      {
        onSuccess: () => {
          toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites')
        },
        onError: () => {
          setLocalFavorited(wasFavorited)
          toast.error('Failed to update favorite')
        },
      }
    )
  }

  const handleExportWorkflow = () => {
    if (!swarm) return

    const categoryPrefix = swarm.category?.name ? `${swarm.category.name}: ` : ''
    const exportData = {
      version: "1.0",
      data: {
        workflows: [{
          name: `${categoryPrefix}${swarm.name}`,
          description: swarm.description,
          diagramJson: {
            nodes: workflowNodes,
            edges: workflowEdges,
            metadata: swarm.workflowMetadata ? JSON.parse(swarm.workflowMetadata) : {}
          }
        }]
      }
    }

    downloadJson(exportData, `${swarm.slug}-workflow.json`)
    toast.success('Workflow exported successfully')
  }

  const handleShare = () => {
    const url = window.location.href.replace('/edit', '')
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied to clipboard')
    }).catch(() => {
      toast.error('Failed to copy link')
    })
  }

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this swarm?')) return

    deleteSwarm.mutate(undefined, {
      onSuccess: () => {
        toast.success('Swarm deleted successfully')
        router.push('/browse')
      },
      onError: () => {
        toast.error('Failed to delete swarm')
      },
    })
  }

  // Register copilot options so the global panel has run mode context
  useRegisterCopilotOptions({
    ...(swarm?.id ? { runMode: { swarmId: swarm.id, swarmSlug: resolvedParams.slug } } : {}),
  })

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

  // Fetch step results when swarm loads
  useEffect(() => {
    if (!swarm?.id) return

    const fetchStepResults = async () => {
      try {
        const res = await fetch(`/api/copilot/step-results?swarmId=${swarm.id}`)
        if (!res.ok) return
        const data = await res.json()
        const map = new Map<string, StepResultData>()
        if (data.steps) {
          for (const step of data.steps) {
            map.set(step.nodeId, {
              nodeId: step.nodeId,
              result: null,
              completed: step.completed,
              completedAt: step.completedAt,
              updatedAt: step.lastUpdated,
            })
          }
        }
        setStepResults(map)
      } catch {
        // ignore
      }
    }
    fetchStepResults()
  }, [swarm?.id])

  // Fetch individual step result when a node is selected
  useEffect(() => {
    if (!selectedNodeId || !swarm?.id) return

    // Skip API fetch if a draft was just loaded from copilot
    if (draftLoadedRef.current) {
      draftLoadedRef.current = false
      return
    }

    setIsDraftResult(false)
    const fetchNodeResult = async () => {
      try {
        const res = await fetch(`/api/copilot/step-results/${swarm.id}/${selectedNodeId}`)
        if (!res.ok) return
        const data = await res.json()
        setEditingResult(data.result || '')
        setEditingCompleted(data.completed || false)
        setStepResults(prev => {
          const next = new Map(prev)
          next.set(selectedNodeId, {
            nodeId: selectedNodeId,
            result: data.result || null,
            completed: data.completed || false,
            completedAt: data.completedAt || null,
            updatedAt: data.updatedAt || null,
          })
          return next
        })
      } catch {
        setEditingResult('')
        setEditingCompleted(false)
      }
    }
    fetchNodeResult()
  }, [selectedNodeId, swarm?.id])

  // Handle draft step result from copilot (via localStorage + query params)
  useEffect(() => {
    const nodeParam = searchParams.get('node')
    const draftParam = searchParams.get('draft')
    if (!nodeParam || draftParam !== '1') return

    const draftJson = localStorage.getItem('draft-step-result')
    if (!draftJson) return

    try {
      const draft = JSON.parse(draftJson)
      if (draft.nodeId !== nodeParam) return

      // Only use drafts less than 5 minutes old
      if (Date.now() - draft.timestamp > 5 * 60 * 1000) {
        localStorage.removeItem('draft-step-result')
        return
      }

      // Pre-populate the result field
      draftLoadedRef.current = true
      setSelectedNodeId(nodeParam)
      setEditingResult(draft.result || '')
      setEditingCompleted(draft.completed ?? true)
      setIsDraftResult(true)

      // Clean up
      localStorage.removeItem('draft-step-result')
      router.replace(`/swarms/${resolvedParams.slug}/edit`, { scroll: false })

      // Highlight the result field
      setHighlightResult(true)
      setTimeout(() => setHighlightResult(false), 5000)

      toast.info('AI result loaded for review. Click "Approve & Continue" to confirm and proceed.')
    } catch {
      localStorage.removeItem('draft-step-result')
    }
  }, [searchParams, router, resolvedParams.slug])

  // Handle ?node= param without draft — just auto-select the node
  useEffect(() => {
    const nodeParam = searchParams.get('node')
    const draftParam = searchParams.get('draft')
    if (!nodeParam || draftParam === '1') return
    if (!workflowNodes.length) return

    const nodeExists = workflowNodes.some(n => n.id === nodeParam)
    if (nodeExists) {
      setSelectedNodeId(nodeParam)
      router.replace(`/swarms/${resolvedParams.slug}/edit`, { scroll: false })
    }
  }, [searchParams, workflowNodes, router, resolvedParams.slug])

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
    setIsDraftResult(false)
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

  const handleSaveStepResult = useCallback(async () => {
    if (!swarm?.id || !selectedNodeId) return

    setSavingResult(true)
    try {
      const res = await fetch(`/api/copilot/step-results/${swarm.id}/${selectedNodeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result: editingResult,
          completed: editingCompleted,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Failed to save step result')
        return
      }

      const data = await res.json()
      setStepResults(prev => {
        const next = new Map(prev)
        next.set(selectedNodeId, {
          nodeId: selectedNodeId,
          result: data.result || null,
          completed: data.completed || false,
          completedAt: data.completedAt || null,
          updatedAt: data.updatedAt || null,
        })
        return next
      })
      toast.success('Step result saved')
    } catch {
      toast.error('Failed to save step result')
    } finally {
      setSavingResult(false)
    }
  }, [swarm?.id, selectedNodeId, editingResult, editingCompleted])

  const handleApproveAndContinue = useCallback(async () => {
    if (!swarm?.id || !selectedNodeId) return

    setSavingResult(true)
    try {
      const res = await fetch(`/api/copilot/step-results/${swarm.id}/${selectedNodeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result: editingResult,
          completed: true,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Failed to save step result')
        return
      }

      const data = await res.json()
      setStepResults(prev => {
        const next = new Map(prev)
        next.set(selectedNodeId, {
          nodeId: selectedNodeId,
          result: data.result || null,
          completed: true,
          completedAt: data.completedAt || null,
          updatedAt: data.updatedAt || null,
        })
        return next
      })

      // Clear draft state and close panel
      setIsDraftResult(false)
      setSelectedNodeId(null)

      toast.success('Step approved! Continuing to next step...')

      // Signal the agent to continue via the chat store
      const { currentSessionId } = useChatStore.getState()
      if (currentSessionId) {
        useChatStore.getState().sendMessage(
          'Step approved, continue to next step.',
          undefined,
          undefined,
          'copilot',
          undefined,
          { runMode: { swarmId: swarm.id, swarmSlug: resolvedParams.slug } }
        )
      }
    } catch {
      toast.error('Failed to save step result')
    } finally {
      setSavingResult(false)
    }
  }, [swarm?.id, selectedNodeId, editingResult, resolvedParams.slug])

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
      <div className="h-screen bg-stone-50">
        <LoadingSpinner fullPage />
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
          <p className="text-stone-500">You don&apos;t have permission to edit this swarm</p>
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

  const hasErrors = Object.keys(errors).length > 0

  // Compute progress
  const completedSteps = Array.from(stepResults.values()).filter(r => r.completed).length
  const totalSteps = workflowNodes.length
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

  // Get selected node
  const selectedNode = selectedNodeId
    ? workflowNodes.find(n => n.id === selectedNodeId) || null
    : null

  const headerLeft = (
    <div className="flex items-center gap-3">
      <Link href="/browse">
        <Button variant="ghost" size="sm" className="text-stone-600 hover:text-stone-900 hover:bg-stone-100">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Browse
        </Button>
      </Link>

      {/* Progress indicator */}
      {totalSteps > 0 && (
        <div className="flex items-center gap-2 text-sm text-stone-600">
          <div className="w-24 h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="font-medium">{completedSteps}/{totalSteps}</span>
        </div>
      )}
    </div>
  )

  const headerRight = (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleFavorite}
              variant="ghost"
              size="sm"
              disabled={toggleFavorite.isPending}
              className={isFavorited ? 'text-pink-600 hover:text-pink-700' : 'text-stone-600'}
            >
              <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isFavorited ? 'Remove from favorites' : 'Add to favorites'}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleExportWorkflow}
              variant="ghost"
              size="sm"
              className="text-stone-600"
            >
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Download workflow</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleShare}
              variant="ghost"
              size="sm"
              className="text-stone-600"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Copy link to clipboard</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleteSwarm.isPending}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete swarm</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )

  // Node editor sidebar (using shared NodeEditorPanel)
  const nodeDetailSidebar = selectedNode ? (
    <NodeEditorPanel
      node={selectedNode}
      onClose={handleDeselectNode}
      onUpdateField={handleNodeUpdate}
      stepResult={{
        result: editingResult,
        completed: editingCompleted,
        saving: savingResult,
        onResultChange: setEditingResult,
        onCompletedChange: setEditingCompleted,
        onSave: handleSaveStepResult,
        highlight: highlightResult,
        isDraft: isDraftResult,
        onApproveAndContinue: handleApproveAndContinue,
      }}
    />
  ) : null

  // Enrich nodes with completed status from step results
  const enrichedNodes = useMemo(
    () => workflowNodes.map(node => {
      const result = stepResults.get(node.id)
      if (result?.completed) {
        return { ...node, data: { ...node.data, completed: true } }
      }
      return node
    }),
    [workflowNodes, stepResults]
  )

  // Banner content — editable template details
  const bannerContent = (
    <div className="shrink-0 border-b border-stone-200 bg-white px-6 py-4">
      {hasErrors && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm mb-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Please fix the form errors</span>
        </div>
      )}
      <div className="flex items-start gap-4">
        {/* Name + Category */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-3">
            <Input
              id="name"
              placeholder="Swarm name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={updateSwarm.isPending}
              className={`text-lg font-semibold h-9 bg-transparent border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-amber-500/20 ${
                errors.name ? 'border-red-500' : ''
              }`}
            />
          </div>
          <Textarea
            id="description"
            placeholder="Describe your workflow template..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={updateSwarm.isPending}
            rows={2}
            className={`text-sm bg-transparent border-stone-200 text-stone-700 placeholder:text-stone-400 focus:border-amber-500 focus:ring-amber-500/20 resize-none ${
              errors.description ? 'border-red-500' : ''
            }`}
          />
        </div>

        {/* Category + Save */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex flex-col gap-1">
            {loadingCategories ? (
              <span className="text-xs text-stone-400">Loading...</span>
            ) : (
              categories.map((category: any) => (
                <Badge
                  key={category.id}
                  variant="outline"
                  className={`cursor-pointer text-xs transition-all ${getCategoryColor(category.name, formData.categoryId === category.id)} ${updateSwarm.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => !updateSwarm.isPending && toggleCategory(category.id)}
                >
                  {category.name}
                </Badge>
              ))
            )}
          </div>

          <div className="h-6 w-px bg-stone-200" />

          <Button
            onClick={handleSubmit}
            disabled={updateSwarm.isPending || !formData.name || !formData.description}
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md"
          >
            {updateSwarm.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <WorkflowWorkspace
      nodes={enrichedNodes}
      edges={workflowEdges}
      onNodesChange={handleNodesChange}
      onEdgesChange={handleEdgesChange}
      readOnly={updateSwarm.isPending}
      bannerContent={bannerContent}
      sidebarContent={nodeDetailSidebar}
      sidebarOpen={!!selectedNodeId}
      headerLeft={headerLeft}
      headerRight={headerRight}
      selectedNodeId={selectedNodeId}
      onNodeClick={handleNodeClick}
      emptyStateTitle="No Workflow Yet"
    />
  )
}
