/**
 * Production-safe logging utility
 * Only logs in development, sends errors to Sentry in production
 */

const isDev = process.env.NODE_ENV === 'development'
const isServer = typeof window === 'undefined'

export const logger = {
  /**
   * Debug level - only visible in development
   */
  debug: (...args: any[]) => {
    if (isDev) {
      console.log('[DEBUG]', ...args)
    }
  },

  /**
   * Info level - only visible in development
   */
  info: (...args: any[]) => {
    if (isDev) {
      console.info('[INFO]', ...args)
    }
  },

  /**
   * Warning level - always logged
   */
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args)

    // Send to Sentry in production
    if (!isDev && !isServer) {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.captureMessage(args.join(' '), 'warning')
      }).catch(() => {
        // Fail silently if Sentry is not available
      })
    }
  },

  /**
   * Error level - always logged and sent to Sentry in production
   */
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args)

    // Send to Sentry in production
    if (!isDev && !isServer) {
      import('@sentry/nextjs').then((Sentry) => {
        // If first arg is an Error object, use captureException
        if (args[0] instanceof Error) {
          Sentry.captureException(args[0], {
            extra: {
              additionalInfo: args.slice(1),
            },
          })
        } else {
          Sentry.captureMessage(args.join(' '), 'error')
        }
      }).catch(() => {
        // Fail silently if Sentry is not available
      })
    }
  },

  /**
   * Server-side logging with request context
   */
  serverError: (error: Error | string, context?: Record<string, any>) => {
    console.error('[SERVER ERROR]', error, context)

    // Send to Sentry in production
    if (!isDev && isServer) {
      import('@sentry/nextjs').then((Sentry) => {
        if (error instanceof Error) {
          Sentry.captureException(error, {
            extra: context,
          })
        } else {
          Sentry.captureMessage(error, {
            level: 'error',
            extra: context,
          })
        }
      }).catch(() => {
        // Fail silently if Sentry is not available
      })
    }
  },
}

/**
 * Performance timing utility
 * Only active in development
 */
export function measurePerformance<T>(
  label: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  if (!isDev) {
    return fn()
  }

  const start = performance.now()
  const result = fn()

  if (result instanceof Promise) {
    return result.then((value) => {
      const end = performance.now()
      console.log(`[PERF] ${label}: ${(end - start).toFixed(2)}ms`)
      return value
    })
  } else {
    const end = performance.now()
    console.log(`[PERF] ${label}: ${(end - start).toFixed(2)}ms`)
    return result
  }
}
