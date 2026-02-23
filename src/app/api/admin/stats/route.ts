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
    let filterDate: Date | null = null
    const now = new Date()

    switch (timeframe) {
      case '7d':
        dateFilter = { gte: new Date(now.setDate(now.getDate() - 7)) }
        filterDate = new Date(now)
        break
      case '30d':
        dateFilter = { gte: new Date(now.setDate(now.getDate() - 30)) }
        filterDate = new Date(now)
        break
      case '90d':
        dateFilter = { gte: new Date(now.setDate(now.getDate() - 90)) }
        filterDate = new Date(now)
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

      // Active users — single query with UNION instead of 5 nested subqueries
      (async () => {
        const dateClause = filterDate ? `AND t."createdAt" >= $1` : ''
        const params = filterDate ? [filterDate] : []
        const tables = ['swarms', 'favorites', 'ratings', 'downloads', 'comments']
        const unions = tables
          .map(t => `SELECT DISTINCT t."userId" FROM ${t} t WHERE 1=1 ${dateClause}`)
          .join(' UNION ')
        const sql = `
          SELECT COUNT(DISTINCT a."userId")::int AS count
          FROM (${unions}) a
          JOIN users u ON u.id = a."userId"
          WHERE u."isDeleted" = false
        `
        const rows = await prisma.$queryRawUnsafe<{ count: number }[]>(sql, ...params)
        return rows[0]?.count ?? 0
      })(),

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

// Helper function to get growth data for charts — single SQL query instead of N
async function getGrowthData(model: 'user' | 'swarm', timeframe: string) {
  const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  const table = model === 'user' ? 'users' : 'swarms'

  const rows = await prisma.$queryRawUnsafe<{ date: string; count: bigint }[]>(
    `SELECT DATE("createdAt") AS date, COUNT(*)::bigint AS count
     FROM ${table}
     WHERE "isDeleted" = false AND "createdAt" >= $1
     GROUP BY DATE("createdAt")
     ORDER BY date ASC`,
    startDate
  )

  // Build a map of date → count from the query results
  const countByDate = new Map<string, number>()
  for (const row of rows) {
    // Postgres DATE comes back as a Date or string depending on driver
    const key = typeof row.date === 'string'
      ? row.date.slice(0, 10)
      : new Date(row.date).toISOString().slice(0, 10)
    countByDate.set(key, Number(row.count))
  }

  // Fill in every day in the range (including zero-count days)
  const data = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    data.push({ date: key, count: countByDate.get(key) ?? 0 })
  }

  return data
}
