'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Loader2, Upload, Trash2, Linkedin } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUserProfile } from '@/hooks/useTools'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { signOut } from 'next-auth/react'

export default function EditProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { data: profile, isLoading: loadingProfile } = useUserProfile(resolvedParams.id)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isDeletingProfile, setIsDeletingProfile] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    website: '',
    linkedin_url: '',
    linkedin_visible: false,
    company: '',
    role: '',
    image: '',
  })

  // Check if the current user owns this profile
  // Handle both ID and username comparisons
  const isOwnProfile = currentUser && profile && (
    currentUser.id === resolvedParams.id ||
    currentUser.id === profile.id ||
    (profile.username && currentUser.username === profile.username)
  )

  // Redirect if not own profile
  if (!loadingProfile && profile && !isOwnProfile) {
    router.push(`/profile/${resolvedParams.id}`)
    return null
  }

  // Set form data when profile loads
  if (profile && !formData.name && !formData.email) {
    setFormData({
      name: profile.name || '',
      email: profile.email || '',
      bio: profile.bio || '',
      website: profile.website || '',
      linkedin_url: profile.linkedin_url || '',
      linkedin_visible: profile.linkedin_visible || false,
      company: profile.company || '',
      role: profile.role || '',
      image: profile.image || '',
    })
    setImagePreview(profile.image || null)
  }

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    setIsUploadingImage(true)

    try {
      // Create FormData and append file
      const formData = new FormData()
      formData.append('file', file)

      // Upload file directly to API
      const uploadRes = await fetch('/api/upload/profile-image', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        throw new Error('Failed to upload image')
      }

      const { publicUrl } = await uploadRes.json()

      // Update local state
      setFormData(prev => ({ ...prev, image: publicUrl }))
      setImagePreview(publicUrl)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        throw new Error('Failed to update profile')
      }

      router.push(`/profile/${resolvedParams.id}`)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProfile = async () => {
    setIsDeletingProfile(true)

    try {
      const res = await fetch('/api/profile/delete', {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete profile')
      }

      // Sign out the user and redirect to home page
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Error deleting profile:', error)
      alert('Failed to delete profile. Please try again.')
      setIsDeletingProfile(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/30 to-transparent">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/profile/${profile?.username || resolvedParams.id}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Edit Profile</h1>
          <p className="text-muted-foreground">
            Update your profile information and settings
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Your profile information is visible to other users on the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Image */}
              <div>
                <Label htmlFor="image">Profile Image</Label>
                <div className="flex items-center gap-4 mt-2">
                  {imagePreview || profile?.image ? (
                    <img
                      src={imagePreview || profile.image}
                      alt={profile.name || profile.email}
                      className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-md"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-2xl font-bold text-white border-4 border-white shadow-md">
                      {(formData.name || formData.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploadingImage}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      disabled={isUploadingImage}
                    >
                      {isUploadingImage ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload New Image
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  JPG, PNG, WebP, or GIF (max 5MB). Image will be uploaded to Google Cloud Storage.
                </p>
              </div>

              {/* Name */}
              <div>
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your display name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-2"
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-2"
                  disabled
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="mt-2 min-h-[100px]"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {formData.bio.length}/500 characters
                </p>
              </div>

              {/* Role */}
              <div>
                <Label htmlFor="role">Role/Title</Label>
                <Input
                  id="role"
                  type="text"
                  placeholder="e.g., Senior Auditor, Financial Analyst"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="mt-2"
                />
              </div>

              {/* Company */}
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  type="text"
                  placeholder="Your company name"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="mt-2"
                />
              </div>

              {/* Website */}
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="mt-2"
                />
              </div>

              {/* LinkedIn Profile */}
              {formData.linkedin_url && (
                <div>
                  <Label>LinkedIn Profile</Label>
                  <div className="mt-2 space-y-2">
                    <Input
                      type="url"
                      value={formData.linkedin_url}
                      disabled
                      className="bg-muted"
                    />
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="linkedin_visibility"
                          checked={formData.linkedin_visible}
                          onChange={() => setFormData({ ...formData, linkedin_visible: true })}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm">Public</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="linkedin_visibility"
                          checked={!formData.linkedin_visible}
                          onChange={() => setFormData({ ...formData, linkedin_visible: false })}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm">Private</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delete Profile Section */}
          <Card className="mb-6 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Permanent actions that cannot be undone
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Delete Profile</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Delete your account and all associated data. You can rejoin anytime by signing in again.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isDeletingProfile}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Profile
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-md bg-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-2xl font-bold text-red-600">
                        Delete Account?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-4 pt-2">
                        <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
                          <p className="text-sm font-bold text-amber-900 mb-2">
                            ⚠️ Your account will be deactivated
                          </p>
                          <p className="text-sm font-medium text-amber-900">
                            You can reactivate your account anytime by signing in again with LinkedIn.
                          </p>
                        </div>

                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-gray-900">
                            The following will be permanently deleted:
                          </p>
                          <ul className="space-y-2 text-sm text-gray-900">
                            <li className="flex items-start gap-2">
                              <span className="text-red-600 font-bold mt-0.5">•</span>
                              <span className="font-medium">All tools you've created</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-600 font-bold mt-0.5">•</span>
                              <span className="font-medium">Your favorites, ratings, and comments</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-600 font-bold mt-0.5">•</span>
                              <span className="font-medium">All collections you've created</span>
                            </li>
                          </ul>
                        </div>

                        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3">
                          <p className="text-sm font-medium text-blue-900">
                            💡 Your profile information will be preserved. When you sign in again, you'll start fresh with no tools or activity.
                          </p>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-2">
                      <AlertDialogCancel disabled={isDeletingProfile} className="flex-1 sm:flex-none">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteProfile}
                        disabled={isDeletingProfile}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600 flex-1 sm:flex-none"
                      >
                        {isDeletingProfile ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          'Yes, Delete My Account'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Link href={`/profile/${profile?.username || resolvedParams.id}`}>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
