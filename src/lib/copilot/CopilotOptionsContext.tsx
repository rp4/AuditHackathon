'use client'

import { createContext, useContext, useCallback, useRef, useState, useEffect, type ReactNode } from 'react'

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

interface CopilotOptionsContextValue {
  options: CopilotPageOptions
  register: (ref: React.RefObject<CopilotPageOptions>) => void
  unregister: () => void
}

const CopilotOptionsContext = createContext<CopilotOptionsContextValue>({
  options: {},
  register: () => {},
  unregister: () => {},
})

export function CopilotOptionsProvider({ children }: { children: ReactNode }) {
  const optionsRef = useRef<React.RefObject<CopilotPageOptions> | null>(null)
  const [, forceUpdate] = useState(0)

  const register = useCallback((ref: React.RefObject<CopilotPageOptions>) => {
    optionsRef.current = ref
    forceUpdate((n) => n + 1)
  }, [])

  const unregister = useCallback(() => {
    optionsRef.current = null
    forceUpdate((n) => n + 1)
  }, [])

  // Read from the page's ref to always get latest closure values
  const options = optionsRef.current?.current ?? {}

  return (
    <CopilotOptionsContext.Provider value={{ options, register, unregister }}>
      {children}
    </CopilotOptionsContext.Provider>
  )
}

/**
 * Read current copilot options (used by CopilotPanel)
 */
export function useCopilotOptions(): CopilotPageOptions {
  const { options } = useContext(CopilotOptionsContext)
  return options
}

/**
 * Register page-specific copilot options (used by create/edit pages).
 * Uses a ref so the panel always calls the latest callback closure.
 */
export function useRegisterCopilotOptions(opts: CopilotPageOptions) {
  const { register, unregister } = useContext(CopilotOptionsContext)
  const optsRef = useRef<CopilotPageOptions>(opts)
  optsRef.current = opts

  useEffect(() => {
    register(optsRef as React.RefObject<CopilotPageOptions>)
    return () => unregister()
  }, [register, unregister])

  // Re-register when dynamic options change so the provider re-renders
  // and the context value reflects the latest selectedNodeId
  const selectedNodeId = opts.selectedNodeId
  useEffect(() => {
    register(optsRef as React.RefObject<CopilotPageOptions>)
  }, [register, selectedNodeId])
}
