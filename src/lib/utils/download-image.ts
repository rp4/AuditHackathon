/**
 * Utility functions for downloading and processing remote images
 */

export interface DownloadImageResult {
  blob: Blob
  extension: string
  mimeType: string
}

/**
 * Downloads an image from a URL and returns it as a Blob
 * @param url - The URL of the image to download
 * @param timeoutMs - Request timeout in milliseconds (default: 10000)
 * @returns Object containing blob, extension, and mime type
 */
export async function downloadImage(
  url: string,
  timeoutMs: number = 10000
): Promise<DownloadImageResult | null> {
  try {
    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    // Fetch the image
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'OpenAuditSwarms/1.0',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`Failed to download image: ${response.status} ${response.statusText}`)
      return null
    }

    // Get the blob
    const blob = await response.blob()

    // Validate it's an image
    if (!blob.type.startsWith('image/')) {
      console.error(`Downloaded file is not an image: ${blob.type}`)
      return null
    }

    // Get file extension from mime type
    const mimeType = blob.type
    const extension = getExtensionFromMimeType(mimeType)

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (blob.size > maxSize) {
      console.error(`Image too large: ${blob.size} bytes (max: ${maxSize})`)
      return null
    }

    return {
      blob,
      extension,
      mimeType,
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('Image download timeout')
    } else {
      console.error('Error downloading image:', error.message)
    }
    return null
  }
}

/**
 * Gets file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  }

  return mimeMap[mimeType.toLowerCase()] || 'jpg'
}

/**
 * Validates if a file is a supported image type
 */
export function isValidImageType(mimeType: string): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  return validTypes.includes(mimeType.toLowerCase())
}

/**
 * Validates image file size
 */
export function isValidImageSize(sizeInBytes: number, maxSizeInMB: number = 5): boolean {
  const maxBytes = maxSizeInMB * 1024 * 1024
  return sizeInBytes <= maxBytes
}
