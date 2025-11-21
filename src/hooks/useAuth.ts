'use client'

import { useSession, signIn, signOut } from 'next-auth/react'

/**
 * Custom hook for authentication using NextAuth
 * Replaces Supabase auth with GCP-based NextAuth
 */
export function useAuth() {
  const { data: session, status } = useSession()

  return {
    user: session?.user,
    session,
    isAuthenticated: !!session?.user,
    isLoading: status === 'loading',
    signIn: (callbackUrl?: string) => {
      // In production, go directly to LinkedIn. In dev, show all options.
      const redirectUrl = callbackUrl || '/browse'
      if (process.env.NODE_ENV === 'production') {
        signIn('linkedin', { callbackUrl: redirectUrl })
      } else {
        signIn(undefined, { callbackUrl: redirectUrl })
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
