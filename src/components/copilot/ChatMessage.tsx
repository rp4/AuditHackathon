'use client'

import { memo, useState } from 'react'
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
            {message.toolCalls.map((toolCall) => (
              <ToolCallDisplay key={toolCall.id} toolCall={toolCall} />
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
