import { prisma } from '@/lib/prisma/client'
import { categoriesCache } from '@/lib/cache'

/**
 * Database utilities for Category operations
 */

/**
 * Get categories with swarm counts (cached for 5 minutes)
 */
export async function getCategoriesWithCounts() {
  return categoriesCache.get('categories:all', async () => {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            swarms: {
              where: {
                is_public: true,
                isDeleted: false,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return categories.map((category) => ({
      ...category,
      swarmCount: category._count.swarms,
    }))
  })
}

export function invalidateCategoriesCache() {
  categoriesCache.invalidate('categories:all')
}
