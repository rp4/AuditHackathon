import { useEffect, RefObject } from 'react'

interface UseIntersectionObserverOptions {
  root?: RefObject<Element>
  rootMargin?: string
  threshold?: number | number[]
  onIntersect: () => void
  enabled?: boolean
}

export function useIntersectionObserver({
  root,
  rootMargin = '100px',
  threshold = 0.1,
  onIntersect,
  enabled = true,
}: UseIntersectionObserverOptions) {
  useEffect(() => {
    if (!enabled) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onIntersect()
          }
        })
      },
      {
        root: root?.current,
        rootMargin,
        threshold,
      }
    )

    // Find the sentinel element
    const sentinel = document.getElementById('load-more-sentinel')
    if (sentinel) {
      observer.observe(sentinel)
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel)
      }
      observer.disconnect()
    }
  }, [root, rootMargin, threshold, onIntersect, enabled])
}
