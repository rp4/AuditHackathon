import { prisma } from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'

// ============================================
// AuditIssue queries (admin + judge)
// ============================================

export async function getAllIssues(filters?: {
  category?: string
  severity?: string
  isActive?: boolean
}) {
  const where: Prisma.AuditIssueWhereInput = {}
  if (filters?.category) where.category = filters.category
  if (filters?.severity) where.severity = filters.severity
  if (filters?.isActive !== undefined) where.isActive = filters.isActive

  return prisma.auditIssue.findMany({
    where,
    orderBy: [{ category: 'asc' }, { issueCode: 'asc' }],
  })
}

export async function getIssueStats() {
  const [total, byCategory, bySeverity] = await Promise.all([
    prisma.auditIssue.count({ where: { isActive: true } }),
    prisma.auditIssue.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: true,
    }),
    prisma.auditIssue.groupBy({
      by: ['severity'],
      where: { isActive: true },
      _count: true,
    }),
  ])

  return {
    total,
    byCategory: Object.fromEntries(byCategory.map(g => [g.category, g._count])),
    bySeverity: Object.fromEntries(bySeverity.map(g => [g.severity, g._count])),
  }
}

export async function createIssue(data: {
  issueCode: string
  title: string
  description: string
  category: string
  severity: string
  financialImpact?: number
  dataSource?: string
  evidence?: string
}) {
  return prisma.auditIssue.create({ data })
}

export async function updateIssue(
  id: string,
  data: Partial<{
    issueCode: string
    title: string
    description: string
    category: string
    severity: string
    financialImpact: number | null
    dataSource: string | null
    evidence: string | null
    isActive: boolean
  }>
) {
  return prisma.auditIssue.update({ where: { id }, data })
}

// ============================================
// IssueDiscovery queries (game logic)
// ============================================

export async function getUserDiscoveries(userId: string) {
  return prisma.issueDiscovery.findMany({
    where: { userId },
    include: {
      issue: {
        select: {
          issueCode: true,
          title: true,
          category: true,
          severity: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getDiscoveredIssueCodes(userId: string): Promise<Set<string>> {
  const discoveries = await prisma.issueDiscovery.findMany({
    where: { userId },
    select: { issue: { select: { issueCode: true } } },
  })
  return new Set(discoveries.map(d => d.issue.issueCode))
}

export async function getUserDiscoveryCount(userId: string): Promise<number> {
  return prisma.issueDiscovery.count({ where: { userId } })
}

/**
 * Core game logic: mark issues as found for a user.
 * Idempotent — skips issues already discovered by this user.
 */
export async function markIssuesFound(
  userId: string,
  reportId: string,
  issueCodes: string[]
): Promise<{ newlyFound: string[]; alreadyFound: string[] }> {
  // Look up AuditIssue records by code
  const issues = await prisma.auditIssue.findMany({
    where: { issueCode: { in: issueCodes }, isActive: true },
    select: { id: true, issueCode: true },
  })

  // Check which ones the user already discovered
  const existing = await prisma.issueDiscovery.findMany({
    where: {
      userId,
      issueId: { in: issues.map(i => i.id) },
    },
    select: { issueId: true },
  })
  const existingIds = new Set(existing.map(e => e.issueId))

  const newIssues = issues.filter(i => !existingIds.has(i.id))
  const alreadyFoundCodes = issues
    .filter(i => existingIds.has(i.id))
    .map(i => i.issueCode)

  if (newIssues.length > 0) {
    await prisma.issueDiscovery.createMany({
      data: newIssues.map(issue => ({
        userId,
        issueId: issue.id,
        reportId,
      })),
      skipDuplicates: true,
    })
  }

  return {
    newlyFound: newIssues.map(i => i.issueCode),
    alreadyFound: alreadyFoundCodes,
  }
}

// ============================================
// AuditReport queries
// ============================================

export async function createReport(data: {
  userId: string
  content: string
  judgeResponse?: string
  newIssues?: number
  totalMatched?: number
  sessionId?: string
}) {
  return prisma.auditReport.create({ data })
}

export async function updateReport(
  id: string,
  data: Partial<{ judgeResponse: string; newIssues: number; totalMatched: number }>
) {
  return prisma.auditReport.update({ where: { id }, data })
}

export async function getUserReports(userId: string, limit = 20, offset = 0) {
  const [reports, total] = await Promise.all([
    prisma.auditReport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        newIssues: true,
        totalMatched: true,
        createdAt: true,
        _count: { select: { discoveries: true } },
      },
    }),
    prisma.auditReport.count({ where: { userId } }),
  ])

  return { reports, total }
}

export async function getUserReportCount(userId: string): Promise<number> {
  return prisma.auditReport.count({ where: { userId } })
}

// ============================================
// Leaderboard
// ============================================

interface LeaderboardEntry {
  id: string
  name: string | null
  image: string | null
  username: string | null
  issuesFound: number
  reportsSubmitted: number
}

export async function getLeaderboard(limit = 50, offset = 0) {
  const [entries, totalIssues] = await Promise.all([
    prisma.$queryRaw<LeaderboardEntry[]>`
      SELECT
        u.id,
        u.name,
        u.image,
        u.username,
        COUNT(DISTINCT d."issueId")::int AS "issuesFound",
        COUNT(DISTINCT r.id)::int AS "reportsSubmitted"
      FROM users u
      LEFT JOIN issue_discoveries d ON u.id = d."userId"
      LEFT JOIN audit_reports r ON u.id = r."userId"
      WHERE u."isDeleted" = false
      GROUP BY u.id, u.name, u.image, u.username
      HAVING COUNT(DISTINCT d."issueId") > 0
      ORDER BY "issuesFound" DESC, "reportsSubmitted" ASC
      LIMIT ${limit} OFFSET ${offset}
    `,
    prisma.auditIssue.count({ where: { isActive: true } }),
  ])

  return { entries, totalIssues }
}
