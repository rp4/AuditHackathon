import { prisma } from '@/lib/prisma/client'

/**
 * Database utilities for Favorite operations
 */

/**
 * Check if a user has favorited a tool
 */
export async function isFavorited(userId: string, toolId: string): Promise<boolean> {
  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_toolId: {
        userId,
        toolId,
      },
    },
  })
  return !!favorite
}

/**
 * Get all favorited tools for a user
 */
export async function getUserFavorites(userId: string, limit = 50, offset = 0) {
  const [favorites, total] = await Promise.all([
    prisma.favorite.findMany({
      where: {
        userId,
        tool: {
          isDeleted: false // Only return favorites for active tools
        }
      },
      include: {
        tool: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            category: true,
            tool_platforms: {
              include: {
                platform: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.favorite.count({
      where: {
        userId,
        tool: {
          isDeleted: false
        }
      }
    }),
  ])

  return {
    favorites: favorites.map((f) => f.tool),
    total,
    hasMore: offset + favorites.length < total,
  }
}

/**
 * Add a tool to favorites
 */
export async function addFavorite(userId: string, toolId: string) {
  // Create favorite and increment counter in a transaction
  const [favorite] = await prisma.$transaction([
    prisma.favorite.create({
      data: {
        userId,
        toolId,
      },
    }),
    prisma.tool.update({
      where: { id: toolId },
      data: {
        favorites_count: { increment: 1 },
      },
    }),
  ])

  return favorite
}

/**
 * Remove a tool from favorites
 */
export async function removeFavorite(userId: string, toolId: string) {
  // Delete favorite and decrement counter in a transaction
  await prisma.$transaction([
    prisma.favorite.delete({
      where: {
        userId_toolId: {
          userId,
          toolId,
        },
      },
    }),
    prisma.tool.update({
      where: { id: toolId },
      data: {
        favorites_count: { decrement: 1 },
      },
    }),
  ])
}

/**
 * Get favorite count for a tool
 */
export async function getFavoriteCount(toolId: string): Promise<number> {
  return prisma.favorite.count({
    where: { toolId },
  })
}
