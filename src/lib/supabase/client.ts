import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database-generated'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Singleton instance to ensure auth state is shared across the app
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

// Create a browser client for client components (singleton pattern)
export function createClient() {
  // Only use singleton in browser environment
  if (typeof window === 'undefined') {
    // For SSR/Edge, create new instance (needed for OAuth callback)
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  }

  // Return existing instance if available (browser only)
  if (browserClient) {
    return browserClient
  }

  // Create new instance with proper cookie handling
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
      storageKey: 'supabase-auth-token',
    },
  })

  return browserClient
}

// Export singleton for direct use (lazy initialized on first access)
let _supabase: ReturnType<typeof createBrowserClient<Database>> | null = null
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient<Database>>, {
  get(_target, prop) {
    if (!_supabase && typeof window !== 'undefined') {
      _supabase = createClient()
    }
    return _supabase?.[prop as keyof typeof _supabase]
  }
})

// Export storage bucket name
export const STORAGE_BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'agents-storage'