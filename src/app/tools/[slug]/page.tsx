'use client'

import { use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Heart, Star, Download, Eye, Edit, Trash2 } from 'lucide-react'
import { useTool, useToggleFavorite, useDeleteTool } from '@/hooks/useTools'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ToolDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { data: tool, isLoading } = useTool(resolvedParams.slug)
  const toggleFavorite = useToggleFavorite()
  const deleteTool = useDeleteTool(resolvedParams.slug)

  const isOwner = user && tool && user.id === tool.userId

  const handleFavorite = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to favorite tools')
      return
    }

    toggleFavorite.mutate(
      { toolId: tool!.id, isFavorited: false }, // TODO: track if favorited
      {
        onSuccess: () => {
          toast.success('Added to favorites')
        },
        onError: () => {
          toast.error('Failed to update favorite')
        },
      }
    )
  }

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this tool?')) return

    deleteTool.mutate(undefined, {
      onSuccess: () => {
        toast.success('Tool deleted successfully')
        router.push('/browse')
      },
      onError: () => {
        toast.error('Failed to delete tool')
      },
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!tool) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Tool Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The tool you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/browse">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Browse
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link href="/browse">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Browse
        </Button>
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">{tool.name}</h1>
              </div>
              {tool.is_featured && (
                <Badge className="ml-4">Featured</Badge>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-foreground">
                  {tool.rating_avg.toFixed(1)}
                </span>
                <span>({tool.rating_count} ratings)</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span>{tool.favorites_count}</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                <span>{tool.downloads_count}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{tool.views_count}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{tool.description}</p>
            </CardContent>
          </Card>

          {/* Documentation */}
          {tool.documentation && (
            <Card>
              <CardHeader>
                <CardTitle>Documentation</CardTitle>
                <CardDescription>
                  Setup instructions and configuration details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
                    {tool.documentation}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full"
                onClick={handleFavorite}
                variant="outline"
                disabled={toggleFavorite.isPending}
              >
                <Heart className="mr-2 h-4 w-4" />
                Add to Favorites
              </Button>

              {isOwner && (
                <>
                  <Link href={`/tools/${tool.slug}/edit`} className="block">
                    <Button className="w-full" variant="outline">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Tool
                    </Button>
                  </Link>
                  <Button
                    className="w-full"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteTool.isPending}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Tool
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Platforms */}
          {tool.tool_platforms && tool.tool_platforms.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Platforms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tool.tool_platforms.map((tp) => (
                    <Badge key={tp.id} variant="secondary">
                      {tp.platform.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category */}
          {tool.category && (
            <Card>
              <CardHeader>
                <CardTitle>Category</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline">{tool.category.name}</Badge>
              </CardContent>
            </Card>
          )}

          {/* Author */}
          <Card>
            <CardHeader>
              <CardTitle>Created By</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold">
                  {(tool.user.name || tool.user.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">
                    {tool.user.name || tool.user.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(tool.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
