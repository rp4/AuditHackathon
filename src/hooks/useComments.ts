import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAgentComments } from '@/lib/supabase/queries'
import {
  createComment,
  updateComment,
  deleteComment,
} from '@/lib/supabase/mutations'
import type { CommentInsert } from '@/types/database'

// ============================================
// QUERY HOOKS
// ============================================

export function useAgentComments(agentId: string) {
  return useQuery({
    queryKey: ['comments', agentId],
    queryFn: () => getAgentComments(agentId),
    enabled: !!agentId,
    staleTime: 1 * 60 * 1000,
  })
}

// ============================================
// MUTATION HOOKS
// ============================================

export function useCreateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (comment: CommentInsert) => createComment(comment),
    onSuccess: (data: any) => {
      // Invalidate comments for this agent
      queryClient.invalidateQueries({ queryKey: ['comments', data.agent_id] })
    },
  })
}

export function useUpdateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      commentId,
      content,
      userId,
      agentId,
    }: {
      commentId: string
      content: string
      userId: string
      agentId: string
    }) => updateComment(commentId, content, userId),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['comments', data.agent_id] })
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      commentId,
      userId,
      agentId,
    }: {
      commentId: string
      userId: string
      agentId: string
    }) => deleteComment(commentId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.agentId] })
    },
  })
}
