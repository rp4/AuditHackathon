import { PrismaClient } from '@prisma/client'

// PrismaClient singleton to prevent multiple instances in development
// Prevents "too many clients" error during hot reloading

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// In production, cap the connection pool so multiple Cloud Run instances
// don't exhaust Cloud SQL's connection limit.
// 5 connections × up to 10 instances = 50 (well within Cloud SQL's default 100).
function getDatasourceUrl(): string | undefined {
  if (process.env.NODE_ENV !== 'production') return undefined
  const base = process.env.DATABASE_URL
  if (!base) return undefined
  const separator = base.includes('?') ? '&' : '?'
  return `${base}${separator}connection_limit=5&pool_timeout=20`
}

const datasourceUrl = getDatasourceUrl()

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    ...(datasourceUrl && { datasourceUrl }),
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
