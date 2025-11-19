"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useCreateTool, usePlatforms, useCategories } from "@/hooks/useTools"
import Link from "next/link"

export default function AddToolPage() {
  const { user, isAuthenticated, signIn } = useAuth()
  const router = useRouter()
  const createTool = useCreateTool()

  const { data: platforms = [], isLoading: loadingPlatforms } = usePlatforms()
  const { data: categories = [], isLoading: loadingCategories } = useCategories()

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    documentation: '',
    categoryId: '',
    platformIds: [] as string[],
    is_public: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    }))
    setErrors(prev => ({ ...prev, name: '' }))
  }

  const togglePlatform = (platformId: string) => {
    setFormData(prev => ({
      ...prev,
      platformIds: prev.platformIds.includes(platformId)
        ? prev.platformIds.filter(id => id !== platformId)
        : [...prev.platformIds, platformId],
    }))
    setErrors(prev => ({ ...prev, platformIds: '' }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.slug.trim()) newErrors.slug = 'Slug is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (formData.platformIds.length === 0) newErrors.platformIds = 'Select at least one platform'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the form errors')
      return
    }

    createTool.mutate(
      {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        documentation: formData.documentation || undefined,
        categoryId: formData.categoryId || undefined,
        platformIds: formData.platformIds,
        is_public: formData.is_public,
      },
      {
        onSuccess: (data) => {
          toast.success('Tool created successfully!')
          router.push(`/tools/${data.slug}`)
        },
        onError: (error: any) => {
          toast.error(error.message || 'Failed to create tool')
        },
      }
    )
  }

  // Show sign-in prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              You need to be signed in to create a tool
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => signIn()} className="w-full">
              Sign In
            </Button>
            <Link href="/">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/browse">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Browse
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create New Tool</CardTitle>
          <CardDescription>
            Share your AI tool with the auditing community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <Label htmlFor="name">Tool Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Financial Statement Analyzer"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Slug */}
            <div>
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="financial-statement-analyzer"
                className={errors.slug ? 'border-red-500' : ''}
              />
              <p className="text-sm text-muted-foreground mt-1">
                URL: /tools/{formData.slug || 'your-tool-slug'}
              </p>
              {errors.slug && <p className="text-sm text-red-500 mt-1">{errors.slug}</p>}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what your tool does, how it works, and how to use it..."
                rows={6}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
            </div>

            {/* Documentation */}
            <div>
              <Label htmlFor="documentation">Documentation</Label>
              <Textarea
                id="documentation"
                value={formData.documentation}
                onChange={(e) => setFormData({ ...formData, documentation: e.target.value })}
                placeholder="Provide detailed documentation, instructions, or configuration details to help others recreate your tool..."
                rows={10}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Include setup steps, configuration examples, API keys needed, or any other information to help others recreate this tool on their platform
              </p>
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                disabled={loadingCategories}
              >
                <option value="">Select a category...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Platforms */}
            <div>
              <Label>Platforms * <span className="text-sm font-normal text-muted-foreground">(Select at least one)</span></Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {loadingPlatforms ? (
                  <p className="text-sm text-muted-foreground">Loading platforms...</p>
                ) : (
                  platforms.map((platform) => (
                    <Badge
                      key={platform.id}
                      variant={formData.platformIds.includes(platform.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => togglePlatform(platform.id)}
                    >
                      {platform.name}
                    </Badge>
                  ))
                )}
              </div>
              {errors.platformIds && <p className="text-sm text-red-500 mt-1">{errors.platformIds}</p>}
            </div>

            {/* Visibility */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_public"
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_public" className="font-normal cursor-pointer">
                Make this tool public (visible to everyone)
              </Label>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={createTool.isPending}
                className="flex-1"
              >
                {createTool.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Tool
              </Button>
              <Link href="/browse">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
