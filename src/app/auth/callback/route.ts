import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database-generated'

type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

/**
 * Sanitize string input from OAuth provider
 */
function sanitizeString(value: string | undefined, maxLength: number = 100): string | null {
  if (!value || typeof value !== 'string') return null

  return value
    .trim()
    .replace(/[<>\"']/g, '') // Remove potential XSS characters
    .substring(0, maxLength)
    .trim() || null
}

/**
 * Sanitize and validate URL from OAuth provider
 */
function sanitizeUrl(url: string | undefined, allowedHosts: string[] = ['linkedin.com']): string | null {
  if (!url || typeof url !== 'string') return null

  try {
    const parsed = new URL(url)

    // Only allow HTTPS
    if (parsed.protocol !== 'https:') return null

    // Check if hostname ends with allowed hosts
    const isAllowed = allowedHosts.some(host =>
      parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
    )

    if (!isAllowed) return null

    return parsed.toString().substring(0, 500) // Limit URL length
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/'

  console.log('🔐 [AUTH-CALLBACK] Auth callback received:', {
    hasCode: !!code,
    hasError: !!error,
    origin,
    next,
    timestamp: new Date().toISOString(),
    url: request.url,
    headers: {
      host: request.headers.get('host'),
      forwardedHost: request.headers.get('x-forwarded-host'),
      forwardedProto: request.headers.get('x-forwarded-proto'),
    }
  })

  // Log any errors from the OAuth provider
  if (error) {
    console.error('❌ [AUTH-CALLBACK] OAuth provider error:', {
      error,
      error_description,
      full_url: request.url,
      timestamp: new Date().toISOString()
    })
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  if (code) {
    const supabase = await createClient()
    console.log('🔄 [AUTH-CALLBACK] Attempting to exchange code for session...')
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError && data.user) {
      console.log('✅ [AUTH-CALLBACK] Successfully exchanged code for session:', {
        userId: data.user.id,
        email: data.user.email,
        hasSession: !!data.session,
        timestamp: new Date().toISOString()
      })

      // Ensure profile exists - create if missing
      console.log('🔍 [AUTH-CALLBACK] Checking for existing profile...')
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (profileCheckError) {
        console.log('⚠️ [AUTH-CALLBACK] Profile check error:', profileCheckError)
      }

      if (!existingProfile) {
        console.log('📝 [AUTH-CALLBACK] Profile not found, creating one...')

        // Convert name to username format (lowercase, spaces to underscores, remove special chars)
        const name = data.user.user_metadata?.name || data.user.user_metadata?.full_name
        let baseUsername: string

        if (name) {
          baseUsername = name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '_')           // Replace spaces with underscores
            .replace(/[^a-z0-9_]/g, '')     // Remove special characters
            .slice(0, 30)                    // Limit length
        } else {
          // Fallback if no name available
          baseUsername = data.user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') ||
                        `user_${data.user.id.slice(0, 8)}`
        }

        // Try to create profile with original username
        let username = baseUsername

        // Sanitize all user metadata before storing
        const profileData: ProfileInsert = {
          id: data.user.id,
          username,
          full_name: sanitizeString(
            data.user.user_metadata?.name || data.user.user_metadata?.full_name,
            100
          ),
          avatar_url: sanitizeUrl(
            data.user.user_metadata?.picture || data.user.user_metadata?.avatar_url,
            ['linkedin.com', 'licdn.com', 'media.licdn.com']
          ),
          linkedin_url: sanitizeUrl(
            data.user.user_metadata?.linkedin_url,
            ['linkedin.com']
          )
        }

        let { error: profileError } = await (supabase
          .from('profiles')
          .insert(profileData as any))

        // If username collision, try with unique suffix
        if (profileError?.code === '23505') {
          console.log('⚠️ [AUTH-CALLBACK] Username collision, adding unique suffix...')
          username = `${baseUsername}_${data.user.id.slice(0, 6)}`
          const retryProfileData: ProfileInsert = {
            ...profileData,
            username
          }
          const result = await (supabase
            .from('profiles')
            .insert(retryProfileData as any))
          profileError = result.error
        }

        if (profileError) {
          console.error('❌ [AUTH-CALLBACK] Error creating profile:', profileError)
        } else {
          console.log('✅ [AUTH-CALLBACK] Profile created successfully with username:', username)
        }
      } else {
        console.log('✅ [AUTH-CALLBACK] Profile already exists')
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      const redirectUrl = isLocalEnv
        ? `${origin}${next}`
        : forwardedHost
          ? `https://${forwardedHost}${next}`
          : `${origin}${next}`

      console.log('🔀 [AUTH-CALLBACK] Redirecting user:', {
        redirectUrl,
        isLocalEnv,
        forwardedHost,
        next,
        timestamp: new Date().toISOString()
      })

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    } else {
      console.error('❌ [AUTH-CALLBACK] Error exchanging code for session:', {
        error: exchangeError,
        code: code?.substring(0, 20) + '...',
        timestamp: new Date().toISOString()
      })
    }
  }

  console.error('❌ [AUTH-CALLBACK] No code or error in callback, redirecting to error page')
  // Return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
