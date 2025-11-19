import { useState, useEffect, RefObject } from 'react'

export type ScrollDirection = 'up' | 'down' | 'static'

interface UseScrollDirectionOptions {
  threshold?: number
  initialVisible?: boolean
}

export function useScrollDirection(
  ref: RefObject<HTMLElement>,
  options: UseScrollDirectionOptions = {}
) {
  const { threshold = 10, initialVisible = true } = options
  const [isVisible, setIsVisible] = useState(initialVisible)
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>('static')

  useEffect(() => {
    const element = ref.current
    if (!element) return

    let lastScrollTop = element.scrollTop
    let ticking = false

    const updateScrollDirection = () => {
      const scrollTop = element.scrollTop

      // Always show header when near top
      if (scrollTop < 50) {
        setIsVisible(true)
        setScrollDirection('static')
        ticking = false
        return
      }

      const scrollDelta = scrollTop - lastScrollTop

      // Only update if scroll exceeds threshold
      if (Math.abs(scrollDelta) < threshold) {
        ticking = false
        return
      }

      if (scrollDelta > 0) {
        // Scrolling down
        setScrollDirection('down')
        setIsVisible(false)
      } else {
        // Scrolling up
        setScrollDirection('up')
        setIsVisible(true)
      }

      lastScrollTop = scrollTop
      ticking = false
    }

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection)
        ticking = true
      }
    }

    element.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      element.removeEventListener('scroll', handleScroll)
    }
  }, [ref, threshold])

  return { isVisible, scrollDirection }
}
