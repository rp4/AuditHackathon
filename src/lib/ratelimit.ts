/**
 * Simple in-memory rate limiter
 * For production, consider using @upstash/ratelimit with Redis
 */

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

// Singleton instance
export const rateLimiter = new InMemoryRateLimiter()

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
