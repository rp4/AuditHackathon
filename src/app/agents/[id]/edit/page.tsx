"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAgent, useUpdateAgent } from "@/hooks/useAgents"
import { useQuery } from "@tanstack/react-query"
import { getPlatforms } from "@/lib/supabase/queries"
import { createAgentSchema, type CreateAgentInput } from "@/lib/validations/agent"
import Link from "next/link"
import dynamic from "next/dynamic"
import { JSONContent } from "@tiptap/core"
import { notFound } from "next/navigation"

// Lazy load DocumentEditor (client-side only)
const DocumentEditor = dynamic(
  () => import('@/components/documents/DocumentEditor').then(mod => ({ default: mod.DocumentEditor })),
  { ssr: false }
)

export default function EditAgentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: slug } = use(params)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [documentationContent, setDocumentationContent] = useState<JSONContent | null>(null)
  const [documentationImages, setDocumentationImages] = useState<string[]>([])
  const router = useRouter()
  const supabase = createClient()

  // Fetch current user
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        setIsLoading(false)
      } catch (error) {
        console.error('Error checking user:', error)
        setIsLoading(false)
      }
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Fetch agent data
  const { data: agent, isLoading: loadingAgent, error: agentError } = useAgent(slug, user?.id)

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
    reset,
  } = useForm<CreateAgentInput>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      platforms: [],
      tags: [],
      is_public: true,
    },
  })

  const selectedPlatforms = watch('platforms') || []

  // Update agent mutation
  const { mutate: updateAgent, isPending } = useUpdateAgent()

  // Populate form when agent data loads
  useEffect(() => {
    if (agent) {
      // Check if user is the owner
      if (user && agent.user_id !== user.id) {
        toast.error('You do not have permission to edit this agent')
        router.push(`/agents/${slug}`)
        return
      }

      // Set form values
      reset({
        name: agent.name,
        description: agent.description,
        platforms: agent.agent_platforms?.map((ap: any) => ap.platform_id) || [],
        tags: agent.tags || [],
        category_id: agent.category_id || undefined,
        is_public: agent.is_public,
      })

      // Set documentation content
      setDocumentationContent(agent.documentation_full || agent.documentation_preview || null)
      setDocumentationImages(agent.documentation_full_images || agent.documentation_preview_images || [])
    }
  }, [agent, user, reset, router, slug])

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

    if (!user || !agent) {
      setSubmitError('You must be logged in to edit an agent')
      return
    }

    if (agent.user_id !== user.id) {
      setSubmitError('You do not have permission to edit this agent')
      return
    }

    try {
      // Extract platforms from form data
      const platformIds = data.platforms || []

      // Prepare agent updates - only include fields that changed
      const agentUpdates: any = {
        name: data.name,
        description: data.description,
        documentation_preview: documentationContent,
        documentation_full: documentationContent,
        documentation_preview_images: documentationImages,
        documentation_full_images: documentationImages,
      }

      // Only add tags if provided
      if (data.tags && data.tags.length > 0) {
        agentUpdates.tags = data.tags
      }

      // Only add category if provided
      if (data.category_id) {
        agentUpdates.category_id = data.category_id
      }

      updateAgent(
        {
          agentId: agent.id,
          updates: agentUpdates,
          platformIds
        },
        {
          onSuccess: (updatedAgent) => {
            toast.success('Agent updated successfully!')
            // Redirect to the agent detail page
            setTimeout(() => {
              router.push(`/agents/${updatedAgent.slug}`)
            }, 1000)
          },
          onError: (error: any) => {
            console.error('Error updating agent:', error)
            setSubmitError(error.message || 'Failed to update agent. Please try again.')
            toast.error('Failed to update agent')
          }
        }
      )
    } catch (error: any) {
      console.error('Error in onSubmit:', error)
      setSubmitError(error.message || 'An unexpected error occurred')
    }
  }

  // Show loading state
  if (isLoading || loadingAgent) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    )
  }

  // Show error if agent not found or user not authorized
  if (agentError || !agent) {
    return notFound()
  }

  if (!user) {
    router.push(`/agents/${slug}`)
    return null
  }

  if (agent.user_id !== user.id) {
    toast.error('You do not have permission to edit this agent')
    router.push(`/agents/${slug}`)
    return null
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/agents/${slug}`} className="text-sm text-muted-foreground hover:text-primary inline-flex items-center">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Agent
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Agent</h1>
        <p className="text-muted-foreground">
          Update your agent's information and documentation
        </p>
      </div>

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
              Update the essential details about your agent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Agent Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Agent Name <span className="text-red-500">*</span>
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
                placeholder="Describe what your agent does and how it helps auditors..."
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
                Select all platforms where this agent can be used
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
              Update your agent's documentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentEditor
              agentSlug={agent.slug}
              initialContent={documentationContent || undefined}
              onContentChange={(content) => setDocumentationContent(content)}
              onSave={(content, images) => {
                setDocumentationContent(content)
                setDocumentationImages(images)
              }}
              autoSave={false}
              placeholder="Write your agent's documentation here. Include setup instructions, usage examples, and any important notes..."
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/agents/${slug}`)}
            className="flex-1"
            size="lg"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isPending}
            className="flex-1"
            size="lg"
          >
            {isSubmitting || isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Updating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update Agent
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
