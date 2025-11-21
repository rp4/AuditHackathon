import { prisma } from '@/lib/prisma/client'
import type { Prisma } from '@prisma/client'

/**
 * Database utilities for Tool operations
 * Renamed from 'agents' to 'tools'
 */

export type ToolWithRelations = Prisma.ToolGetPayload<{
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
    tool_platforms: {
      include: {
        platform: true
      }
    }
  }
}>

export type ToolFilters = {
  search?: string
  categoryId?: string
  platformId?: string
  userId?: string
  isFeatured?: boolean
  isPublic?: boolean
  limit?: number
  offset?: number
  sortBy?: 'recent' | 'popular' | 'rating' | 'downloads'
}

/**
 * Get tools with filtering, sorting, and pagination
 */
export async function getTools(filters: ToolFilters & { currentUserId?: string } = {}) {
  const {
    search,
    categoryId,
    platformId,
    userId,
    isFeatured,
    isPublic = true,
    limit = 20,
    offset = 0,
    sortBy = 'recent',
    currentUserId,
  } = filters

  const where: Prisma.ToolWhereInput = {
    is_public: isPublic,
    ...(isFeatured !== undefined && { is_featured: isFeatured }),
    ...(userId && { userId }),
    ...(categoryId && { categoryId }),
    ...(platformId && {
      tool_platforms: {
        some: { platformId },
      },
    }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { documentation: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  const orderBy = getOrderBy(sortBy)

  const [tools, total] = await Promise.all([
    prisma.tool.findMany({
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
        tool_platforms: {
          include: {
            platform: true,
          },
        },
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
    prisma.tool.count({ where }),
  ])

  // Transform the tools to include isFavorited flag
  const toolsWithFavorites = tools.map((tool: any) => ({
    ...tool,
    isFavorited: currentUserId ? tool.favorites?.length > 0 : false,
    favorites: undefined, // Remove the raw favorites data
  }))

  return {
    tools: toolsWithFavorites,
    total,
    hasMore: offset + tools.length < total,
  }
}

/**
 * Get a single tool by slug
 */
export async function getToolBySlug(slug: string) {
  return prisma.tool.findUnique({
    where: { slug },
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
      tool_platforms: {
        include: {
          platform: true,
        },
      },
      comments: {
        where: { parentId: null }, // Only root comments
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
 * Create a new tool
 */
export async function createTool(data: {
  name: string
  slug: string
  description: string
  documentation?: string
  image_url?: string
  userId: string
  categoryId?: string
  platformIds: string[]
  is_public?: boolean
}) {
  const { platformIds, ...toolData } = data

  return prisma.tool.create({
    data: {
      ...toolData,
      publishedAt: data.is_public ? new Date() : null,
      tool_platforms: {
        create: platformIds.map((platformId) => ({
          platformId,
        })),
      },
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
      tool_platforms: {
        include: {
          platform: true,
        },
      },
    },
  })
}

/**
 * Update a tool
 */
export async function updateTool(
  id: string,
  data: Partial<{
    name: string
    description: string
    documentation: string
    image_url: string
    categoryId: string
    platformIds: string[]
    is_public: boolean
    is_featured: boolean
  }>
) {
  const { platformIds, ...updateData } = data

  // If changing to public and not yet published, set publishedAt
  const finalUpdateData: any = { ...updateData }
  if (data.is_public) {
    const tool = await prisma.tool.findUnique({ where: { id } })
    if (tool && !tool.publishedAt) {
      finalUpdateData.publishedAt = new Date()
    }
  }

  return prisma.tool.update({
    where: { id },
    data: {
      ...finalUpdateData,
      ...(platformIds && {
        tool_platforms: {
          deleteMany: {},
          create: platformIds.map((platformId) => ({
            platformId,
          })),
        },
      }),
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
      tool_platforms: {
        include: {
          platform: true,
        },
      },
    },
  })
}

/**
 * Delete a tool
 */
export async function deleteTool(id: string) {
  return prisma.tool.delete({
    where: { id },
  })
}

/**
 * Increment tool views
 */
export async function incrementToolViews(id: string) {
  return prisma.tool.update({
    where: { id },
    data: {
      views_count: { increment: 1 },
    },
  })
}

/**
 * Get featured tools
 */
export async function getFeaturedTools(limit: number = 6) {
  return prisma.tool.findMany({
    where: {
      is_public: true,
      is_featured: true,
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
      tool_platforms: {
        include: {
          platform: true,
        },
      },
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
function getOrderBy(sortBy: ToolFilters['sortBy']): any {
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
