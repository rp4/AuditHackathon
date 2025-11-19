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