'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { convertDocxToTiptap } from '@/lib/documents/converter'
import { uploadDocumentImage } from '@/lib/documents/storage'
import { JSONContent } from '@tiptap/core'
import { toast } from 'sonner'
import { DocumentViewer } from './DocumentViewer'

interface DocumentUploaderProps {
  agentSlug: string
  onConversionComplete: (content: JSONContent, images: string[]) => void
  onCancel?: () => void
}

export function DocumentUploader({
  agentSlug,
  onConversionComplete,
  onCancel,
}: DocumentUploaderProps) {
  const [isConverting, setIsConverting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [convertedContent, setConvertedContent] = useState<JSONContent | null>(null)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const processFile = async (file: File) => {
    setError(null)
    setIsConverting(true)
    setConvertedContent(null)

    try {
      // Validate file type
      if (!file.name.endsWith('.docx')) {
        throw new Error('Only .docx files are supported')
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File must be less than 10MB')
      }

      toast.loading('Converting document...')

      // Convert to Tiptap format
      const result = await convertDocxToTiptap(file)

      toast.dismiss()

      if (!result.success || !result.content) {
        throw new Error(result.error || 'Conversion failed')
      }

      // Show warnings if any
      if (result.warnings && result.warnings.length > 0) {
        console.warn('Conversion warnings:', result.warnings)
      }

      // Upload images if present
      const imageUrls: string[] = []
      if (result.images && result.images.length > 0) {
        toast.loading('Uploading images...')

        for (const img of result.images) {
          const blob = new Blob([img.buffer], { type: img.contentType })
          const file = new File([blob], img.filename, { type: img.contentType })

          const uploadResult = await uploadDocumentImage(agentSlug, file)
          if (uploadResult.success && uploadResult.url) {
            imageUrls.push(uploadResult.url)
          }
        }

        toast.dismiss()
      }

      setConvertedContent(result.content)
      setUploadedImages(imageUrls)
      toast.success('Document converted successfully!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to convert document'
      setError(message)
      toast.error(message)
    } finally {
      setIsConverting(false)
    }
  }

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        await processFile(files[0])
      }
    },
    [agentSlug]
  )

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await processFile(files[0])
    }
  }

  const handleConfirm = () => {
    if (convertedContent) {
      onConversionComplete(convertedContent, uploadedImages)
    }
  }

  return (
    <div className="space-y-4">
      {!convertedContent ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            {isConverting ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-gray-600">Converting document...</p>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-lg font-medium mb-2">
                    Upload a Word Document
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Drag and drop a .docx file here, or click to browse
                  </p>
                  <label htmlFor="file-upload">
                    <Button asChild variant="outline">
                      <span>
                        <FileText className="h-4 w-4 mr-2" />
                        Choose File
                      </span>
                    </Button>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".docx"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isConverting}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  Maximum file size: 10MB
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <Check className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800">
              Document converted successfully! Preview below and confirm to use this
              content.
            </p>
          </div>

          <div className="border rounded-lg p-6 bg-white max-h-96 overflow-y-auto">
            <DocumentViewer content={convertedContent} />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setConvertedContent(null)
                setUploadedImages([])
                setError(null)
              }}
            >
              Try Another File
            </Button>
            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button onClick={handleConfirm}>
              Use This Content
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
