import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getUserFavorites,
  checkUserFavorited,
} from '@/lib/supabase/queries'
import {
  toggleFavorite,
  addFavorite,
  removeFavorite,
} from '@/lib/supabase/mutations'

// ============================================
// QUERY HOOKS
// ============================================

export function useUserFavorites(userId: string, limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['favorites', userId, limit, offset],
    queryFn: () => getUserFavorites(userId, limit, offset),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  })
}

export function useAgentFavoriteStatus(agentId: string, userId?: string) {
  return useQuery({
    queryKey: ['favorite-status', agentId, userId],
    queryFn: () => {
      if (!userId) return false
      return checkUserFavorited(agentId, userId)
    },
    enabled: !!agentId,
    staleTime: 1 * 60 * 1000,
  })
}

// ============================================
// MUTATION HOOKS
// ============================================

export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ agentId, userId }: { agentId: string; userId: string }) =>
      toggleFavorite(agentId, userId),
    onMutate: async ({ agentId, userId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['favorite-status', agentId, userId] })
      await queryClient.cancelQueries({ queryKey: ['agent', agentId] })

      // Snapshot previous value
      const previousStatus = queryClient.getQueryData<boolean>(['favorite-status', agentId, userId])

      // Optimistically update
      queryClient.setQueryData<boolean>(['favorite-status', agentId, userId], (old) => !old)

      return { previousStatus }
    },
    onError: (err, { agentId, userId }, context) => {
      // Rollback on error
      if (context?.previousStatus !== undefined) {
        queryClient.setQueryData(['favorite-status', agentId, userId], context.previousStatus)
      }
    },
    onSuccess: (data, { agentId, userId }) => {
      // Update queries
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] })
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] })
      queryClient.setQueryData(['favorite-status', agentId, userId], data.favorited)
    },
  })
}

export function useAddFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ agentId, userId }: { agentId: string; userId: string }) =>
      addFavorite(agentId, userId),
    onSuccess: (_, { agentId, userId }) => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] })
      queryClient.invalidateQueries({ queryKey: ['favorite-status', agentId, userId] })
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] })
    },
  })
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ agentId, userId }: { agentId: string; userId: string }) =>
      removeFavorite(agentId, userId),
    onSuccess: (_, { agentId, userId }) => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] })
      queryClient.invalidateQueries({ queryKey: ['favorite-status', agentId, userId] })
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] })
    },
  })
}
