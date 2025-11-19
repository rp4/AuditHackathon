import { prisma } from '@/lib/prisma/client'

/**
 * Database utilities for Category and Platform operations
 */

/**
 * Get all categories
 */
export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
  })
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
  })
}

/**
 * Get all platforms
 */
export async function getPlatforms() {
  return prisma.platform.findMany({
    orderBy: { name: 'asc' },
  })
}

/**
 * Get platform by slug
 */
export async function getPlatformBySlug(slug: string) {
  return prisma.platform.findUnique({
    where: { slug },
  })
}

/**
 * Get categories with tool counts
 */
export async function getCategoriesWithCounts() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: {
          tools: {
            where: {
              is_public: true,
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return categories.map((category) => ({
    ...category,
    toolCount: category._count.tools,
  }))
}

/**
 * Get platforms with tool counts
 */
export async function getPlatformsWithCounts() {
  const platforms = await prisma.platform.findMany({
    include: {
      _count: {
        select: {
          tool_platforms: {
            where: {
              tool: {
                is_public: true,
              },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return platforms.map((platform) => ({
    ...platform,
    toolCount: platform._count.tool_platforms,
  }))
}
