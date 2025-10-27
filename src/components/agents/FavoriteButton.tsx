'use client'

import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToggleFavorite } from '@/hooks/useFavorites'
import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

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
  const [localFavorited, setLocalFavorited] = useState(initialFavorited)
  const [localCount, setLocalCount] = useState(favoritesCount)
  const { mutate: toggleFavorite, isPending } = useToggleFavorite()
  const supabase = createClient()

  const handleClick = async () => {
    // Check if user is authenticated
    if (!userId) {
      // Trigger LinkedIn OAuth sign-in
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        toast.error('Failed to sign in. Please try again.')
      }
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
