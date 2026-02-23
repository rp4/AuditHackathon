'use client'

import Image from 'next/image'
import { Trophy, Workflow, Target } from 'lucide-react'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface LeaderboardEntry {
  id: string
  name: string | null
  image: string | null
  username: string | null
  issuesFound: number
  workflowsCreated: number
}

export default function LeaderboardPage() {
  const { user } = useAuth()
  const { data, isLoading } = useLeaderboard(50)

  const entries: LeaderboardEntry[] = data?.entries || []

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <Trophy className="h-8 w-8 text-brand-500" />
            <h1 className="text-3xl md:text-4xl font-black">Leaderboard</h1>
          </div>
          <p className="text-gray-500">
            Find audit issues in the Bluth Company data to climb the ranks
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <LoadingSpinner />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && entries.length === 0 && (
          <div className="text-center py-20">
            <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600">
              No discoveries yet
            </h3>
            <p className="text-gray-400 mt-2">
              Be the first to find issues — submit a report to the Judge!
            </p>
          </div>
        )}

        {/* Leaderboard Table */}
        {!isLoading && entries.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-[3rem_1fr_6rem_6rem] md:grid-cols-[4rem_1fr_8rem_8rem] items-center px-4 py-3 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div className="text-center">#</div>
              <div>Auditor</div>
              <div className="text-center">Found</div>
              <div className="text-center">Workflows</div>
            </div>

            {/* Rows */}
            {entries.map((entry, index) => {
              const rank = index + 1
              const isCurrentUser = user?.id === entry.id

              return (
                <div
                  key={entry.id}
                  className={`grid grid-cols-[3rem_1fr_6rem_6rem] md:grid-cols-[4rem_1fr_8rem_8rem] items-center px-4 py-3 border-b last:border-b-0 transition-colors ${
                    isCurrentUser
                      ? 'bg-brand-50 border-brand-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Rank */}
                  <div className="text-center">
                    {rank <= 3 ? (
                      <span className="text-lg">
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-gray-400">
                        {rank}
                      </span>
                    )}
                  </div>

                  {/* Player */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-8 w-8 rounded-full overflow-hidden bg-gradient-to-br from-brand-400 to-brand-600 shrink-0">
                      {entry.image ? (
                        <Image
                          src={entry.image}
                          alt={entry.name || 'User'}
                          fill
                          className="object-cover"
                          sizes="32px"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-white text-xs font-semibold">
                          {entry.name?.[0] || '?'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">
                        {entry.name || 'Anonymous'}
                        {isCurrentUser && (
                          <span className="ml-1 text-xs text-brand-600 font-normal">
                            (you)
                          </span>
                        )}
                      </div>
                      {entry.username && (
                        <div className="text-xs text-gray-400 truncate">
                          @{entry.username}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Issues Found */}
                  <div className="text-center">
                    <span className="font-bold text-sm">
                      {entry.issuesFound}
                    </span>
                  </div>

                  {/* Workflows Created */}
                  <div className="text-center flex items-center justify-center gap-1">
                    <Workflow className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {entry.workflowsCreated}
                    </span>
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
