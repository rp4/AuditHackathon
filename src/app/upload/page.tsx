"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DocumentEditor } from "@/components/ui/DocumentEditor"
import { Upload } from "lucide-react"

const platforms = ["OpenAI", "Claude", "Gemini", "LangChain", "Copilot", "Other"]

export default function UploadPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    platforms: [] as string[],
    documentContent: null as any,
  })

  const handleDocumentChange = (content: any) => {
    setFormData({ ...formData, documentContent: content })
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
