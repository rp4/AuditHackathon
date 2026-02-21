import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { z } from 'zod'

/**
 * Require authentication for an API route.
 * Returns the session and userId, or a 401 NextResponse.
 */
export async function requireAuth(): Promise<
  { userId: string; session: any } | NextResponse
> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  return { userId: session.user.id, session }
}

/**
 * Handle API errors consistently.
 * Handles Zod validation errors and generic errors.
 */
export function handleApiError(error: unknown, context: string): NextResponse {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Validation error', details: error.issues },
      { status: 400 }
    )
  }
  console.error(`Error in ${context}:`, error)
  return NextResponse.json(
    { error: `Failed to ${context}` },
    { status: 500 }
  )
}
