"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X, Camera, Loader2 } from "lucide-react"
import { uploadAvatar, deleteAvatar } from "@/lib/supabase/mutations"
import { toast } from "sonner"

interface AvatarUploadProps {
  userId: string
  currentAvatarUrl: string | null
  username: string
  onAvatarChange?: (newAvatarUrl: string | null) => void
}

export function AvatarUpload({ userId, currentAvatarUrl, username, onAvatarChange }: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.')
      return
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 5MB.')
      return
    }

    setSelectedFile(file)

    // Create preview URL
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first')
      return
    }

    setIsUploading(true)
    try {
      const newAvatarUrl = await uploadAvatar(userId, selectedFile)
      toast.success('Avatar updated successfully!')
      setPreviewUrl(newAvatarUrl)
      setSelectedFile(null)
      onAvatarChange?.(newAvatarUrl)
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast.error(error.message || 'Failed to upload avatar')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!currentAvatarUrl) return

    if (!confirm('Are you sure you want to delete your avatar?')) {
      return
    }

    setIsUploading(true)
    try {
      await deleteAvatar(userId)
      toast.success('Avatar deleted successfully')
      setPreviewUrl(null)
      setSelectedFile(null)
      onAvatarChange?.(null)
    } catch (error: any) {
      console.error('Error deleting avatar:', error)
      toast.error(error.message || 'Failed to delete avatar')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setPreviewUrl(currentAvatarUrl)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Picture</CardTitle>
        <CardDescription>
          Upload a profile picture or use your initials
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current/Preview Avatar */}
        <div className="flex items-center gap-6">
          <div className="relative">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt={username}
                width={120}
                height={120}
                className="rounded-full border-4 border-purple-200 object-cover"
              />
            ) : (
              <div className="w-30 h-30 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-purple-200">
                {username.charAt(0).toUpperCase()}
              </div>
            )}
            {selectedFile && (
              <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full px-2 py-1 text-xs font-semibold">
                New
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            {currentAvatarUrl && !selectedFile && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isUploading}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-2" />
                Remove Picture
              </Button>
            )}
            {selectedFile && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Save Picture
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isUploading}
          />

          <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />

          <p className="text-sm text-gray-600 mb-2">
            Drag and drop your image here, or click to browse
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            Choose File
          </Button>

          <p className="text-xs text-gray-500 mt-4">
            JPEG, PNG, WebP, or GIF (max 5MB)
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
