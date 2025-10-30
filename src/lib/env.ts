/**
 * Environment variable validation
 * Ensures all required environment variables are present and valid
 */

import { z } from 'zod'

// Define the schema for environment variables
const envSchema = z.object({
  // Supabase (Required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),

  // Supabase Service Role (Optional - only for server-side admin operations)
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Upstash Redis (Optional - falls back to in-memory)
  UPSTASH_REDIS_REST_URL: z.string().url('Invalid Upstash Redis URL').optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Sentry (Optional - error tracking)
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
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    ENABLE_DEV_AUTH: process.env.ENABLE_DEV_AUTH,
    DEV_AUTH_SECRET: process.env.DEV_AUTH_SECRET,
  })

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:')
    console.error(JSON.stringify(parsed.error.format(), null, 2))
    throw new Error('Invalid environment variables. Check the console for details.')
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
export const isSentryConfigured = !!env.NEXT_PUBLIC_SENTRY_DSN

// Warn about missing optional configurations
if (!isRedisConfigured && isProduction) {
  console.warn('⚠️  WARNING: Upstash Redis is not configured. Rate limiting will use in-memory storage.')
  console.warn('   This is not recommended for production. Please configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.')
}

if (!isSentryConfigured && isProduction) {
  console.warn('⚠️  WARNING: Sentry is not configured. Error tracking will not be available.')
  console.warn('   Consider setting NEXT_PUBLIC_SENTRY_DSN for production error monitoring.')
}

// Production safety checks
if (isProduction) {
  // Ensure service role key is not exposed in production builds
  if (typeof window !== 'undefined' && env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ CRITICAL: Service role key detected in client bundle!')
    throw new Error('Service role key must never be exposed to the client')
  }

  // Ensure dev auth is disabled in production
  if (env.ENABLE_DEV_AUTH === 'true') {
    console.error('❌ CRITICAL: Dev auth is enabled in production!')
    throw new Error('Dev auth must be disabled in production')
  }
}
