import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database-generated'

type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/'

  // Log any errors from the OAuth provider
  if (error) {
    console.error('OAuth provider error:', {
      error,
      error_description,
      full_url: request.url
    })
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  if (code) {
    const supabase = await createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError && data.user) {
      console.log('Successfully exchanged code for session')

      // Ensure profile exists - create if missing
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existingProfile) {
        console.log('Profile not found, creating one...')

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
        const profileData: ProfileInsert = {
          id: data.user.id,
          username,
          full_name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || null,
          avatar_url: data.user.user_metadata?.picture || data.user.user_metadata?.avatar_url || null,
          linkedin_url: data.user.user_metadata?.linkedin_url || null
        }

        let { error: profileError } = await (supabase
          .from('profiles')
          .insert(profileData as any))

        // If username collision, try with unique suffix
        if (profileError?.code === '23505') {
          console.log('Username collision, adding unique suffix...')
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
          console.error('Error creating profile:', profileError)
        } else {
          console.log('Profile created successfully with username:', username)
        }
      } else {
        console.log('Profile already exists')
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    } else {
      console.error('Error exchanging code for session:', {
        error: exchangeError,
        code: code?.substring(0, 20) + '...'
      })
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
