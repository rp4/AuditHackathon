'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { signOut } from 'next-auth/react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { ChatHistory } from './ChatHistory'
import { ModelSelector } from './ModelSelector'
import { AgentSelector } from './AgentSelector'
import { useChatStore } from '@/lib/copilot/stores/chatStore'
import { useSessionStore } from '@/lib/copilot/stores/sessionStore'
import { getAgentOption } from '@/lib/copilot/adk/agents/registry'
import { Menu, PanelLeftClose, Plus, LogOut, User as UserIcon, Square, BarChart3, Shield, AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { GeminiModel, AgentId, FileAttachment } from '@/lib/copilot/types'

interface User {
  id: string
  email: string
  name: string
  image?: string | null
  isAdmin?: boolean
}

interface ChatInterfaceProps {
  user: User | null
}

export function ChatInterface({ user }: ChatInterfaceProps) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [model, setModel] = useState<GeminiModel>('gemini-3-flash-preview')
  const [agentId, setAgentId] = useState<AgentId>('copilot')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const [budgetStatus, setBudgetStatus] = useState<{
    spend: number
    limit: number | null
    remaining: number | null
  } | null>(null)

  useEffect(() => {
    const fetchBudget = async () => {
      try {
        const res = await fetch('/api/copilot/usage')
        if (res.ok) {
          const data = await res.json()
          setBudgetStatus(data.currentMonth)
        }
      } catch {
        // ignore
      }
    }
    fetchBudget()
    const interval = setInterval(fetchBudget, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const {
    getCurrentMessages,
    isLoading,
    error,
    sendMessage,
    stopGeneration,
    setSessionId,
    deleteSessionMessages,
  } = useChatStore()

  const messages = getCurrentMessages()

  const {
    sessions,
    currentSessionId,
    createSession,
    selectSession,
    deleteSession,
    updateSession,
  } = useSessionStore()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(
    async (content: string, attachments?: FileAttachment[]) => {
      try {
        let sessionId = currentSessionId
        if (!sessionId) {
          sessionId = createSession(model)
        }

        setSessionId(sessionId)

        const title = content.slice(0, 50) + (content.length > 50 ? '...' : '')
        updateSession(sessionId, { title })

        await sendMessage(content, attachments, model, agentId)
      } catch (error) {
        console.error('handleSend error:', error)
        useChatStore.getState().setError(
          error instanceof Error ? error.message : 'Failed to send message'
        )
      }
    },
    [currentSessionId, createSession, model, agentId, sendMessage, updateSession, setSessionId]
  )

  const handleNewChat = useCallback(() => {
    const newSessionId = createSession(model)
    setSessionId(newSessionId)
  }, [createSession, model, setSessionId])

  const handleSessionSelect = useCallback(
    (sessionId: string) => {
      selectSession(sessionId)
      setSessionId(sessionId)
    },
    [selectSession, setSessionId]
  )

  const handleDeleteSession = useCallback(
    (sessionId: string) => {
      deleteSession(sessionId)
      deleteSessionMessages(sessionId)
    },
    [deleteSession, deleteSessionMessages]
  )

  useEffect(() => {
    if (currentSessionId) {
      setSessionId(currentSessionId)
    }
  }, [currentSessionId, setSessionId])

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-72' : 'w-0'
        } flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 overflow-hidden`}
      >
        <div className="flex flex-col h-full w-72">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <ChatHistory
              sessions={sessions}
              currentSessionId={currentSessionId}
              onSelect={handleSessionSelect}
              onDelete={handleDeleteSession}
            />
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <AgentSelector value={agentId} onChange={setAgentId} fullWidth />
            <ModelSelector value={model} onChange={setModel} fullWidth />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
            <Image src="/copilot.png" alt="Copilot" width={28} height={28} />
            <h1 className="font-semibold text-gray-900 dark:text-white">
              {agentId === 'copilot' ? 'AuditSwarm Copilot' : (
                <>
                  <span className="mr-1.5">{getAgentOption(agentId)?.icon}</span>
                  {getAgentOption(agentId)?.name || 'AuditSwarm Copilot'}
                </>
              )}
            </h1>
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase() || <UserIcon className="w-4 h-4" />}
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {user?.name?.charAt(0).toUpperCase() || <UserIcon className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false)
                      router.push('/copilot/usage')
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-sm font-medium">My Usage</span>
                  </button>
                  {user?.isAdmin && (
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        router.push('/copilot/admin')
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      <span className="text-sm font-medium">Admin Dashboard</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setUserMenuOpen(false)
                      signOut({ callbackUrl: '/' })
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="text-center max-w-md">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {agentId === 'copilot' && 'How can I help you today?'}
                  {agentId === 'judge' && 'Ready to score your audit?'}
                  {agentId.startsWith('character:') && `Interview: ${getAgentOption(agentId)?.name}`}
                </h2>
                {agentId.startsWith('character:') && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {getAgentOption(agentId)?.title} — Cooperation: {getAgentOption(agentId)?.cooperationLevel}
                  </p>
                )}

                {error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-left mt-4">
                  {(agentId === 'copilot' ? [
                    { icon: '🕵️', text: 'Start a Bluth Company audit challenge' },
                    { icon: '✨', text: 'Create a workflow for a T&E audit' },
                    { icon: '🔍', text: 'Show me all open audits' },
                    { icon: '📄', text: 'What are my assigned tasks?' },
                  ] : agentId === 'judge' ? [
                    { icon: '📋', text: 'Here are my findings from the Bluth audit...' },
                    { icon: '❓', text: 'How does the scoring work?' },
                    { icon: '🏆', text: 'What score do I need for excellent?' },
                    { icon: '📊', text: 'Evaluate my audit based on our conversation' },
                  ] : [
                    { icon: '👋', text: 'Hello, I have a few questions for you' },
                    { icon: '🔐', text: 'Can you tell me about your system access?' },
                    { icon: '📝', text: 'Walk me through your daily responsibilities' },
                    { icon: '🤔', text: 'Have you noticed anything unusual recently?' },
                  ]).map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleSend(action.text)}
                      className="p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors text-left"
                    >
                      <span className="mr-2">{action.icon}</span>
                      {action.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {isLoading && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">{getAgentOption(agentId)?.icon || '🤖'}</span>
                  </div>
                  <div className="flex gap-1 py-3">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                  <button
                    onClick={stopGeneration}
                    className="ml-2 p-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg transition-colors"
                    title="Stop generating"
                  >
                    <Square className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="currentColor" />
                  </button>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="max-w-3xl mx-auto p-4">
            {budgetStatus?.limit != null && budgetStatus.remaining !== null && (
              budgetStatus.remaining <= 0 ? (
                <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  Monthly spending limit reached. Contact your admin to continue.
                </div>
              ) : budgetStatus.remaining / budgetStatus.limit < 0.2 ? (
                <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {`${Math.round((budgetStatus.spend / budgetStatus.limit) * 100)}% of monthly budget used ($${budgetStatus.remaining.toFixed(2)} remaining)`}
                </div>
              ) : null
            )}
            <ChatInput onSend={handleSend} disabled={isLoading} />
            <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-500">
              Gemini may display inaccurate info. All AI suggestions require your approval.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
