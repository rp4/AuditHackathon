import { createClient, STORAGE_BUCKET } from './client'

// Get singleton instance
const supabase = createClient()

export interface UploadOptions {
  folder?: string // Optional folder path within the bucket
  fileName?: string // Optional custom filename
  upsert?: boolean // Whether to overwrite existing files
  contentType?: string // MIME type of the file
}

export interface FileUploadResult {
  success: boolean
  path?: string
  publicUrl?: string
  error?: string
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  options: UploadOptions & {
    validate?: boolean
    maxSize?: number
    allowedTypes?: string[]
  } = {}
): Promise<FileUploadResult> {
  try {
    const {
      folder = 'uploads',
      fileName = `${Date.now()}-${file.name}`,
      upsert = false,
      contentType = file.type,
      validate = true,
      maxSize,
      allowedTypes
    } = options

    // Validate file before upload
    if (validate) {
      const validation = await validateFile(file, {
        maxSize,
        allowedTypes,
        checkMagicNumbers: true
      })

      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        }
      }
    }

    // Construct the full path
    const filePath = `${folder}/${fileName}`

    // Upload the file
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        contentType,
        upsert,
        cacheControl: '3600',
      })

    if (error) {
      console.error('Upload error:', error)
      return { success: false, error: error.message }
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path)

    return {
      success: true,
      path: data.path,
      publicUrl,
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
  files: FileList | File[],
  options: UploadOptions = {}
): Promise<FileUploadResult[]> {
  const fileArray = Array.from(files)
  return Promise.all(fileArray.map(file => uploadFile(file, options)))
}

/**
 * Delete a file from storage
 */
export async function deleteFile(path: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path])

    if (error) {
      console.error('Delete error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Download a file from storage
 */
export async function downloadFile(path: string): Promise<Blob | null> {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(path)

    if (error) {
      console.error('Download error:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Download error:', error)
    return null
  }
}

/**
 * Get a signed URL for temporary access to a private file
 */
export async function getSignedUrl(
  path: string,
  expiresIn: number = 3600
): Promise<{ url: string | null; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(path, expiresIn)

    if (error) {
      console.error('Signed URL error:', error)
      return { url: null, error: error.message }
    }

    return { url: data.signedUrl }
  } catch (error) {
    console.error('Signed URL error:', error)
    return {
      url: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * List files in a folder
 */
export async function listFiles(folder: string = '') {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(folder, {
        limit: 100,
        offset: 0,
      })

    if (error) {
      console.error('List files error:', error)
      return { files: [], error: error.message }
    }

    return { files: data || [], error: null }
  } catch (error) {
    console.error('List files error:', error)
    return {
      files: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Validate file before upload with magic number checking
 */
export async function validateFile(
  file: File,
  options: {
    maxSize?: number // in bytes
    allowedTypes?: string[]
    checkMagicNumbers?: boolean // Verify file type using magic numbers (default: true)
  } = {}
): Promise<{ valid: boolean; error?: string }> {
  const { maxSize = 10 * 1024 * 1024, allowedTypes, checkMagicNumbers = true } = options

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`,
    }
  }

  // Empty file check
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
    }
  }

  // Check file type if specified
  if (allowedTypes && allowedTypes.length > 0) {
    const fileType = file.type.toLowerCase()

    // First check MIME type (client-provided)
    const mimeTypeAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const baseType = type.slice(0, -2)
        return fileType.startsWith(baseType)
      }
      return fileType === type
    })

    if (!mimeTypeAllowed) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      }
    }

    // Then verify with magic numbers (server-side verification)
    if (checkMagicNumbers) {
      try {
        const { fileTypeFromBuffer } = await import('file-type')
        const buffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(buffer)

        // Detect actual file type from content
        const detectedType = await fileTypeFromBuffer(uint8Array)

        // Some files (like text files, JSON) may not have magic numbers
        // Only validate if we can detect the type
        if (detectedType) {
          const detectedMime = detectedType.mime

          // Verify detected type matches allowed types
          const magicNumberMatches = allowedTypes.some(type => {
            if (type.endsWith('/*')) {
              const baseType = type.slice(0, -2)
              return detectedMime.startsWith(baseType)
            }
            return detectedMime === type
          })

          if (!magicNumberMatches) {
            return {
              valid: false,
              error: `File content does not match declared type. Detected: ${detectedMime}, Declared: ${file.type}`,
            }
          }
        }
      } catch (error) {
        console.error('Magic number validation error:', error)
        // Don't fail validation if magic number check fails
        // Just log the error and continue
      }
    }
  }

  // Special checks for specific file types
  if (file.type === 'image/svg+xml') {
    try {
      const text = await file.text()
      // Check for potentially malicious content in SVG
      if (/<script/i.test(text) || /on\w+=/i.test(text) || /<iframe/i.test(text)) {
        return {
          valid: false,
          error: 'SVG file contains potentially malicious content (scripts or event handlers)',
        }
      }
    } catch (error) {
      return {
        valid: false,
        error: 'Unable to read SVG file content',
      }
    }
  }

  // Check for executable files by extension
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.msi', '.app', '.dmg']
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  if (dangerousExtensions.includes(extension)) {
    return {
      valid: false,
      error: 'Executable files are not allowed',
    }
  }

  return { valid: true }
}

/**
 * Generate a unique filename
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
  const sanitizedName = nameWithoutExt.replace(/[^a-z0-9]/gi, '_').toLowerCase()

  return `${sanitizedName}_${timestamp}_${randomString}.${extension}`
}

