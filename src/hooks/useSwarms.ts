'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'

/**
 * Custom hooks for swarms data fetching
 */

export type SwarmFilters = {
  search?: string
  categoryId?: string
  userId?: string
  featured?: boolean
  limit?: number
  offset?: number
  sortBy?: 'recent' | 'popular' | 'rating' | 'downloads'
}

/**
 * Fetch swarms with filters
 */
export function useSwarms(filters: SwarmFilters = {}) {
  return useQuery({
    queryKey: ['swarms', filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })

      const res = await fetch(`/api/swarms?${params}`)
      if (!res.ok) throw new Error('Failed to fetch swarms')
      return res.json()
    },
    staleTime: 60 * 1000, // 1 minute — avoid refetching on every filter change
    placeholderData: (prev: any) => prev, // keep previous data while fetching (no flash)
  })
}

/**
 * Fetch a single swarm by slug
 */
export function useSwarm(slug: string) {
  return useQuery({
    queryKey: ['swarm', slug],
    queryFn: async () => {
      const res = await fetch(`/api/swarms/${slug}`)
      if (!res.ok) {
        if (res.status === 404) return null
        throw new Error('Failed to fetch swarm')
      }
      return res.json()
    },
    enabled: !!slug,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Update a swarm
 */
export function useUpdateSwarm(slug: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/swarms/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update swarm')
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swarm', slug] })
      queryClient.invalidateQueries({ queryKey: ['swarms'] })
    },
  })
}

/**
 * Delete a swarm
 */
export function useDeleteSwarm(slug: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/swarms/${slug}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete swarm')
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swarms'] })
    },
  })
}

/**
 * Fetch categories
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Failed to fetch categories')
      return res.json()
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - categories rarely change
  })
}

/**
 * Check if current user is an admin
 */
export function useIsAdmin() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['admin-status', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/user/admin-status')
      if (!res.ok) return { isAdmin: false }
      return res.json()
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes - admin status rarely changes
  })
}

/**
 * Toggle favorite
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ swarmId, isFavorited }: { swarmId: string; isFavorited: boolean }) => {
      if (isFavorited) {
        const res = await fetch(`/api/favorites?swarmId=${swarmId}`, {
          method: 'DELETE',
        })
        if (!res.ok) throw new Error('Failed to remove favorite')
        return { action: 'removed', swarmId }
      } else {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ swarmId }),
        })
        if (!res.ok) throw new Error('Failed to add favorite')
        return { action: 'added', swarmId }
      }
    },
    onSuccess: () => {
      // Don't invalidate anything to prevent refetching
    },
  })
}

/**
 * Get user's favorites
 */
export function useFavorites() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/favorites')
      if (!res.ok) throw new Error('Failed to fetch favorites')
      return res.json()
    },
    enabled: !!user,
  })
}

/**
 * Submit or update a rating
 */
export function useRateSwarm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ swarmId, rating, review }: { swarmId: string; rating: number; review?: string }) => {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swarmId, rating, review }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to submit rating')
      }

      return res.json()
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['swarms'] })
      queryClient.invalidateQueries({ queryKey: ['swarm', variables.swarmId] })
      queryClient.invalidateQueries({ queryKey: ['ratings', variables.swarmId] })
    },
  })
}

/**
 * Fetch ratings for a swarm
 */
export function useSwarmRatings(swarmId: string) {
  return useQuery({
    queryKey: ['ratings', swarmId],
    queryFn: async () => {
      const res = await fetch(`/api/ratings?swarmId=${swarmId}`)
      if (!res.ok) throw new Error('Failed to fetch ratings')
      return res.json()
    },
    enabled: !!swarmId,
  })
}

/**
 * Get current user's rating for a swarm
 */
export function useUserRating(swarmId: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['user-rating', swarmId, user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/ratings?swarmId=${swarmId}&checkUser=true`)
      if (!res.ok) throw new Error('Failed to fetch user rating')
      const data = await res.json()
      return data.rating
    },
    enabled: !!swarmId && !!user,
  })
}

/**
 * Fetch user profile
 */
export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}`)
      if (!res.ok) {
        if (res.status === 404) return null
        throw new Error('Failed to fetch user profile')
      }
      return res.json()
    },
    enabled: !!userId,
  })
}

/**
 * Fetch user's swarms
 */
export function useUserSwarms(userId: string) {
  return useQuery({
    queryKey: ['user-swarms', userId],
    queryFn: async () => {
      const res = await fetch(`/api/swarms?userId=${userId}`)
      if (!res.ok) throw new Error('Failed to fetch user swarms')
      const data = await res.json()
      return data.swarms || []
    },
    enabled: !!userId,
  })
}
