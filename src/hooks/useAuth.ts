'use client'

import { useSession, signIn, signOut } from 'next-auth/react'

/**
 * Custom hook for authentication using NextAuth
 * Replaces Supabase auth with GCP-based NextAuth
 */
export function useAuth() {
  const { data: session, status } = useSession()

  console.log('[useAuth] Session status:', status, 'Session:', session)

  return {
    user: session?.user,
    session,
    isAuthenticated: !!session?.user,
    isLoading: status === 'loading',
    signIn: (callbackUrl?: string) => {
      console.log('[useAuth.signIn] Called with callbackUrl:', callbackUrl)
      console.log('[useAuth.signIn] NODE_ENV:', process.env.NODE_ENV)
      // In production, go directly to LinkedIn. In dev, show all options.
      const redirectUrl = callbackUrl || '/browse'
      console.log('[useAuth.signIn] Redirect URL:', redirectUrl)
      if (process.env.NODE_ENV === 'production') {
        console.log('[useAuth.signIn] Calling signIn with linkedin provider')
        signIn('linkedin', { callbackUrl: redirectUrl })
          .then((result) => console.log('[useAuth.signIn] signIn result:', result))
          .catch((error) => console.error('[useAuth.signIn] signIn error:', error))
      } else {
        console.log('[useAuth.signIn] Calling signIn with undefined provider (dev mode)')
        signIn(undefined, { callbackUrl: redirectUrl })
          .then((result) => console.log('[useAuth.signIn] signIn result:', result))
          .catch((error) => console.error('[useAuth.signIn] signIn error:', error))
      }
    },
    signOut: () => signOut({ callbackUrl: '/' }),
  }
}

/**
 * Hook to require authentication (redirects if not authenticated)
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()

  if (!isLoading && !isAuthenticated) {
    // In production, go directly to LinkedIn. In dev, show all options.
    if (process.env.NODE_ENV === 'production') {
      signIn('linkedin')
    } else {
      signIn()
    }
  }

  return { isAuthenticated, isLoading }
}
