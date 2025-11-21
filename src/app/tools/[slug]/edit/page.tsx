'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTool, useUpdateTool, usePlatforms, useCategories } from '@/hooks/useTools'

export default function EditToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { data: tool, isLoading: loadingTool } = useTool(resolvedParams.slug)
  const { data: platforms = [], isLoading: loadingPlatforms } = usePlatforms()
  const { data: categories = [], isLoading: loadingCategories } = useCategories()
  const updateTool = useUpdateTool(resolvedParams.slug)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    documentation: '',
    categoryId: '',
    platformIds: [] as string[],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Populate form when tool loads
  useEffect(() => {
    if (tool) {
      setFormData({
        name: tool.name,
        description: tool.description,
        documentation: tool.documentation || '',
        categoryId: tool.categoryId || '',
        platformIds: tool.tool_platforms?.map((tp) => tp.platformId) || [],
      })
    }
  }, [tool])

  const togglePlatform = (platformId: string) => {
    setFormData(prev => ({
      ...prev,
      platformIds: prev.platformIds.includes(platformId)
        ? prev.platformIds.filter(id => id !== platformId)
        : [...prev.platformIds, platformId],
    }))
    setErrors(prev => ({ ...prev, platformIds: '' }))
  }

  const toggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categoryId: prev.categoryId === categoryId ? '' : categoryId,
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Name is required'
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

    updateTool.mutate(
      {
        name: formData.name,
        description: formData.description,
        documentation: formData.documentation || undefined,
        categoryId: formData.categoryId || undefined,
        platformIds: formData.platformIds,
        is_public: true, // Always public per requirements
      },
      {
        onSuccess: (data) => {
          toast.success('Tool updated successfully!')
          router.push(`/tools/${data.slug}`)
        },
        onError: (error: any) => {
          toast.error(error.message || 'Failed to update tool')
        },
      }
    )
  }

  // Check authorization
  if (loadingTool) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !tool) {
    return (
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need to be signed in and own this tool to edit it
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/tools/${resolvedParams.slug}`}>
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tool
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (tool.userId !== user?.id) {
    return (
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Not Authorized</CardTitle>
            <CardDescription>
              You don't have permission to edit this tool
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/tools/${resolvedParams.slug}`}>
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tool
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href={`/tools/${resolvedParams.slug}`}>
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tool
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Edit Tool</CardTitle>
          <CardDescription>
            Update your tool information
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
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Financial Statement Analyzer"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what your tool does, how it works, and its key benefits..."
                rows={4}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
            </div>

            {/* Category - Badge Style */}
            <div>
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {loadingCategories ? (
                  <p className="text-sm text-muted-foreground">Loading categories...</p>
                ) : (
                  categories.map((category) => (
                    <Badge
                      key={category.id}
                      variant={formData.categoryId === category.id ? "default" : "outline"}
                      className={`cursor-pointer transition-all ${
                        formData.categoryId === category.id
                          ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => toggleCategory(category.id)}
                    >
                      {category.name}
                      {category.toolCount !== undefined && (
                        <span className="ml-1 opacity-60">({category.toolCount})</span>
                      )}
                    </Badge>
                  ))
                )}
              </div>
            </div>

            {/* Platforms - Badge Style */}
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
                      className={`cursor-pointer transition-all ${
                        formData.platformIds.includes(platform.id)
                          ? "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => togglePlatform(platform.id)}
                    >
                      {platform.name}
                      {platform.toolCount !== undefined && (
                        <span className="ml-1 opacity-60">({platform.toolCount})</span>
                      )}
                    </Badge>
                  ))
                )}
              </div>
              {errors.platformIds && <p className="text-sm text-red-500 mt-1">{errors.platformIds}</p>}
            </div>

            {/* Documentation - Rich Text Editor */}
            <div>
              <Label htmlFor="documentation">Documentation</Label>
              <RichTextEditor
                content={formData.documentation}
                onChange={(content) => setFormData({ ...formData, documentation: content })}
                placeholder="Provide detailed documentation, setup steps, configuration examples, tables, images, or any other information to help others recreate this tool..."
                disabled={updateTool.isPending}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Include setup steps, configuration examples, API keys needed, or any other information to help others recreate this tool on their platform
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={updateTool.isPending}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
              >
                {updateTool.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Tool...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Tool
                  </>
                )}
              </Button>
              <Link href={`/tools/${resolvedParams.slug}`}>
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