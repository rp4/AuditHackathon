import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma/client'

export async function DELETE() {
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

    // Start a transaction to soft delete user and their tools, and hard delete their interactions
    await prisma.$transaction(async (tx) => {
      // Hard delete all user's ratings
      await tx.rating.deleteMany({
        where: {
          userId: userId
        }
      })

      // Hard delete all user's comments
      await tx.comment.deleteMany({
        where: {
          userId: userId
        }
      })

      // Hard delete all user's favorites
      await tx.favorite.deleteMany({
        where: {
          userId: userId
        }
      })

      // Hard delete all user's downloads
      await tx.download.deleteMany({
        where: {
          userId: userId
        }
      })

      // Hard delete all collection tools first (junction table)
      const userCollections = await tx.collection.findMany({
        where: { userId: userId },
        select: { id: true }
      })

      if (userCollections.length > 0) {
        await tx.collectionTool.deleteMany({
          where: {
            collectionId: {
              in: userCollections.map(c => c.id)
            }
          }
        })
      }

      // Hard delete all user's collections
      await tx.collection.deleteMany({
        where: {
          userId: userId
        }
      })

      // Note: We keep OAuth Account records so user can sign back in

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

      // Soft delete the user - keep all data intact, just mark as deleted
      await tx.user.update({
        where: {
          id: userId
        },
        data: {
          isDeleted: true,
          deletedAt: new Date()
          // Keep everything else: email, name, username, image, profile fields
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