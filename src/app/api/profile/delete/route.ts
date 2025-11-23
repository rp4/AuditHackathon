import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'

export async function DELETE(request: Request) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Start a transaction to soft delete user and their tools
    await prisma.$transaction(async (tx) => {
      // Soft delete all user's tools
      await tx.tool.updateMany({
        where: {
          userId: userId,
          isDeleted: false // Only update tools that aren't already deleted
        },
        data: {
          isDeleted: true,
          deletedAt: new Date()
        }
      })

      // Soft delete the user
      await tx.user.update({
        where: {
          id: userId
        },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          // Clear sensitive data while preserving the record
          email: `deleted_${userId}@deleted.com`,
          name: 'Deleted User',
          username: null, // Free up the username for reuse
          image: null,
          bio: null,
          linkedin_url: null,
          website: null,
          company: null,
          role: null
        }
      })

      // Delete all active sessions for this user to log them out
      await tx.session.deleteMany({
        where: {
          userId: userId
        }
      })
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Your profile and all associated tools have been deleted successfully'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting profile:', error)
    return NextResponse.json(
      { error: 'Failed to delete profile' },
      { status: 500 }
    )
  }
}