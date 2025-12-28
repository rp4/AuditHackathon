import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma/client'

// GET /api/admin/stats - Get platform statistics
export async function GET(request: NextRequest) {
  const authError = await requireAdminApi()
  if (authError) return authError

  try {
    const searchParams = request.nextUrl.searchParams
    const timeframe = searchParams.get('timeframe') || '30d' // 7d, 30d, 90d, all

    // Calculate date range
    let dateFilter = {}
    const now = new Date()

    switch (timeframe) {
      case '7d':
        dateFilter = { gte: new Date(now.setDate(now.getDate() - 7)) }
        break
      case '30d':
        dateFilter = { gte: new Date(now.setDate(now.getDate() - 30)) }
        break
      case '90d':
        dateFilter = { gte: new Date(now.setDate(now.getDate() - 90)) }
        break
      case 'all':
      default:
        // No date filter
        break
    }

    // Get statistics in parallel
    const [
      totalUsers,
      newUsers,
      activeUsers,
      totalSwarms,
      newSwarms,
      topViewedSwarms,
      topFavoritedSwarms,
      recentProfiles
    ] = await Promise.all([
      // Total users
      prisma.user.count({
        where: { isDeleted: false }
      }),

      // New users (in timeframe)
      prisma.user.count({
        where: {
          isDeleted: false,
          createdAt: dateFilter
        }
      }),

      // Active users (users who created swarms or interacted in timeframe)
      prisma.user.count({
        where: {
          isDeleted: false,
          OR: [
            { swarms: { some: { createdAt: dateFilter } } },
            { favorites: { some: { createdAt: dateFilter } } },
            { ratings: { some: { createdAt: dateFilter } } },
            { downloads: { some: { createdAt: dateFilter } } },
            { comments: { some: { createdAt: dateFilter } } }
          ]
        }
      }),

      // Total swarms
      prisma.swarm.count({
        where: { isDeleted: false }
      }),

      // New swarms (in timeframe)
      prisma.swarm.count({
        where: {
          isDeleted: false,
          createdAt: dateFilter
        }
      }),

      // Top viewed swarms (all time)
      prisma.swarm.findMany({
        where: { isDeleted: false, is_public: true },
        orderBy: { views_count: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          slug: true,
          views_count: true,
          favorites_count: true,
          rating_avg: true,
          rating_count: true,
          user: {
            select: {
              name: true,
              username: true
            }
          }
        }
      }),

      // Top favorited swarms (all time)
      prisma.swarm.findMany({
        where: { isDeleted: false, is_public: true },
        orderBy: { favorites_count: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          slug: true,
          views_count: true,
          favorites_count: true,
          rating_avg: true,
          rating_count: true,
          user: {
            select: {
              name: true,
              username: true
            }
          }
        }
      }),

      // Recent user profiles
      prisma.user.findMany({
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          createdAt: true,
          _count: {
            select: {
              swarms: true,
              favorites: true
            }
          }
        }
      })
    ])

    // Get growth data for charts
    const userGrowth = await getGrowthData('user', timeframe)
    const swarmGrowth = await getGrowthData('swarm', timeframe)

    return NextResponse.json({
      overview: {
        totalUsers,
        newUsers,
        activeUsers,
        totalSwarms,
        newSwarms
      },
      topViewedSwarms,
      topFavoritedSwarms,
      recentProfiles,
      charts: {
        userGrowth,
        swarmGrowth
      }
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}

// Helper function to get growth data for charts
async function getGrowthData(model: 'user' | 'swarm', timeframe: string) {
  const now = new Date()
  const data = []

  const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365

  for (let i = days - 1; i >= 0; i--) {
    const start = new Date(now)
    start.setDate(start.getDate() - i)
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(end.getDate() + 1)

    const whereClause = {
      isDeleted: false,
      createdAt: {
        gte: start,
        lt: end
      }
    }

    const count = model === 'user'
      ? await prisma.user.count({ where: whereClause })
      : await prisma.swarm.count({ where: whereClause })

    data.push({
      date: start.toISOString().split('T')[0],
      count
    })
  }

  return data
}
