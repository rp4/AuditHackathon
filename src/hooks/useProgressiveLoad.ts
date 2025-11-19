import { useState, useEffect, useCallback } from 'react'

interface UseProgressiveLoadOptions {
  items: any[]
  initialBatch?: number
  batchSize?: number
  delay?: number
}

export function useProgressiveLoad<T>({
  items,
  initialBatch = 6,
  batchSize = 6,
  delay = 100,
}: UseProgressiveLoadOptions) {
  const [visibleCount, setVisibleCount] = useState(initialBatch)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Reset visible count when items change
  useEffect(() => {
    setVisibleCount(initialBatch)
  }, [items, initialBatch])

  const loadMore = useCallback(() => {
    if (visibleCount >= items.length || isLoadingMore) return

    setIsLoadingMore(true)

    // Simulate async loading with a small delay for smoother UX
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + batchSize, items.length))
      setIsLoadingMore(false)
    }, delay)
  }, [visibleCount, items.length, isLoadingMore, batchSize, delay])

  const visibleItems = items.slice(0, visibleCount)
  const hasMore = visibleCount < items.length

  return {
    visibleItems,
    hasMore,
    isLoadingMore,
    loadMore,
    totalCount: items.length,
    visibleCount,
  }
}
