'use client'

import { useState, useMemo } from 'react'
import { useDebounce } from 'use-debounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Filter, Search, Star, Loader2, CheckSquare, Square, Download, X } from 'lucide-react'
import { useSwarms, useCategories } from '@/hooks/useSwarms'
import { SwarmCard } from '@/components/swarms/SwarmCard'
import { getCategoryColor } from '@/lib/utils/categoryColors'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'

export default function BrowsePage() {
  const { isAuthenticated, signIn } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'recent' | 'downloads'>('popular')
  const [showFilters, setShowFilters] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedSwarmIds, setSelectedSwarmIds] = useState<Set<string>>(new Set())

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

  // Selection handlers
  const toggleSwarmSelection = (swarmId: string) => {
    setSelectedSwarmIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(swarmId)) {
        newSet.delete(swarmId)
      } else {
        newSet.add(swarmId)
      }
      return newSet
    })
  }

  const selectAll = () => {
    setSelectedSwarmIds(new Set(swarms.map((s: any) => s.id)))
  }

  const clearSelection = () => {
    setSelectedSwarmIds(new Set())
  }

  const exitSelectionMode = () => {
    setSelectionMode(false)
    setSelectedSwarmIds(new Set())
  }

  // Download selected workflows as combined JSON
  const downloadSelectedWorkflows = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to download workflows')
      signIn('/browse')
      return
    }

    const selectedSwarms = swarms.filter((s: any) => selectedSwarmIds.has(s.id))

    if (selectedSwarms.length === 0) {
      toast.error('No workflows selected')
      return
    }

    const workflows = selectedSwarms.map((swarm: any) => {
      let nodes = []
      let edges = []

      try {
        if (swarm.workflowNodes) nodes = JSON.parse(swarm.workflowNodes)
        if (swarm.workflowEdges) edges = JSON.parse(swarm.workflowEdges)
      } catch {
        // Ignore parse errors
      }

      return {
        name: swarm.name,
        description: swarm.description,
        diagramJson: {
          nodes,
          edges,
          metadata: {}
        }
      }
    })

    const exportData = {
      version: "1.0",
      data: {
        workflows
      }
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `openauditswarms-workflows-${selectedSwarms.length}.json`
    a.click()
    URL.revokeObjectURL(url)

    toast.success(`Downloaded ${selectedSwarms.length} workflow${selectedSwarms.length > 1 ? 's' : ''}`)
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
            <Button
              variant={selectionMode ? "default" : "outline"}
              onClick={() => selectionMode ? exitSelectionMode() : setSelectionMode(true)}
              size="lg"
              className={`gap-2 h-12 md:h-14 px-3 sm:px-4 md:px-6 text-base md:text-lg ${selectionMode ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
            >
              {selectionMode ? <X className="h-5 w-5" /> : <CheckSquare className="h-5 w-5" />}
              <span className="hidden sm:inline">{selectionMode ? 'Cancel' : 'Select'}</span>
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
                      className={`cursor-pointer transition-all duration-150 ease-out active:scale-95 ${getCategoryColor(category.name, selectedCategoryIds.includes(category.id))}`}
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
                    className={`cursor-pointer transition-all duration-150 ease-out active:scale-95 ${getCategoryColor(category.name, true)}`}
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

          {/* Selection bar when in selection mode */}
          {selectionMode && swarms.length > 0 && (
            <div className="flex items-center justify-between mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-amber-800">
                  {selectedSwarmIds.size} of {swarms.length} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAll}
                  className="text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                >
                  Select All
                </Button>
                {selectedSwarmIds.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                  >
                    Clear Selection
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Swarms Grid */}
          {!isLoading && swarms.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {swarms.map((swarm: any) => (
                <SwarmCard
                  key={swarm.id}
                  swarm={swarm}
                  selectionMode={selectionMode}
                  isSelected={selectedSwarmIds.has(swarm.id)}
                  onSelect={toggleSwarmSelection}
                />
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

      {/* Floating action bar when items are selected */}
      {selectionMode && selectedSwarmIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 shadow-lg z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-medium text-stone-800">
                {selectedSwarmIds.size} workflow{selectedSwarmIds.size > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={clearSelection}
              >
                Clear Selection
              </Button>
              <Button
                onClick={downloadSelectedWorkflows}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                Download {selectedSwarmIds.size} Workflow{selectedSwarmIds.size > 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
