'use client'

import { createContext, useContext, type ReactNode } from 'react'

interface CopilotPageOptions {
  canvasMode?: boolean
  runMode?: { swarmId: string; swarmSlug: string }
  selectedNodeId?: string
  selectedNodeLabel?: string
  onWorkflowGenerated?: (data: {
    name: string
    description: string
    nodes: unknown[]
    edges: unknown[]
    metadata?: unknown
    categorySlug?: string
  }) => void
}

const CopilotOptionsContext = createContext<{ options: CopilotPageOptions }>({
  options: {},
})

export function CopilotOptionsProvider({ children }: { children: ReactNode }) {
  return (
    <CopilotOptionsContext.Provider value={{ options: {} }}>
      {children}
    </CopilotOptionsContext.Provider>
  )
}

export function useCopilotOptions(): CopilotPageOptions {
  const { options } = useContext(CopilotOptionsContext)
  return options
}

export function useRegisterCopilotOptions(_opts: CopilotPageOptions) {
  // No-op in standalone mode
}
