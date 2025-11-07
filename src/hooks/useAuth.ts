'use client'

import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react'
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

  // Use ref to access current user in validation without triggering re-renders
  const userRef = useRef(user)
  useEffect(() => {
    userRef.current = user
  }, [user])

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
    console.log('🔐 [AUTH-PROVIDER] Initializing auth state...')
    const DEV_USER_ID = '51b0255c-de4d-45d5-90fb-af62e5291435'
    const isDevelopment = process.env.NODE_ENV === 'development' &&
                          typeof window !== 'undefined' &&
                          window.location.hostname === 'localhost'

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('📋 [AUTH-PROVIDER] Initial session check:', {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        expiresAt: session?.expires_at,
        timestamp: new Date().toISOString()
      })

      // Auto-login in development mode if not already logged in
      if (isDevelopment && !session) {
        console.log('🔧 [AUTH-PROVIDER] DEV MODE: No session found, attempting auto-login...')
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
              console.error('❌ [AUTH-PROVIDER] DEV MODE: Failed to set session:', error)
            } else if (authData.session) {
              console.log('✅ [AUTH-PROVIDER] DEV MODE: Auto-logged in as user:', DEV_USER_ID)
              setSession(authData.session)
              setUser(authData.user)
            }
          } else {
            console.error('❌ [AUTH-PROVIDER] DEV MODE: Auto-login failed:', data.error || 'Unknown error')
            if (data.details) {
              console.error('[AUTH-PROVIDER] Details:', data.details)
            }
          }
        } catch (error) {
          console.error('❌ [AUTH-PROVIDER] DEV MODE: Auto-login request failed:', error)
        }
      } else {
        console.log('📝 [AUTH-PROVIDER] Setting initial session state')
        setSession(session)
        setUser(session?.user ?? null)
      }
      setLoading(false)
      console.log('✅ [AUTH-PROVIDER] Initial auth state set, loading complete')
    })

    // Listen for auth changes
    console.log('👂 [AUTH-PROVIDER] Setting up auth state change listener')
    let isInitialChange = true
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Skip the first INITIAL_SESSION event to avoid double initialization
      if (isInitialChange && _event === 'INITIAL_SESSION') {
        console.log('⏩ [AUTH-PROVIDER] Skipping INITIAL_SESSION event (already handled)')
        isInitialChange = false
        return
      }

      const currentUser = userRef.current
      const wasLoggedOut = !session && currentUser
      const wasLoggedIn = session && !currentUser

      console.log('🔄 [AUTH-PROVIDER] Auth state changed:', {
        event: _event,
        hasSession: !!session,
        userId: session?.user?.id,
        wasLoggedOut,
        wasLoggedIn,
        timestamp: new Date().toISOString()
      })

      setSession(session)
      setUser(session?.user ?? null)

      // Only invalidate queries on actual auth transitions (not during initial load)
      if (wasLoggedIn || wasLoggedOut) {
        console.log('🔄 [AUTH-PROVIDER] Auth state changed, invalidating queries...')
        queryClient.invalidateQueries({ queryKey: ['agents'] })
        queryClient.invalidateQueries({ queryKey: ['platforms'] })
        queryClient.invalidateQueries({ queryKey: ['categories'] })
      }
    })

    return () => subscription.unsubscribe()
  }, [queryClient]) // Remove 'user' from dependencies to prevent re-initialization

  // Validate session when window regains focus (user returns to tab)
  // and periodically check for expired sessions
  useEffect(() => {
    const validateSession = async () => {
      console.log('🔍 [AUTH-PROVIDER] Validating session...')
      const { data: { session }, error } = await supabase.auth.getSession()
      const currentUser = userRef.current

      console.log('📊 [AUTH-PROVIDER] Session validation result:', {
        hasSession: !!session,
        hasError: !!error,
        hasUser: !!currentUser,
        userId: session?.user?.id,
        timestamp: new Date().toISOString()
      })

      if (error || !session) {
        // Session is invalid or expired
        if (currentUser) {
          console.warn('⚠️ [AUTH-PROVIDER] Session expired, refreshing page...')
          // Clear auth state and reload
          setUser(null)
          setSession(null)
          queryClient.invalidateQueries()
          window.location.reload()
        }
      } else if (!currentUser && session) {
        // We have a session but no user state - sync it
        console.log('🔄 [AUTH-PROVIDER] Syncing session state (had session but no user)')
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
  }, [queryClient]) // Removed user and supabase to prevent unnecessary re-runs

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