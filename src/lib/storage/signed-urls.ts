import { bucket } from './client'

/**
 * Generate a signed URL for secure file upload
 * Used when users need to upload files (images, documents)
 */
export async function generateUploadUrl(
  fileName: string,
  contentType: string,
  expiresIn: number = 15 * 60 * 1000 // 15 minutes default
): Promise<string> {
  const file = bucket.file(fileName)

  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + expiresIn,
    contentType,
  })

  return url
}

/**
 * Generate a signed URL for secure file download/read
 * Used to serve private files to authenticated users
 */
export async function generateDownloadUrl(
  fileName: string,
  expiresIn: number = 60 * 60 * 1000 // 1 hour default
): Promise<string> {
  const file = bucket.file(fileName)

  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + expiresIn,
  })

  return url
}

/**
 * Delete a file from Cloud Storage
 */
export async function deleteFile(fileName: string): Promise<void> {
  const file = bucket.file(fileName)
  await file.delete()
}

/**
 * Check if a file exists in Cloud Storage
 */
export async function fileExists(fileName: string): Promise<boolean> {
  const file = bucket.file(fileName)
  const [exists] = await file.exists()
  return exists
}

/**
 * Get public URL for a file (for public buckets only)
 */
export function getPublicUrl(fileName: string): string {
  return `https://storage.googleapis.com/${bucket.name}/${fileName}`
}
