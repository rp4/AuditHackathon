import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { bucket } from '@/lib/storage/client'
import { prisma } from '@/lib/prisma/client'
import { logger } from '@/lib/utils/logger'

// POST /api/upload/profile-image - Upload profile image directly
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Validate content type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid content type. Only JPEG, PNG, WebP, and GIF are allowed' },
        { status: 400 }
      )
    }

    // Generate unique file name with user ID
    const fileExtension = file.name.split('.').pop()
    const uniqueFileName = `profile-images/${session.user.id}/${Date.now()}.${fileExtension}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to GCS
    const gcsFile = bucket.file(uniqueFileName)
    await gcsFile.save(buffer, {
      contentType: file.type,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    })

    // Generate public URL
    const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${uniqueFileName}`

    // Update user's image URL in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: publicUrl },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    })

    return NextResponse.json({
      publicUrl,
      user: updatedUser,
    })
  } catch (error) {
    logger.serverError(error instanceof Error ? error : String(error), { endpoint: 'POST /api/upload/profile-image' })
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}
