import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatSession, GeminiModel } from '@/lib/copilot/types'

interface SessionState {
  sessions: ChatSession[]
  currentSessionId: string | null
}

interface SessionActions {
  createSession: (model?: GeminiModel) => string
  selectSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => void
  clearSessions: () => void
}

type SessionStore = SessionState & SessionActions

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      // State
      sessions: [],
      currentSessionId: null,

      // Actions
      createSession: (model = 'gemini-3-flash-preview') => {
        const newSession: ChatSession = {
          id: crypto.randomUUID(),
          title: 'New Chat',
          model,
          createdAt: new Date(),
          updatedAt: new Date(),
          messageCount: 0,
        }

        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: newSession.id,
        }))

        return newSession.id
      },

      selectSession: (sessionId) => {
        set({ currentSessionId: sessionId })
      },

      deleteSession: (sessionId) => {
        set((state) => {
          const newSessions = state.sessions.filter((s) => s.id !== sessionId)
          const newCurrentId =
            state.currentSessionId === sessionId
              ? newSessions[0]?.id || null
              : state.currentSessionId

          return {
            sessions: newSessions,
            currentSessionId: newCurrentId,
          }
        })
      },

      updateSession: (sessionId, updates) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, ...updates, updatedAt: new Date() }
              : s
          ),
        }))
      },

      clearSessions: () => {
        set({ sessions: [], currentSessionId: null })
      },
    }),
    {
      name: 'copilot-sessions',
      partialize: (state) => ({
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.sessions = state.sessions.map((s) => ({
            ...s,
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.updatedAt),
          }))
        }
      },
    }
  )
)
