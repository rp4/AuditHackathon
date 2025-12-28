import { prisma } from '@/lib/prisma/client'

/**
 * Database utilities for Rating operations
 */

/**
 * Get user's rating for a swarm
 */
export async function getUserRating(userId: string, swarmId: string) {
  return prisma.rating.findUnique({
    where: {
      userId_swarmId: {
        userId,
        swarmId,
      },
    },
  })
}

/**
 * Get all ratings for a swarm
 */
export async function getSwarmRatings(swarmId: string, limit = 20, offset = 0) {
  const [ratings, total] = await Promise.all([
    prisma.rating.findMany({
      where: { swarmId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.rating.count({ where: { swarmId } }),
  ])

  return {
    ratings,
    total,
    hasMore: offset + ratings.length < total,
  }
}

/**
 * Create or update a rating
 */
export async function upsertRating(
  userId: string,
  swarmId: string,
  rating: number,
  review?: string
) {
  // Upsert rating and recalculate averages
  const [newRating] = await prisma.$transaction(async (tx) => {
    // Upsert the rating
    const upserted = await tx.rating.upsert({
      where: {
        userId_swarmId: {
          userId,
          swarmId,
        },
      },
      create: {
        userId,
        swarmId,
        rating,
        review,
      },
      update: {
        rating,
        review,
      },
    })

    // Recalculate average rating
    const stats = await tx.rating.aggregate({
      where: { swarmId },
      _avg: { rating: true },
      _count: true,
    })

    // Update swarm with new stats
    await tx.swarm.update({
      where: { id: swarmId },
      data: {
        rating_avg: stats._avg.rating || 0,
        rating_count: stats._count,
      },
    })

    return [upserted]
  })

  return newRating
}

/**
 * Delete a rating
 */
export async function deleteRating(userId: string, swarmId: string) {
  await prisma.$transaction(async (tx) => {
    // Delete the rating
    await tx.rating.delete({
      where: {
        userId_swarmId: {
          userId,
          swarmId,
        },
      },
    })

    // Recalculate average rating
    const stats = await tx.rating.aggregate({
      where: { swarmId },
      _avg: { rating: true },
      _count: true,
    })

    // Update swarm with new stats
    await tx.swarm.update({
      where: { id: swarmId },
      data: {
        rating_avg: stats._avg.rating || 0,
        rating_count: stats._count,
      },
    })
  })
}

/**
 * Get rating statistics for a swarm
 */
export async function getRatingStats(swarmId: string) {
  const [stats, distribution] = await Promise.all([
    prisma.rating.aggregate({
      where: { swarmId },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.rating.groupBy({
      by: ['rating'],
      where: { swarmId },
      _count: true,
    }),
  ])

  // Create rating distribution object (1-5 stars)
  const ratingDistribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  }

  distribution.forEach((d) => {
    ratingDistribution[d.rating as keyof typeof ratingDistribution] = d._count
  })

  return {
    average: stats._avg.rating || 0,
    count: stats._count,
    distribution: ratingDistribution,
  }
}
