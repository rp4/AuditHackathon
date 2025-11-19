'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle } from 'lucide-react'

const supabase = createClient()

export default function DevLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('devuser@localhost.dev')
  const [password, setPassword] = useState('devpassword123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Block access in production
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <p className="text-red-800">This page is only available in development mode.</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.session) {
        console.log('✅ [DEV-LOGIN] Logged in successfully:', data.user.email)
        router.push('/browse')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🔧</div>
          <h2 className="text-3xl font-bold">Development Login</h2>
          <p className="text-gray-600 mt-2">
            Email/password auth for local development
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <p className="font-semibold text-yellow-900">Default credentials:</p>
            <p className="text-yellow-700">Email: devuser@localhost.dev</p>
            <p className="text-yellow-700">Password: devpassword123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
