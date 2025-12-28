import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  fullPage?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}

export function LoadingSpinner({
  size = 'md',
  fullPage = false,
  className
}: LoadingSpinnerProps) {
  const wrapperClass = fullPage
    ? 'min-h-screen flex items-center justify-center'
    : 'flex items-center justify-center py-20'

  return (
    <div className={cn(wrapperClass, className)}>
      <Loader2 className={cn(sizeClasses[size], 'animate-spin text-primary')} />
    </div>
  )
}
