'use client'

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import * as auth from '@/lib/supabase/auth'
import { useQueryClient } from '@tanstack/react-query'

// Get the singleton client instance
const supabase = createClient()

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<auth.AuthResponse>
  signUp: (
    email: string,
    password: string,
    metadata?: { username?: string; full_name?: string }
  ) => Promise<auth.AuthResponse>
  signInWithOAuth: (provider: 'google' | 'github') => Promise<{ error: auth.AuthError | null }>
  signOut: () => Promise<{ error: auth.AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: auth.AuthError | null }>
  updatePassword: (newPassword: string) => Promise<{ error: auth.AuthError | null }>
  updateUserMetadata: (metadata: {
    username?: string
    full_name?: string
    avatar_url?: string
  }) => Promise<{ user: User | null; error: auth.AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Session timeout: 30 minutes of inactivity
  useEffect(() => {
    if (!session) return

    const IDLE_TIMEOUT = 30 * 60 * 1000 // 30 minutes
    let timeoutId: NodeJS.Timeout

    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId)

      timeoutId = setTimeout(async () => {
        console.log('Session timed out due to inactivity')
        await auth.signOut()
        window.location.href = '/login?reason=timeout'
      }, IDLE_TIMEOUT)
    }

    // Activity events that reset the timeout
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

    const handleActivity = () => {
      resetTimeout()
    }

    // Set up listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    // Start initial timeout
    resetTimeout()

    // Cleanup
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [session])

  useEffect(() => {
    const DEV_USER_ID = '51b0255c-de4d-45d5-90fb-af62e5291435'
    const isDevelopment = process.env.NODE_ENV === 'development' &&
                          typeof window !== 'undefined' &&
                          window.location.hostname === 'localhost'

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // Auto-login in development mode if not already logged in
      if (isDevelopment && !session) {
        console.log('🔧 DEV MODE: No session found, attempting auto-login...')
        try {
          const response = await fetch('/api/dev-auth', {
            method: 'POST',
            credentials: 'include'
          })
          const data = await response.json()

          if (data.success && data.session) {
            // Set the session directly using the tokens
            const { data: authData, error } = await supabase.auth.setSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token
            })

            if (error) {
              console.error('❌ DEV MODE: Failed to set session:', error)
            } else if (authData.session) {
              console.log('✅ DEV MODE: Auto-logged in as user:', DEV_USER_ID)
              setSession(authData.session)
              setUser(authData.user)
            }
          } else {
            console.error('❌ DEV MODE: Auto-login failed:', data.error || 'Unknown error')
            if (data.details) {
              console.error('Details:', data.details)
            }
          }
        } catch (error) {
          console.error('❌ DEV MODE: Auto-login request failed:', error)
        }
      } else {
        setSession(session)
        setUser(session?.user ?? null)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const wasLoggedOut = !session && user
      const wasLoggedIn = session && !user

      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Invalidate queries when auth state changes
      if (wasLoggedIn || wasLoggedOut) {
        console.log('🔄 Auth state changed, invalidating queries...')
        queryClient.invalidateQueries({ queryKey: ['agents'] })
        queryClient.invalidateQueries({ queryKey: ['platforms'] })
        queryClient.invalidateQueries({ queryKey: ['categories'] })
      }
    })

    return () => subscription.unsubscribe()
  }, [user, queryClient])

  // Validate session when window regains focus (user returns to tab)
  // and periodically check for expired sessions
  useEffect(() => {
    const validateSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        // Session is invalid or expired
        if (user) {
          console.log('🔄 Session expired, refreshing page...')
          // Clear auth state and reload
          setUser(null)
          setSession(null)
          queryClient.invalidateQueries()
          window.location.reload()
        }
      } else if (!user && session) {
        // We have a session but no user state - sync it
        setSession(session)
        setUser(session.user)
        queryClient.invalidateQueries({ queryKey: ['agents'] })
        queryClient.invalidateQueries({ queryKey: ['platforms'] })
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // User returned to tab - validate session
        validateSession()
      }
    }

    const handleFocus = () => {
      // User focused window - validate session
      validateSession()
    }

    // Periodic session check (every 5 minutes)
    const intervalId = setInterval(() => {
      validateSession()
    }, 5 * 60 * 1000) // 5 minutes

    // Listen for visibility changes and focus events
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [user, queryClient, supabase])

  const value = {
    user,
    session,
    loading,
    signIn: auth.signIn,
    signUp: auth.signUp,
    signInWithOAuth: auth.signInWithOAuth,
    signOut: auth.signOut,
    resetPassword: auth.resetPassword,
    updatePassword: auth.updatePassword,
    updateUserMetadata: auth.updateUserMetadata,
  }

  return React.createElement(AuthContext.Provider, { value }, children)
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Custom hook for checking authentication status
export function useRequireAuth(redirectTo = '/login') {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = redirectTo
    }
  }, [user, loading, redirectTo])

  return { user, loading }
}

// Custom hook for profile data
export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await (supabase
        .from('profiles') as any)
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      setProfile(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile')
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (userId) {
      fetchProfile(userId)
    }
  }, [userId, fetchProfile])

  const updateProfile = useCallback(async (updates: Record<string, any>) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await (supabase
        .from('profiles') as any)
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [userId])

  return { profile, loading, error, refetch: () => userId && fetchProfile(userId), updateProfile }
}