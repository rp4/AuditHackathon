import { createClient } from './client'
import type { User, Session } from '@supabase/supabase-js'
import zxcvbn from 'zxcvbn'

// Get singleton instance
const supabase = createClient()

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
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean
  score: number
  feedback: string[]
} {
  // Minimum length check
  if (password.length < 12) {
    return {
      valid: false,
      score: 0,
      feedback: ['Password must be at least 12 characters long'],
    }
  }

  // Use zxcvbn for strength analysis
  const result = zxcvbn(password)

  // Score 0-4: 0 is weakest, 4 is strongest
  // Require at least score 3 for production
  const minScore = 3
  const isStrong = result.score >= minScore

  const feedback: string[] = []

  if (!isStrong) {
    feedback.push(`Password strength: ${['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'][result.score]}`)

    if (result.feedback.warning) {
      feedback.push(result.feedback.warning)
    }

    if (result.feedback.suggestions && result.feedback.suggestions.length > 0) {
      feedback.push(...result.feedback.suggestions)
    }
  }

  return {
    valid: isStrong,
    score: result.score,
    feedback,
  }
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
    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      return {
        user: null,
        session: null,
        error: {
          message: passwordValidation.feedback.join(' '),
          code: 'weak_password',
        },
      }
    }

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
    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.valid) {
      return {
        error: {
          message: passwordValidation.feedback.join(' '),
          code: 'weak_password',
        },
      }
    }

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

/**
 * Development-only: Auto-login as specific user
 * This bypasses authentication and creates a mock session for testing
 * ONLY works in development mode (localhost:3000)
 */
export async function devAutoLogin(userId: string): Promise<AuthResponse> {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development' && !window.location.hostname.includes('localhost')) {
    return {
      user: null,
      session: null,
      error: { message: 'Auto-login only available in development mode' }
    }
  }

  try {
    // Use Supabase admin API to sign in as the user
    // Note: This requires the service role key, so we'll use a workaround
    // by fetching the user from the database and creating a mock session
    console.log('🔧 DEV MODE: Auto-logging in as user:', userId)

    // For now, we'll just fetch the current session
    // In a real implementation, you'd need backend support to create a valid session
    const { data } = await supabase.auth.getUser()

    if (data.user?.id === userId) {
      console.log('✅ DEV MODE: Already logged in as target user')
      const { data: sessionData } = await supabase.auth.getSession()
      return { user: data.user, session: sessionData.session, error: null }
    }

    return {
      user: null,
      session: null,
      error: {
        message: 'Dev auto-login requires backend support. Please implement a dev-only API route.'
      }
    }
  } catch (err) {
    return {
      user: null,
      session: null,
      error: { message: err instanceof Error ? err.message : 'Dev auto-login failed' },
    }
  }
}