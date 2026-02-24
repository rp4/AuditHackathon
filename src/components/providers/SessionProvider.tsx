'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

/**
 * NextAuth Session Provider wrapper
 * Wraps the entire app to provide authentication context
 *
 * refetchInterval keeps the session alive during long copilot conversations
 * where the user stays on the same page without triggering navigation or focus events.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  return (
    <NextAuthSessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
      {children}
    </NextAuthSessionProvider>
  )
}
