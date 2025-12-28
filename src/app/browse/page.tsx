'use client'

import { useState, useMemo } from 'react'
import { useDebounce } from 'use-debounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Filter, Search, Star, Loader2 } from 'lucide-react'
import { useSwarms, useCategories } from '@/hooks/useSwarms'
import { SwarmCard } from '@/components/swarms/SwarmCard'

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'recent' | 'downloads'>('popular')
  const [showFilters, setShowFilters] = useState(false)

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useCategories()

  // Build query params for swarms
  const queryParams = useMemo(() => ({
    search: debouncedSearchQuery || undefined,
    categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds.join(',') : undefined,
    sortBy,
    limit: 50,
  }), [debouncedSearchQuery, selectedCategoryIds, sortBy])

  // Fetch swarms with filters
  const { data, isLoading: swarmsLoading } = useSwarms(queryParams)
  const swarms = data?.swarms || []
  const total = data?.total || 0

  // Toggle category filter (multiselect)
  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const isLoading = swarmsLoading || categoriesLoading

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
                placeholder="Search workflow templates..."
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
            <div className="space-y-4 p-4 mt-4 rounded-xl bg-white/80 backdrop-blur-md border shadow-lg">
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

              {/* Category Filter */}
              <div>
                <h3 className="font-semibold text-sm mb-2">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category: { id: string; name: string; swarmCount?: number }) => (
                    <Badge
                      key={category.id}
                      variant={selectedCategoryIds.includes(category.id) ? "default" : "outline"}
                      className={`cursor-pointer transition-all duration-150 ease-out active:scale-95 ${
                        selectedCategoryIds.includes(category.id)
                          ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => toggleCategory(category.id)}
                    >
                      {category.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(selectedCategoryIds.length > 0 || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCategoryIds([])
                    setSearchQuery('')
                  }}
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          )}

          {/* Active Filters Display */}
          {selectedCategoryIds.length > 0 && !showFilters && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedCategoryIds.map((categoryId) => {
                const category = categories.find((c: any) => c.id === categoryId)
                return category ? (
                  <Badge
                    key={categoryId}
                    className="cursor-pointer bg-green-100 text-green-700 border-green-200 hover:bg-green-200 transition-all duration-150 ease-out active:scale-95"
                    onClick={() => toggleCategory(categoryId)}
                  >
                    {category.name} ×
                  </Badge>
                ) : null
              })}
            </div>
          )}
        </div>
      </div>

      {/* Swarms Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8">
          {/* Results Count */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              {isLoading ? (
                'Loading swarms...'
              ) : (
                `${total} workflow ${total === 1 ? 'template' : 'templates'} found`
              )}
            </h2>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Swarms Grid */}
          {!isLoading && swarms.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {swarms.map((swarm: any) => (
                <SwarmCard key={swarm.id} swarm={swarm} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && swarms.length === 0 && (
            <div className="text-center py-20">
              <div className="mb-4">
                <Search className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No workflow templates found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your filters or search query
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategoryIds([])
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
