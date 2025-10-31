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
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  }

  // Browser: Use singleton pattern
  if (browserClient) {
    return browserClient
  }

  // Create singleton with proper auth persistence
  browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return document.cookie.split(';').map(cookie => {
          const [name, value] = cookie.trim().split('=')
          return { name, value: decodeURIComponent(value) }
        }).filter(cookie => cookie.name)
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
        })
      },
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return browserClient
}

// Export storage bucket name
export const STORAGE_BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'agents-storage'