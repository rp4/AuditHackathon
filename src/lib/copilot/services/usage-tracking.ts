import { prisma } from '@/lib/prisma/client'

export interface UserContext {
  userId: string
  userEmail: string
}

export interface UsageRecord {
  userId: string
  userEmail: string
  model: string
  promptTokens: number
  outputTokens: number
  totalTokens: number
  sessionId?: string
}

// Gemini model pricing (per 1M tokens, under 200k context)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gemini-3-flash-preview': { input: 0.15, output: 0.60 },
  'gemini-3-pro-preview': { input: 2.00, output: 12.00 },
  'gemini-3-pro-image-preview': { input: 2.00, output: 12.00 },
}

function calculateCost(model: string, promptTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['gemini-3-flash-preview']
  return (promptTokens * pricing.input + outputTokens * pricing.output) / 1_000_000
}

/**
 * Track a Gemini API call. Fire-and-forget — never throws.
 */
export async function trackUsage(record: UsageRecord): Promise<void> {
  try {
    const estimatedCost = calculateCost(record.model, record.promptTokens, record.outputTokens)

    await prisma.apiUsage.create({
      data: {
        userId: record.userId,
        userEmail: record.userEmail,
        model: record.model,
        promptTokens: record.promptTokens,
        outputTokens: record.outputTokens,
        totalTokens: record.totalTokens,
        estimatedCost,
        sessionId: record.sessionId || null,
      },
    })
  } catch (error) {
    console.error('Failed to track API usage:', error)
  }
}

export interface UserUsageSummary {
  userId: string
  userEmail: string
  totalCalls: number
  promptTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCost: number
  byModel: Record<string, { calls: number; promptTokens: number; outputTokens: number; cost: number }>
}

/**
 * Get usage aggregated by user, with optional date range.
 */
export async function getUsageByUser(startDate?: string, endDate?: string): Promise<UserUsageSummary[]> {
  const where: Record<string, unknown> = {}
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate)
    if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate + 'T23:59:59.999Z')
  }

  const grouped = await prisma.apiUsage.groupBy({
    by: ['userId', 'userEmail', 'model'],
    where,
    _count: { id: true },
    _sum: {
      promptTokens: true,
      outputTokens: true,
      totalTokens: true,
      estimatedCost: true,
    },
    orderBy: { _sum: { estimatedCost: 'desc' } },
  })

  const userMap = new Map<string, UserUsageSummary>()

  for (const row of grouped) {
    let user = userMap.get(row.userId)
    if (!user) {
      user = {
        userId: row.userId,
        userEmail: row.userEmail,
        totalCalls: 0,
        promptTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCost: 0,
        byModel: {},
      }
      userMap.set(row.userId, user)
    }

    const calls = row._count.id
    const promptTokens = row._sum.promptTokens || 0
    const outputTokens = row._sum.outputTokens || 0
    const totalTokens = row._sum.totalTokens || 0
    const cost = row._sum.estimatedCost || 0

    user.totalCalls += calls
    user.promptTokens += promptTokens
    user.outputTokens += outputTokens
    user.totalTokens += totalTokens
    user.estimatedCost += cost
    user.byModel[row.model] = { calls, promptTokens, outputTokens, cost }
  }

  return Array.from(userMap.values()).sort((a, b) => b.estimatedCost - a.estimatedCost)
}

/**
 * Get a user's total spend for the current calendar month (UTC).
 */
export async function getCurrentMonthSpend(userId: string): Promise<number> {
  const startOfMonth = new Date()
  startOfMonth.setUTCDate(1)
  startOfMonth.setUTCHours(0, 0, 0, 0)

  const result = await prisma.apiUsage.aggregate({
    where: {
      userId,
      createdAt: { gte: startOfMonth },
    },
    _sum: { estimatedCost: true },
  })

  return result._sum.estimatedCost || 0
}

/**
 * Get a user's configured monthly spending limit.
 */
export async function getUserLimit(userId: string): Promise<{ monthlyLimit: number } | null> {
  const limit = await prisma.userSpendingLimit.findUnique({
    where: { userId },
    select: { monthlyLimit: true },
  })
  return limit
}

/**
 * Set or update a user's monthly spending limit.
 */
export async function setUserLimit(
  userId: string,
  userEmail: string,
  monthlyLimit: number,
  adminEmail: string
): Promise<void> {
  await prisma.userSpendingLimit.upsert({
    where: { userId },
    update: { monthlyLimit, updatedBy: adminEmail },
    create: { userId, monthlyLimit, updatedBy: adminEmail },
  })
}

/**
 * Get all user limits (for admin dashboard).
 */
export async function getAllUserLimits(): Promise<
  Array<{
    userId: string
    monthlyLimit: number
    updatedBy: string | null
    updatedAt: Date
  }>
> {
  return prisma.userSpendingLimit.findMany({
    select: {
      userId: true,
      monthlyLimit: true,
      updatedBy: true,
      updatedAt: true,
      user: { select: { email: true, name: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })
}

/**
 * Check whether a user is allowed to make another API call.
 */
export async function checkUserCanSpend(userId: string): Promise<{
  allowed: boolean
  currentSpend: number
  monthlyLimit: number
  remaining: number
}> {
  const defaultLimit = parseFloat(process.env.DEFAULT_MONTHLY_LIMIT || '5.00')

  const [currentSpend, limitConfig] = await Promise.all([
    getCurrentMonthSpend(userId),
    getUserLimit(userId),
  ])

  const monthlyLimit = limitConfig?.monthlyLimit ?? defaultLimit
  const remaining = Math.max(0, monthlyLimit - currentSpend)

  return {
    allowed: remaining > 0,
    currentSpend,
    monthlyLimit,
    remaining,
  }
}

/**
 * Check if a user is admin (via is_admin flag on User model).
 */
export async function isAdminUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { is_admin: true },
  })
  return user?.is_admin ?? false
}

/**
 * Get detailed usage records for a single user.
 */
export async function getUserDetail(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<{
  records: Array<{
    id: string
    model: string
    promptTokens: number
    outputTokens: number
    totalTokens: number
    estimatedCost: number
    sessionId: string | null
    createdAt: Date
  }>
}> {
  const where: Record<string, unknown> = { userId }
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate)
    if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate + 'T23:59:59.999Z')
  }

  const records = await prisma.apiUsage.findMany({
    where,
    select: {
      id: true,
      model: true,
      promptTokens: true,
      outputTokens: true,
      totalTokens: true,
      estimatedCost: true,
      sessionId: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  })

  return { records }
}
