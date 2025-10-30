import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Debug endpoint to check database connectivity and data
 * Access at: /api/debug
 * REMOVE IN PRODUCTION!
 */
export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: {},
    database: {},
    data: {},
  }

  try {
    // Check environment variables
    results.environment = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({
        ...results,
        error: 'Missing Supabase credentials',
      }, { status: 500 })
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Test database connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('agents')
      .select('id')
      .limit(1)

    results.database.connected = !connectionError
    results.database.connectionError = connectionError?.message

    // Count platforms
    const { count: platformCount, error: platformError } = await supabase
      .from('platforms')
      .select('*', { count: 'exact', head: true })

    results.data.platforms = {
      count: platformCount,
      error: platformError?.message,
    }

    // Get actual platforms
    const { data: platformsData, error: platformsDataError } = await supabase
      .from('platforms')
      .select('id, name, slug')
      .limit(10)

    results.data.platformsList = {
      data: platformsData,
      error: platformsDataError?.message,
    }

    // Count agents
    const { count: agentCount, error: agentError } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })

    results.data.agents = {
      count: agentCount,
      error: agentError?.message,
    }

    // Get actual agents
    const { data: agentsData, error: agentsDataError } = await supabase
      .from('agents')
      .select('id, name, slug, is_public, is_deleted')
      .limit(10)

    results.data.agentsList = {
      data: agentsData,
      error: agentsDataError?.message,
    }

    // Check public agents
    const { count: publicAgentCount, error: publicAgentError } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', true)

    results.data.publicAgents = {
      count: publicAgentCount,
      error: publicAgentError?.message,
    }

    // Check categories
    const { count: categoryCount, error: categoryError } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })

    results.data.categories = {
      count: categoryCount,
      error: categoryError?.message,
    }

    // Get actual categories
    const { data: categoriesData, error: categoriesDataError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .limit(10)

    results.data.categoriesList = {
      data: categoriesData,
      error: categoriesDataError?.message,
    }

    // Check RLS policies (try to read with anon key)
    const { data: rlsTest, error: rlsError } = await supabase
      .from('agents')
      .select('id, name, is_public')
      .eq('is_public', true)
      .limit(5)

    results.database.rlsTest = {
      canReadPublicAgents: !rlsError && rlsTest && rlsTest.length > 0,
      publicAgentsFound: rlsTest?.length || 0,
      error: rlsError?.message,
    }

    return NextResponse.json(results, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })

  } catch (error) {
    return NextResponse.json({
      ...results,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
