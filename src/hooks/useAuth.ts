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
    signIn,
    signOut: () => signOut({ callbackUrl: '/' }),
  }
}

/**
 * Hook to require authentication (redirects if not authenticated)
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()

  if (!isLoading && !isAuthenticated) {
    signIn()
  }

  return { isAuthenticated, isLoading }
}
