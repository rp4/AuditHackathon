import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatMessage, FileAttachment, GeminiModel, AgentId, StreamChunk } from '@/lib/copilot/types'

interface ChatState {
  messagesById: Record<string, ChatMessage[]> // sessionId -> messages[]
  currentSessionId: string | null
  isLoading: boolean
  error: string | null
  abortController: AbortController | null
}

interface ChatActions {
  getCurrentMessages: () => ChatMessage[]
  addMessage: (message: ChatMessage) => void
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void
  removeMessage: (id: string) => void
  clearMessages: () => void
  deleteSessionMessages: (sessionId: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSessionId: (sessionId: string | null) => void
  stopGeneration: () => void
  sendMessage: (
    content: string,
    attachments?: FileAttachment[],
    model?: GeminiModel,
    agentId?: AgentId,
    onFirstMessage?: (content: string) => void,
    options?: { canvasMode?: boolean; runMode?: { swarmId: string; swarmSlug: string }; selectedNodeId?: string; selectedNodeLabel?: string }
  ) => Promise<void>
}

type ChatStore = ChatState & ChatActions

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // State
      messagesById: {},
      currentSessionId: null,
      isLoading: false,
      error: null,
      abortController: null,

      getCurrentMessages: () => {
        const { messagesById, currentSessionId } = get()
        return currentSessionId ? messagesById[currentSessionId] || [] : []
      },

      addMessage: (message) => {
        const { currentSessionId, messagesById } = get()
        if (!currentSessionId) return

        set({
          messagesById: {
            ...messagesById,
            [currentSessionId]: [
              ...(messagesById[currentSessionId] || []),
              message,
            ],
          },
        })
      },

      updateMessage: (id, updates) => {
        const { currentSessionId, messagesById } = get()
        if (!currentSessionId) return

        const sessionMessages = messagesById[currentSessionId] || []
        set({
          messagesById: {
            ...messagesById,
            [currentSessionId]: sessionMessages.map((m) =>
              m.id === id ? { ...m, ...updates } : m
            ),
          },
        })
      },

      removeMessage: (id) => {
        const { currentSessionId, messagesById } = get()
        if (!currentSessionId) return

        const sessionMessages = messagesById[currentSessionId] || []
        set({
          messagesById: {
            ...messagesById,
            [currentSessionId]: sessionMessages.filter((m) => m.id !== id),
          },
        })
      },

      clearMessages: () => {
        const { currentSessionId, messagesById } = get()
        if (!currentSessionId) return

        set({
          messagesById: {
            ...messagesById,
            [currentSessionId]: [],
          },
          error: null,
        })
      },

      deleteSessionMessages: (sessionId) => {
        const { messagesById } = get()
        const newMessagesById = { ...messagesById }
        delete newMessagesById[sessionId]
        set({ messagesById: newMessagesById })
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      setError: (error) => {
        set({ error })
      },

      setSessionId: (sessionId) => {
        set({ currentSessionId: sessionId })
      },

      stopGeneration: () => {
        const { abortController } = get()
        if (abortController) {
          abortController.abort()
          set({ abortController: null, isLoading: false })
        }
      },

      sendMessage: async (
        content,
        attachments,
        model = 'gemini-3-flash-preview',
        agentId = 'copilot',
        onFirstMessage,
        options
      ) => {
        const { currentSessionId } = get()
        if (!currentSessionId) {
          set({ error: 'No active session. Please create a new chat.' })
          return
        }

        set({ error: null })

        // Add user message
        const userMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'user',
          content,
          attachments,
          createdAt: new Date(),
        }
        get().addMessage(userMessage)
        set({ isLoading: true })

        // Prepare assistant message placeholder
        const assistantMessageId = crypto.randomUUID()
        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          createdAt: new Date(),
        }
        get().addMessage(assistantMessage)

        if (onFirstMessage) {
          onFirstMessage(content)
        }

        const abortController = new AbortController()
        set({ abortController })

        try {
          // Build conversation history (exclude the messages we just added)
          const currentMessages = get().getCurrentMessages()
          const previousMessages = currentMessages.slice(0, -2)
          const history = previousMessages.map((m) => ({
            role: m.role,
            content: m.content,
          }))

          const response = await fetch('/api/copilot/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: content,
              attachments,
              model,
              sessionId: currentSessionId,
              history,
              agentId,
              ...(options?.canvasMode && { canvasMode: true }),
              ...(options?.runMode && { runMode: options.runMode }),
              ...(options?.selectedNodeId && { selectedNodeId: options.selectedNodeId, selectedNodeLabel: options.selectedNodeLabel }),
            }),
            signal: abortController.signal,
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `Request failed: ${response.status}`)
          }

          const reader = response.body?.getReader()
          if (!reader) {
            throw new Error('No response stream available')
          }

          const decoder = new TextDecoder()
          let accumulatedContent = ''
          let sseBuffer = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            sseBuffer += decoder.decode(value, { stream: true })
            const segments = sseBuffer.split('\n')
            sseBuffer = segments.pop() || ''

            const lines = segments.filter((line) => line.startsWith('data: '))

            for (const line of lines) {
              const data = line.slice(6)
              if (data === '[DONE]') continue

              try {
                const parsed: StreamChunk = JSON.parse(data)

                switch (parsed.type) {
                  case 'text':
                    accumulatedContent += parsed.content || ''
                    get().updateMessage(assistantMessageId, {
                      content: accumulatedContent,
                    })
                    break

                  case 'tool_call':
                    if (parsed.toolCall) {
                      const currentMessages = get().getCurrentMessages()
                      const existingMessage = currentMessages.find(
                        (m) => m.id === assistantMessageId
                      )
                      get().updateMessage(assistantMessageId, {
                        toolCalls: [
                          ...(existingMessage?.toolCalls || []),
                          parsed.toolCall,
                        ],
                      })
                    }
                    break

                  case 'tool_result':
                    if (parsed.toolCall) {
                      const currentMessages = get().getCurrentMessages()
                      const message = currentMessages.find(
                        (m) => m.id === assistantMessageId
                      )
                      if (message?.toolCalls) {
                        const updatedToolCalls = message.toolCalls.map((tc) =>
                          tc.id === parsed.toolCall?.id
                            ? { ...tc, ...parsed.toolCall }
                            : tc
                        )
                        get().updateMessage(assistantMessageId, {
                          toolCalls: updatedToolCalls,
                        })
                      }
                    }
                    break

                  case 'code_execution':
                    if (parsed.codeExecution) {
                      const currentMessages = get().getCurrentMessages()
                      const existingMessage = currentMessages.find(
                        (m) => m.id === assistantMessageId
                      )
                      const codeBlockId = crypto.randomUUID()
                      get().updateMessage(assistantMessageId, {
                        codeExecutions: [
                          ...(existingMessage?.codeExecutions || []),
                          {
                            id: codeBlockId,
                            code: parsed.codeExecution.code,
                            language: parsed.codeExecution.language,
                            status: 'running',
                          },
                        ],
                      })
                    }
                    break

                  case 'code_result':
                    if (parsed.codeExecution) {
                      const currentMessages = get().getCurrentMessages()
                      const message = currentMessages.find(
                        (m) => m.id === assistantMessageId
                      )
                      if (message?.codeExecutions && message.codeExecutions.length > 0) {
                        const updatedCodeExecutions = [...message.codeExecutions]
                        const lastIndex = updatedCodeExecutions.length - 1
                        updatedCodeExecutions[lastIndex] = {
                          ...updatedCodeExecutions[lastIndex],
                          output: parsed.codeExecution.output,
                          status: parsed.codeExecution.status,
                        }
                        get().updateMessage(assistantMessageId, {
                          codeExecutions: updatedCodeExecutions,
                        })
                      }
                    }
                    break

                  case 'image':
                    if (parsed.image) {
                      const currentMessages = get().getCurrentMessages()
                      const existingMessage = currentMessages.find(
                        (m) => m.id === assistantMessageId
                      )
                      const imageId = crypto.randomUUID()
                      get().updateMessage(assistantMessageId, {
                        images: [
                          ...(existingMessage?.images || []),
                          {
                            id: imageId,
                            data: parsed.image.data,
                            mimeType: parsed.image.mimeType,
                          },
                        ],
                      })
                    }
                    break

                  case 'step_status':
                    if (parsed.stepStatus && typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('copilot:step-status', {
                        detail: parsed.stepStatus,
                      }))
                    }
                    break

                  case 'error':
                    set({ error: parsed.error || 'An error occurred' })
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('copilot:step-status-clear'))
                    }
                    break

                  case 'done':
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('copilot:step-status-clear'))
                    }
                    break
                }
              } catch (e) {
                console.error('Failed to parse stream chunk:', e)
              }
            }
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            return
          }

          console.error('Chat error:', error)
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to send message'
          set({ error: errorMessage })

          get().removeMessage(assistantMessageId)
        } finally {
          set({ isLoading: false, abortController: null })
        }
      },
    }),
    {
      name: 'copilot-messages',
      partialize: (state) => ({
        messagesById: state.messagesById,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.messagesById) {
          Object.keys(state.messagesById).forEach((sessionId) => {
            state.messagesById[sessionId] = state.messagesById[sessionId].map(
              (m) => ({
                ...m,
                createdAt: new Date(m.createdAt),
              })
            )
          })
        }
      },
    }
  )
)
