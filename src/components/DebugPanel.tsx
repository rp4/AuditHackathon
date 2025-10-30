'use client'

import { useAgents } from '@/hooks/useAgents'
import { useEffect, useState } from 'react'
import { getPlatforms } from '@/lib/supabase/queries'
import type { Platform } from '@/types/database'

/**
 * Debug panel to show what's happening with data fetching
 * Add this to any page to see live data status
 */
export function DebugPanel() {
  const { data: agents, isLoading, error, dataUpdatedAt } = useAgents({ limit: 20 })
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [platformsError, setPlatformsError] = useState<Error | null>(null)

  useEffect(() => {
    console.log('🐛 DebugPanel: Fetching platforms...')
    getPlatforms()
      .then((data) => {
        console.log('🐛 DebugPanel: Platforms loaded:', data.length)
        setPlatforms(data)
      })
      .catch((err) => {
        console.error('🐛 DebugPanel: Platforms error:', err)
        setPlatformsError(err)
      })
  }, [])

  useEffect(() => {
    console.log('🐛 DebugPanel: Agents state changed:', {
      loading: isLoading,
      agentsCount: agents?.length,
      error: error,
      dataUpdatedAt: new Date(dataUpdatedAt).toLocaleTimeString(),
    })
  }, [agents, isLoading, error, dataUpdatedAt])

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white text-xs p-4 rounded-lg shadow-lg max-w-md z-50 font-mono">
      <div className="font-bold mb-2 text-yellow-400">🐛 DEBUG PANEL</div>

      <div className="space-y-2">
        <div>
          <strong>Platforms:</strong>{' '}
          {platformsError ? (
            <span className="text-red-400">Error: {platformsError.message}</span>
          ) : (
            <span className="text-green-400">{platforms.length} loaded</span>
          )}
        </div>

        <div>
          <strong>Agents Query:</strong>{' '}
          {isLoading ? (
            <span className="text-yellow-400">Loading...</span>
          ) : error ? (
            <span className="text-red-400">Error: {error.message}</span>
          ) : (
            <span className="text-green-400">{agents?.length || 0} loaded</span>
          )}
        </div>

        {dataUpdatedAt > 0 && (
          <div className="text-gray-400">
            Last update: {new Date(dataUpdatedAt).toLocaleTimeString()}
          </div>
        )}

        {error && (
          <div className="mt-2 p-2 bg-red-900/50 rounded text-xs overflow-auto max-h-32">
            <strong>Error Details:</strong>
            <pre>{JSON.stringify(error, null, 2)}</pre>
          </div>
        )}

        {agents && agents.length > 0 && (
          <div className="mt-2 p-2 bg-green-900/30 rounded">
            <strong>Sample Agent:</strong>
            <div className="text-xs mt-1">
              • {agents[0].name} ({agents[0].slug})
              <br />• Public: {agents[0].is_public ? 'Yes' : 'No'}
              <br />• Platforms: {agents[0].agent_platforms?.length || 0}
            </div>
          </div>
        )}

        {platforms.length > 0 && (
          <div className="mt-2 text-xs text-gray-300">
            <strong>Platforms:</strong> {platforms.map(p => p.name).join(', ')}
          </div>
        )}
      </div>
    </div>
  )
}
