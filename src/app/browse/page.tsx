'use client'

import { useState, useMemo } from 'react'
import { useDebounce } from 'use-debounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Filter, Search, Star, Loader2 } from 'lucide-react'
import { useTools, usePlatforms, useCategories } from '@/hooks/useTools'
import { ToolCard } from '@/components/tools/ToolCard'

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300)
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<string[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'recent' | 'downloads'>('popular')
  const [showFilters, setShowFilters] = useState(false)

  // Fetch platforms and categories
  const { data: platforms = [], isLoading: platformsLoading } = usePlatforms()
  const { data: categories = [], isLoading: categoriesLoading } = useCategories()

  // Build query params for tools
  const queryParams = useMemo(() => ({
    search: debouncedSearchQuery || undefined,
    platformId: selectedPlatformIds[0] || undefined, // Use first selected platform for now
    categoryId: selectedCategoryId || undefined,
    sortBy,
    limit: 50,
  }), [debouncedSearchQuery, selectedPlatformIds, selectedCategoryId, sortBy])

  // Fetch tools with filters
  const { data, isLoading: toolsLoading } = useTools(queryParams)
  const tools = data?.tools || []
  const total = data?.total || 0

  // Toggle platform filter
  const togglePlatform = (platformId: string) => {
    setSelectedPlatformIds(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    )
  }

  // Toggle category filter (single selection)
  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryId(prev => prev === categoryId ? '' : categoryId)
  }

  const isLoading = toolsLoading || platformsLoading || categoriesLoading

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header with Search and Filters */}
      <div className="shrink-0 bg-background">
        <div className="container mx-auto px-4 py-6">
          {/* Search Bar */}
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 md:h-14 text-base md:text-lg"
              />
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              size="lg"
              className="gap-2 h-12 md:h-14 px-3 sm:px-4 md:px-6 text-base md:text-lg"
            >
              <Filter className="h-5 w-5" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="space-y-4 py-4 border-t">
              {/* Sort Options */}
              <div>
                <h3 className="font-semibold text-sm mb-2">Sort By</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'popular', label: 'Popular' },
                    { value: 'recent', label: 'Recent' },
                    { value: 'rating', label: 'Top Rated' },
                  ].map((option) => (
                    <Badge
                      key={option.value}
                      variant={sortBy === option.value ? "default" : "outline"}
                      className={`cursor-pointer transition-all duration-150 ease-out active:scale-95 ${
                        sortBy === option.value
                          ? "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSortBy(option.value as any)}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Platform Filter */}
              <div>
                <h3 className="font-semibold text-sm mb-2">Platforms</h3>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((platform: { id: string; name: string; toolCount?: number }) => (
                    <Badge
                      key={platform.id}
                      variant={selectedPlatformIds.includes(platform.id) ? "default" : "outline"}
                      className={`cursor-pointer transition-all duration-150 ease-out active:scale-95 ${
                        selectedPlatformIds.includes(platform.id)
                          ? "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => togglePlatform(platform.id)}
                    >
                      {platform.name}
                      {platform.toolCount !== undefined && (
                        <span className="ml-1 opacity-60">({platform.toolCount})</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <h3 className="font-semibold text-sm mb-2">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category: { id: string; name: string; toolCount?: number }) => (
                    <Badge
                      key={category.id}
                      variant={selectedCategoryId === category.id ? "default" : "outline"}
                      className={`cursor-pointer transition-all duration-150 ease-out active:scale-95 ${
                        selectedCategoryId === category.id
                          ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => toggleCategory(category.id)}
                    >
                      {category.name}
                      {category.toolCount !== undefined && (
                        <span className="ml-1 opacity-60">({category.toolCount})</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(selectedPlatformIds.length > 0 || selectedCategoryId || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedPlatformIds([])
                    setSelectedCategoryId('')
                    setSearchQuery('')
                  }}
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          )}

          {/* Active Filters Display */}
          {(selectedPlatformIds.length > 0 || selectedCategoryId) && !showFilters && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedPlatformIds.map((platformId) => {
                const platform = platforms.find((p: any) => p.id === platformId)
                return platform ? (
                  <Badge
                    key={platformId}
                    className="cursor-pointer bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 transition-all duration-150 ease-out active:scale-95"
                    onClick={() => togglePlatform(platformId)}
                  >
                    {platform.name} ×
                  </Badge>
                ) : null
              })}
              {selectedCategoryId && (() => {
                const category = categories.find((c: any) => c.id === selectedCategoryId)
                return category ? (
                  <Badge
                    key={selectedCategoryId}
                    className="cursor-pointer bg-green-100 text-green-700 border-green-200 hover:bg-green-200 transition-all duration-150 ease-out active:scale-95"
                    onClick={() => toggleCategory(selectedCategoryId)}
                  >
                    {category.name} ×
                  </Badge>
                ) : null
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8">
          {/* Results Count */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              {isLoading ? (
                'Loading tools...'
              ) : (
                `${total} ${total === 1 ? 'tool' : 'tools'} found`
              )}
            </h2>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Tools Grid */}
          {!isLoading && tools.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && tools.length === 0 && (
            <div className="text-center py-20">
              <div className="mb-4">
                <Search className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No tools found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your filters or search query
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedPlatformIds([])
                  setSelectedCategoryId('')
                }}
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
