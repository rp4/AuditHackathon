'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '@/hooks/useAuth'

// Wrapper component that waits for auth to be ready
function QueryProviderWithAuth({ children }: { children: React.ReactNode }) {
  const { loading: authLoading } = useAuth()
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // Wait a tick after auth is ready to ensure all state is settled
    if (!authLoading) {
      console.log('✅ [QUERY-PROVIDER] Auth initialization complete, rendering content')
      // Small delay to ensure auth state propagates
      const timer = setTimeout(() => setShowContent(true), 100)
      return () => clearTimeout(timer)
    } else {
      console.log('⏳ [QUERY-PROVIDER] Waiting for auth initialization...')
    }
  }, [authLoading])

  if (!showContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
      <AuthProvider>
        <QueryProviderWithAuth>
          {children}
        </QueryProviderWithAuth>
      </AuthProvider>
    </QueryClientProvider>
  )
}
