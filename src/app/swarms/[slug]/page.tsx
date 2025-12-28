'use client'

import { use, useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  ArrowLeft,
  Heart,
  Star,
  Edit,
  Trash2,
  Share2,
  Download,
  User,
  ChevronLeft,
  PanelRightClose,
  PanelRight,
  MessageSquare,
  Eye,
  FileText,
  X,
  Link as LinkIcon
} from 'lucide-react'
import type { Node } from 'reactflow'
import { useSwarm, useToggleFavorite, useDeleteSwarm, useFavorites, useRateSwarm, useSwarmRatings, useUserRating } from '@/hooks/useSwarms'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { WorkflowDesigner } from '@/components/workflows/shared/WorkflowDesigner'
import type { WorkflowExport } from '@/types/workflow'

export default function SwarmDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { data: swarm, isLoading } = useSwarm(resolvedParams.slug)
  const { data: favorites } = useFavorites()
  const { data: ratings } = useSwarmRatings(swarm?.id || '')
  const { data: existingRating } = useUserRating(swarm?.id || '')
  const toggleFavorite = useToggleFavorite()
  const deleteSwarm = useDeleteSwarm(resolvedParams.slug)
  const rateSwarm = useRateSwarm()

  const [userRating, setUserRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [localFavorited, setLocalFavorited] = useState<boolean | null>(null)
  const [localFavoritesCount, setLocalFavoritesCount] = useState<number | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<'details' | 'reviews' | 'node'>('details')
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

  // Set initial rating if user has already rated
  useEffect(() => {
    if (existingRating) {
      setUserRating(existingRating.rating)
      setReviewText(existingRating.review || '')
    }
  }, [existingRating])

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

  const handleExportWorkflow = () => {
    if (!swarm) return

    const exportData: WorkflowExport = {
      version: "1.0",
      data: {
        workflows: [{
          name: swarm.name,
          description: swarm.description,
          diagramJson: {
            nodes: workflowNodes,
            edges: workflowEdges,
            metadata: swarm.workflowMetadata ? JSON.parse(swarm.workflowMetadata) : {}
          }
        }]
      }
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${swarm.slug}-workflow.json`
    a.click()
    URL.revokeObjectURL(url)
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

  const handleRating = (rating: number) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to rate swarms')
      return
    }
    setUserRating(rating)
  }

  const submitRating = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to submit a review')
      return
    }

    if (userRating === 0) {
      toast.error('Please select a rating')
      return
    }

    rateSwarm.mutate(
      { swarmId: swarm!.id, rating: userRating, review: reviewText },
      {
        onSuccess: () => {
          toast.success('Review submitted successfully')
          setReviewText('')
        },
        onError: () => {
          toast.error('Failed to submit review')
        },
      }
    )
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
    setActiveTab('node')
    if (!sidebarOpen) {
      setSidebarOpen(true)
    }
  }

  const handleCloseNodeView = () => {
    setSelectedNode(null)
    setActiveTab('details')
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  if (!swarm) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-stone-800">Swarm Not Found</h1>
          <p className="text-stone-500 mb-8">
            The swarm you're looking for doesn't exist or has been removed.
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
  const edgeCount = workflowEdges.length

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
          <div className="h-6 w-px bg-stone-200" />
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-stone-800 truncate max-w-md">{swarm.name}</h1>
            {swarm.is_featured && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200">Featured</Badge>
            )}
            {swarm.category && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                {swarm.category.name}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Action buttons */}
          <Button
            onClick={handleFavorite}
            variant="ghost"
            size="sm"
            disabled={toggleFavorite.isPending}
            className={isFavorited ? 'text-pink-600 hover:text-pink-700' : 'text-stone-600'}
          >
            <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
          </Button>

          <Button
            onClick={handleExportWorkflow}
            variant="ghost"
            size="sm"
            className="text-stone-600"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            onClick={handleShare}
            variant="ghost"
            size="sm"
            className="text-stone-600"
          >
            <Share2 className="h-4 w-4" />
          </Button>

          {isOwner && (
            <>
              <Link href={`/swarms/${swarm.slug}/edit`}>
                <Button variant="ghost" size="sm" className="text-stone-600">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleteSwarm.isPending}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}

          <div className="h-6 w-px bg-stone-200" />

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
            {workflowNodes.length > 0 ? (
              <WorkflowDesigner
                nodes={workflowNodes}
                edges={workflowEdges}
                onNodesChange={() => {}}
                onEdgesChange={() => {}}
                onNodeClick={handleNodeClick}
                readOnly={true}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="h-20 w-20 mx-auto rounded-2xl bg-white border border-stone-200 shadow-sm flex items-center justify-center">
                    <Eye className="h-10 w-10 text-stone-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-stone-600">No Workflow</h3>
                  <p className="text-stone-500 text-sm">This swarm doesn't have a workflow defined yet.</p>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-96' : 'w-0'
          } transition-all duration-300 ease-out overflow-hidden border-l border-stone-200 bg-white shrink-0`}
        >
          <div className="w-96 h-full flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-stone-200 shrink-0">
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'details'
                    ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50/50'
                    : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'reviews'
                    ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50/50'
                    : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Reviews ({swarm.rating_count})
              </button>
              {selectedNode && (
                <button
                  onClick={() => setActiveTab('node')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    activeTab === 'node'
                      ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50/50'
                      : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  Node
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {activeTab === 'details' ? (
                <div className="space-y-6">
                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <Link href={`/profile/${swarm.user.id}`}>
                      <Avatar className="h-10 w-10 ring-2 ring-stone-100">
                        <AvatarImage src={swarm.user.image || undefined} alt={swarm.user.name || 'User'} />
                        <AvatarFallback className="bg-amber-100 text-amber-700">
                          {swarm.user.name
                            ? swarm.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                            : <User className="h-4 w-4" />
                          }
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div>
                      <Link href={`/profile/${swarm.user.id}`} className="font-medium text-stone-800 hover:text-amber-600">
                        {swarm.user.name || 'Anonymous'}
                      </Link>
                      <p className="text-sm text-stone-500">
                        Updated {new Date(swarm.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-sm font-medium text-stone-600 mb-2">Description</h3>
                    <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {swarm.description}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-lg bg-stone-50">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-stone-800">{swarm.rating_avg.toFixed(1)}</span>
                      </div>
                      <p className="text-xs text-stone-500">{swarm.rating_count} ratings</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-stone-50">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Heart className="h-4 w-4 text-pink-500" />
                        <span className="font-semibold text-stone-800">{localFavoritesCount ?? swarm.favorites_count}</span>
                      </div>
                      <p className="text-xs text-stone-500">favorites</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-stone-50">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <span className="font-semibold text-stone-800">{nodeCount}</span>
                      </div>
                      <p className="text-xs text-stone-500">workflow nodes</p>
                    </div>
                  </div>

                  {/* Export Button */}
                  <Button
                    onClick={handleExportWorkflow}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Workflow JSON
                  </Button>
                </div>
              ) : activeTab === 'reviews' ? (
                <div className="space-y-6">
                  {/* Rating Input */}
                  {isAuthenticated ? (
                    <div className="space-y-4 p-4 rounded-lg bg-stone-50">
                      <div>
                        <p className="text-sm font-medium text-stone-700 mb-2">Your Rating</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => handleRating(star)}
                              className="focus:outline-none transition-transform hover:scale-110"
                            >
                              <Star
                                className={`h-6 w-6 ${
                                  star <= userRating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-stone-300 hover:text-amber-400'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-stone-700 mb-2">Review (optional)</p>
                        <Textarea
                          placeholder="Share your experience..."
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          className="min-h-[80px] bg-white border-stone-200 resize-none"
                        />
                      </div>

                      <Button
                        onClick={submitRating}
                        disabled={rateSwarm.isPending || userRating === 0}
                        size="sm"
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                      >
                        Submit Review
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center p-6 bg-stone-50 rounded-lg">
                      <p className="text-stone-500 text-sm mb-3">Sign in to leave a review</p>
                      <Link href="/api/auth/signin">
                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
                          Sign In
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Reviews List */}
                  <div className="space-y-4">
                    {ratings?.ratings && ratings.ratings.length > 0 ? (
                      ratings.ratings.map((rating: any) => (
                        <div key={rating.id} className="p-4 rounded-lg bg-stone-50 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={rating.user.image} />
                                <AvatarFallback className="text-xs bg-amber-100 text-amber-700">
                                  {rating.user.name?.[0]?.toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm text-stone-700">
                                {rating.user.name || 'Anonymous'}
                              </span>
                            </div>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 ${
                                    star <= rating.rating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-stone-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {rating.review && (
                            <p className="text-sm text-stone-600">{rating.review}</p>
                          )}
                          <p className="text-xs text-stone-400">
                            {new Date(rating.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-stone-500 text-center py-8">
                        No reviews yet. Be the first!
                      </p>
                    )}
                  </div>
                </div>
              ) : activeTab === 'node' && selectedNode ? (
                <div className="space-y-6">
                  {/* Node Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-stone-800">
                          {selectedNode.data.label || 'Untitled Node'}
                        </h3>
                        <p className="text-xs text-stone-500">Artifact Node</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCloseNodeView}
                      className="text-stone-400 hover:text-stone-600 -mr-2 -mt-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
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
                      <div className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap bg-stone-50 rounded-lg p-3 max-h-64 overflow-y-auto">
                        {selectedNode.data.instructions}
                      </div>
                    </div>
                  )}

                  {/* Linked Agent URL */}
                  {selectedNode.data.linkedAgentUrl && (
                    <div>
                      <h4 className="text-sm font-medium text-stone-600 mb-2">Linked Agent</h4>
                      <a
                        href={selectedNode.data.linkedAgentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 rounded-lg p-3"
                      >
                        <LinkIcon className="h-4 w-4" />
                        <span className="truncate">{selectedNode.data.linkedAgentUrl}</span>
                      </a>
                    </div>
                  )}

                  {/* No configuration message */}
                  {!selectedNode.data.description && !selectedNode.data.instructions && !selectedNode.data.linkedAgentUrl && (
                    <div className="text-center py-8">
                      <p className="text-sm text-stone-500">
                        This node has no additional configuration.
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
