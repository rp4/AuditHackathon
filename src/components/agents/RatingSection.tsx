'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAgentRatings, useUserRating, useCreateOrUpdateRating } from '@/hooks/useRatings'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Image from 'next/image'

interface RatingSectionProps {
  agentId: string
  userId?: string
  averageRating: number
  totalRatings: number
}

export function RatingSection({
  agentId,
  userId,
  averageRating,
  totalRatings,
}: RatingSectionProps) {
  const router = useRouter()
  const [selectedRating, setSelectedRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: ratings = [], isLoading: ratingsLoading } = useAgentRatings(agentId)
  const { data: userRating } = useUserRating(agentId, userId)
  const { mutate: submitRating } = useCreateOrUpdateRating()

  // Initialize with user's existing rating
  useState(() => {
    if (userRating) {
      setSelectedRating(userRating.score)
      setReviewText(userRating.review || '')
    }
  })

  const handleSubmit = () => {
    if (!userId) {
      router.push('/auth/signin')
      return
    }

    if (selectedRating === 0) return

    setIsSubmitting(true)
    submitRating(
      {
        agent_id: agentId,
        user_id: userId,
        score: selectedRating,
        review: reviewText || undefined,
      },
      {
        onSuccess: () => {
          setIsSubmitting(false)
          toast.success(userRating ? 'Review updated successfully!' : 'Review submitted successfully!')
          // Clear form if it was a new rating
          if (!userRating) {
            setSelectedRating(0)
            setReviewText('')
          }
        },
        onError: (error: any) => {
          setIsSubmitting(false)
          toast.error(error?.message || 'Failed to submit review')
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <h3 className="text-xl font-semibold">Ratings & Reviews</h3>

      {/* Overall Rating Display */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
          <span className="text-4xl font-bold">{averageRating.toFixed(1)}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {totalRatings} {totalRatings === 1 ? 'review' : 'reviews'}
        </div>
      </div>

      {/* User Rating Form */}
      {userId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {userRating ? 'Update Your Review' : 'Rate This Agent'}
            </CardTitle>
            <CardDescription>
              Share your experience with this agent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Star Selection */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelectedRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || selectedRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {selectedRating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {selectedRating} {selectedRating === 1 ? 'star' : 'stars'}
                </span>
              )}
            </div>

            {/* Review Text */}
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your thoughts about this agent (optional)..."
              className="w-full min-h-[100px] px-3 py-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={1000}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {reviewText.length}/1000 characters
              </span>
              <Button
                onClick={handleSubmit}
                disabled={selectedRating === 0 || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : userRating ? 'Update Review' : 'Submit Review'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Community Reviews</h3>
        {ratingsLoading ? (
          <div className="text-sm text-muted-foreground">Loading reviews...</div>
        ) : ratings.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No reviews yet. Be the first to review this agent!
          </div>
        ) : (
          ratings.map((rating) => (
            <Card key={rating.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {rating.profile.avatar_url ? (
                      <Image
                        src={rating.profile.avatar_url}
                        alt={rating.profile.full_name || rating.profile.username}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-sm">
                        {rating.profile.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Review Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">
                          {rating.profile.full_name || rating.profile.username}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${
                                  star <= rating.score
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(rating.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {rating.review && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {rating.review}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
