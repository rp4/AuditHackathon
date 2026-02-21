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
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface Swarm {
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

export default function FeaturedSwarmsManager() {
  const [featured, setFeatured] = useState<Swarm[]>([])
  const [available, setAvailable] = useState<Swarm[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSwarms()
  }, [])

  const fetchSwarms = async () => {
    try {
      const response = await fetch('/api/admin/featured')
      if (!response.ok) throw new Error('Failed to fetch swarms')
      const data = await response.json()

      setFeatured(data.featured)
      setAvailable(data.available)

      // Initialize selected IDs with currently featured swarms
      const featuredIds = new Set<string>(data.featured.map((s: Swarm) => s.id))
      setSelectedIds(featuredIds)
    } catch (error) {
      console.error('Error fetching swarms:', error)
      toast.error('Failed to load swarms')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSwarm = (swarmId: string) => {
    const newSelected = new Set(selectedIds)

    if (newSelected.has(swarmId)) {
      newSelected.delete(swarmId)
    } else {
      // Limit to 3 featured swarms
      if (newSelected.size >= 3) {
        toast.error('You can only feature up to 3 swarms at a time')
        return
      }
      newSelected.add(swarmId)
    }

    setSelectedIds(newSelected)
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const response = await fetch('/api/admin/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swarmIds: Array.from(selectedIds) })
      })

      if (!response.ok) throw new Error('Failed to update featured swarms')

      const data = await response.json()
      setFeatured(data.featured)

      toast.success('Featured swarms updated successfully')

      // Refresh the available swarms list
      fetchSwarms()
    } catch (error) {
      console.error('Error updating featured swarms:', error)
      toast.error('Failed to update featured swarms')
    } finally {
      setSaving(false)
    }
  }

  const filteredSwarms = available.filter(swarm =>
    swarm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    swarm.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    swarm.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    swarm.user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <LoadingSpinner />
    )
  }

  return (
    <div className="space-y-6">
      {/* Currently Featured Swarms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Currently Featured Swarms
          </CardTitle>
          <CardDescription>
            These swarms are displayed on the homepage. You can feature up to 3 swarms.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {featured.length === 0 ? (
            <p className="text-muted-foreground">No swarms are currently featured</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {featured.map((swarm) => (
                <Card key={swarm.id}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">{swarm.name}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {swarm.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        by {swarm.user.name || swarm.user.username}
                      </p>
                      <div className="flex gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {swarm.views_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {swarm.favorites_count}
                        </span>
                        {swarm.rating_avg > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {swarm.rating_avg.toFixed(1)}
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

      {/* Swarm Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Featured Swarms</CardTitle>
          <CardDescription>
            Choose up to 3 swarms to feature on the homepage
          </CardDescription>
          <div className="pt-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search swarms..."
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
              {filteredSwarms.map((swarm) => (
                <div
                  key={swarm.id}
                  className={`flex items-center space-x-3 rounded-lg border p-3 transition-colors ${
                    selectedIds.has(swarm.id) ? 'bg-primary/5 border-primary' : 'hover:bg-accent'
                  }`}
                >
                  <Checkbox
                    checked={selectedIds.has(swarm.id)}
                    onCheckedChange={() => handleToggleSwarm(swarm.id)}
                    disabled={!selectedIds.has(swarm.id) && selectedIds.size >= 3}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{swarm.name}</p>
                      {swarm.is_featured && (
                        <Badge variant="secondary" className="text-xs">
                          Currently Featured
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {swarm.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>by {swarm.user.name || swarm.user.username}</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {swarm.views_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {swarm.favorites_count}
                      </span>
                      {swarm.rating_avg > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {swarm.rating_avg.toFixed(1)}
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
              {selectedIds.size} of 3 swarms selected
            </p>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Featured Swarms
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
