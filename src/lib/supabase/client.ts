import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database-generated'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Singleton instance - initialized lazily in browser only
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Get or create the singleton Supabase client
 * CRITICAL: This ensures all parts of the app share the same auth state
 */
export function createClient() {
  // SSR/Build time: create temporary instance
  if (typeof window === 'undefined') {
    console.log('🔧 [SUPABASE-CLIENT] Creating server-side client instance')
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  }

  // Browser: Use singleton pattern
  if (browserClient) {
    console.log('♻️ [SUPABASE-CLIENT] Returning existing singleton client')
    return browserClient
  }

  console.log('🆕 [SUPABASE-CLIENT] Creating new singleton browser client')
  // Create singleton with proper auth persistence
  browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const cookies = document.cookie.split(';').map(cookie => {
          const [name, value] = cookie.trim().split('=')
          return { name, value: decodeURIComponent(value) }
        }).filter(cookie => cookie.name)

        // Log Supabase auth cookies for debugging
        const authCookies = cookies.filter(c => c.name.includes('supabase') || c.name.includes('sb-'))
        if (authCookies.length > 0) {
          console.log('🍪 [SUPABASE-CLIENT] Auth cookies found:', authCookies.map(c => c.name))
        }

        return cookies
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => {
          const cookieOptions = {
            sameSite: 'lax' as const,
            secure: process.env.NODE_ENV === 'production',
            ...options,
          }
          const expires = cookieOptions.maxAge
            ? new Date(Date.now() + cookieOptions.maxAge * 1000).toUTCString()
            : ''
          document.cookie = `${name}=${encodeURIComponent(value)}; path=${cookieOptions.path || '/'}; ${expires ? `expires=${expires};` : ''} ${cookieOptions.sameSite ? `SameSite=${cookieOptions.sameSite};` : ''} ${cookieOptions.secure ? 'Secure;' : ''}`

          // Log cookie setting for debugging
          if (name.includes('supabase') || name.includes('sb-')) {
            console.log('🍪 [SUPABASE-CLIENT] Setting auth cookie:', name)
          }
        })
      },
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  console.log('✅ [SUPABASE-CLIENT] Singleton client created successfully')
  return browserClient
}

// Export storage bucket name
export const STORAGE_BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'agents-storage'