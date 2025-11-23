import { getServerSession } from 'next-auth'
import { authOptions } from './config'
import { prisma } from '@/lib/prisma/client'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return false
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { is_admin: true }
  })

  return user?.is_admin || false
}

/**
 * Require admin access for a page (use in Server Components)
 */
export async function requireAdmin() {
  const admin = await isAdmin()

  if (!admin) {
    redirect('/')
  }
}

/**
 * Check admin access for API routes
 */
export async function requireAdminApi() {
  const admin = await isAdmin()

  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 403 }
    )
  }

  return null // Continue with request
}