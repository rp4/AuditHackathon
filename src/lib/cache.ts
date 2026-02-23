/**
 * In-memory TTL cache + view count batcher for scaling without external services.
 * Each Cloud Run instance maintains its own cache — no cross-instance coordination needed.
 */

// ---------------------------------------------------------------------------
// TTL Cache
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class TTLCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private cleanupInterval: NodeJS.Timeout

  constructor(private defaultTTL: number) {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key)
        }
      }
    }, 60_000)

    // Prevent the interval from keeping the process alive
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref()
    }
  }

  /**
   * Return cached value if fresh, otherwise call `fetcher`, cache the result, and return it.
   */
  async get<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    const now = Date.now()
    const cached = this.cache.get(key)

    if (cached && now < cached.expiresAt) {
      return cached.data as T
    }

    const data = await fetcher()
    this.cache.set(key, { data, expiresAt: now + (ttl ?? this.defaultTTL) })
    return data
  }

  invalidate(key: string) {
    this.cache.delete(key)
  }

  invalidatePattern(pattern: RegExp) {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key)
      }
    }
  }
}

// Shared cache instances
export const leaderboardCache = new TTLCache(60_000)   // 60 s
export const categoriesCache = new TTLCache(300_000)    // 5 min
export const swarmsCache = new TTLCache(30_000)         // 30 s

// ---------------------------------------------------------------------------
// View Count Batcher
// ---------------------------------------------------------------------------

class ViewCountBatcher {
  private buffer = new Map<string, number>()
  private flushInterval: NodeJS.Timeout
  private shuttingDown = false

  constructor(private flushMs: number) {
    this.flushInterval = setInterval(() => this.flush(), this.flushMs)

    if (this.flushInterval.unref) {
      this.flushInterval.unref()
    }

    // Graceful shutdown — flush remaining counts
    const shutdown = () => this.shutdown()
    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)
  }

  /** Queue a +1 view for the given swarm. */
  increment(swarmId: string) {
    this.buffer.set(swarmId, (this.buffer.get(swarmId) ?? 0) + 1)
  }

  /** Flush buffered counts to the database. */
  async flush() {
    if (this.buffer.size === 0) return

    // Swap the buffer so new increments accumulate separately
    const batch = this.buffer
    this.buffer = new Map()

    try {
      // Dynamic import avoids circular dependency with prisma client
      const { prisma } = await import('@/lib/prisma/client')

      await Promise.all(
        Array.from(batch.entries()).map(([swarmId, count]) =>
          prisma.swarm
            .update({ where: { id: swarmId }, data: { views_count: { increment: count } } })
            .catch((err: unknown) => console.error(`Failed to flush views for ${swarmId}:`, err))
        )
      )
    } catch (err) {
      console.error('View count flush failed:', err)
      // Put failed counts back for next flush
      for (const [id, count] of batch) {
        this.buffer.set(id, (this.buffer.get(id) ?? 0) + count)
      }
    }
  }

  private async shutdown() {
    if (this.shuttingDown) return
    this.shuttingDown = true
    clearInterval(this.flushInterval)
    await this.flush()
  }
}

export const viewCountBatcher = new ViewCountBatcher(30_000) // flush every 30 s
