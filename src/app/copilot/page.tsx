'use client'

import { useSession } from 'next-auth/react'
import { ChatInterface } from '@/components/copilot/ChatInterface'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function CopilotFullscreenPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <LoadingSpinner fullPage />
  }

  const user = session?.user
    ? {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.name || '',
        image: session.user.image,
        isAdmin: session.user.isAdmin,
      }
    : null

  return <ChatInterface user={user} />
}
