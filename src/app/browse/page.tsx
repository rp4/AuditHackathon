'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useDebounce } from 'use-debounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Filter, Search, Star, Loader2 } from 'lucide-react'
import { useAgents } from '@/hooks/useAgents'
import { getPlatforms } from '@/lib/supabase/queries'
import { AgentCard } from '@/components/agents/AgentCard'
import { useProgressiveLoad } from '@/hooks/useProgressiveLoad'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import type { Platform } from '@/types/database'

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300) // 300ms debounce
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<string[]>([])
  const [minRating, setMinRating] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'recent' | 'favorites'>('popular')
  const [showFilters, setShowFilters] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Smart header: hide on scroll down, show on scroll up
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const currentScrollY = container.scrollTop

      // Show header when scrolling up or at top
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        window.dispatchEvent(new CustomEvent('browseHeaderVisibility', {
          detail: { visible: true }
        }))
      }
      // Hide header when scrolling down past threshold
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        window.dispatchEvent(new CustomEvent('browseHeaderVisibility', {
          detail: { visible: false }
        }))
      }

      setLastScrollY(currentScrollY)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Get header visibility state from parent
  const [showHeader, setShowHeader] = useState(true)
  useEffect(() => {
    const handleHeaderVisibility = (e: Event) => {
      const customEvent = e as CustomEvent<{ visible: boolean }>
      setShowHeader(customEvent.detail.visible)
    }
    window.addEventListener('browseHeaderVisibility', handleHeaderVisibility)
    return () => window.removeEventListener('browseHeaderVisibility', handleHeaderVisibility)
  }, [])

  // Fetch platforms
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [platformsLoading, setPlatformsLoading] = useState(true)

  useEffect(() => {
    console.log('🌐 [BROWSE] Component mounted, fetching platforms...')
    setPlatformsLoading(true)
    getPlatforms()
      .then((data) => {
        console.log('✅ [BROWSE] Platforms loaded successfully:', {
          count: data.length,
          platforms: data.map(p => ({ id: p.id, name: p.name })),
          timestamp: new Date().toISOString()
        })
        setPlatforms(data)
      })
      .catch((err) => {
        console.error('❌ [BROWSE] Error loading platforms:', {
          error: err,
          message: err?.message,
          code: err?.code,
          timestamp: new Date().toISOString()
        })
      })
      .finally(() => {
        setPlatformsLoading(false)
      })
  }, [])

  // Build query params for agents (using debounced search, excluding platformIds)
  const queryParams = useMemo(() => {
    const params = {
      search: debouncedSearchQuery || undefined,
      minRating: minRating || undefined,
      sortBy,
      limit: 1000, // Fetch more to allow client-side filtering
    }
    console.log('🔍 [BROWSE] Query params updated:', params)
    return params
  }, [debouncedSearchQuery, minRating, sortBy])

  // Fetch agents with real-time filtering
  const { data: allAgents = [], isLoading, error } = useAgents(queryParams)

  // Debug log when agents data changes
  useEffect(() => {
    console.log('📊 [BROWSE] Agents data updated:', {
      count: allAgents.length,
      isLoading,
      hasError: !!error,
      error: error?.message,
      timestamp: new Date().toISOString()
    })
  }, [allAgents, isLoading, error])

  // Filter agents by selected platforms on the client side
  const filteredAgents = useMemo(() => {
    if (selectedPlatformIds.length === 0) {
      return allAgents
    }

    // Filter agents that have at least one of the selected platforms
    return allAgents.filter((agent) => {
      return agent.agent_platforms?.some((ap) =>
        selectedPlatformIds.includes(ap.platform_id || ap.platform?.id)
      )
    })
  }, [allAgents, selectedPlatformIds])

  // Use progressive loading for better UX
  const {
    visibleItems: agents,
    hasMore,
    isLoadingMore,
    loadMore,
  } = useProgressiveLoad({
    items: filteredAgents,
    initialBatch: 9, // Load 9 initially (3x3 grid)
    batchSize: 6, // Load 6 more at a time (2 rows)
    delay: 50,
  })

  // Auto-load more when scrolling near bottom
  useIntersectionObserver({
    onIntersect: loadMore,
    enabled: hasMore && !isLoadingMore && !isLoading,
    rootMargin: '400px', // Start loading 400px before reaching the sentinel
  })

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
    <div className="flex flex-col h-full">
      {/* Search and Controls - Sticky with smooth transition */}
      <div
        className="bg-background border-b shrink-0 transition-all duration-300 ease-in-out"
        style={{
          paddingTop: showHeader ? '1rem' : '2rem', // More space when header is hidden
        }}
      >
        <div className="container mx-auto px-4 pb-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="search"
                placeholder="Search tools by name or description..."
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
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4">
          <div className="flex gap-8 relative">
            {/* Filters Sidebar - Sticky */}
            <aside className={`w-64 flex-shrink-0 py-6 sticky top-0 self-start ${showFilters ? 'block' : 'hidden'} lg:block`}>
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
            <div className="flex-1 py-6" ref={scrollContainerRef}>
              <div className="mb-4 text-sm text-muted-foreground">
                {isLoading ? (
                  'Loading tools...'
                ) : error ? (
                  'Error loading tools'
                ) : (
                  `Showing ${agents.length} of ${filteredAgents.length} tool${filteredAgents.length !== 1 ? 's' : ''}`
                )}
              </div>

              {isLoading ? (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-64 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">Failed to load tools</p>
                  <Button onClick={() => window.location.reload()}>Retry</Button>
                </div>
              ) : filteredAgents.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-2">No tools found</p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your filters or search query
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {agents.map((agent, index) => (
                      <div
                        key={agent.id}
                        className="animate-in fade-in slide-in-from-bottom-4"
                        style={{
                          animationDelay: `${(index % 9) * 30}ms`,
                          animationDuration: '400ms',
                          animationFillMode: 'backwards',
                        }}
                      >
                        <AgentCard agent={agent} />
                      </div>
                    ))}
                  </div>

                  {/* Loading More Indicator */}
                  {hasMore && (
                    <div
                      id="load-more-sentinel"
                      className="flex justify-center items-center py-8 mt-6"
                    >
                      {isLoadingMore ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span className="text-sm">Loading more tools...</span>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={loadMore}
                          className="min-w-[200px]"
                        >
                          Load More
                        </Button>
                      )}
                    </div>
                  )}

                  {/* End of Results */}
                  {!hasMore && agents.length > 9 && (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      You've reached the end of the results
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
