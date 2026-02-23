/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Enable standalone output for Docker

  // Disable ESLint during build (known Next.js 15.5.6 bug with circular structure)
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      // Localhost for development
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
      // Google Cloud Storage
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      // LinkedIn profile images
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
      },
      {
        protocol: 'https',
        hostname: '**.licdn.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Security headers (moved from middleware to apply to all routes efficiently)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'X-Download-Options', value: 'noopen' },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://storage.googleapis.com https://media.licdn.com https://*.licdn.com blob:; font-src 'self' data:; connect-src 'self' https://storage.googleapis.com https://vercel.live https://data.auditswarm.com https://cdn.jsdelivr.net https://unpkg.com; frame-src 'self' https://vercel.live; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;",
          },
        ],
      },
    ]
  },

  // SECURITY: Block dev credentials in production
  async redirects() {
    const isProduction = process.env.NODE_ENV === 'production'

    if (isProduction) {
      return [
        {
          source: '/api/auth/signin',
          has: [{ type: 'query', key: 'callbackUrl' }],
          destination: '/api/auth/signin?callbackUrl=/browse',
          permanent: false,
        },
      ]
    }

    return []
  },
}

module.exports = nextConfig