'use client'

import { useState, useEffect, useMemo } from 'react'
import { useDebounce } from 'use-debounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Filter, Search, Star } from 'lucide-react'
import { useAgents } from '@/hooks/useAgents'
import { getPlatforms } from '@/lib/supabase/queries'
import { AgentCard } from '@/components/agents/AgentCard'
import type { Platform } from '@/types/database'

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300) // 300ms debounce
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<string[]>([])
  const [minRating, setMinRating] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'recent' | 'favorites'>('popular')
  const [showFilters, setShowFilters] = useState(false)

  // Fetch platforms
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [platformsLoading, setPlatformsLoading] = useState(true)

  useEffect(() => {
    console.log('[Browse] Fetching platforms...')
    setPlatformsLoading(true)
    getPlatforms()
      .then((data) => {
        console.log('[Browse] Platforms loaded:', data.length)
        setPlatforms(data)
      })
      .catch((err) => {
        console.error('[Browse] Error loading platforms:', err)
      })
      .finally(() => {
        setPlatformsLoading(false)
      })
  }, [])

  // Build query params for agents (using debounced search, excluding platformIds)
  const queryParams = useMemo(
    () => ({
      search: debouncedSearchQuery || undefined,
      minRating: minRating || undefined,
      sortBy,
      limit: 1000, // Fetch more to allow client-side filtering
    }),
    [debouncedSearchQuery, minRating, sortBy]
  )

  // Fetch agents with real-time filtering
  const { data: allAgents = [], isLoading, error } = useAgents(queryParams)

  // Filter agents by selected platforms on the client side
  const agents = useMemo(() => {
    if (selectedPlatformIds.length === 0) {
      return allAgents.slice(0, 20) // Return first 20 if no platform filter
    }

    // Filter agents that have at least one of the selected platforms
    const filtered = allAgents.filter((agent) => {
      return agent.agent_platforms?.some((ap) =>
        selectedPlatformIds.includes(ap.platform_id || ap.platform?.id)
      )
    })

    return filtered.slice(0, 20) // Return first 20 filtered results
  }, [allAgents, selectedPlatformIds])

  // Fetch agents for counting (without platform filter to get accurate counts)
  const countQueryParams = useMemo(
    () => ({
      search: searchQuery || undefined,
      minRating: minRating || undefined,
      limit: 1000, // Get more agents for accurate counting
    }),
    [searchQuery, minRating]
  )
  const { data: agentsForCounting = [] } = useAgents(countQueryParams)

  // Calculate platform counts based on current filters (excluding platform filter itself)
  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {}

    agentsForCounting.forEach((agent) => {
      agent.agent_platforms?.forEach((ap) => {
        const platformId = ap.platform?.id || ap.platform_id
        if (platformId) {
          counts[platformId] = (counts[platformId] || 0) + 1
        }
      })
    })

    return counts
  }, [agentsForCounting])

  // Handle platform toggle
  const togglePlatform = (platformId: string) => {
    setSelectedPlatformIds((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    )
  }

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (selectedPlatformIds.length > 0) count += selectedPlatformIds.length
    if (minRating !== null) count += 1
    return count
  }, [selectedPlatformIds.length, minRating])

  return (
    <div className="container mx-auto px-4 py-8">
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
            className="lg:hidden relative"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge className="ml-2 bg-primary text-primary-foreground">
                {activeFilterCount}
              </Badge>
            )}
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
        </div>
      </div>

      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <aside className={`w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden'} lg:block`}>
          <div className="space-y-6">
            {/* Platform Filter */}
            <div>
              <h3 className="font-semibold mb-3">Platform</h3>
              {platformsLoading ? (
                <div className="text-sm text-muted-foreground">Please Refresh the Page.</div>
              ) : platforms.length === 0 ? (
                <div className="text-sm text-muted-foreground">No platforms found</div>
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
                      <span className="text-sm">
                        {platform.name}{' '}
                        <span className="text-gray-400">
                          ({platformCounts[platform.id] || 0})
                        </span>
                      </span>
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
            {(selectedPlatformIds.length > 0 ||
              minRating !== null ||
              searchQuery) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
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
              'Please Refresh the Page'
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
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
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
