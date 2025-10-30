import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Health check endpoint
 * Used by monitoring services and load balancers
 */
export async function GET() {
  const startTime = Date.now()

  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          checks: {
            environment: 'failed',
            database: 'skipped',
          },
          error: 'Missing environment configuration',
        },
        { status: 503 }
      )
    }

    // Check database connection
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from('agents')
      .select('id')
      .limit(1)
      .single()

    const responseTime = Date.now() - startTime

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is fine for health check
      return NextResponse.json(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          responseTime: `${responseTime}ms`,
          checks: {
            environment: 'ok',
            database: 'failed',
          },
          error: error.message,
        },
        { status: 503 }
      )
    }

    // All checks passed
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      checks: {
        environment: 'ok',
        database: 'ok',
      },
      version: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'unknown',
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
    })
  } catch (error) {
    const responseTime = Date.now() - startTime

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        checks: {
          environment: 'unknown',
          database: 'unknown',
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}

// Disable caching for health checks
export const dynamic = 'force-dynamic'
export const revalidate = 0
