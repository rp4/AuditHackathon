'use client'

import React, { useCallback, useRef, useState } from 'react'
import { useFileUpload } from '@/hooks/useFileUpload'
import type { UseFileUploadOptions } from '@/hooks/useFileUpload'

interface FileUploadProps extends UseFileUploadOptions {
  accept?: string
  multiple?: boolean
  className?: string
  disabled?: boolean
  children?: React.ReactNode
  onFilesSelected?: (files: FileList) => void
}

export function FileUpload({
  accept,
  multiple = false,
  className = '',
  disabled = false,
  children,
  onFilesSelected,
  ...uploadOptions
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const {
    upload,
    uploadMultiple,
    isUploading,
    uploadProgress,
    uploadedFiles,
    error,
    reset,
  } = useFileUpload(uploadOptions)

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return

      onFilesSelected?.(files)

      if (multiple) {
        await uploadMultiple(files)
      } else {
        await upload(files[0])
      }
    },
    [multiple, upload, uploadMultiple, onFilesSelected]
  )

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(event.target.files)
    },
    [handleFileSelect]
  )

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setIsDragging(false)

      if (disabled || isUploading) return

      const files = event.dataTransfer.files
      handleFileSelect(files)
    },
    [disabled, isUploading, handleFileSelect]
  )

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6
          transition-colors cursor-pointer
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {children || (
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
            </p>
            {accept && (
              <p className="text-xs text-gray-500 mt-1">
                {accept}
              </p>
            )}
          </div>
        )}
      </div>

      {isUploading && (
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Uploaded Files:
          </h4>
          <ul className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-md"
              >
                <span className="text-sm text-green-700 truncate">
                  {file.path?.split('/').pop()}
                </span>
                {file.publicUrl && (
                  <a
                    href={file.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline ml-2"
                  >
                    View
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Specialized component for agent file uploads
export function AgentFileUpload({
  agentId,
  userId,
  onUploadComplete,
  ...props
}: FileUploadProps & {
  agentId?: string
  userId: string
  onUploadComplete?: (files: any[]) => void
}) {
  const folder = agentId
    ? `agents/${agentId}`
    : `users/${userId}/temp`

  return (
    <FileUpload
      {...props}
      folder={folder}
      allowedTypes={[
        'application/json', // JSON configs
        'text/plain', // Text files
        'application/pdf', // Documentation
        'text/markdown', // Markdown files
        'application/zip', // Zip archives
        'image/*', // Screenshots
      ]}
      maxSize={50 * 1024 * 1024} // 50MB limit
      onSuccess={(result) => {
        props.onSuccess?.(result)
        if (result.success && onUploadComplete) {
          onUploadComplete([result])
        }
      }}
    >
      <div className="text-center py-4">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="mt-2 text-sm text-gray-600">
          Upload agent configuration files
        </p>
        <p className="text-xs text-gray-500 mt-1">
          JSON, PDF, MD, TXT, ZIP (Max 50MB)
        </p>
      </div>
    </FileUpload>
  )
}