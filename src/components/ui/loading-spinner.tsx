'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSiteConfig } from '@/lib/site/SiteContext'

const DotLottieReact = dynamic(
  () => import('@lottiefiles/dotlottie-react').then((mod) => mod.DotLottieReact),
  {
    ssr: false,
    loading: () => <Loader2 className="h-8 w-8 animate-spin text-primary" />,
  }
)

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  fullPage?: boolean
  className?: string
}

const pixelSizes = {
  sm: 16,
  md: 120,
  lg: 200,
}

export function LoadingSpinner({
  size = 'md',
  fullPage = false,
  className,
}: LoadingSpinnerProps) {
  const site = useSiteConfig()
  const lottieSrc = site.theme === 'allstars' ? '/basketball.lottie' : '/Loading.lottie'
  const wrapperClass = fullPage
    ? 'min-h-screen flex items-center justify-center'
    : 'flex items-center justify-center py-20'

  if (size === 'sm') {
    return (
      <Loader2 className={cn('h-4 w-4 animate-spin', className)} />
    )
  }

  return (
    <div className={cn(wrapperClass, className)}>
      <DotLottieReact
        src={lottieSrc}
        loop
        autoplay
        style={{
          width: pixelSizes[size],
          height: pixelSizes[size],
        }}
      />
    </div>
  )
}
