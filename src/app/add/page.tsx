"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Upload, Linkedin, ArrowLeft, Check, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useCreateAgent } from "@/hooks/useAgents"
import { useQuery } from "@tanstack/react-query"
import { getPlatforms } from "@/lib/supabase/queries"
import { generateUniqueSlug } from "@/lib/supabase/mutations"
import { createAgentSchema, type CreateAgentInput } from "@/lib/validations/agent"
import Link from "next/link"
import dynamic from "next/dynamic"
import { JSONContent } from "@tiptap/core"

// Lazy load DocumentEditor (client-side only)
const DocumentEditor = dynamic(
  () => import('@/components/documents/DocumentEditor').then(mod => ({ default: mod.DocumentEditor })),
  { ssr: false }
)

export default function AddAgentPage() {
  const { user, loading: isLoading } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [documentationContent, setDocumentationContent] = useState<JSONContent | null>(null)
  const [documentationImages, setDocumentationImages] = useState<string[]>([])
  const router = useRouter()
  const supabase = createClient()

  // Fetch platforms from database
  const { data: platforms = [], isLoading: loadingPlatforms } = useQuery({
    queryKey: ['platforms'],
    queryFn: async () => {
      const result = await getPlatforms()
      return result
    },
  })

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<CreateAgentInput>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      platforms: [],
      tags: [],
      is_public: true,
    },
  })

  const selectedPlatforms = watch('platforms') || []

  // Create agent mutation
  const { mutate: createAgent, isPending } = useCreateAgent()

  const handleSignIn = async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        // In development, redirect to dev login page
        router.push('/dev-login')
      } else {
        // In production, use LinkedIn OAuth
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'linkedin_oidc',
          options: {
            redirectTo: `${window.location.origin}/auth/callback?redirect=/add`,
          },
        })

        if (error) {
          throw new Error(error.message)
        }
      }
    } catch (error) {
      console.error('Error logging in:', error)
      setSubmitError('Failed to sign in. Please try again.')
      toast.error('Failed to sign in')
    }
  }

  const togglePlatform = (platformId: string) => {
    const current = selectedPlatforms
    if (current.includes(platformId)) {
      setValue('platforms', current.filter(id => id !== platformId))
    } else {
      setValue('platforms', [...current, platformId])
    }
    setSubmitError(null)
  }

  const onSubmit = async (data: CreateAgentInput) => {
    setSubmitError(null)
    setSubmitSuccess(false)

    if (!user) {
      setSubmitError('You must be logged in to create an agent')
      return
    }

    try {
      // Validate platform selection
      const platformIds = data.platforms || []
      if (platformIds.length === 0) {
        setSubmitError('Please select at least one platform')
        toast.error('Please select at least one platform')
        return
      }

      // Generate unique slug from name
      const slug = await generateUniqueSlug(data.name, 'agents')

      // Prepare agent data - only include fields that have values
      const agentData: any = {
        name: data.name,
        slug: slug,
        description: data.description,
        user_id: user.id,
        is_public: true,
        // For now, both preview and full show the same content (free agents)
        // When monetization is enabled, user can set preview vs full manually
        documentation_preview: documentationContent,
        documentation_full: documentationContent,
        documentation_preview_images: documentationImages,
        documentation_full_images: documentationImages,
      }

      // Only add tags if provided
      if (data.tags && data.tags.length > 0) {
        agentData.tags = data.tags
      }

      // Only add category if provided
      if (data.category_id) {
        agentData.category_id = data.category_id
      }

      console.log('Creating agent with data:', { agentData, platformIds, userId: user.id })

      createAgent(
        { agent: agentData, platformIds },
        {
          onSuccess: (newAgent) => {
            setSubmitSuccess(true)
            toast.success('Tool created successfully!')

            // Redirect to the agent detail page after a short delay
            setTimeout(() => {
              router.push(`/agents/${newAgent.slug}`)
            }, 1500)
          },
          onError: (error: any) => {
            console.error('Error creating agent:', error)
            const errorMessage = error?.message || error?.error_description || 'Failed to create agent. Please try again.'
            setSubmitError(errorMessage)
            toast.error('Failed to create agent')
          }
        }
      )
    } catch (error: any) {
      console.error('Error in onSubmit:', error)
      setSubmitError(error.message || 'An unexpected error occurred')
      toast.error('An unexpected error occurred')
    }
  }

  // Show login prompt if not authenticated
  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Linkedin className="h-5 w-5 text-blue-600" />
              Sign In Required
            </CardTitle>
            <CardDescription>
              You must be signed in to create an agent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Please sign in with your LinkedIn account to share your AI agents with the community.
            </p>
            <Button onClick={handleSignIn} className="w-full" size="lg">
              <Linkedin className="mr-2 h-5 w-5" />
              Sign In with LinkedIn
            </Button>
            <div className="text-center">
              <Link href="/browse" className="text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="inline h-4 w-4 mr-1" />
                Back to Browse
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/browse" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Browse
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Add New Tool</h1>
        <p className="text-muted-foreground">
          Share your AI agent with the auditing community
        </p>
      </div>

      {submitSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <Check className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <p className="font-medium text-green-900">Tool created successfully!</p>
            <p className="text-sm text-green-700">Redirecting to your tool...</p>
          </div>
        </div>
      )}

      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Provide the essential details about your tool
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Agent Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Tool Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Financial Statement Analyzer"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                {...register('description')}
                placeholder="Describe what your tool does and how it helps auditors..."
                rows={4}
                className={`w-full px-3 py-2 border rounded-md resize-none ${
                  errors.description ? 'border-red-500' : 'border-input'
                }`}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* Platforms */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Platforms <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-muted-foreground">
                Select all platforms where this tool can be used
              </p>
              {loadingPlatforms ? (
                <div className="text-sm text-muted-foreground">Loading platforms...</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {platforms.map((platform) => (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => togglePlatform(platform.id)}
                      className={`p-3 border rounded-lg text-sm transition-colors ${
                        selectedPlatforms.includes(platform.id)
                          ? 'bg-purple-50 border-purple-500 text-purple-700'
                          : 'border-gray-300 hover:border-purple-300'
                      }`}
                    >
                      {platform.name}
                    </button>
                  ))}
                </div>
              )}
              {errors.platforms && (
                <p className="text-sm text-red-500">{errors.platforms.message}</p>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Documentation */}
        <Card>
          <CardHeader>
            <CardTitle>Documentation</CardTitle>
            <CardDescription>
              Write comprehensive documentation for your tool
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentEditor
              agentSlug={watch('name')?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'new-agent'}
              initialContent={documentationContent || undefined}
              onContentChange={(content) => setDocumentationContent(content)}
              onSave={(content, images) => {
                setDocumentationContent(content)
                setDocumentationImages(images)
              }}
              autoSave={false}
              placeholder="Write your tool's documentation here. Include setup instructions, usage examples, and any important notes..."
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isSubmitting || isPending || submitSuccess}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            size="lg"
          >
            {isSubmitting || isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creating...
              </>
            ) : submitSuccess ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Created!
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Add Tool
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
