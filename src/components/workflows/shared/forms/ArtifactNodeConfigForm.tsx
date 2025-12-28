'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ArtifactNodeConfigFormProps {
  initialData: {
    label: string
    description?: string
    instructions?: string
    linkedAgentUrl?: string
  }
  onSave: (data: {
    label: string
    description?: string
    instructions?: string
    linkedAgentUrl?: string
  }) => void
  onCancel: () => void
}

export function ArtifactNodeConfigForm({
  initialData,
  onSave,
  onCancel,
}: ArtifactNodeConfigFormProps) {
  const [formData, setFormData] = useState({
    label: initialData.label || '',
    description: initialData.description || '',
    instructions: initialData.instructions || '',
    linkedAgentUrl: initialData.linkedAgentUrl || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="label">
          Name<span className="text-red-500">*</span>
        </Label>
        <Input
          id="label"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          placeholder="Artifact name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of this artifact in the workflow"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea
          id="instructions"
          value={formData.instructions}
          onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
          placeholder="Instructions or notes for this artifact step"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="linkedAgentUrl">AI Agent Link (Optional)</Label>
        <Input
          id="linkedAgentUrl"
          type="url"
          value={formData.linkedAgentUrl}
          onChange={(e) => setFormData({ ...formData, linkedAgentUrl: e.target.value })}
          placeholder="https://claude.ai/project/... or https://chatgpt.com/..."
        />
        <p className="text-xs text-muted-foreground">
          Link to an AI agent that can help with this artifact
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  )
}
