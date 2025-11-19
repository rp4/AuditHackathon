import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAgents,
  getAgentBySlug,
  getUserAgents,
  type GetAgentsParams,
} from '@/lib/supabase/queries'
import {
  createAgent,
  updateAgent,
  deleteAgent,
  incrementViews,
} from '@/lib/supabase/mutations'
import type { AgentInsert, AgentUpdate } from '@/types/database'

// ============================================
// QUERY HOOKS
// ============================================

export function useAgents(params: GetAgentsParams = {}) {
  return useQuery({
    queryKey: ['agents', params],
    queryFn: () => getAgents(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useAgent(slug: string, userId?: string) {
  return useQuery({
    queryKey: ['agent', slug, userId],
    queryFn: () => getAgentBySlug(slug, userId),
    enabled: !!slug,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useUserAgents(userId: string, limit = 20) {
  return useQuery({
    queryKey: ['user-agents', userId, limit],
    queryFn: () => getUserAgents(userId, limit),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

// ============================================
// MUTATION HOOKS
// ============================================

export function useCreateAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ agent, platformIds }: { agent: AgentInsert; platformIds: string[] }) =>
      createAgent(agent, platformIds),
    onSuccess: () => {
      // Invalidate agents list
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    },
  })
}

export function useUpdateAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      agentId,
      updates,
      platformIds,
    }: {
      agentId: string
      updates: AgentUpdate
      platformIds?: string[]
    }) => updateAgent(agentId, updates, platformIds),
    onSuccess: (data: any) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      queryClient.invalidateQueries({ queryKey: ['agent', data.slug] })
      queryClient.invalidateQueries({ queryKey: ['user-agents', data.user_id] })
    },
  })
}

export function useDeleteAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (agentId: string) => deleteAgent(agentId),
    onSuccess: () => {
      // Invalidate agents list
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    },
  })
}

export function useIncrementViews() {
  return useMutation({
    mutationFn: (agentId: string) => incrementViews(agentId),
    // Don't need to update cache for views
  })
}
