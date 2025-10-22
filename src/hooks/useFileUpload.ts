import { useState, useCallback } from 'react'
import { uploadFile, uploadFiles, validateFile, generateUniqueFileName } from '@/lib/supabase/storage'
import type { UploadOptions, FileUploadResult } from '@/lib/supabase/storage'

export interface UseFileUploadOptions extends UploadOptions {
  maxSize?: number
  allowedTypes?: string[]
  generateUniqueName?: boolean
  onProgress?: (progress: number) => void
  onSuccess?: (result: FileUploadResult) => void
  onError?: (error: string) => void
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const {
    maxSize,
    allowedTypes,
    generateUniqueName = true,
    onProgress,
    onSuccess,
    onError,
    ...uploadOptions
  } = options

  const upload = useCallback(
    async (file: File) => {
      setError(null)
      setIsUploading(true)
      setUploadProgress(0)

      try {
        // Validate file
        const validation = validateFile(file, { maxSize, allowedTypes })
        if (!validation.valid) {
          throw new Error(validation.error)
        }

        // Generate unique filename if requested
        let fileName = uploadOptions.fileName || file.name
        if (generateUniqueName && !uploadOptions.fileName) {
          fileName = generateUniqueFileName(file.name)
        }

        // Upload file
        const result = await uploadFile(file, {
          ...uploadOptions,
          fileName,
        })

        if (!result.success) {
          throw new Error(result.error || 'Upload failed')
        }

        setUploadedFiles(prev => [...prev, result])
        setUploadProgress(100)
        onProgress?.(100)
        onSuccess?.(result)

        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed'
        setError(errorMessage)
        onError?.(errorMessage)
        throw err
      } finally {
        setIsUploading(false)
      }
    },
    [maxSize, allowedTypes, generateUniqueName, uploadOptions, onProgress, onSuccess, onError]
  )

  const uploadMultiple = useCallback(
    async (files: FileList | File[]) => {
      setError(null)
      setIsUploading(true)
      setUploadProgress(0)

      const fileArray = Array.from(files)
      const results: FileUploadResult[] = []
      const errors: string[] = []

      try {
        // Validate all files first
        for (const file of fileArray) {
          const validation = validateFile(file, { maxSize, allowedTypes })
          if (!validation.valid) {
            errors.push(`${file.name}: ${validation.error}`)
          }
        }

        if (errors.length > 0) {
          throw new Error(errors.join('\n'))
        }

        // Upload files
        for (let i = 0; i < fileArray.length; i++) {
          const file = fileArray[i]
          const progress = Math.round(((i + 1) / fileArray.length) * 100)

          setUploadProgress(progress)
          onProgress?.(progress)

          let fileName = file.name
          if (generateUniqueName) {
            fileName = generateUniqueFileName(file.name)
          }

          const result = await uploadFile(file, {
            ...uploadOptions,
            fileName,
          })

          results.push(result)

          if (result.success) {
            onSuccess?.(result)
          } else {
            errors.push(`${file.name}: ${result.error}`)
          }
        }

        setUploadedFiles(prev => [...prev, ...results.filter(r => r.success)])

        if (errors.length > 0) {
          throw new Error(errors.join('\n'))
        }

        return results
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed'
        setError(errorMessage)
        onError?.(errorMessage)
        throw err
      } finally {
        setIsUploading(false)
        setUploadProgress(100)
      }
    },
    [maxSize, allowedTypes, generateUniqueName, uploadOptions, onProgress, onSuccess, onError]
  )

  const reset = useCallback(() => {
    setIsUploading(false)
    setUploadProgress(0)
    setUploadedFiles([])
    setError(null)
  }, [])

  const removeUploadedFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  return {
    upload,
    uploadMultiple,
    isUploading,
    uploadProgress,
    uploadedFiles,
    error,
    reset,
    removeUploadedFile,
  }
}