'use client'

import { useState } from 'react'
import { MessageSquare, Reply, Edit2, Trash2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useAgentComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from '@/hooks/useComments'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Image from 'next/image'
import type { CommentWithProfile } from '@/types/database'

interface CommentsSectionProps {
  agentId: string
  userId?: string
}

interface CommentItemProps {
  comment: CommentWithProfile
  agentId: string
  userId?: string
  onReply: (commentId: string, username: string) => void
}

function CommentItem({ comment, agentId, userId, onReply }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const { mutate: updateComment, isPending: isUpdating } = useUpdateComment()
  const { mutate: deleteComment, isPending: isDeleting } = useDeleteComment()

  const isOwner = userId === comment.user_id
  const createdDate = new Date(comment.created_at).toLocaleDateString()
  const isEdited = comment.is_edited

  const handleUpdate = () => {
    if (!userId || editContent.trim() === '') return

    updateComment(
      {
        commentId: comment.id,
        content: editContent,
        userId,
        agentId,
      },
      {
        onSuccess: () => {
          setIsEditing(false)
          toast.success('Comment updated!')
        },
        onError: (error: any) => {
          toast.error(error?.message || 'Failed to update comment')
        },
      }
    )
  }

  const handleDelete = () => {
    if (!userId) return
    if (!confirm('Are you sure you want to delete this comment?')) return

    deleteComment(
      {
        commentId: comment.id,
        userId,
        agentId,
      },
      {
        onSuccess: () => {
          toast.success('Comment deleted')
        },
        onError: (error: any) => {
          toast.error(error?.message || 'Failed to delete comment')
        },
      }
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.profile.avatar_url ? (
            <Image
              src={comment.profile.avatar_url}
              alt={comment.profile.full_name || comment.profile.username}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-sm">
              {comment.profile.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">
              {comment.profile.full_name || comment.profile.username}
            </span>
            <span className="text-xs text-muted-foreground">
              {createdDate}
              {isEdited && ' (edited)'}
            </span>
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={2000}
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleUpdate} disabled={isUpdating}>
                  {isUpdating ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false)
                    setEditContent(comment.content)
                  }}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {comment.content}
            </p>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => onReply(comment.id, comment.profile.username)}
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                <Reply className="h-3 w-3" />
                Reply
              </button>
              {isOwner && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                  >
                    <Edit2 className="h-3 w-3" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-12 space-y-3 border-l-2 border-muted pl-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              agentId={agentId}
              userId={userId}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CommentsSection({ agentId, userId }: CommentsSectionProps) {
  const router = useRouter()
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null)

  const { data: comments = [], isLoading } = useAgentComments(agentId)
  const { mutate: createComment, isPending: isSubmitting } = useCreateComment()

  const handleSubmit = () => {
    if (!userId) {
      router.push('/auth/signin')
      return
    }

    if (newComment.trim() === '') return

    createComment(
      {
        agent_id: agentId,
        user_id: userId,
        content: newComment,
        parent_id: replyTo?.id,
      },
      {
        onSuccess: () => {
          setNewComment('')
          setReplyTo(null)
          toast.success(replyTo ? 'Reply posted!' : 'Comment posted!')
        },
        onError: (error: any) => {
          toast.error(error?.message || 'Failed to post comment')
        },
      }
    )
  }

  const handleReply = (commentId: string, username: string) => {
    if (!userId) {
      router.push('/auth/signin')
      return
    }
    setReplyTo({ id: commentId, username })
    setNewComment(`@${username} `)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Community Feedback
        </CardTitle>
        <CardDescription>
          Share your experience and discuss this agent with the community
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New Comment Form */}
        <div className="space-y-3">
          {replyTo && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Reply className="h-4 w-4" />
              Replying to @{replyTo.username}
              <button
                onClick={() => {
                  setReplyTo(null)
                  setNewComment('')
                }}
                className="text-xs text-primary hover:underline ml-auto"
              >
                Cancel
              </button>
            </div>
          )}
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={
              userId
                ? replyTo
                  ? 'Write your reply...'
                  : 'Share your thoughts about this agent...'
                : 'Sign in to leave a comment'
            }
            disabled={!userId}
            className="w-full min-h-[100px] px-3 py-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            maxLength={2000}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {newComment.length}/2000 characters
            </span>
            <Button
              onClick={handleSubmit}
              disabled={!userId || newComment.trim() === '' || isSubmitting}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No comments yet. Be the first to share your thoughts!
            </div>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                agentId={agentId}
                userId={userId}
                onReply={handleReply}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
