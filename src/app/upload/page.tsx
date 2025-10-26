"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Upload, Linkedin, ArrowLeft, Check, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useCreateAgent } from "@/hooks/useAgents"
import { useQuery } from "@tanstack/react-query"
import { getPlatforms } from "@/lib/supabase/queries"
import { createAgentSchema, type CreateAgentInput } from "@/lib/validations/agent"
import Link from "next/link"
import { DocumentEditor, type DocumentEditorRef } from "@/components/ui/DocumentEditor"
import { uploadUniverDocument, deleteUniverDocument } from "@/lib/supabase/storage"

export default function UploadPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const documentEditorRef = useRef<DocumentEditorRef>(null)
  const router = useRouter()
  const supabase = createClient()

  // Fetch platforms from database
  const { data: platforms = [], isLoading: loadingPlatforms, error: platformsError } = useQuery({
    queryKey: ['platforms'],
    queryFn: async () => {
      console.log('🔍 Fetching platforms...')
      try {
        const result = await getPlatforms()
        console.log('✅ Platforms loaded:', result?.length || 0, 'items')
        return result
      } catch (error) {
        console.error('❌ Error fetching platforms:', error)
        throw error
      }
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
  const selectedTags = watch('tags') || []

  // Create agent mutation
  const { mutate: createAgent, isPending } = useCreateAgent()

  useEffect(() => {
    const checkUser = async () => {
      console.log('👤 Checking user authentication...')
      try {
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
          console.error('❌ Error getting user:', error)
        }

        if (user) {
          console.log('✅ User authenticated:', user.id)
        } else {
          console.log('⚠️ No user found')
        }

        setUser(user)
        setIsLoading(false)
      } catch (error) {
        console.error('❌ Exception in checkUser:', error)
        setIsLoading(false)
      }
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔄 Auth state changed:', _event, session?.user?.id || 'no user')
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/upload`,
      },
    })

    if (error) {
      console.error('Error logging in with LinkedIn:', error.message)
      setSubmitError('Failed to sign in with LinkedIn. Please try again.')
      toast.error('Failed to sign in with LinkedIn')
    }
  }

  const togglePlatform = (platformId: string) => {
    const current = selectedPlatforms
    if (current.includes(platformId)) {
      setValue('platforms', current.filter(id => id !== platformId))
    } else {
      if (current.length >= 5) {
        setSubmitError('You can select a maximum of 5 platforms')
        return
      }
      setValue('platforms', [...current, platformId])
    }
    setSubmitError(null)
  }

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase()
    if (!trimmed) return

    if (selectedTags.length >= 10) {
      setSubmitError('You can add a maximum of 10 tags')
      return
    }

    if (!selectedTags.includes(trimmed)) {
      setValue('tags', [...selectedTags, trimmed])
    }
    setSubmitError(null)
  }

  const removeTag = (tag: string) => {
    setValue('tags', selectedTags.filter(t => t !== tag))
  }

  const onSubmit = async (data: CreateAgentInput) => {
    if (!user) {
      setSubmitError('You must be signed in to upload an agent')
      return
    }

    // Check if user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile check error:', profileError)
      setSubmitError('Your profile is not set up yet. Please try signing out and signing in again.')
      return
    }

    // Get document content from Univer editor
    const documentContent = documentEditorRef.current?.getContent()
    if (!documentContent) {
      setSubmitError('Please add documentation for your agent')
      return
    }

    setSubmitError(null)
    setSubmitSuccess(false)

    // Generate slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    try {
      // Upload Univer document to storage bucket using helper function
      console.log('📤 Uploading document to storage...')

      const documentPath = await uploadUniverDocument(slug, documentContent)

      if (!documentPath) {
        setSubmitError('Failed to upload documentation. Please try again.')
        toast.error('Failed to upload documentation')
        return
      }

      console.log('✅ Document uploaded successfully:', documentPath)

      // Prepare agent data with document file URL
      const agentData = {
        user_id: user.id,
        name: data.name,
        description: data.description,
        slug,
        markdown_file_url: documentPath, // Store the path for later retrieval
        tags: data.tags,
        is_public: data.is_public ?? true,
        instructions: data.instructions,
        configuration: data.configuration,
        sample_inputs: data.sample_inputs,
        sample_outputs: data.sample_outputs,
        prerequisites: data.prerequisites,
        estimated_tokens: data.estimated_tokens,
        estimated_cost: data.estimated_cost,
      }

      createAgent(
        { agent: agentData, platformIds: data.platforms },
        {
          onSuccess: (createdAgent: any) => {
            setSubmitSuccess(true)
            toast.success('Agent created successfully! Redirecting...')
            setTimeout(() => {
              router.push(`/agents/${createdAgent.slug}`)
            }, 1500)
          },
          onError: async (error: any) => {
            console.error('❌ Error creating agent:', error)

            // Cleanup: Delete the uploaded document if agent creation failed
            await deleteUniverDocument(documentPath)

            const errorMessage = error.message || 'Failed to create agent. Please try again.'
            setSubmitError(errorMessage)
            toast.error(errorMessage)
          },
        }
      )
    } catch (error: any) {
      console.error('❌ Exception during upload:', error)
      setSubmitError(error.message || 'An unexpected error occurred')
      toast.error('An unexpected error occurred')
    }
  }

  // Debug: Log loading states
  useEffect(() => {
    console.log('📊 Loading states:', {
      isLoading,
      loadingPlatforms,
      platformsError: platformsError?.message,
      platformsCount: platforms?.length,
    })
  }, [isLoading, loadingPlatforms, platformsError, platforms])

  // Loading state
  if (isLoading || loadingPlatforms) {
    const loadingStates = {
      user: isLoading ? '⏳ Loading...' : '✅ Loaded',
      platforms: loadingPlatforms ? '⏳ Loading...' : platformsError ? '❌ Error' : '✅ Loaded',
    }

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading upload form...</p>
            <div className="mt-4 text-sm text-gray-500 space-y-1">
              <div>{loadingStates.user} User authentication</div>
              <div>{loadingStates.platforms} Platforms ({platforms?.length || 0})</div>
            </div>
            {platformsError && (
              <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-lg text-sm">
                <p className="font-semibold">Error loading data:</p>
                <p>Platforms: {platformsError.message}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Check if platforms are empty
  if (!loadingPlatforms && platforms.length === 0) {
    console.warn('⚠️ Missing data:', {
      platforms: platforms.length,
    })

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Database Setup Required</CardTitle>
              <CardDescription>
                The database tables are missing data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                <p className="mb-2">The following data is missing:</p>
                <ul className="list-disc list-inside space-y-1">
                  {platforms.length === 0 && <li>Platforms (0 found)</li>}
                </ul>
              </div>
              <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
                <p className="font-semibold mb-2">To fix this:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Run the database schema: <code className="bg-blue-100 px-1 py-0.5 rounded">supabase/schema.sql</code></li>
                  <li>This will create tables and seed data</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
              <Link href="/browse">
                <Button variant="outline" className="w-full">
                  Go to Browse Page
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Sign-in prompt
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Sign In Required</CardTitle>
              <CardDescription>
                You need to be signed in to upload an agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-sm text-gray-600 mb-4">
                Join the community to share your AI agents with auditors worldwide
              </div>
              <Button
                onClick={handleSignIn}
                className="w-full h-12 bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold"
              >
                <Linkedin className="h-5 w-5 mr-2" />
                Continue with LinkedIn
              </Button>
              <p className="text-xs text-center text-gray-500">
                You'll be redirected back to this page after signing in
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Success message
  if (submitSuccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Agent Created Successfully!</h3>
                <p className="text-sm text-gray-500">
                  Redirecting to your agent page...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold mb-2">Upload AI Agent</h1>
        <p className="text-gray-600">
          Share your AI agent with the audit community
        </p>
      </div>

      {/* Error Alert */}
      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-red-800">Error</h4>
            <p className="text-sm text-red-700 mt-1">{submitError}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Provide essential details about your agent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Agent Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Agent Name <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('name')}
                placeholder="e.g., Financial Statement Analyzer"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Short Description <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('description')}
                className={`w-full min-h-[100px] px-3 py-2 border rounded-md text-sm ${
                  errors.description ? 'border-red-500' : ''
                }`}
                placeholder="Brief description of what your agent does (10-500 characters)..."
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                This will appear in search results and previews.
              </p>
            </div>

            {/* Platforms */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Platforms <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {platforms.map((platform) => {
                  const isSelected = selectedPlatforms.includes(platform.id)
                  return (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => togglePlatform(platform.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-sm border-purple-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {platform.name}
                    </button>
                  )
                })}
              </div>
              {errors.platforms && (
                <p className="text-sm text-red-600 mt-1">{errors.platforms.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Select 1-5 platforms that apply to your agent.
              </p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-2">Tags (Optional)</label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add a tag and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag(e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                />
              </div>
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Add up to 10 tags to help others discover your agent.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Documentation</CardTitle>
            <CardDescription>
              Provide detailed documentation to help others use your agent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Document Editor */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Documentation <span className="text-red-500">*</span>
              </label>
              <DocumentEditor ref={documentEditorRef} />
              <p className="text-xs text-gray-500 mt-2">
                Use the rich text editor to create comprehensive documentation for your agent.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending || isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={isPending || isSubmitting}
          >
            {isPending || isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Create Agent
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
