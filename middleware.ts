import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkRateLimit, getLimiterForPath } from './src/lib/ratelimit'
import crypto from 'crypto'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Generate request ID for tracing
  const requestId = crypto.randomUUID()

  // CSRF Protection for state-changing requests
  if (
    request.method !== 'GET' &&
    request.method !== 'HEAD' &&
    request.method !== 'OPTIONS'
  ) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')

    if (origin) {
      const originHost = new URL(origin).host
      if (originHost !== host) {
        return NextResponse.json(
          { error: 'Invalid origin' },
          { status: 403 }
        )
      }
    }
  }

  // Get client identifier - prefer authenticated user ID over IP
  const ip = request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0] ??
    '127.0.0.1'

  const sessionToken = request.cookies.get('next-auth.session-token')?.value ||
                      request.cookies.get('__Secure-next-auth.session-token')?.value
  const identifier = sessionToken ? `session:${sessionToken.slice(0, 16)}` : `ip:${ip}`

  // Get appropriate rate limiter for this path
  const { limiter, config } = getLimiterForPath(pathname, request.method)

  // Check rate limit
  const result = await checkRateLimit(identifier, limiter, config)

  const response = result.success
    ? NextResponse.next()
    : NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )

  response.headers.set('X-Request-ID', requestId)
  response.headers.set('X-RateLimit-Limit', result.limit.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', new Date(result.reset).toISOString())

  return response
}

// Only run middleware on API routes — security headers are handled by next.config.js headers()
export const config = {
  matcher: ['/api/:path*'],
}
