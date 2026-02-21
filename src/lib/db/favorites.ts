import { prisma } from '@/lib/prisma/client'

/**
 * Database utilities for Favorite operations
 */

/**
 * Check if a user has favorited a swarm
 */
export async function isFavorited(userId: string, swarmId: string): Promise<boolean> {
  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_swarmId: {
        userId,
        swarmId,
      },
    },
  })
  return !!favorite
}

/**
 * Get all favorited swarms for a user
 */
export async function getUserFavorites(userId: string, limit = 50, offset = 0) {
  const [favorites, total] = await Promise.all([
    prisma.favorite.findMany({
      where: {
        userId,
        swarm: {
          isDeleted: false // Only return favorites for active swarms
        }
      },
      include: {
        swarm: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            category: true,
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
        swarm: {
          isDeleted: false
        }
      }
    }),
  ])

  return {
    favorites: favorites.map((f) => f.swarm),
    total,
    hasMore: offset + favorites.length < total,
  }
}

/**
 * Add a swarm to favorites
 */
export async function addFavorite(userId: string, swarmId: string) {
  // Create favorite and increment counter in a transaction
  const [favorite] = await prisma.$transaction([
    prisma.favorite.create({
      data: {
        userId,
        swarmId,
      },
    }),
    prisma.swarm.update({
      where: { id: swarmId },
      data: {
        favorites_count: { increment: 1 },
      },
    }),
  ])

  return favorite
}

/**
 * Remove a swarm from favorites
 */
export async function removeFavorite(userId: string, swarmId: string) {
  // Delete favorite and decrement counter in a transaction
  await prisma.$transaction([
    prisma.favorite.delete({
      where: {
        userId_swarmId: {
          userId,
          swarmId,
        },
      },
    }),
    prisma.swarm.update({
      where: { id: swarmId },
      data: {
        favorites_count: { decrement: 1 },
      },
    }),
  ])
}
