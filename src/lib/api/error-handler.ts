import { NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/utils/logger'

/**
 * Centralized error handler for API routes
 * Handles different error types and returns appropriate responses
 */
export function handleApiError(error: unknown, action: string) {
  // Log error for debugging
  logger.error(`Error ${action}:`, error)

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: 'Validation error',
        details: error.issues
      },
      { status: 400 }
    )
  }

  // Handle database errors
  if (error && typeof error === 'object' && 'code' in error) {
    const dbError = error as any

    // Unique constraint violation
    if (dbError.code === 'P2002') {
      return NextResponse.json(
        { error: 'Resource already exists' },
        { status: 409 }
      )
    }

    // Foreign key constraint violation
    if (dbError.code === 'P2003') {
      return NextResponse.json(
        { error: 'Related resource not found' },
        { status: 404 }
      )
    }

    // Record not found
    if (dbError.code === 'P2025') {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }
  }

  // Handle Error instances
  if (error instanceof Error) {
    // Check for specific error messages
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    if (error.message.includes('Not found')) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
      )
    }
  }

  // Default error response
  return NextResponse.json(
    { error: `Failed to ${action}` },
    { status: 500 }
  )
}