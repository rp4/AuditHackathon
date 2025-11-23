'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Loader2, Search, Star, Eye, Heart, Check, X, Sparkles } from 'lucide-react'

interface Tool {
  id: string
  name: string
  slug: string
  description: string
  image_url?: string
  is_featured?: boolean
  views_count: number
  favorites_count: number
  rating_avg: number
  user: {
    name?: string
    username?: string
  }
}

export default function FeaturedToolsManager() {
  const [featured, setFeatured] = useState<Tool[]>([])
  const [available, setAvailable] = useState<Tool[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTools()
  }, [])

  const fetchTools = async () => {
    try {
      const response = await fetch('/api/admin/featured')
      if (!response.ok) throw new Error('Failed to fetch tools')
      const data = await response.json()

      setFeatured(data.featured)
      setAvailable(data.available)

      // Initialize selected IDs with currently featured tools
      const featuredIds = new Set<string>(data.featured.map((t: Tool) => t.id))
      setSelectedIds(featuredIds)
    } catch (error) {
      console.error('Error fetching tools:', error)
      toast.error('Failed to load tools')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTool = (toolId: string) => {
    const newSelected = new Set(selectedIds)

    if (newSelected.has(toolId)) {
      newSelected.delete(toolId)
    } else {
      // Limit to 3 featured tools
      if (newSelected.size >= 3) {
        toast.error('You can only feature up to 3 tools at a time')
        return
      }
      newSelected.add(toolId)
    }

    setSelectedIds(newSelected)
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const response = await fetch('/api/admin/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolIds: Array.from(selectedIds) })
      })

      if (!response.ok) throw new Error('Failed to update featured tools')

      const data = await response.json()
      setFeatured(data.featured)

      toast.success('Featured tools updated successfully')

      // Refresh the available tools list
      fetchTools()
    } catch (error) {
      console.error('Error updating featured tools:', error)
      toast.error('Failed to update featured tools')
    } finally {
      setSaving(false)
    }
  }

  const filteredTools = available.filter(tool =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Currently Featured Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Currently Featured Tools
          </CardTitle>
          <CardDescription>
            These tools are displayed on the homepage. You can feature up to 3 tools.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {featured.length === 0 ? (
            <p className="text-muted-foreground">No tools are currently featured</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {featured.map((tool) => (
                <Card key={tool.id}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">{tool.name}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {tool.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        by {tool.user.name || tool.user.username}
                      </p>
                      <div className="flex gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {tool.views_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {tool.favorites_count}
                        </span>
                        {tool.rating_avg > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {tool.rating_avg.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tool Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Featured Tools</CardTitle>
          <CardDescription>
            Choose up to 3 tools to feature on the homepage
          </CardDescription>
          <div className="pt-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {filteredTools.map((tool) => (
                <div
                  key={tool.id}
                  className={`flex items-center space-x-3 rounded-lg border p-3 transition-colors ${
                    selectedIds.has(tool.id) ? 'bg-primary/5 border-primary' : 'hover:bg-accent'
                  }`}
                >
                  <Checkbox
                    checked={selectedIds.has(tool.id)}
                    onCheckedChange={() => handleToggleTool(tool.id)}
                    disabled={!selectedIds.has(tool.id) && selectedIds.size >= 3}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{tool.name}</p>
                      {tool.is_featured && (
                        <Badge variant="secondary" className="text-xs">
                          Currently Featured
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {tool.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>by {tool.user.name || tool.user.username}</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {tool.views_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {tool.favorites_count}
                      </span>
                      {tool.rating_avg > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {tool.rating_avg.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedIds.size} of 3 tools selected
            </p>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Featured Tools
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}