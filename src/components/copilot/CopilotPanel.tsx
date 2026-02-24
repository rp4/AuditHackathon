'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { LogIn, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useCopilotPanelStore } from '@/lib/copilot/stores/panelStore'
import { useCopilotOptions } from '@/lib/copilot/CopilotOptionsContext'
import { ChatInterface } from '@/components/copilot/ChatInterface'

export function CopilotPanel() {
  const { isOpen, closePanel, setReferrerPath } = useCopilotPanelStore()
  const { user, isAuthenticated, signIn } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const copilotOptions = useCopilotOptions()

  // Don't render on /copilot routes (fullscreen page handles itself)
  const isCopilotRoute = pathname?.startsWith('/copilot')

  // Escape key closes panel
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closePanel])

  if (isCopilotRoute) return null

  const copilotUser = isAuthenticated && user ? {
    id: user.id,
    email: user.email || '',
    name: user.name || '',
    image: user.image,
    isAdmin: user.isAdmin,
  } : null

  return (
    <div
      className={`shrink-0 bg-white border-r border-stone-200 overflow-hidden transition-all duration-300 ease-out ${
        isOpen ? 'w-[480px]' : 'w-0'
      }`}
    >
      <div className="w-[480px] h-full">
        {copilotUser ? (
          <ChatInterface
            user={copilotUser}
            compact
            onExpandRequest={() => {
              if (pathname) setReferrerPath(pathname)
              closePanel()
              router.push('/copilot')
            }}
            onWorkflowGenerated={copilotOptions.onWorkflowGenerated}
            copilotOptions={{
              canvasMode: copilotOptions.canvasMode,
              runMode: copilotOptions.runMode,
              selectedNodeId: copilotOptions.selectedNodeId,
              selectedNodeLabel: copilotOptions.selectedNodeLabel,
            }}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center px-6 text-center bg-stone-50">
            <button
              onClick={closePanel}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <Image src="/copilot.png" alt="AI Copilot" width={48} height={48} className="mb-4" />
            <h3 className="text-lg font-semibold text-stone-800 mb-2">AI Copilot</h3>
            <p className="text-sm text-stone-500 mb-6">
              Sign in to use the AI assistant to generate workflows from natural language.
            </p>
            <Button
              onClick={() => signIn()}
              className="bg-[#0A66C2] hover:bg-[#004182] text-white"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign in with LinkedIn
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
