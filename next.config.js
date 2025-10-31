/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

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
      // Supabase storage for user avatars and agent images
      {
        protocol: 'https',
        hostname: '**.supabase.co',
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
      // Add other specific domains as needed
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
}

module.exports = nextConfig