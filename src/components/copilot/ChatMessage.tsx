'use client'

import { memo, useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { User, Paperclip, Wrench, CheckCircle, XCircle, Loader2, ChevronRight, ChevronDown, Code2, Play, Image as ImageIcon } from 'lucide-react'
import type { ChatMessage as ChatMessageType, ToolCall, CodeExecutionBlock, GeneratedImage } from '@/lib/copilot/types'

interface ChatMessageProps {
  message: ChatMessageType
}

function ToolCallDisplay({ toolCall }: { toolCall: ToolCall }) {
  const [isQueryExpanded, setIsQueryExpanded] = useState(false)
  const [isResponseExpanded, setIsResponseExpanded] = useState(false)

  return (
    <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
      <div className="flex items-center gap-2 text-sm">
        <Wrench className="w-4 h-4 text-gray-500" />
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {toolCall.name}
        </span>
        {toolCall.status === 'pending' && (
          <span className="text-gray-400">Pending</span>
        )}
        {toolCall.status === 'running' && (
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
        )}
        {toolCall.status === 'completed' && (
          <CheckCircle className="w-4 h-4 text-green-500" />
        )}
        {toolCall.status === 'error' && (
          <XCircle className="w-4 h-4 text-red-500" />
        )}
      </div>

      <div className="mt-2">
        <button
          onClick={() => setIsQueryExpanded(!isQueryExpanded)}
          className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          {isQueryExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
          <span>{isQueryExpanded ? 'Hide' : 'Show'} raw query</span>
        </button>
        {isQueryExpanded && (
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-mono overflow-x-auto">
            <pre className="whitespace-pre-wrap">{JSON.stringify(toolCall.arguments || {}, null, 2)}</pre>
          </div>
        )}
      </div>

      {toolCall.result && (
        <div className="mt-2">
          <button
            onClick={() => setIsResponseExpanded(!isResponseExpanded)}
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {isResponseExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            <span>{isResponseExpanded ? 'Hide' : 'Show'} raw response</span>
          </button>
          {isResponseExpanded && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-mono overflow-x-auto">
              <pre className="whitespace-pre-wrap">{toolCall.result}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function summarizeToolArgs(name: string, args: Record<string, unknown>): string {
  if (name === 'delegate_to' && args.agent) {
    const task = args.task ? String(args.task) : ''
    const truncated = task.length > 60 ? task.slice(0, 60) + '...' : task
    return `${args.agent}${truncated ? `: ${truncated}` : ''}`
  }
  if (args.entity) return String(args.entity)
  if (args.query) {
    const q = String(args.query)
    return q.length > 60 ? q.slice(0, 60) + '...' : q
  }
  const firstVal = Object.values(args)[0]
  return firstVal ? String(firstVal).slice(0, 50) : ''
}

function CompactToolCallDisplay({ toolCall }: { toolCall: ToolCall }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const summary = summarizeToolArgs(toolCall.name, toolCall.arguments || {})

  return (
    <div className="rounded bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-center gap-2 px-2.5 py-1.5 text-xs">
        <Wrench className="w-3 h-3 text-gray-400 flex-shrink-0" />
        <span className="font-medium text-gray-600 dark:text-gray-400">{toolCall.name}</span>
        {summary && (
          <span className="text-gray-400 dark:text-gray-500 truncate">{summary}</span>
        )}
        <span className="ml-auto flex-shrink-0">
          {toolCall.status === 'running' && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
          {toolCall.status === 'completed' && <CheckCircle className="w-3 h-3 text-green-500" />}
          {toolCall.status === 'error' && <XCircle className="w-3 h-3 text-red-500" />}
        </span>
        {(toolCall.result || Object.keys(toolCall.arguments || {}).length > 0) && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        )}
      </div>
      {isExpanded && (
        <div className="px-2.5 pb-2 space-y-1">
          <div className="text-[10px] text-gray-500 dark:text-gray-500 font-mono overflow-x-auto">
            <pre className="whitespace-pre-wrap">{JSON.stringify(toolCall.arguments || {}, null, 2)}</pre>
          </div>
          {toolCall.result && (
            <div className="text-[10px] text-gray-500 dark:text-gray-500 font-mono overflow-x-auto border-t border-gray-200 dark:border-gray-700 pt-1">
              <pre className="whitespace-pre-wrap">{toolCall.result}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StepActivityGroup({ stepLabel, toolCalls }: { stepLabel: string; toolCalls: ToolCall[] }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const isAllDone = toolCalls.every(tc => tc.status === 'completed' || tc.status === 'error')
  const hasError = toolCalls.some(tc => tc.status === 'error')

  return (
    <div className="mt-2 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-2 w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 text-sm font-medium text-left hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        <span className="text-gray-700 dark:text-gray-300 flex-1 truncate">{stepLabel}</span>
        {!isAllDone && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />}
        {isAllDone && !hasError && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
        {isAllDone && hasError && <XCircle className="w-3.5 h-3.5 text-red-500" />}
        <span className="text-xs text-gray-400">{toolCalls.filter(tc => tc.status === 'completed').length}/{toolCalls.length}</span>
      </button>
      {!isCollapsed && (
        <div className="px-2 py-1.5 space-y-1">
          {toolCalls.map(tc => (
            <CompactToolCallDisplay key={tc.id} toolCall={tc} />
          ))}
        </div>
      )}
    </div>
  )
}

function CodeExecutionDisplay({ codeBlock }: { codeBlock: CodeExecutionBlock }) {
  const [isCodeExpanded, setIsCodeExpanded] = useState(true)
  const [isOutputExpanded, setIsOutputExpanded] = useState(true)

  return (
    <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-sm">
        <Code2 className="w-4 h-4 text-purple-500" />
        <span className="font-medium text-gray-700 dark:text-gray-300">
          Python Code Execution
        </span>
        {codeBlock.status === 'running' && (
          <Loader2 className="w-4 h-4 animate-spin text-blue-500 ml-auto" />
        )}
        {codeBlock.status === 'completed' && (
          <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
        )}
        {codeBlock.status === 'error' && (
          <XCircle className="w-4 h-4 text-red-500 ml-auto" />
        )}
      </div>

      <div className="border-b border-gray-200 dark:border-gray-600">
        <button
          onClick={() => setIsCodeExpanded(!isCodeExpanded)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors w-full"
        >
          {isCodeExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
          <span>Code</span>
        </button>
        {isCodeExpanded && (
          <div className="px-3 pb-3">
            <pre className="text-xs font-mono bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
              <code>{codeBlock.code}</code>
            </pre>
          </div>
        )}
      </div>

      {codeBlock.output !== undefined && (
        <div>
          <button
            onClick={() => setIsOutputExpanded(!isOutputExpanded)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors w-full"
          >
            {isOutputExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            <Play className="w-3 h-3" />
            <span>Output</span>
          </button>
          {isOutputExpanded && (
            <div className="px-3 pb-3">
              <pre className={`text-xs font-mono p-3 rounded overflow-x-auto whitespace-pre-wrap ${
                codeBlock.status === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              }`}>
                {codeBlock.output || '(no output)'}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function GeneratedImageDisplay({ image }: { image: GeneratedImage }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const dataUrl = `data:${image.mimeType};base64,${image.data}`

  return (
    <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-sm">
        <ImageIcon className="w-4 h-4 text-purple-500" />
        <span className="font-medium text-gray-700 dark:text-gray-300">
          Generated Image
        </span>
      </div>
      <div className="p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dataUrl}
          alt="AI-generated image"
          className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ maxHeight: isExpanded ? 'none' : '400px', objectFit: 'contain' }}
        />
      </div>
    </div>
  )
}

export const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  // Group tool calls: ungrouped (orchestrator-level) vs grouped by step label
  const { ungroupedToolCalls, stepGroups } = useMemo(() => {
    if (!message.toolCalls || message.toolCalls.length === 0) {
      return { ungroupedToolCalls: [], stepGroups: [] as Array<{ label: string; toolCalls: ToolCall[] }> }
    }

    const ungrouped: ToolCall[] = []
    const groupMap = new Map<string, ToolCall[]>()
    const groupOrder: string[] = []

    for (const tc of message.toolCalls) {
      if (tc.stepLabel) {
        if (!groupMap.has(tc.stepLabel)) {
          groupMap.set(tc.stepLabel, [])
          groupOrder.push(tc.stepLabel)
        }
        groupMap.get(tc.stepLabel)!.push(tc)
      } else {
        ungrouped.push(tc)
      }
    }

    const groups = groupOrder.map(label => ({ label, toolCalls: groupMap.get(label)! }))
    return { ungroupedToolCalls: ungrouped, stepGroups: groups }
  }, [message.toolCalls])

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-blue-600'
            : 'bg-transparent'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <img src="/queen.png" alt="Agent" className="w-6 h-6 object-contain" />
        )}
      </div>

      <div
        className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}
      >
        <div
          className={`px-4 py-3 ${
            isUser ? 'chat-message-user' : 'chat-message-assistant'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    const isInline = !match

                    if (isInline) {
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      )
                    }

                    return (
                      <div className="relative">
                        <div className="absolute top-2 right-2 text-xs text-gray-400">
                          {match[1]}
                        </div>
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </div>
                    )
                  },
                  a({ children, ...props }) {
                    return (
                      <a {...props} target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    )
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300"
              >
                <Paperclip className="w-4 h-4" />
                <span className="truncate max-w-[150px]">{attachment.name}</span>
              </div>
            ))}
          </div>
        )}

        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 w-full space-y-2">
            {ungroupedToolCalls.map((toolCall) => (
              <ToolCallDisplay key={toolCall.id} toolCall={toolCall} />
            ))}
            {stepGroups.map((group) => (
              <StepActivityGroup key={group.label} stepLabel={group.label} toolCalls={group.toolCalls} />
            ))}
          </div>
        )}

        {message.codeExecutions && message.codeExecutions.length > 0 && (
          <div className="mt-2 w-full space-y-2">
            {message.codeExecutions.map((codeBlock) => (
              <CodeExecutionDisplay key={codeBlock.id} codeBlock={codeBlock} />
            ))}
          </div>
        )}

        {message.images && message.images.length > 0 && (
          <div className="mt-2 w-full space-y-2">
            {message.images.map((image) => (
              <GeneratedImageDisplay key={image.id} image={image} />
            ))}
          </div>
        )}

        <span className="mt-1 text-xs text-gray-400">
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  )
})
