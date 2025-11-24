/**
 * Environment variable validation
 * Ensures all required environment variables are present and valid
 */

import { z } from 'zod'
import { logger } from '@/lib/utils/logger'

// Define the schema for environment variables
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'Database URL is required'),

  // NextAuth
  NEXTAUTH_URL: z.string().url('Invalid NextAuth URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters'),

  // LinkedIn OAuth
  LINKEDIN_CLIENT_ID: z.string().min(1, 'LinkedIn client ID is required'),
  LINKEDIN_CLIENT_SECRET: z.string().min(1, 'LinkedIn client secret is required'),

  // Google Cloud Platform
  GCP_PROJECT_ID: z.string().min(1, 'GCP project ID is required'),
  GCS_BUCKET_NAME: z.string().min(1, 'GCS bucket name is required'),

  // Optional: Service account credentials (not needed in Cloud Run with default SA)
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  GCS_SERVICE_ACCOUNT_KEY: z.string().optional(),

  // Upstash Redis (Optional - falls back to in-memory)
  UPSTASH_REDIS_REST_URL: z.string().url('Invalid Upstash Redis URL').optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Sentry (Optional - error tracking)
  SENTRY_DSN: z.string().url('Invalid Sentry DSN').optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url('Invalid Sentry DSN').optional(),

  // Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
  VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),

  // Dev Auth (Development only)
  ENABLE_DEV_AUTH: z.string().optional(),
  DEV_AUTH_SECRET: z.string().optional(),
})

// Type for validated environment variables
export type Env = z.infer<typeof envSchema>

// Validate and export environment variables
function validateEnv(): Env {
  const parsed = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID,
    LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET,
    GCP_PROJECT_ID: process.env.GCP_PROJECT_ID,
    GCS_BUCKET_NAME: process.env.GCS_BUCKET_NAME,
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    GCS_SERVICE_ACCOUNT_KEY: process.env.GCS_SERVICE_ACCOUNT_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    SENTRY_DSN: process.env.SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    ENABLE_DEV_AUTH: process.env.ENABLE_DEV_AUTH,
    DEV_AUTH_SECRET: process.env.DEV_AUTH_SECRET,
  })

  if (!parsed.success) {
    const errors = JSON.stringify(parsed.error.format(), null, 2)
    logger.error('Invalid environment variables', { errors })
    throw new Error('Invalid environment variables. Check logs for details.')
  }

  return parsed.data
}

// Export validated environment variables
export const env = validateEnv()

// Helper to check if we're in production
export const isProduction = env.NODE_ENV === 'production' || env.VERCEL_ENV === 'production'

// Helper to check if we're in development
export const isDevelopment = env.NODE_ENV === 'development'

// Helper to check if Redis is configured
export const isRedisConfigured = !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)

// Helper to check if Sentry is configured
export const isSentryConfigured = !!(env.SENTRY_DSN || env.NEXT_PUBLIC_SENTRY_DSN)

// Warn about missing optional configurations
if (!isRedisConfigured && isProduction) {
  logger.warn('Upstash Redis is not configured. Rate limiting will use in-memory storage. This is not recommended for production.')
}

if (!isSentryConfigured && isProduction) {
  logger.warn('Sentry is not configured. Error tracking will not be available.')
}

// Production safety checks
if (isProduction) {
  // Ensure dev auth is disabled in production
  if (env.ENABLE_DEV_AUTH === 'true') {
    logger.error('CRITICAL: Dev auth is enabled in production!')
    throw new Error('Dev auth must be disabled in production')
  }

  // Warn if service account key is used (Cloud Run should use default SA)
  if (env.GCS_SERVICE_ACCOUNT_KEY || env.GOOGLE_APPLICATION_CREDENTIALS) {
    logger.warn('Service account credentials detected. Cloud Run should use default service account.')
  }
}
