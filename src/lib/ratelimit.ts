/**
 * Production-ready rate limiter using Upstash Redis
 * Falls back to in-memory for development
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Check if Redis is configured
const isRedisConfigured =
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN

// Initialize Redis client for production
const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

// Different limits for different endpoints
export const RATE_LIMITS = {
  // Strict limits for auth endpoints
  AUTH: { maxRequests: 5, windowMs: 60000 }, // 5 requests per minute

  // Moderate limits for mutations
  MUTATION: { maxRequests: 20, windowMs: 60000 }, // 20 requests per minute

  // Generous limits for reads
  API: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute

  // Very strict for sensitive operations
  UPLOAD: { maxRequests: 10, windowMs: 300000 }, // 10 uploads per 5 minutes
} as const

// Create rate limiters for different endpoints using Upstash
export const authLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.AUTH.maxRequests,
        `${RATE_LIMITS.AUTH.windowMs / 1000} s`
      ),
      analytics: true,
      prefix: 'ratelimit:auth',
    })
  : null

export const uploadLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.UPLOAD.maxRequests,
        `${RATE_LIMITS.UPLOAD.windowMs / 1000} s`
      ),
      analytics: true,
      prefix: 'ratelimit:upload',
    })
  : null

export const mutationLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.MUTATION.maxRequests,
        `${RATE_LIMITS.MUTATION.windowMs / 1000} s`
      ),
      analytics: true,
      prefix: 'ratelimit:mutation',
    })
  : null

export const apiLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.API.maxRequests,
        `${RATE_LIMITS.API.windowMs / 1000} s`
      ),
      analytics: true,
      prefix: 'ratelimit:api',
    })
  : null

// Fallback in-memory rate limiter for development
interface RateLimitEntry {
  count: number
  resetTime: number
}

class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.store.entries()) {
        if (now > entry.resetTime) {
          this.store.delete(key)
        }
      }
    }, 60000)
  }

  async limit(
    identifier: string,
    maxRequests: number = 10,
    windowMs: number = 60000
  ): Promise<{
    success: boolean
    limit: number
    remaining: number
    reset: number
  }> {
    const now = Date.now()
    const entry = this.store.get(identifier)

    if (!entry || now > entry.resetTime) {
      // Start new window
      const resetTime = now + windowMs
      this.store.set(identifier, { count: 1, resetTime })
      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests - 1,
        reset: resetTime,
      }
    }

    if (entry.count >= maxRequests) {
      // Rate limit exceeded
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset: entry.resetTime,
      }
    }

    // Increment count
    entry.count++
    this.store.set(identifier, entry)

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - entry.count,
      reset: entry.resetTime,
    }
  }

  cleanup() {
    clearInterval(this.cleanupInterval)
    this.store.clear()
  }
}

// Fallback limiter for development
const fallbackLimiter = new InMemoryRateLimiter()

/**
 * Check rate limit for a given identifier
 * Uses Upstash Redis in production, falls back to in-memory for development
 */
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit | null,
  config: { maxRequests: number; windowMs: number }
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
}> {
  // Use Upstash if configured
  if (limiter) {
    const result = await limiter.limit(identifier)
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset * 1000, // Convert to ms
    }
  }

  // Fall back to in-memory limiter (development only)
  console.warn(
    '⚠️  Using in-memory rate limiter. Configure Upstash Redis for production!'
  )
  return fallbackLimiter.limit(
    identifier,
    config.maxRequests,
    config.windowMs
  )
}

/**
 * Helper to get the appropriate limiter for a path
 */
export function getLimiterForPath(pathname: string): {
  limiter: Ratelimit | null
  config: { maxRequests: number; windowMs: number }
} {
  if (pathname.startsWith('/api/auth') || pathname.includes('/auth/')) {
    return { limiter: authLimiter, config: RATE_LIMITS.AUTH }
  }

  if (pathname.includes('/upload') || pathname.includes('/storage')) {
    return { limiter: uploadLimiter, config: RATE_LIMITS.UPLOAD }
  }

  if (
    pathname.startsWith('/api/agents') &&
    (pathname.includes('POST') || pathname.includes('PUT') || pathname.includes('DELETE'))
  ) {
    return { limiter: mutationLimiter, config: RATE_LIMITS.MUTATION }
  }

  return { limiter: apiLimiter, config: RATE_LIMITS.API }
}
