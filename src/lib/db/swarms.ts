import { prisma } from '@/lib/prisma/client'
import type { Prisma } from '@prisma/client'

/**
 * Database utilities for Swarm operations
 * Renamed from 'tools' to 'swarms'
 */

export type SwarmWithRelations = Prisma.SwarmGetPayload<{
  include: {
    user: {
      select: {
        id: true
        name: true
        email: true
        image: true
      }
    }
    category: true
  }
}>

export type SwarmFilters = {
  search?: string
  categoryId?: string
  categoryIds?: string[]
  userId?: string
  isFeatured?: boolean
  isPublic?: boolean
  limit?: number
  offset?: number
  sortBy?: 'recent' | 'popular' | 'rating' | 'downloads'
}

/**
 * Get swarms with filtering, sorting, and pagination
 */
export async function getSwarms(filters: SwarmFilters & { currentUserId?: string } = {}) {
  const {
    search,
    categoryId,
    categoryIds,
    userId,
    isFeatured,
    isPublic = true,
    limit = 20,
    offset = 0,
    sortBy = 'recent',
    currentUserId,
  } = filters

  const where: Prisma.SwarmWhereInput = {
    ...(isPublic !== undefined && { is_public: isPublic }),
    isDeleted: false,
    user: {
      isDeleted: false,
    },
    ...(isFeatured !== undefined && { is_featured: isFeatured }),
    ...(userId && {
      user: {
        OR: [
          { id: userId },
          { username: userId }
        ],
        isDeleted: false,
      }
    }),
    ...(categoryIds && categoryIds.length > 0
      ? { categoryId: { in: categoryIds } }
      : categoryId && { categoryId }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { workflowNodes: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  const orderBy = getOrderBy(sortBy)

  const [swarms, total] = await Promise.all([
    prisma.swarm.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        category: true,
        ...(currentUserId && {
          favorites: {
            where: { userId: currentUserId },
            select: { id: true },
          },
        }),
      },
      orderBy,
      take: limit,
      skip: offset,
    }),
    prisma.swarm.count({ where }),
  ])

  const swarmsWithFavorites = swarms.map((swarm: any) => ({
    ...swarm,
    isFavorited: currentUserId ? swarm.favorites?.length > 0 : false,
    favorites: undefined,
  }))

  return {
    swarms: swarmsWithFavorites,
    total,
    hasMore: offset + swarms.length < total,
  }
}

/**
 * Get a single swarm by slug
 */
export async function getSwarmBySlug(slug: string) {
  return prisma.swarm.findFirst({
    where: {
      slug,
      isDeleted: false,
      user: {
        isDeleted: false,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          bio: true,
          linkedin_url: true,
        },
      },
      category: true,
      comments: {
        where: { parentId: null },
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
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

/**
 * Create a new swarm
 */
export async function createSwarm(data: {
  name: string
  slug: string
  description: string
  workflowNodes?: string
  workflowEdges?: string
  workflowMetadata?: string
  image_url?: string
  userId: string
  categoryId?: string
  is_public?: boolean
}) {
  return prisma.swarm.create({
    data: {
      ...data,
      publishedAt: data.is_public ? new Date() : null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      category: true,
    },
  })
}

/**
 * Update a swarm
 */
export async function updateSwarm(
  id: string,
  data: Partial<{
    name: string
    description: string
    workflowNodes: string
    workflowEdges: string
    workflowMetadata: string
    image_url: string
    categoryId: string
    is_public: boolean
    is_featured: boolean
  }>
) {
  const finalUpdateData: any = { ...data }
  if (data.is_public) {
    const swarm = await prisma.swarm.findUnique({ where: { id } })
    if (swarm && !swarm.publishedAt) {
      finalUpdateData.publishedAt = new Date()
    }
  }

  return prisma.swarm.update({
    where: { id },
    data: finalUpdateData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      category: true,
    },
  })
}

/**
 * Delete a swarm
 */
export async function deleteSwarm(id: string) {
  return prisma.swarm.delete({
    where: { id },
  })
}

/**
 * Increment swarm views
 */
export async function incrementSwarmViews(id: string) {
  return prisma.swarm.update({
    where: { id },
    data: {
      views_count: { increment: 1 },
    },
  })
}

/**
 * Get featured swarms
 */
export async function getFeaturedSwarms(limit: number = 6) {
  return prisma.swarm.findMany({
    where: {
      is_public: true,
      is_featured: true,
      isDeleted: false,
      user: {
        isDeleted: false,
      },
    },
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
    orderBy: {
      publishedAt: 'desc',
    },
    take: limit,
  })
}

/**
 * Helper to get Prisma orderBy based on sort option
 */
function getOrderBy(sortBy: SwarmFilters['sortBy']): any {
  switch (sortBy) {
    case 'popular':
      return { favorites_count: 'desc' }
    case 'rating':
      return [{ rating_avg: 'desc' }, { rating_count: 'desc' }]
    case 'downloads':
      return { downloads_count: 'desc' }
    case 'recent':
    default:
      return { publishedAt: 'desc' }
  }
}
