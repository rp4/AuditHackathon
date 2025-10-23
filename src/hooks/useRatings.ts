import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAgentRatings,
  getUserRating,
} from '@/lib/supabase/queries'
import {
  createOrUpdateRating,
  deleteRating,
} from '@/lib/supabase/mutations'
import type { RatingInsert } from '@/types/database'

// ============================================
// QUERY HOOKS
// ============================================

export function useAgentRatings(agentId: string, limit = 10, offset = 0) {
  return useQuery({
    queryKey: ['ratings', agentId, limit, offset],
    queryFn: () => getAgentRatings(agentId, limit, offset),
    enabled: !!agentId,
    staleTime: 2 * 60 * 1000,
  })
}

export function useUserRating(agentId: string, userId?: string) {
  return useQuery({
    queryKey: ['user-rating', agentId, userId],
    queryFn: () => {
      if (!userId) return null
      return getUserRating(agentId, userId)
    },
    enabled: !!agentId,
    staleTime: 1 * 60 * 1000,
  })
}

// ============================================
// MUTATION HOOKS
// ============================================

export function useCreateOrUpdateRating() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (rating: RatingInsert) => createOrUpdateRating(rating),
    onSuccess: (data: any) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['ratings', data.agent_id] })
      queryClient.invalidateQueries({ queryKey: ['user-rating', data.agent_id, data.user_id] })
      queryClient.invalidateQueries({ queryKey: ['agent'] }) // Invalidate agent queries to update avg_rating
    },
  })
}

export function useDeleteRating() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ratingId, userId, agentId }: { ratingId: string; userId: string; agentId: string }) =>
      deleteRating(ratingId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ratings', variables.agentId] })
      queryClient.invalidateQueries({ queryKey: ['user-rating', variables.agentId, variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['agent'] })
    },
  })
}
