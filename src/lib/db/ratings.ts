import { prisma } from '@/lib/prisma/client'

/**
 * Database utilities for Rating operations
 */

/**
 * Get user's rating for a tool
 */
export async function getUserRating(userId: string, toolId: string) {
  return prisma.rating.findUnique({
    where: {
      userId_toolId: {
        userId,
        toolId,
      },
    },
  })
}

/**
 * Get all ratings for a tool
 */
export async function getToolRatings(toolId: string, limit = 20, offset = 0) {
  const [ratings, total] = await Promise.all([
    prisma.rating.findMany({
      where: { toolId },
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
    prisma.rating.count({ where: { toolId } }),
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
  toolId: string,
  rating: number,
  review?: string
) {
  // Get current rating if exists
  const existingRating = await prisma.rating.findUnique({
    where: {
      userId_toolId: {
        userId,
        toolId,
      },
    },
  })

  // Upsert rating and recalculate averages
  const [newRating] = await prisma.$transaction(async (tx) => {
    // Upsert the rating
    const upserted = await tx.rating.upsert({
      where: {
        userId_toolId: {
          userId,
          toolId,
        },
      },
      create: {
        userId,
        toolId,
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
      where: { toolId },
      _avg: { rating: true },
      _count: true,
    })

    // Update tool with new stats
    await tx.tool.update({
      where: { id: toolId },
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
export async function deleteRating(userId: string, toolId: string) {
  await prisma.$transaction(async (tx) => {
    // Delete the rating
    await tx.rating.delete({
      where: {
        userId_toolId: {
          userId,
          toolId,
        },
      },
    })

    // Recalculate average rating
    const stats = await tx.rating.aggregate({
      where: { toolId },
      _avg: { rating: true },
      _count: true,
    })

    // Update tool with new stats
    await tx.tool.update({
      where: { id: toolId },
      data: {
        rating_avg: stats._avg.rating || 0,
        rating_count: stats._count,
      },
    })
  })
}

/**
 * Get rating statistics for a tool
 */
export async function getRatingStats(toolId: string) {
  const [stats, distribution] = await Promise.all([
    prisma.rating.aggregate({
      where: { toolId },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.rating.groupBy({
      by: ['rating'],
      where: { toolId },
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
