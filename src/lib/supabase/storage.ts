import { supabase, STORAGE_BUCKET } from './client'

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

// ============================================
// UNIVER DOCUMENT STORAGE HELPERS
// ============================================

/**
 * Download a Univer document from storage
 * @param documentPath - The path to the document in storage (e.g., "agent-slug/documentation.univer")
 * @returns The parsed Univer document object or null
 */
export async function downloadUniverDocument(documentPath: string): Promise<any | null> {
  if (!documentPath) return null

  try {
    const { data, error } = await supabase.storage
      .from('documentation')
      .download(documentPath)

    if (error) {
      console.error('Error downloading document:', error)
      return null
    }

    // Parse the blob as JSON
    const text = await data.text()
    return JSON.parse(text)
  } catch (error) {
    console.error('Error parsing document:', error)
    return null
  }
}

/**
 * Get a signed URL for downloading a Univer document
 * @param documentPath - The path to the document in storage
 * @param expiresIn - Time in seconds until the URL expires (default: 3600 = 1 hour)
 * @returns The signed URL or null
 */
export async function getDocumentDownloadUrl(
  documentPath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  if (!documentPath) return null

  try {
    const { data, error } = await supabase.storage
      .from('documentation')
      .createSignedUrl(documentPath, expiresIn)

    if (error) {
      console.error('Error creating signed URL:', error)
      return null
    }

    return data.signedUrl
  } catch (error) {
    console.error('Error getting download URL:', error)
    return null
  }
}

/**
 * Upload a Univer document to storage
 * @param slug - The agent slug to use as folder name
 * @param documentContent - The Univer document object
 * @returns The storage path or null if failed
 */
export async function uploadUniverDocument(
  slug: string,
  documentContent: any
): Promise<string | null> {
  const documentPath = `${slug}/documentation.univer`

  try {
    const documentBlob = new Blob([JSON.stringify(documentContent)], {
      type: 'application/json',
    })

    const { data, error } = await supabase.storage
      .from('documentation')
      .upload(documentPath, documentBlob, {
        contentType: 'application/json',
        upsert: true,
      })

    if (error) {
      console.error('Error uploading document:', error)
      return null
    }

    return documentPath
  } catch (error) {
    console.error('Error uploading document:', error)
    return null
  }
}

/**
 * Delete a Univer document from storage
 * @param documentPath - The path to the document in storage
 * @returns True if successful, false otherwise
 */
export async function deleteUniverDocument(documentPath: string): Promise<boolean> {
  if (!documentPath) return false

  try {
    const { error } = await supabase.storage
      .from('documentation')
      .remove([documentPath])

    if (error) {
      console.error('Error deleting document:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting document:', error)
    return false
  }
}

/**
 * Trigger a browser download of a Univer document
 * @param documentPath - The path to the document in storage
 * @param filename - The filename for the download (default: "documentation.univer")
 */
export async function triggerDocumentDownload(
  documentPath: string,
  filename: string = 'documentation.univer'
): Promise<void> {
  const url = await getDocumentDownloadUrl(documentPath)

  if (!url) {
    throw new Error('Failed to get download URL')
  }

  // Create a temporary anchor element to trigger download
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// ============================================
// IMAGE STORAGE HELPERS
// ============================================

/**
 * Upload an image for an agent to Supabase Storage
 * @param agentSlug - The agent slug to organize images by
 * @param imageBlob - The image blob to upload
 * @param imageId - Unique image identifier (UUID)
 * @returns The public URL of the uploaded image or null if failed
 */
export async function uploadAgentImage(
  agentSlug: string,
  imageBlob: Blob,
  imageId: string
): Promise<string | null> {
  try {
    // Determine file extension from blob type
    const extension = imageBlob.type.split('/')[1] || 'png'
    const imagePath = `${agentSlug}/images/${imageId}.${extension}`

    const { data, error } = await supabase.storage
      .from('agent-images')
      .upload(imagePath, imageBlob, {
        contentType: imageBlob.type,
        upsert: true,
        cacheControl: '31536000', // Cache for 1 year
      })

    if (error) {
      console.error('Error uploading image:', error)
      return null
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('agent-images')
      .getPublicUrl(data.path)

    return publicUrl
  } catch (error) {
    console.error('Error uploading image:', error)
    return null
  }
}

/**
 * Delete an image from storage
 * @param agentSlug - The agent slug
 * @param imageId - The image identifier
 * @returns True if successful, false otherwise
 */
export async function deleteAgentImage(
  agentSlug: string,
  imageId: string
): Promise<boolean> {
  try {
    // Try common extensions
    const extensions = ['png', 'jpg', 'jpeg', 'gif', 'webp']
    const paths = extensions.map(ext => `${agentSlug}/images/${imageId}.${ext}`)

    const { error } = await supabase.storage
      .from('agent-images')
      .remove(paths)

    if (error) {
      console.error('Error deleting image:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting image:', error)
    return false
  }
}

/**
 * Delete all images for an agent
 * @param agentSlug - The agent slug
 * @returns True if successful, false otherwise
 */
export async function deleteAgentImages(agentSlug: string): Promise<boolean> {
  try {
    // List all files in the agent's folder
    const { data: files, error: listError } = await supabase.storage
      .from('agent-images')
      .list(`${agentSlug}/images`)

    if (listError || !files) {
      console.error('Error listing images:', listError)
      return false
    }

    if (files.length === 0) {
      return true // No images to delete
    }

    // Delete all files
    const paths = files.map(file => `${agentSlug}/images/${file.name}`)
    const { error } = await supabase.storage
      .from('agent-images')
      .remove(paths)

    if (error) {
      console.error('Error deleting images:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting agent images:', error)
    return false
  }
}

/**
 * Get a public URL for an agent image
 * @param agentSlug - The agent slug
 * @param imageId - The image identifier with extension
 * @returns The public URL
 */
export function getAgentImageUrl(agentSlug: string, imageId: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from('agent-images')
    .getPublicUrl(`${agentSlug}/images/${imageId}`)

  return publicUrl
}