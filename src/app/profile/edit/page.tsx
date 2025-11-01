"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations/agent"
import { updateProfile } from "@/lib/supabase/mutations"
import Link from "next/link"

export default function EditProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()

        // Handle auth errors or no user
        if (error || !user) {
          console.warn('Auth error in profile edit:', error?.message || 'No user')
          router.push('/')
          return
        }

        setUser(user)

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          toast.error('Failed to load profile')
          setIsLoading(false)
          return
        }

        if (profileData) {
          setProfile(profileData)
          // Set form values
          setValue('username', (profileData as any).username || '')
          setValue('full_name', (profileData as any).full_name || '')
          setValue('bio', (profileData as any).bio || '')
          setValue('website', (profileData as any).website || '')
          setValue('github_url', (profileData as any).github_url || '')
          setValue('linkedin_url', (profileData as any).linkedin_url || '')
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Failed to fetch profile:', error)
        toast.error('Failed to load profile')
        router.push('/')
      }
    }

    fetchProfile()
  }, [supabase, router, setValue])

  const onSubmit = async (data: UpdateProfileInput) => {
    if (!user) return

    setIsSaving(true)
    try {
      await updateProfile(user.id, data)
      toast.success('Profile updated successfully!')
      router.push(`/profile/${data.username || user.id}`)
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error?.message || 'Failed to update profile')
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link href={`/profile/${profile?.username || user?.id}`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">Edit Profile</h1>
        <p className="text-gray-600">
          Update your public profile information
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Your public profile information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('username')}
                placeholder="johndoe"
                className={errors.username ? 'border-red-500' : ''}
              />
              {errors.username && (
                <p className="text-sm text-red-600 mt-1">{errors.username.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Your unique username. Can contain letters, numbers, underscores, and hyphens.
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Full Name
              </label>
              <Input
                {...register('full_name')}
                placeholder="John Doe"
                className={errors.full_name ? 'border-red-500' : ''}
              />
              {errors.full_name && (
                <p className="text-sm text-red-600 mt-1">{errors.full_name.message}</p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Bio
              </label>
              <textarea
                {...register('bio')}
                className={`w-full min-h-[100px] px-3 py-2 border rounded-md text-sm ${
                  errors.bio ? 'border-red-500' : ''
                }`}
                placeholder="Tell us about yourself..."
              />
              {errors.bio && (
                <p className="text-sm text-red-600 mt-1">{errors.bio.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Maximum 500 characters
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
            <CardDescription>
              Connect your social profiles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Website */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Website
              </label>
              <Input
                {...register('website')}
                type="url"
                placeholder="https://yourwebsite.com"
                className={errors.website ? 'border-red-500' : ''}
              />
              {errors.website && (
                <p className="text-sm text-red-600 mt-1">{errors.website.message}</p>
              )}
            </div>

            {/* GitHub */}
            <div>
              <label className="block text-sm font-medium mb-2">
                GitHub URL
              </label>
              <Input
                {...register('github_url')}
                type="url"
                placeholder="https://github.com/username"
                className={errors.github_url ? 'border-red-500' : ''}
              />
              {errors.github_url && (
                <p className="text-sm text-red-600 mt-1">{errors.github_url.message}</p>
              )}
            </div>

            {/* LinkedIn */}
            <div>
              <label className="block text-sm font-medium mb-2">
                LinkedIn URL
              </label>
              <Input
                {...register('linkedin_url')}
                type="url"
                placeholder="https://linkedin.com/in/username"
                className={errors.linkedin_url ? 'border-red-500' : ''}
              />
              {errors.linkedin_url && (
                <p className="text-sm text-red-600 mt-1">{errors.linkedin_url.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link href={`/profile/${profile?.username || user?.id}`}>
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
