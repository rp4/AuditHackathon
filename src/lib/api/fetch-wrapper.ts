import { logger } from '@/lib/utils/logger'

/**
 * Wrapper for fetch API with consistent error handling
 * Used in client-side hooks for API calls
 */
export async function apiFetch<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      }
    })

    // Handle 404 as null return
    if (response.status === 404) {
      return null as T
    }

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`

      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch {
        // If parsing JSON fails, use default message
      }

      throw new Error(errorMessage)
    }

    // Parse and return JSON response
    const data = await response.json()
    return data as T
  } catch (error) {
    logger.error(`API fetch error for ${url}:`, error)
    throw error
  }
}

/**
 * Helper function for GET requests
 */
export function apiGet<T = any>(url: string, options?: RequestInit) {
  return apiFetch<T>(url, {
    ...options,
    method: 'GET'
  })
}

/**
 * Helper function for POST requests
 */
export function apiPost<T = any>(
  url: string,
  body?: any,
  options?: RequestInit
) {
  return apiFetch<T>(url, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined
  })
}

/**
 * Helper function for PUT requests
 */
export function apiPut<T = any>(
  url: string,
  body?: any,
  options?: RequestInit
) {
  return apiFetch<T>(url, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined
  })
}

/**
 * Helper function for DELETE requests
 */
export function apiDelete<T = any>(url: string, options?: RequestInit) {
  return apiFetch<T>(url, {
    ...options,
    method: 'DELETE'
  })
}

/**
 * Helper function for PATCH requests
 */
export function apiPatch<T = any>(
  url: string,
  body?: any,
  options?: RequestInit
) {
  return apiFetch<T>(url, {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined
  })
}