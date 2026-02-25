'use client'

export function useAuth() {
  return {
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: false,
    signIn: (_callbackUrl?: string) => {},
    signOut: () => {},
  }
}
