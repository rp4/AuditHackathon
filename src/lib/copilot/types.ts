// Chat types
export interface GeneratedImage {
  id: string
  data: string // base64 encoded
  mimeType: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  attachments?: FileAttachment[]
  toolCalls?: ToolCall[]
  codeExecutions?: CodeExecutionBlock[]
  images?: GeneratedImage[]
  createdAt: Date
}

export interface CodeExecutionBlock {
  id: string
  code: string
  language: string
  output?: string
  status: 'running' | 'completed' | 'error'
}

export interface FileAttachment {
  id: string
  name: string
  mimeType: string
  size: number
  data?: string // Base64 encoded
}

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
  result?: string
  status: 'pending' | 'running' | 'completed' | 'error'
  stepLabel?: string // present when this tool call belongs to a step-executor sub-agent
}

export interface ChatSession {
  id: string
  title: string
  model: GeminiModel
  createdAt: Date
  updatedAt: Date
  messageCount?: number
  lastMessage?: string
}

// Gemini model types
export type GeminiModel = 'gemini-3-flash-preview' | 'gemini-3-pro-preview'

export interface ModelConfig {
  id: GeminiModel
  name: string
  description: string
  maxTokens: number
  supportsTools: boolean
}

// Agent types
export type AgentId = string // e.g. 'copilot', 'judge', 'character:gob'

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface CodeExecution {
  code: string
  language: string
  output?: string
  status: 'running' | 'completed' | 'error'
}

export interface StepStatus {
  nodeId: string
  status: 'executing' | 'review' | 'completed' | 'error'
  result?: string // included when status='review' (the draft deliverable)
}

export interface StreamChunk {
  type: 'text' | 'tool_call' | 'tool_result' | 'code_execution' | 'code_result' | 'image' | 'error' | 'done' | 'step_status'
  content?: string
  toolCall?: ToolCall
  codeExecution?: CodeExecution
  image?: { data: string; mimeType: string }
  stepStatus?: StepStatus
  error?: string
}

// Tool result types
export interface ToolResult {
  success: boolean
  result?: unknown
  error?: string
}
