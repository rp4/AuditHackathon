import { prisma } from '@/lib/prisma/client'

/**
 * Database utilities for Category operations
 */

/**
 * Get categories with swarm counts
 */
export async function getCategoriesWithCounts() {
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
}
