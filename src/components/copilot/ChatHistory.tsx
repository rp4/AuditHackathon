'use client'

import { memo } from 'react'
import { MessageSquare, Trash2 } from 'lucide-react'
import type { ChatSession } from '@/lib/copilot/types'

interface ChatHistoryProps {
  sessions: ChatSession[]
  currentSessionId: string | null
  onSelect: (sessionId: string) => void
  onDelete: (sessionId: string) => void
}

export const ChatHistory = memo(function ChatHistory({
  sessions,
  currentSessionId,
  onSelect,
  onDelete,
}: ChatHistoryProps) {
  if (sessions.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No conversations yet</p>
        <p className="text-xs mt-1">Start a new chat to begin</p>
      </div>
    )
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const groups: { label: string; sessions: ChatSession[] }[] = [
    { label: 'Today', sessions: [] },
    { label: 'Yesterday', sessions: [] },
    { label: 'Previous 7 Days', sessions: [] },
    { label: 'Older', sessions: [] },
  ]

  sessions.forEach((session) => {
    const sessionDate = new Date(session.updatedAt)
    sessionDate.setHours(0, 0, 0, 0)

    if (sessionDate >= today) {
      groups[0].sessions.push(session)
    } else if (sessionDate >= yesterday) {
      groups[1].sessions.push(session)
    } else if (sessionDate >= weekAgo) {
      groups[2].sessions.push(session)
    } else {
      groups[3].sessions.push(session)
    }
  })

  return (
    <div className="py-2">
      {groups
        .filter((group) => group.sessions.length > 0)
        .map((group) => (
          <div key={group.label} className="mb-4">
            <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {group.label}
            </h3>
            <div className="space-y-1">
              {group.sessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={session.id === currentSessionId}
                  onSelect={onSelect}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        ))}
    </div>
  )
})

interface SessionItemProps {
  session: ChatSession
  isActive: boolean
  onSelect: (sessionId: string) => void
  onDelete: (sessionId: string) => void
}

const SessionItem = memo(function SessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
}: SessionItemProps) {
  return (
    <div
      className={`group flex items-center gap-2 mx-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        isActive
          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
      onClick={() => onSelect(session.id)}
    >
      <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-60" />
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm truncate ${
            isActive
              ? 'font-medium'
              : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          {session.title}
        </p>
        {session.lastMessage && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {session.lastMessage}
          </p>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(session.id)
        }}
        className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-all"
        title="Delete conversation"
      >
        <Trash2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </button>
    </div>
  )
})
