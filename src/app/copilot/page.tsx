'use client'

import { useSession, signIn } from 'next-auth/react'
import { ChatInterface } from '@/components/copilot/ChatInterface'
import { Loader2, LogIn, Shield } from 'lucide-react'
import Image from 'next/image'

export default function CopilotPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="text-center max-w-lg">
          <div className="mb-8">
            <Image
              src="/copilot.png"
              alt="AuditSwarm Copilot"
              width={80}
              height={80}
              className="mx-auto mb-4"
            />
            <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">
              AuditSwarm Copilot
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              AI-powered audit workflow assistant
            </p>
          </div>

          <button
            onClick={() => signIn('linkedin', { callbackUrl: '/copilot' })}
            className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg hover:shadow-xl"
          >
            <LogIn className="w-5 h-5" />
            Sign in with LinkedIn
          </button>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-500">
            <Shield className="w-4 h-4" />
            <span>Secure OAuth 2.0 authentication</span>
          </div>
        </div>
      </div>
    )
  }

  const user = {
    id: session.user.id,
    email: session.user.email || '',
    name: session.user.name || '',
    image: session.user.image,
    isAdmin: session.user.isAdmin,
  }

  return <ChatInterface user={user} />
}
