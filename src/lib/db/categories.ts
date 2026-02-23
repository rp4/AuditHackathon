import { prisma } from '@/lib/prisma/client'
import { categoriesCache } from '@/lib/cache'

/**
 * Database utilities for Category operations
 */

/**
 * Get categories with swarm counts (cached for 5 minutes)
 */
export async function getCategoriesWithCounts() {
  const CATEGORY_ORDER = ['PrePlanning', 'Planning', 'Fieldwork', 'Reporting', 'Other']

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
    })

    const mapped = categories.map((category) => ({
      ...category,
      swarmCount: category._count.swarms,
    }))

    mapped.sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a.name)
      const bi = CATEGORY_ORDER.indexOf(b.name)
      return (ai === -1 ? CATEGORY_ORDER.length : ai) - (bi === -1 ? CATEGORY_ORDER.length : bi)
    })

    return mapped
  })
}

export function invalidateCategoriesCache() {
  categoriesCache.invalidate('categories:all')
}
