import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth/config'

/**
 * Authentication middleware for API routes
 * Ensures user is authenticated before proceeding
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  return {
    authenticated: true,
    session,
    userId: session.user.id
  }
}

/**
 * Optional authentication middleware
 * Returns session if authenticated, null otherwise
 */
export async function optionalAuth() {
  const session = await getServerSession(authOptions)

  return {
    authenticated: !!session?.user?.id,
    session: session || null,
    userId: session?.user?.id || null
  }
}