'use client'

import { useSession, signIn, signOut } from 'next-auth/react'

/**
 * Custom hook for authentication using NextAuth
 */
export function useAuth() {
  const { data: session, status } = useSession()

  return {
    user: session?.user,
    session,
    isAuthenticated: !!session?.user,
    isLoading: status === 'loading',
    signIn: (callbackUrl?: string) => {
      const redirectUrl = `${window.location.origin}${callbackUrl || '/browse'}`
      if (process.env.NODE_ENV === 'production') {
        signIn('linkedin', { callbackUrl: redirectUrl })
      } else {
        signIn(undefined, { callbackUrl: redirectUrl })
      }
    },
    signOut: () => signOut({ callbackUrl: `${window.location.origin}/` }),
  }
}
