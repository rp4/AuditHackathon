'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'

export function useLeaderboard(limit = 50) {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard?limit=${limit}`)
      if (!res.ok) throw new Error('Failed to fetch leaderboard')
      return res.json()
    },
    staleTime: 60 * 1000,
  })
}

export function useMyDiscoveries() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['my-discoveries', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/audit-issues/my-discoveries')
      if (!res.ok) throw new Error('Failed to fetch discoveries')
      return res.json()
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  })
}
