'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'

/**
 * Custom hooks for tools data fetching
 */

export type Tool = {
  id: string
  name: string
  slug: string
  description: string
  documentation?: string
  image_url?: string
  userId: string
  categoryId?: string
  is_public: boolean
  is_featured: boolean
  views_count: number
  downloads_count: number
  favorites_count: number
  rating_avg: number
  rating_count: number
  createdAt: string
  updatedAt: string
  publishedAt?: string
  user: {
    id: string
    name?: string
    email: string
    image?: string
  }
  category?: {
    id: string
    name: string
    slug: string
  }
  tool_platforms: Array<{
    id: string
    platformId: string
    platform: {
      id: string
      name: string
      slug: string
    }
  }>
}

export type UserProfile = {
  id: string
  name?: string
  email: string
  image?: string
  bio?: string
  linkedin_url?: string
  createdAt: string
}

export type ToolFilters = {
  search?: string
  categoryId?: string
  platformId?: string
  userId?: string
  featured?: boolean
  limit?: number
  offset?: number
  sortBy?: 'recent' | 'popular' | 'rating' | 'downloads'
}

/**
 * Fetch tools with filters
 */
export function useTools(filters: ToolFilters = {}) {
  return useQuery({
    queryKey: ['tools', filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })

      const res = await fetch(`/api/tools?${params}`)
      if (!res.ok) throw new Error('Failed to fetch tools')
      return res.json()
    },
  })
}

/**
 * Fetch a single tool by slug
 */
export function useTool(slug: string) {
  return useQuery({
    queryKey: ['tool', slug],
    queryFn: async () => {
      const res = await fetch(`/api/tools/${slug}`)
      if (!res.ok) {
        if (res.status === 404) return null
        throw new Error('Failed to fetch tool')
      }
      return res.json()
    },
    enabled: !!slug,
  })
}

/**
 * Create a new tool
 */
export function useCreateTool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create tool')
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] })
    },
  })
}

/**
 * Update a tool
 */
export function useUpdateTool(slug: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/tools/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update tool')
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tool', slug] })
      queryClient.invalidateQueries({ queryKey: ['tools'] })
    },
  })
}

/**
 * Delete a tool
 */
export function useDeleteTool(slug: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tools/${slug}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete tool')
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] })
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
  })
}

/**
 * Fetch platforms
 */
export function usePlatforms() {
  return useQuery({
    queryKey: ['platforms'],
    queryFn: async () => {
      const res = await fetch('/api/platforms')
      if (!res.ok) throw new Error('Failed to fetch platforms')
      return res.json()
    },
  })
}

/**
 * Toggle favorite
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ toolId, isFavorited }: { toolId: string; isFavorited: boolean }) => {
      if (isFavorited) {
        // Remove favorite
        const res = await fetch(`/api/favorites?toolId=${toolId}`, {
          method: 'DELETE',
        })
        if (!res.ok) throw new Error('Failed to remove favorite')
        return res.json()
      } else {
        // Add favorite
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolId }),
        })
        if (!res.ok) throw new Error('Failed to add favorite')
        return res.json()
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] })
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
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
export function useRateTool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ toolId, rating, review }: { toolId: string; rating: number; review?: string }) => {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId, rating, review }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to submit rating')
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] })
      queryClient.invalidateQueries({ queryKey: ['ratings'] })
    },
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
 * Fetch user's tools
 */
export function useUserTools(userId: string) {
  return useQuery({
    queryKey: ['user-tools', userId],
    queryFn: async () => {
      const res = await fetch(`/api/tools?userId=${userId}`)
      if (!res.ok) throw new Error('Failed to fetch user tools')
      const data = await res.json()
      return data.tools || []
    },
    enabled: !!userId,
  })
}
