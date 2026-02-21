/**
 * Production-safe logging utility
 * Only logs in development
 */

const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  debug: (...args: any[]) => {
    if (isDev) {
      console.log('[DEBUG]', ...args)
    }
  },

  info: (...args: any[]) => {
    if (isDev) {
      console.info('[INFO]', ...args)
    }
  },

  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args)
  },

  error: (...args: any[]) => {
    console.error('[ERROR]', ...args)
  },

  serverError: (error: Error | string, context?: Record<string, any>) => {
    console.error('[SERVER ERROR]', error, context)
  },
}
