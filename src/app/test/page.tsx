'use client'

import { useAuth } from '@/hooks/useAuth'
import { signIn as nextAuthSignIn } from 'next-auth/react'
import { useState, useEffect } from 'react'

export default function TestPage() {
  const { user, isAuthenticated, isLoading, signIn, signOut } = useAuth()
  const [tools, setTools] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [platforms, setPlatforms] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch data
  const fetchData = async () => {
    setLoadingData(true)
    setError(null)

    try {
      // Fetch tools
      const toolsRes = await fetch('/api/tools')
      if (!toolsRes.ok) throw new Error('Failed to fetch tools')
      const toolsData = await toolsRes.json()
      setTools(toolsData.tools || [])

      // Fetch categories (from database seed)
      const categoriesRes = await fetch('/api/categories')
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData || [])
      }

      // Fetch platforms (from database seed)
      const platformsRes = await fetch('/api/platforms')
      if (platformsRes.ok) {
        const platformsData = await platformsRes.json()
        setPlatforms(platformsData || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🧪 Migration Test Page</h1>

        {/* Authentication Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Authentication Status</h2>

          {isAuthenticated ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-green-800">Authenticated</p>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm font-mono text-gray-700">
                  <strong>User ID:</strong> {user?.id}<br/>
                  <strong>Name:</strong> {user?.name || 'Not set'}<br/>
                  <strong>Email:</strong> {user?.email}
                </p>
              </div>

              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-yellow-800">Not Authenticated</p>
                  <p className="text-sm text-gray-600">Sign in to test authenticated features</p>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => signIn()}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Sign In with LinkedIn
                </button>

                <button
                  onClick={() => nextAuthSignIn('credentials', {
                    callbackUrl: '/test',
                    email: 'dev@openauditswarms.com',
                    password: 'devpassword123'
                  })}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                >
                  Sign In as Dev User (dev@openauditswarms.com)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Database Connection */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Database Connection</h2>
            <button
              onClick={fetchData}
              disabled={loadingData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loadingData ? 'Loading...' : 'Refresh Data'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Categories */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Categories ({categories.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {categories.map((cat: any) => (
                <div key={cat.id} className="bg-blue-50 border border-blue-200 rounded p-2">
                  <p className="font-medium text-sm">{cat.name}</p>
                  <p className="text-xs text-gray-600">{cat.slug}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Platforms */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Platforms ({platforms.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {platforms.map((platform: any) => (
                <div key={platform.id} className="bg-green-50 border border-green-200 rounded p-2">
                  <p className="font-medium text-sm">{platform.name}</p>
                  <p className="text-xs text-gray-600">{platform.slug}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tools */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Tools ({tools.length})</h3>
            {tools.length === 0 ? (
              <p className="text-gray-500 text-sm">No tools found. Database seeded with sample tool.</p>
            ) : (
              <div className="space-y-4">
                {tools.map((tool: any) => (
                  <div key={tool.id} className="border border-gray-200 rounded p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-lg">{tool.name}</h4>
                        <p className="text-sm text-gray-500">{tool.slug}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {tool.is_featured && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                            Featured
                          </span>
                        )}
                        {tool.is_public && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            Public
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-3">{tool.short_description}</p>

                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      <span>⭐ {tool.rating_avg.toFixed(1)} ({tool.rating_count})</span>
                      <span>❤️ {tool.favorites_count}</span>
                      <span>👁️ {tool.views_count}</span>
                      <span>⬇️ {tool.downloads_count}</span>
                    </div>

                    {tool.tool_platforms && tool.tool_platforms.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {tool.tool_platforms.map((tp: any) => (
                          <span key={tp.id} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {tp.platform.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">System Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <p className="font-semibold text-gray-700">Database</p>
              <p className="text-gray-600">Cloud SQL PostgreSQL</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="font-semibold text-gray-700">Authentication</p>
              <p className="text-gray-600">NextAuth.js</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="font-semibold text-gray-700">ORM</p>
              <p className="text-gray-600">Prisma</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="font-semibold text-gray-700">Storage</p>
              <p className="text-gray-600">Google Cloud Storage</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
