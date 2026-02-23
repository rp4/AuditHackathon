'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  ArrowLeft,
  Heart,
  Edit,
  Trash2,
  Share2,
  Download,
  User,
  ChevronLeft,
  Eye,
  FileText,
  X,
} from 'lucide-react'
import type { Node } from 'reactflow'
import { useSwarm, useToggleFavorite, useDeleteSwarm, useFavorites } from '@/hooks/useSwarms'
import { useAuth } from '@/hooks/useAuth'
import { getCategoryColor } from '@/lib/utils/categoryColors'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'sonner'
import { downloadJson } from '@/lib/utils/downloadJson'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import dynamic from 'next/dynamic'

// Fix common markdown issues: ensure space after # for headings
function normalizeMarkdown(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/^(#{1,6})([^\s#])/gm, '$1 $2')
}
import { Loader2 as WorkflowLoader } from 'lucide-react'

const WorkflowDesigner = dynamic(
  () => import('@/components/workflows/shared/WorkflowDesigner').then(mod => ({ default: mod.WorkflowDesigner })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <WorkflowLoader className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    ),
  }
)
import type { WorkflowExport } from '@/types/workflow'

const noop = () => {}

interface SwarmDetailClientProps {
  slug: string
}

export default function SwarmDetailClient({ slug }: SwarmDetailClientProps) {
  const router = useRouter()
  const { user, isAuthenticated, signIn } = useAuth()
  const { data: swarm, isLoading } = useSwarm(slug)
  const { data: favorites } = useFavorites()
  const toggleFavorite = useToggleFavorite()
  const deleteSwarm = useDeleteSwarm(slug)

  const [localFavorited, setLocalFavorited] = useState<boolean | null>(null)
  const [localFavoritesCount, setLocalFavoritesCount] = useState<number | null>(null)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  // Parse workflow data
  const workflowNodes = useMemo(() => {
    try {
      return swarm?.workflowNodes ? JSON.parse(swarm.workflowNodes) : []
    } catch {
      return []
    }
  }, [swarm?.workflowNodes])

  const workflowEdges = useMemo(() => {
    try {
      return swarm?.workflowEdges ? JSON.parse(swarm.workflowEdges) : []
    } catch {
      return []
    }
  }, [swarm?.workflowEdges])

  // Initialize local favorite state only once when swarm loads
  useEffect(() => {
    if (swarm && localFavorited === null && localFavoritesCount === null) {
      const initialFavorited = swarm.isFavorited || favorites?.swarms?.some((f: any) => f.id === swarm.id) || false
      setLocalFavorited(initialFavorited)
      setLocalFavoritesCount(swarm.favorites_count || 0)
    }
  }, [swarm, favorites, localFavorited, localFavoritesCount])

  const isOwner = user && swarm && user.id === swarm.userId
  const isFavorited = localFavorited === true

  // Auto-redirect owners to the edit page
  useEffect(() => {
    if (isOwner && swarm) {
      router.replace(`/swarms/${swarm.slug}/edit`)
    }
  }, [isOwner, swarm, router])

  const handleExportWorkflow = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to download workflows')
      signIn(`/swarms/${slug}`)
      return
    }

    if (!swarm) return

    const categoryPrefix = swarm.category?.name ? `${swarm.category.name}: ` : ''
    const exportData: WorkflowExport = {
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

  const handleFavorite = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to favorite swarms')
      return
    }

    const wasFavorited = isFavorited
    const currentCount = localFavoritesCount ?? swarm?.favorites_count ?? 0
    setLocalFavorited(!isFavorited)
    setLocalFavoritesCount(isFavorited ? currentCount - 1 : currentCount + 1)

    toggleFavorite.mutate(
      { swarmId: swarm!.id, isFavorited },
      {
        onSuccess: () => {
          toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites')
        },
        onError: () => {
          setLocalFavorited(wasFavorited)
          const currentCount = localFavoritesCount ?? swarm?.favorites_count ?? 0
          setLocalFavoritesCount(wasFavorited ? currentCount : currentCount - 1)
          toast.error('Failed to update favorite')
        },
      }
    )
  }

  const handleShare = () => {
    const url = window.location.href
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

  const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }

  const handleCloseNodeView = () => {
    setSelectedNode(null)
  }

  if (isLoading) {
    return (
      <div className="h-screen bg-stone-50">
        <LoadingSpinner fullPage />
      </div>
    )
  }

  if (!swarm) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-stone-800">Swarm Not Found</h1>
          <p className="text-stone-500 mb-8">
            The swarm you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/browse">
            <Button className="bg-amber-500 hover:bg-amber-600 text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Browse
            </Button>
          </Link>
        </div>
      </div>
    )
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
              Browse
            </Button>
          </Link>
        </div>

        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-2">
            {/* Action buttons */}
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

            {isOwner && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={`/swarms/${swarm.slug}/edit`}>
                      <Button variant="ghost" size="sm" className="text-stone-600">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit swarm</p>
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
              </>
            )}
          </div>
        </TooltipProvider>
      </header>

      {/* Details Banner */}
      <div className="shrink-0 border-b border-stone-200 bg-white px-6 py-4">
        <div className="flex items-start gap-6">
          {/* Left: Title + Badges + Description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-semibold text-stone-800 truncate">{swarm.name}</h1>
              {swarm.category && (
                <Badge variant="outline" className={`shrink-0 ${getCategoryColor(swarm.category.name, true)}`}>
                  {swarm.category.name}
                </Badge>
              )}
              {swarm.is_featured && (
                <Badge className="shrink-0 bg-amber-100 text-amber-700 border-amber-200">Featured</Badge>
              )}
            </div>
            <p className="text-stone-600 text-sm line-clamp-2">{swarm.description}</p>
          </div>

          {/* Right: Author */}
          <div className="flex items-center shrink-0">
            <Link href={`/profile/${swarm.user.id}`} className="flex items-center gap-2 hover:opacity-80">
              <Avatar className="h-8 w-8 ring-2 ring-stone-100">
                <AvatarImage src={swarm.user.image || undefined} alt={swarm.user.name || 'User'} />
                <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">
                  {swarm.user.name
                    ? swarm.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                    : <User className="h-3 w-3" />
                  }
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="text-sm font-medium text-stone-700">{swarm.user.name || 'Anonymous'}</span>
                <p className="text-xs text-stone-500">{new Date(swarm.updatedAt).toLocaleDateString()}</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

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
            {workflowNodes.length > 0 ? (
              <WorkflowDesigner
                nodes={workflowNodes}
                edges={workflowEdges}
                onNodesChange={noop}
                onEdgesChange={noop}
                onNodeClick={handleNodeClick}
                readOnly={true}
                selectedNodeId={selectedNode?.id}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="h-20 w-20 mx-auto rounded-2xl bg-white border border-stone-200 shadow-sm flex items-center justify-center">
                    <Eye className="h-10 w-10 text-stone-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-stone-600">No Workflow</h3>
                  <p className="text-stone-500 text-sm">This swarm doesn&apos;t have a workflow defined yet.</p>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right Panel — Node Details Only */}
        <aside
          className={`${
            selectedNode ? 'w-96' : 'w-0'
          } transition-all duration-300 ease-out overflow-hidden border-l border-stone-200 bg-white shrink-0`}
        >
          <div className="w-96 h-full flex flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-stone-200 shrink-0">
              <span className="text-sm font-medium text-stone-600">Node Details</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseNodeView}
                className="text-stone-400 hover:text-stone-600 -mr-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {selectedNode && (
                <div className="space-y-6">
                  {/* Node Header */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-800">
                        {selectedNode.data.label || 'Untitled Node'}
                      </h3>
                      <p className="text-xs text-stone-500">Step Node</p>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedNode.data.description && (
                    <div>
                      <h4 className="text-sm font-medium text-stone-600 mb-2">Description</h4>
                      <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap bg-stone-50 rounded-lg p-3">
                        {selectedNode.data.description}
                      </p>
                    </div>
                  )}

                  {/* Instructions */}
                  {selectedNode.data.instructions && (
                    <div>
                      <h4 className="text-sm font-medium text-stone-600 mb-2">Instructions</h4>
                      <div className="markdown-content text-stone-700 bg-stone-50 rounded-lg p-3 max-h-64 overflow-y-auto">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                          {normalizeMarkdown(selectedNode.data.instructions)}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {/* No configuration message */}
                  {!selectedNode.data.description && !selectedNode.data.instructions && (
                    <div className="text-center py-8">
                      <p className="text-sm text-stone-500">
                        This node has no additional configuration.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
