import { prisma } from '@/lib/prisma/client'

/**
 * Database utilities for Comment operations
 * Supports threaded/nested comments
 */

/**
 * Get comments for a tool (top-level only)
 */
export async function getToolComments(toolId: string, limit = 20, offset = 0) {
  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: {
        toolId,
        parentId: null, // Only root comments
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.comment.count({
      where: {
        toolId,
        parentId: null,
      },
    }),
  ])

  return {
    comments,
    total,
    hasMore: offset + comments.length < total,
  }
}

/**
 * Get replies for a comment
 */
export async function getCommentReplies(commentId: string) {
  return prisma.comment.findMany({
    where: { parentId: commentId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })
}

/**
 * Create a comment
 */
export async function createComment(data: {
  content: string
  userId: string
  toolId: string
  parentId?: string
}) {
  return prisma.comment.create({
    data,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  })
}

/**
 * Update a comment
 */
export async function updateComment(id: string, content: string) {
  return prisma.comment.update({
    where: { id },
    data: { content },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  })
}

/**
 * Delete a comment (cascades to replies)
 */
export async function deleteComment(id: string) {
  return prisma.comment.delete({
    where: { id },
  })
}

/**
 * Get comment count for a tool
 */
export async function getCommentCount(toolId: string): Promise<number> {
  return prisma.comment.count({
    where: { toolId },
  })
}
