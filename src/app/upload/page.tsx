"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Upload, Loader2, AlertCircle } from "lucide-react"

export default function UploadPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [categories, setCategories] = useState<any[]>([])
  const [platforms, setPlatforms] = useState<any[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    documentation: "",
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && user !== undefined) {
      router.push("/")
    }
  }, [isAuthenticated, user, router])

  // Load categories and platforms
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, platformsRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/platforms"),
        ])

        if (categoriesRes.ok) {
          const data = await categoriesRes.json()
          setCategories(data)
        }

        if (platformsRes.ok) {
          const data = await platformsRes.json()
          setPlatforms(data)
        }
      } catch (err) {
        console.error("Error fetching data:", err)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name || !formData.description) {
      setError("Name and description are required")
      return
    }

    if (selectedPlatforms.length === 0) {
      setError("Please select at least one platform")
      return
    }

    setLoading(true)

    try {
      // Generate slug from name
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")

      const response = await fetch("/api/tools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          slug,
          description: formData.description,
          documentation: formData.documentation,
          categoryId: selectedCategoryId || undefined,
          platformIds: selectedPlatforms,
          is_public: true, // Always public per requirements
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create tool")
      }

      // Redirect to the new tool page
      router.push(`/tools/${data.slug}`)
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    )
  }

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryId(prev => prev === categoryId ? "" : categoryId)
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Upload New Tool</CardTitle>
          <CardDescription>
            Share your AI tool with the auditing community. Provide clear documentation
            so others can recreate and benefit from your work.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Tool Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Tool Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Financial Statement Analyzer"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Briefly describe what your tool does and its key benefits..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={loading}
                rows={4}
              />
            </div>

            {/* Category - Badge Style */}
            <div className="space-y-2">
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category.id}
                    variant={selectedCategoryId === category.id ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      selectedCategoryId === category.id
                        ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                        : "hover:bg-muted"
                    } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => !loading && toggleCategory(category.id)}
                  >
                    {category.name}
                    {category.toolCount !== undefined && (
                      <span className="ml-1 opacity-60">({category.toolCount})</span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Platforms - Badge Style */}
            <div className="space-y-2">
              <Label>Platforms * (Select all that apply)</Label>
              <div className="flex flex-wrap gap-2">
                {platforms.map((platform) => (
                  <Badge
                    key={platform.id}
                    variant={selectedPlatforms.includes(platform.id) ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      selectedPlatforms.includes(platform.id)
                        ? "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200"
                        : "hover:bg-muted"
                    } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => !loading && togglePlatform(platform.id)}
                  >
                    {platform.name}
                    {platform.toolCount !== undefined && (
                      <span className="ml-1 opacity-60">({platform.toolCount})</span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Documentation - Rich Text Editor */}
            <div className="space-y-2">
              <Label htmlFor="documentation">
                Documentation (Instructions for Recreation)
              </Label>
              <RichTextEditor
                content={formData.documentation}
                onChange={(content) => setFormData({ ...formData, documentation: content })}
                placeholder="Provide step-by-step instructions, configuration details, prompts, tables, images, and any other information needed to recreate this tool..."
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                You can format text, add images, create tables, and more. Be as detailed as possible.
              </p>
            </div>

            {/* Submit Button - with color */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Tool...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Create Tool
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}