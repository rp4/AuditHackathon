'use client'

import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToggleFavorite } from '@/hooks/useFavorites'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface FavoriteButtonProps {
  agentId: string
  userId?: string
  initialFavorited?: boolean
  favoritesCount?: number
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showCount?: boolean
}

export function FavoriteButton({
  agentId,
  userId,
  initialFavorited = false,
  favoritesCount = 0,
  variant = 'outline',
  size = 'default',
  showCount = true,
}: FavoriteButtonProps) {
  const router = useRouter()
  const [localFavorited, setLocalFavorited] = useState(initialFavorited)
  const [localCount, setLocalCount] = useState(favoritesCount)
  const { mutate: toggleFavorite, isPending } = useToggleFavorite()

  const handleClick = () => {
    // Check if user is authenticated
    if (!userId) {
      // Redirect to auth
      router.push('/auth/signin')
      return
    }

    // Optimistic update
    const newFavorited = !localFavorited
    setLocalFavorited(newFavorited)
    setLocalCount(prev => newFavorited ? prev + 1 : prev - 1)

    // Call mutation
    toggleFavorite(
      { agentId, userId },
      {
        onSuccess: () => {
          toast.success(newFavorited ? 'Agent saved to favorites!' : 'Agent removed from favorites')
        },
        onError: (error: any) => {
          // Rollback on error
          setLocalFavorited(!newFavorited)
          setLocalCount(prev => newFavorited ? prev - 1 : prev + 1)
          toast.error(error?.message || 'Failed to update favorite')
        },
      }
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isPending}
      className="gap-2"
    >
      <Heart
        className={`h-4 w-4 transition-all ${
          localFavorited ? 'fill-red-500 text-red-500' : ''
        }`}
      />
      {showCount && (
        <span className={localFavorited ? 'text-red-500' : ''}>
          {localFavorited ? 'Saved' : 'Save'}
          {localCount > 0 && ` (${localCount})`}
        </span>
      )}
    </Button>
  )
}
