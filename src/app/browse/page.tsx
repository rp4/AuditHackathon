'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Filter, Grid, List, Search, Star } from 'lucide-react'
import { useAgents } from '@/hooks/useAgents'
import { getCategories, getPlatforms } from '@/lib/supabase/queries'
import { AgentCard } from '@/components/agents/AgentCard'
import type { Category, Platform } from '@/types/database'

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<string[]>([])
  const [minRating, setMinRating] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'recent' | 'favorites'>('popular')
  const [showFilters, setShowFilters] = useState(true)

  // Fetch categories and platforms
  const [categories, setCategories] = useState<Category[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error)
    getPlatforms().then(setPlatforms).catch(console.error)
  }, [])

  // Build query params for agents
  const queryParams = useMemo(
    () => ({
      search: searchQuery || undefined,
      categoryId: selectedCategoryIds[0] || undefined, // Currently supporting single category
      platformIds: selectedPlatformIds.length > 0 ? selectedPlatformIds : undefined,
      minRating: minRating || undefined,
      sortBy,
      limit: 20,
    }),
    [searchQuery, selectedCategoryIds, selectedPlatformIds, minRating, sortBy]
  )

  // Fetch agents with real-time filtering
  const { data: agents = [], isLoading, error } = useAgents(queryParams)

  // Handle category toggle
  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [categoryId] // Single selection for now
    )
  }

  // Handle platform toggle
  const togglePlatform = (platformId: string) => {
    setSelectedPlatformIds((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Browse AI Agents</h1>
        <p className="text-muted-foreground">
          Discover and implement AI agents created by the audit community
        </p>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="search"
            placeholder="Search agents by name or description..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <select
            className="px-4 py-2 border rounded-md text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="recent">Most Recent</option>
            <option value="favorites">Most Favorited</option>
          </select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <aside className={`w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden'} lg:block`}>
          <div className="space-y-6">
            {/* Category Filter */}
            <div>
              <h3 className="font-semibold mb-3">Category</h3>
              {categories.length === 0 ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.includes(category.id)}
                        onChange={() => toggleCategory(category.id)}
                        className="mr-2"
                      />
                      <span className="text-sm">{category.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Platform Filter */}
            <div>
              <h3 className="font-semibold mb-3">Platform</h3>
              {platforms.length === 0 ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : (
                <div className="space-y-2">
                  {platforms.map((platform) => (
                    <label key={platform.id} className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPlatformIds.includes(platform.id)}
                        onChange={() => togglePlatform(platform.id)}
                        className="mr-2"
                      />
                      <span className="text-sm">{platform.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Rating Filter */}
            <div>
              <h3 className="font-semibold mb-3">Minimum Rating</h3>
              <div className="space-y-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    checked={minRating === null}
                    onChange={() => setMinRating(null)}
                    className="mr-2"
                  />
                  <span className="text-sm">All Ratings</span>
                </label>
                {[4, 3, 2, 1].map((rating) => (
                  <label key={rating} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="rating"
                      checked={minRating === rating}
                      onChange={() => setMinRating(rating)}
                      className="mr-2"
                    />
                    <div className="flex items-center">
                      {Array.from({ length: rating }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="ml-1 text-sm">& up</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {(selectedCategoryIds.length > 0 ||
              selectedPlatformIds.length > 0 ||
              minRating !== null ||
              searchQuery) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategoryIds([])
                  setSelectedPlatformIds([])
                  setMinRating(null)
                  setSearchQuery('')
                }}
                className="w-full"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        </aside>

        {/* Agents Grid/List */}
        <div className="flex-1">
          <div className="mb-4 text-sm text-muted-foreground">
            {isLoading ? (
              'Loading agents...'
            ) : error ? (
              'Error loading agents'
            ) : (
              `Showing ${agents.length} agent${agents.length !== 1 ? 's' : ''}`
            )}
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-64 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Failed to load agents</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-2">No agents found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or search query
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}

          {/* Pagination - Future Enhancement */}
          {/* <div className="mt-8 flex justify-center">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
                1
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  )
}
