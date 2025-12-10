'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft, Heart, Star, Edit, Trash2, Share2, MessageSquare, User } from 'lucide-react'
import { useTool, useToggleFavorite, useDeleteTool, useFavorites, useRateTool, useToolRatings, useUserRating } from '@/hooks/useTools'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'

export default function ToolDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { data: tool, isLoading } = useTool(resolvedParams.slug)
  const { data: favorites } = useFavorites()
  const { data: ratings } = useToolRatings(tool?.id || '')
  const { data: existingRating } = useUserRating(tool?.id || '')
  const toggleFavorite = useToggleFavorite()
  const deleteTool = useDeleteTool(resolvedParams.slug)
  const rateTool = useRateTool()

  const [userRating, setUserRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [localFavorited, setLocalFavorited] = useState<boolean | null>(null)
  const [localFavoritesCount, setLocalFavoritesCount] = useState<number | null>(null)

  // Set initial rating if user has already rated
  useEffect(() => {
    if (existingRating) {
      setUserRating(existingRating.rating)
      setReviewText(existingRating.review || '')
    }
  }, [existingRating])

  // Initialize local favorite state only once when tool loads
  useEffect(() => {
    if (tool && localFavorited === null && localFavoritesCount === null) {
      const initialFavorited = tool.isFavorited || favorites?.tools?.some((f: any) => f.id === tool.id) || false
      setLocalFavorited(initialFavorited)
      setLocalFavoritesCount(tool.favorites_count || 0)
    }
  }, [tool, favorites, localFavorited, localFavoritesCount])

  const isOwner = user && tool && user.id === tool.userId
  const isFavorited = localFavorited === true

  const handleFavorite = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to favorite tools')
      return
    }

    // Optimistically update the UI
    const wasFavorited = isFavorited
    const currentCount = localFavoritesCount ?? tool?.favorites_count ?? 0
    setLocalFavorited(!isFavorited)
    setLocalFavoritesCount(isFavorited ? currentCount - 1 : currentCount + 1)

    toggleFavorite.mutate(
      { toolId: tool!.id, isFavorited },
      {
        onSuccess: () => {
          toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites')
        },
        onError: () => {
          // Revert on error
          setLocalFavorited(wasFavorited)
          const currentCount = localFavoritesCount ?? tool?.favorites_count ?? 0
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
      toast.error('Please sign in to rate tools')
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

    rateTool.mutate(
      { toolId: tool!.id, rating: userRating, review: reviewText },
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

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Section */}
        <div>
          {/* Title with Featured Badge */}
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-4xl font-bold">{tool.name}</h1>
            {tool.is_featured && (
              <Badge className="ml-4">Featured</Badge>
            )}
          </div>

          {/* Platforms and Categories as colored badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {tool.tool_platforms && tool.tool_platforms.length > 0 &&
              tool.tool_platforms.map((tp: any) => (
                <Badge
                  key={tp.id}
                  className="bg-amber-100 text-amber-700 border-amber-200"
                >
                  {tp.platform.name}
                </Badge>
              ))
            }
            {tool.category && (
              <Badge
                className="bg-green-100 text-green-700 border-green-200"
              >
                {tool.category.name}
              </Badge>
            )}
          </div>

          {/* Creator and Date Info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <Link
              href={`/profile/${tool.user.id}`}
              className="hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={tool.user.image || undefined} alt={tool.user.name || 'User'} />
                <AvatarFallback>
                  {tool.user.name
                    ? tool.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                    : <User className="h-4 w-4" />
                  }
                </AvatarFallback>
              </Avatar>
            </Link>
            <span>•</span>
            <span>Updated {new Date(tool.updatedAt).toLocaleDateString()}</span>
          </div>

          {/* Stats - only ratings and favorites */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-foreground">
                {tool.rating_avg.toFixed(1)}
              </span>
              <span>({tool.rating_count} ratings)</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span>{localFavoritesCount ?? tool.favorites_count} favorites</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleFavorite}
              variant={isFavorited ? "default" : "outline"}
              disabled={toggleFavorite.isPending}
            >
              <Heart
                className={`mr-2 h-4 w-4 ${isFavorited ? 'fill-pink-500 text-pink-500' : ''}`}
              />
              {isFavorited ? 'Favorited' : 'Add to Favorites'}
            </Button>

            <Button
              onClick={handleShare}
              variant="outline"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>

            {isOwner && (
              <>
                <Link href={`/tools/${tool.slug}/edit`}>
                  <Button variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Tool
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteTool.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Tool
                </Button>
              </>
            )}
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
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm max-w-none break-words [&_a]:text-blue-600 [&_a]:underline hover:[&_a]:text-blue-800 [&_a]:break-all"
                dangerouslySetInnerHTML={{ __html: tool.documentation }}
              />
            </CardContent>
          </Card>
        )}

        {/* Ratings & Reviews Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Ratings & Reviews
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Rating Input */}
            {isAuthenticated ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Your Rating</p>
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
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300 hover:text-yellow-400'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Your Review (optional)</p>
                  <Textarea
                    placeholder="Share your experience, ask questions, or discuss this tool..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <Button
                  onClick={submitRating}
                  disabled={rateTool.isPending || userRating === 0}
                >
                  Submit Review
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 bg-muted rounded-lg">
                <p className="text-muted-foreground mb-4">
                  Sign in to leave a rating and review
                </p>
                <Link href="/api/auth/signin">
                  <Button>Sign In</Button>
                </Link>
              </div>
            )}

            {/* Display existing reviews */}
            <div className="pt-6 border-t space-y-4">
              {ratings?.ratings && ratings.ratings.length > 0 ? (
                ratings.ratings.map((rating: any) => (
                  <div key={rating.id} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">
                            {rating.user.name || rating.user.email}
                          </p>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= rating.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(rating.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {rating.review && (
                      <p className="text-sm">{rating.review}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No reviews yet. Be the first to review this tool!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
