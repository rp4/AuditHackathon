import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimiter, RATE_LIMITS } from './src/lib/ratelimit'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // CSRF Protection for state-changing requests
  if (
    request.method !== 'GET' &&
    request.method !== 'HEAD' &&
    request.method !== 'OPTIONS'
  ) {
    // Verify Origin header matches the request host
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

  // Get client identifier (IP address or fallback)
  const ip = request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0] ??
    '127.0.0.1'

  // Apply rate limiting based on endpoint type
  let rateLimit = RATE_LIMITS.API // Default
  let identifier = `api:${ip}`

  // Authentication endpoints - strictest limits
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/auth')) {
    rateLimit = RATE_LIMITS.AUTH
    identifier = `auth:${ip}`
  }
  // Upload endpoints - strict limits
  else if (pathname.includes('/upload') || pathname.includes('/add')) {
    rateLimit = RATE_LIMITS.UPLOAD
    identifier = `upload:${ip}`
  }
  // Mutation endpoints - moderate limits
  else if (request.method !== 'GET' && request.method !== 'HEAD') {
    rateLimit = RATE_LIMITS.MUTATION
    identifier = `mutation:${ip}`
  }

  // Check rate limit
  const result = await rateLimiter.limit(
    identifier,
    rateLimit.maxRequests,
    rateLimit.windowMs
  )

  // Add rate limit headers
  const response = result.success
    ? NextResponse.next()
    : NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )

  response.headers.set('X-RateLimit-Limit', result.limit.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', new Date(result.reset).toISOString())

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Content Security Policy
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com https://vercel.live;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https://*.supabase.co https://media.licdn.com https://*.licdn.com blob:;
    font-src 'self' data:;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vercel.live;
    frame-src 'self' https://vercel.live;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim()

  response.headers.set('Content-Security-Policy', cspHeader)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
