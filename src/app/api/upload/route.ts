import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { bucket } from '@/lib/storage/client'
import { logger } from '@/lib/utils/logger'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the file from the request
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const fileName = `documentation/${session.user.id}/${randomUUID()}.${fileExtension}`

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Google Cloud Storage
    const gcsFile = bucket.file(fileName)
    await gcsFile.save(buffer, {
      contentType: file.type,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    })

    // Get the public URL (bucket already has uniform public access)
    const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${fileName}`

    return NextResponse.json({
      url: publicUrl,
      fileName: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    logger.serverError(error instanceof Error ? error : String(error), { endpoint: 'POST /api/upload' })
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}