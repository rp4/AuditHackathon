/**
 * Document Storage Utilities
 * Handles image uploads and management for agent documentation
 */

import { createClient } from '@/lib/supabase/client'

const DOCUMENTATION_BUCKET = 'agents-storage'

export interface ImageUploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

/**
 * Upload an image for agent documentation
 * @param agentSlug - The agent slug (used for folder organization)
 * @param file - The image file to upload
 * @returns Upload result with public URL
 */
export async function uploadDocumentImage(
  agentSlug: string,
  file: File
): Promise<ImageUploadResult> {
  try {
    const supabase = createClient()

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${agentSlug}/documentation/images/${fileName}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(DOCUMENTATION_BUCKET)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error('Error uploading image:', error)
      return { success: false, error: error.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(DOCUMENTATION_BUCKET)
      .getPublicUrl(data.path)

    return {
      success: true,
      url: publicUrl,
      path: data.path,
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Delete an image from documentation storage
 * @param imagePath - The full path to the image (e.g., "agent-slug/documentation/images/file.png")
 * @returns Success status
 */
export async function deleteDocumentImage(imagePath: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase.storage
      .from(DOCUMENTATION_BUCKET)
      .remove([imagePath])

    if (error) {
      console.error('Error deleting image:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Delete error:', error)
    return false
  }
}

/**
 * Delete multiple images from documentation storage
 * @param imagePaths - Array of image paths to delete
 * @returns Success status
 */
export async function deleteDocumentImages(imagePaths: string[]): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase.storage
      .from(DOCUMENTATION_BUCKET)
      .remove(imagePaths)

    if (error) {
      console.error('Error deleting images:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Delete error:', error)
    return false
  }
}

/**
 * Delete all images for an agent
 * @param agentSlug - The agent slug
 * @returns Success status
 */
export async function deleteAgentDocumentImages(agentSlug: string): Promise<boolean> {
  try {
    const supabase = createClient()

    // List all files in the agent's folder
    const { data: files, error: listError } = await supabase.storage
      .from(DOCUMENTATION_BUCKET)
      .list(`${agentSlug}/documentation/images`)

    if (listError) {
      console.error('Error listing images:', listError)
      return false
    }

    if (!files || files.length === 0) {
      return true // No images to delete
    }

    // Delete all files
    const paths = files.map(file => `${agentSlug}/documentation/images/${file.name}`)
    return await deleteDocumentImages(paths)
  } catch (error) {
    console.error('Error deleting agent images:', error)
    return false
  }
}

/**
 * Extract image URLs from Tiptap JSON content
 * @param content - Tiptap JSON content
 * @returns Array of image URLs found in the content
 */
export function extractImageUrls(content: any): string[] {
  if (!content) return []

  const urls: string[] = []

  function traverse(node: any) {
    if (node.type === 'image' && node.attrs?.src) {
      urls.push(node.attrs.src)
    }

    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse)
    }
  }

  traverse(content)
  return urls
}

/**
 * Clean up orphaned images (images no longer referenced in documentation)
 * @param agentSlug - The agent slug
 * @param currentImageUrls - Array of URLs currently used in documentation
 * @returns Number of images deleted
 */
export async function cleanupOrphanedImages(
  agentSlug: string,
  currentImageUrls: string[]
): Promise<number> {
  try {
    const supabase = createClient()

    // List all images for this agent
    const { data: files, error: listError } = await supabase.storage
      .from(DOCUMENTATION_BUCKET)
      .list(`${agentSlug}/documentation/images`)

    if (listError || !files) {
      console.error('Error listing images:', listError)
      return 0
    }

    // Get public URLs for all files
    const { data: { publicUrl: baseUrl } } = supabase.storage
      .from(DOCUMENTATION_BUCKET)
      .getPublicUrl(`${agentSlug}/documentation/images`)

    // Find orphaned files
    const orphanedPaths: string[] = []
    for (const file of files) {
      const fileUrl = `${baseUrl}/${file.name}`
      if (!currentImageUrls.includes(fileUrl)) {
        orphanedPaths.push(`${agentSlug}/documentation/images/${file.name}`)
      }
    }

    if (orphanedPaths.length === 0) {
      return 0
    }

    // Delete orphaned images
    const success = await deleteDocumentImages(orphanedPaths)
    return success ? orphanedPaths.length : 0
  } catch (error) {
    console.error('Error cleaning up images:', error)
    return 0
  }
}

/**
 * Get storage usage for an agent's documentation
 * @param agentSlug - The agent slug
 * @returns Total size in bytes
 */
export async function getDocumentStorageUsage(agentSlug: string): Promise<number> {
  try {
    const supabase = createClient()

    const { data: files, error } = await supabase.storage
      .from(DOCUMENTATION_BUCKET)
      .list(`${agentSlug}/documentation/images`)

    if (error || !files) {
      return 0
    }

    return files.reduce((total, file) => total + (file.metadata?.size || 0), 0)
  } catch (error) {
    console.error('Error getting storage usage:', error)
    return 0
  }
}
