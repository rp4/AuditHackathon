"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DocumentEditor } from "@/components/ui/DocumentEditor"
import { Upload, Linkedin } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const platforms = ["OpenAI", "Claude", "Gemini", "LangChain", "Copilot", "Other"]

export default function UploadPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    platforms: [] as string[],
    documentContent: null as any,
  })
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
    }
  }

  const handleDocumentChange = (content: any) => {
    setFormData({ ...formData, documentContent: content })
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show sign-in prompt if not authenticated
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upload AI Agent</h1>
        <p className="text-gray-600">
          Share your AI agent with the audit community
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Information</CardTitle>
          <CardDescription>
            Provide basic details and documentation for your agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Agent Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Agent Name *</label>
              <Input
                placeholder="e.g., Financial Statement Analyzer"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Short Description *</label>
              <textarea
                className="w-full min-h-[100px] px-3 py-2 border rounded-md text-sm"
                placeholder="Brief description of what your agent does (will be shown in search results)..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                This will appear in search results and previews. Keep it concise (2-3 sentences).
              </p>
            </div>

            {/* Platform */}
            <div>
              <label className="block text-sm font-medium mb-2">Platform *</label>
              <div className="flex flex-wrap gap-2">
                {platforms.map((platform) => {
                  const isSelected = formData.platforms.includes(platform)
                  return (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setFormData({ ...formData, platforms: formData.platforms.filter(p => p !== platform) })
                        } else {
                          setFormData({ ...formData, platforms: [...formData.platforms, platform] })
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-sm border-purple-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {platform}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Select all platforms that apply to your agent.
              </p>
            </div>

            {/* Document Editor */}
            <div>
              <label className="block text-sm font-medium mb-2">Documentation *</label>
              <p className="text-xs text-gray-500 mb-3">
                Create your agent documentation with rich text formatting, images, and tables.
              </p>
              <DocumentEditor
                onChange={handleDocumentChange}
                initialContent={formData.documentContent}
              />
            </div>

            {/* Terms */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-start gap-2">
                <input type="checkbox" id="terms" className="mt-1" />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I confirm that this agent does not contain any proprietary or confidential information,
                  and I agree to the terms of service and content guidelines.
                </label>
              </div>

              <div className="flex items-start gap-2">
                <input type="checkbox" id="license" className="mt-1" />
                <label htmlFor="license" className="text-sm text-gray-600">
                  I agree to share this agent under an open license (specify license in your documentation).
                </label>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end mt-6">
        <Button
          size="lg"
          disabled={!formData.name || !formData.description || formData.platforms.length === 0 || !formData.documentContent}
        >
          <Upload className="h-4 w-4 mr-2" />
          Submit Agent
        </Button>
      </div>
    </div>
  )
}
