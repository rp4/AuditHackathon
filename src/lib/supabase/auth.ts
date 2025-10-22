import { supabase } from './client'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthError {
  message: string
  code?: string
}

export interface AuthResponse {
  user: User | null
  session: Session | null
  error: AuthError | null
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(
  email: string,
  password: string,
  metadata?: {
    username?: string
    full_name?: string
  }
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      return { user: null, session: null, error: { message: error.message, code: error.name } }
    }

    return { user: data.user, session: data.session, error: null }
  } catch (err) {
    return {
      user: null,
      session: null,
      error: { message: err instanceof Error ? err.message : 'Unknown error occurred' },
    }
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { user: null, session: null, error: { message: error.message, code: error.name } }
    }

    return { user: data.user, session: data.session, error: null }
  } catch (err) {
    return {
      user: null,
      session: null,
      error: { message: err instanceof Error ? err.message : 'Unknown error occurred' },
    }
  }
}

/**
 * Sign in with OAuth provider (Google, GitHub, etc.)
 */
export async function signInWithOAuth(
  provider: 'google' | 'github'
): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      return { error: { message: error.message, code: error.name } }
    }

    return { error: null }
  } catch (err) {
    return {
      error: { message: err instanceof Error ? err.message : 'Unknown error occurred' },
    }
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { error: { message: error.message, code: error.name } }
    }

    return { error: null }
  } catch (err) {
    return {
      error: { message: err instanceof Error ? err.message : 'Unknown error occurred' },
    }
  }
}

/**
 * Get the current user session
 */
export async function getSession(): Promise<{
  session: Session | null
  error: AuthError | null
}> {
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      return { session: null, error: { message: error.message, code: error.name } }
    }

    return { session: data.session, error: null }
  } catch (err) {
    return {
      session: null,
      error: { message: err instanceof Error ? err.message : 'Unknown error occurred' },
    }
  }
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<{
  user: User | null
  error: AuthError | null
}> {
  try {
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      return { user: null, error: { message: error.message, code: error.name } }
    }

    return { user: data.user, error: null }
  } catch (err) {
    return {
      user: null,
      error: { message: err instanceof Error ? err.message : 'Unknown error occurred' },
    }
  }
}

/**
 * Reset password for a user
 */
export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      return { error: { message: error.message, code: error.name } }
    }

    return { error: null }
  } catch (err) {
    return {
      error: { message: err instanceof Error ? err.message : 'Unknown error occurred' },
    }
  }
}

/**
 * Update password for authenticated user
 */
export async function updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      return { error: { message: error.message, code: error.name } }
    }

    return { error: null }
  } catch (err) {
    return {
      error: { message: err instanceof Error ? err.message : 'Unknown error occurred' },
    }
  }
}

/**
 * Update user metadata
 */
export async function updateUserMetadata(metadata: {
  username?: string
  full_name?: string
  avatar_url?: string
}): Promise<{ user: User | null; error: AuthError | null }> {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: metadata,
    })

    if (error) {
      return { user: null, error: { message: error.message, code: error.name } }
    }

    return { user: data.user, error: null }
  } catch (err) {
    return {
      user: null,
      error: { message: err instanceof Error ? err.message : 'Unknown error occurred' },
    }
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange(callback)
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { session } = await getSession()
  return !!session
}