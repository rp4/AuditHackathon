/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disabled for Univer compatibility - Univer's DI system doesn't support React Strict Mode
  // See: https://docs.univer.ai (Troubleshooting section)
  reactStrictMode: false,

  // Tell webpack to ignore Univer during SSR - it's client-only
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...config.externals,
        '@univerjs/core',
        '@univerjs/design',
        '@univerjs/docs',
        '@univerjs/docs-ui',
        '@univerjs/engine-render',
        '@univerjs/preset-docs-core',
        '@univerjs/preset-docs-drawing',
        '@univerjs/presets',
        '@univerjs/ui',
      ]
    }
    return config
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