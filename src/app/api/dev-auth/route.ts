import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const DEV_USER_ID = '51b0255c-de4d-45d5-90fb-af62e5291435'

export async function POST(request: NextRequest) {
  // HARD BLOCK in production - this endpoint should never be accessible
  if (process.env.NODE_ENV === 'production' ||
      process.env.VERCEL_ENV === 'production') {
    return new NextResponse(null, { status: 404 })
  }

  // Multiple layers of protection for non-production environments
  const isDev = process.env.NODE_ENV === 'development'
  const devModeEnabled = process.env.ENABLE_DEV_AUTH === 'true'
  const host = request.headers.get('host') || ''
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')

  // Require special development header for additional security
  const devHeader = request.headers.get('x-dev-auth-secret')
  const expectedSecret = process.env.DEV_AUTH_SECRET || 'dev-only-secret'

  // Strict checks - ALL must be true
  if (!isDev || !devModeEnabled || !isLocalhost || devHeader !== expectedSecret) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    )
  }

  try {
    console.log('🔧 DEV MODE: Starting auto-login process for user:', DEV_USER_ID)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('🔧 DEV MODE: Supabase URL:', supabaseUrl ? 'Found' : 'Missing')
    console.log('🔧 DEV MODE: Service key:', supabaseServiceKey ? 'Found' : 'Missing')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials for dev auth')
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

    console.log('🔧 DEV MODE: Creating admin client...')
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('🔧 DEV MODE: Fetching user data...')
    // Get the user data
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(DEV_USER_ID)

    if (userError || !userData.user) {
      console.error('Dev user not found:', userError)
      return NextResponse.json(
        { error: 'Dev user not found in database', details: userError?.message },
        { status: 404 }
      )
    }

    console.log('🔧 DEV MODE: User found, generating magic link...')
    // Generate a magic link for dev login (createSession doesn't exist in this version)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.user.email || '',
    })

    if (linkError || !linkData) {
      console.error('Failed to generate link:', linkError)
      return NextResponse.json(
        { error: 'Failed to generate auth link', details: linkError?.message },
        { status: 500 }
      )
    }

    console.log('✅ DEV MODE: Auth link generated for user:', DEV_USER_ID)

    // Return the auth URL (client should redirect here)
    const response = NextResponse.json({
      success: true,
      user: userData.user,
      authUrl: linkData.properties.action_link,
    })

    return response

  } catch (error) {
    console.error('Dev auth error:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
