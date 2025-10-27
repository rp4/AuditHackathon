import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const DEV_USER_ID = '51b0255c-de4d-45d5-90fb-af62e5291435'

export async function POST(request: NextRequest) {
  // Multiple layers of protection
  const isDev = process.env.NODE_ENV === 'development'
  const devModeEnabled = process.env.ENABLE_DEV_AUTH === 'true'
  const host = request.headers.get('host') || ''
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')

  // Strict checks - ALL must be true
  if (!isDev || !devModeEnabled || !isLocalhost) {
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
    // Generate a magic link (this creates a one-time token)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.user.email!,
    })

    if (linkError || !linkData) {
      console.error('Failed to generate link:', linkError)
      return NextResponse.json(
        { error: 'Failed to generate auth link', details: linkError?.message },
        { status: 500 }
      )
    }

    console.log('✅ DEV MODE: Auto-login link generated for user:', DEV_USER_ID)

    // Return the link data so client can use it
    const response = NextResponse.json({
      success: true,
      user: userData.user,
      properties: linkData.properties
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
