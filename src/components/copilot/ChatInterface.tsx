'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { signIn, signOut } from 'next-auth/react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { ChatHistory } from './ChatHistory'
import { ModelSelector } from './ModelSelector'
import { AgentSelector } from './AgentSelector'
import { useChatStore } from '@/lib/copilot/stores/chatStore'
import { useSessionStore } from '@/lib/copilot/stores/sessionStore'
import { useCopilotPanelStore } from '@/lib/copilot/stores/panelStore'
import { getAgentOption } from '@/lib/copilot/adk/agents/registry'
import { Menu, PanelLeftClose, Plus, LogOut, User as UserIcon, Square, BarChart3, Shield, AlertTriangle, Maximize2, Minimize2, Sparkles, FileText, Search, Play } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { GeminiModel, AgentId, FileAttachment } from '@/lib/copilot/types'
import { useSiteConfig } from '@/lib/site/SiteContext'

function LoadingDots({ size = 32 }: { size?: number }) {
  const dotSize = Math.round(size / 5)
  return (
    <div className="flex items-center gap-1" style={{ width: size, height: size, justifyContent: 'center' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
          style={{
            width: dotSize,
            height: dotSize,
            animationDelay: `${i * 0.15}s`,
            animationDuration: '0.8s',
          }}
        />
      ))}
    </div>
  )
}

interface User {
  id: string
  email: string
  name: string
  image?: string | null
  isAdmin?: boolean
}

interface ChatInterfaceProps {
  user: User | null
  compact?: boolean
  onExpandRequest?: () => void
  onWorkflowGenerated?: (data: { name: string; description: string; nodes: unknown[]; edges: unknown[]; metadata?: unknown; categorySlug?: string }) => void
  copilotOptions?: { canvasMode?: boolean; runMode?: { swarmId: string; swarmSlug: string }; selectedNodeId?: string; selectedNodeLabel?: string }
}

export function ChatInterface({ user, compact = false, onExpandRequest, onWorkflowGenerated, copilotOptions }: ChatInterfaceProps) {
  const router = useRouter()
  const site = useSiteConfig()
  const { openPanel, referrerPath, clearReferrer } = useCopilotPanelStore()
  const [sidebarOpen, setSidebarOpen] = useState(!compact)
  const [model, setModel] = useState<GeminiModel>('gemini-3-flash-preview')
  const [agentId, setAgentId] = useState<AgentId>('copilot')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const processedToolCalls = useRef<Set<string>>(new Set())
  // Messages created before this timestamp are from localStorage persistence —
  // we skip navigation for those. Messages created after are from live streaming.
  const mountedAt = useRef(Date.now())

  // Auth gate: intercept all interactions when user is not signed in
  const handleAuthGate = useCallback(
    (e: React.MouseEvent | React.FocusEvent) => {
      if (!user) {
        e.preventDefault()
        e.stopPropagation()
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`${window.location.origin}/copilot`)}`)
      }
    },
    [user, router]
  )

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

  // Detect tool call completions (create_workflow, save_step_result, etc.)
  // Navigate only for tool calls from live streaming, not from localStorage persistence.
  // We compare the message's createdAt against the component mount time to distinguish.
  useEffect(() => {
    for (const msg of messages) {
      if (msg.role !== 'assistant' || !msg.toolCalls) continue

      for (const tc of msg.toolCalls) {
        if (tc.status !== 'completed') continue
        if (processedToolCalls.current.has(tc.id)) continue

        processedToolCalls.current.add(tc.id)

        // Messages created before this component mounted are from persistence — skip.
        const createdAt = msg.createdAt instanceof Date ? msg.createdAt.getTime() : new Date(msg.createdAt).getTime()
        const isLive = createdAt >= mountedAt.current

        // DEBUG: remove after fixing navigation
        if (tc.name === 'create_workflow' || tc.name === 'save_step_result' || tc.name === 'update_workflow' || tc.name === 'get_step_context') {
          console.log(`[copilot-nav] ${tc.name}`, {
            isLive,
            createdAt,
            mountedAt: mountedAt.current,
            diff: createdAt - mountedAt.current,
            hasResult: !!tc.result,
            resultPreview: tc.result?.slice(0, 200),
            canvasMode: copilotOptions?.canvasMode,
          })
        }

        if (!isLive) continue

        // Handle create_workflow
        if (tc.name === 'create_workflow') {
          // Canvas mode: pass data to onWorkflowGenerated callback
          if (copilotOptions?.canvasMode && onWorkflowGenerated) {
            try {
              const resultData = tc.result ? JSON.parse(tc.result) : null
              if (resultData?.canvasMode && resultData.nodes) {
                onWorkflowGenerated({
                  name: resultData.name || '',
                  description: resultData.description || '',
                  nodes: resultData.nodes || [],
                  edges: resultData.edges || [],
                  metadata: resultData.metadata,
                  categorySlug: resultData.categorySlug,
                })
              }
            } catch {
              // Result might not be JSON — ignore
            }
          } else if (!copilotOptions?.canvasMode && tc.result) {
            // Non-canvas mode: save draft to localStorage and navigate to /create
            try {
              const resultData = JSON.parse(tc.result)
              const nodes = (resultData.nodes as unknown[]) || []
              const edges = (resultData.edges as unknown[]) || []
              const name = (resultData.name as string) || ''
              const description = (resultData.description as string) || ''
              const categorySlug = resultData.categorySlug as string | undefined

              console.log('[copilot-nav] create_workflow draft', { nodesCount: nodes.length, name, description })

              if (nodes.length > 0) {
                const draft = {
                  formData: { name, description },
                  workflowNodes: nodes,
                  workflowEdges: edges,
                  categorySlug,
                }
                localStorage.setItem('draft-swarm-workflow', JSON.stringify(draft))
                console.log('[copilot-nav] navigating to /create')
                router.push('/create')
                openPanel()
              }
            } catch (err) {
              console.error('[copilot-nav] create_workflow parse error', err)
            }
          }
        }

        // Handle save_step_result → navigate to edit page for user review
        // NOTE: In the new architecture, execute_steps uses step_status events instead.
        // This handler is kept for backwards compatibility if save_step_result is called directly.
        if (tc.name === 'save_step_result') {
          try {
            const resultData = tc.result ? JSON.parse(tc.result) : null
            if (resultData?.pendingReview) {
              const draft = {
                nodeId: resultData.nodeId,
                result: resultData.result,
                completed: resultData.completed,
                timestamp: Date.now(),
              }
              localStorage.setItem('draft-step-result', JSON.stringify(draft))
              router.push(`/swarms/${resultData.swarmSlug}/edit?node=${resultData.nodeId}&draft=1`)
              openPanel()
            }
          } catch {
            // ignore parse errors
          }
        }

        // Handle update_step → dispatch event so the edit page can patch local node state
        if (tc.name === 'update_step') {
          try {
            const resultData = tc.result ? JSON.parse(tc.result) : null
            if (resultData?.nodeId && resultData?.patched) {
              window.dispatchEvent(new CustomEvent('copilot:step-updated', {
                detail: { nodeId: resultData.nodeId, patched: resultData.patched },
              }))
            }
          } catch {
            // ignore parse errors
          }
        }

        // Handle update_workflow → dispatch event so the edit page can refetch, then navigate
        if (tc.name === 'update_workflow') {
          try {
            const resultData = tc.result ? JSON.parse(tc.result) : null
            if (resultData?.slug) {
              window.dispatchEvent(new CustomEvent('copilot:workflow-updated', {
                detail: { slug: resultData.slug },
              }))
              router.push(`/swarms/${resultData.slug}/edit`)
              openPanel()
            }
          } catch {
            // ignore parse errors
          }
        }

        // Handle get_step_context → navigate to the workflow's edit page with node selected
        if (tc.name === 'get_step_context') {
          try {
            const resultData = tc.result ? JSON.parse(tc.result) : null
            if (resultData?.swarmSlug && resultData?.step?.nodeId) {
              router.push(`/swarms/${resultData.swarmSlug}/edit?node=${resultData.step.nodeId}`)
              openPanel()
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    }
  }, [messages, onWorkflowGenerated, copilotOptions?.canvasMode, router, openPanel])

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

        await sendMessage(content, attachments, model, agentId, undefined, copilotOptions)
      } catch (error) {
        console.error('handleSend error:', error)
        useChatStore.getState().setError(
          error instanceof Error ? error.message : 'Failed to send message'
        )
      }
    },
    [currentSessionId, createSession, model, agentId, sendMessage, updateSession, setSessionId, copilotOptions]
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

  // Compact mode: no sidebar, simplified header
  if (compact) {
    return (
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900" onClickCapture={handleAuthGate} onFocusCapture={handleAuthGate}>
        {/* Compact Header */}
        <header className="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Image src="/copilot.png" alt="Copilot" width={22} height={22} />
            <h1 className="font-medium text-sm text-gray-900 dark:text-white">
              {agentId === 'copilot' ? 'Copilot' : (getAgentOption(agentId)?.name || 'Copilot')}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleNewChat}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="New chat"
            >
              <Plus className="w-4 h-4 text-gray-500" />
            </button>
            {onExpandRequest && (
              <button
                onClick={onExpandRequest}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Expand to full view"
              >
                <Maximize2 className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="text-center max-w-sm">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  How can I help?
                </h2>
                <div className="flex flex-col gap-2 mt-3">
                  {[
                    { icon: Sparkles, label: 'Create a workflow', color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-900/30 border-brand-200 dark:border-brand-800' },
                    { icon: FileText, label: 'Edit step instructions', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' },
                    { icon: Play, label: 'Run a step', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800' },
                  ].map((action) => (
                    <button
                      key={action.label}
                      onClick={() => handleSend(action.label)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border ${action.bg} hover:shadow-sm transition-all`}
                    >
                      <action.icon className={`w-3 h-3 ${action.color}`} />
                      <span className={action.color}>{action.label}</span>
                    </button>
                  ))}
                </div>
                {error && (
                  <div className="mb-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="px-3 py-4 space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {isLoading && (
                <div className="flex items-center gap-2">
                  <LoadingDots size={32} />
                  <button
                    onClick={stopGeneration}
                    className="p-1.5 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg transition-colors"
                    title="Stop generating"
                  >
                    <Square className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" fill="currentColor" />
                  </button>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="px-3 py-2">
            <ChatInput onSend={handleSend} disabled={isLoading} />
          </div>
        </div>
      </div>
    )
  }

  // Full mode (original layout)
  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900" onClickCapture={handleAuthGate} onFocusCapture={handleAuthGate}>
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
            <button
              onClick={() => {
                const target = referrerPath || '/create'
                clearReferrer()
                openPanel()
                router.push(target)
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={referrerPath ? 'Back to previous page' : 'Open in side panel'}
            >
              <Minimize2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <Image src="/copilot.png" alt="Copilot" width={28} height={28} />
            <h1 className="font-semibold text-gray-900 dark:text-white">
              {agentId === 'copilot' ? `${site.name} Copilot` : (
                <>
                  <span className="mr-1.5">{getAgentOption(agentId)?.icon}</span>
                  {getAgentOption(agentId)?.name || `${site.name} Copilot`}
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
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-brand-400 to-brand-600">
                {user?.image ? (
                  <Image src={user.image} alt={user?.name || 'Profile'} fill className="object-cover" sizes="32px" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-white font-semibold text-sm">
                    {user?.name?.charAt(0).toUpperCase() || <UserIcon className="w-4 h-4" />}
                  </div>
                )}
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-brand-400 to-brand-600">
                      {user?.image ? (
                        <Image src={user.image} alt={user?.name || 'Profile'} fill className="object-cover" sizes="40px" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-white font-semibold">
                          {user?.name?.charAt(0).toUpperCase() || <UserIcon className="w-5 h-5" />}
                        </div>
                      )}
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
              <div className="w-full max-w-2xl">
                {/* Welcome heading */}
                <h2 className="text-3xl font-semibold text-center text-gray-900 dark:text-white mb-8">
                  {agentId === 'copilot' && 'Welcome, how can I help?'}
                  {agentId === 'judge' && 'Ready to score your audit?'}
                  {agentId.startsWith('character:') && `Interview: ${getAgentOption(agentId)?.name}`}
                </h2>
                {agentId.startsWith('character:') && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
                    {getAgentOption(agentId)?.title} — Cooperation: {getAgentOption(agentId)?.cooperationLevel}
                  </p>
                )}

                {error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {budgetStatus?.limit != null && budgetStatus.remaining !== null && (
                  budgetStatus.remaining <= 0 ? (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      Monthly spending limit reached. Contact your admin to continue.
                    </div>
                  ) : budgetStatus.remaining / budgetStatus.limit < 0.2 ? (
                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      {`${Math.round((budgetStatus.spend / budgetStatus.limit) * 100)}% of monthly budget used ($${budgetStatus.remaining.toFixed(2)} remaining)`}
                    </div>
                  ) : null
                )}

                {/* Centered input */}
                <div className="mb-8">
                  <ChatInput onSend={handleSend} disabled={isLoading} />
                </div>

                {/* Suggestion cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(agentId === 'copilot' ? [
                    { icon: Sparkles, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-900/20', title: 'Create a workflow', subtitle: 'Generate from scratch' },
                    { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', title: 'Complete an audit', subtitle: 'Practice your skills' },
                    { icon: Search, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', title: 'Explore the Bluth data', subtitle: 'Browse available work' },
                  ] : agentId === 'judge' ? [
                    { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', title: 'Here are my findings from the Bluth audit', subtitle: 'Submit your work' },
                    { icon: Search, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', title: 'Show me my issue discovery progress', subtitle: 'Track your score' },
                    { icon: Sparkles, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-900/20', title: 'How does the scoring work?', subtitle: 'Understand the criteria' },
                  ] : [
                    { icon: Sparkles, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-900/20', title: 'Hello, I have a few questions for you', subtitle: 'Start the interview' },
                    { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', title: 'Walk me through your daily responsibilities', subtitle: 'Understand their role' },
                    { icon: Search, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', title: 'Have you noticed anything unusual recently?', subtitle: 'Ask about red flags' },
                  ]).map((card, index) => (
                    <button
                      key={index}
                      onClick={() => handleSend(card.title)}
                      className="flex flex-col gap-2 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left group"
                    >
                      <div className={`w-8 h-8 ${card.bg} rounded-lg flex items-center justify-center`}>
                        <card.icon className={`w-4 h-4 ${card.color}`} />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white leading-snug">
                        {card.title}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {card.subtitle}
                      </span>
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
                  <LoadingDots size={40} />
                  <button
                    onClick={stopGeneration}
                    className="p-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg transition-colors"
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

        {/* Input Area - only shown when there are messages */}
        {messages.length > 0 && (
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
                Copilot may display inaccurate info. All AI suggestions require your approval.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
