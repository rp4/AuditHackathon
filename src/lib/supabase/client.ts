import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database-generated'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create a browser client for client components
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        if (typeof document === 'undefined') return []
        return document.cookie.split(';').map(cookie => {
          const [name, value] = cookie.trim().split('=')
          return { name, value: decodeURIComponent(value) }
        }).filter(cookie => cookie.name)
      },
      setAll(cookies) {
        if (typeof document === 'undefined') return
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
  })
}

// Legacy export for backwards compatibility - lazy initialized to avoid SSR issues
let _supabase: ReturnType<typeof createClient> | null = null
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    if (!_supabase) {
      _supabase = createClient()
    }
    return _supabase[prop as keyof typeof _supabase]
  }
})

// Export storage bucket name
export const STORAGE_BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'agents-storage'