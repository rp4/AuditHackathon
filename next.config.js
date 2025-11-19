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

  webpack: (config, { isServer, dev }) => {
    // CRITICAL SECURITY: Prevent service role key from being bundled in client code
    if (!isServer && !dev) {
      config.plugins.push({
        apply: (compiler) => {
          compiler.hooks.emit.tap('BlockServiceRoleKey', (compilation) => {
            let foundServiceKey = false
            const problematicFiles = []

            // Check all generated JavaScript files (exclude server chunks)
            Object.keys(compilation.assets).forEach((filename) => {
              // Only check client-side JavaScript bundles
              if (filename.endsWith('.js') && !filename.includes('server/')) {
                const source = compilation.assets[filename].source()

                // More specific check: look for actual environment variable access patterns
                // This reduces false positives while still catching real leaks
                const dangerousPatterns = [
                  /process\.env\.SUPABASE_SERVICE_ROLE_KEY/,
                  /SUPABASE_SERVICE_ROLE_KEY"\s*:\s*"/,
                  /SUPABASE_SERVICE_ROLE_KEY['"]?\s*:\s*['"]?eyJ/,
                ]

                const foundDangerousPattern = dangerousPatterns.some(pattern => pattern.test(source))

                if (foundDangerousPattern) {
                  foundServiceKey = true
                  problematicFiles.push(filename)
                }
              }
            })

            if (foundServiceKey) {
              const errorMsg = `
╔════════════════════════════════════════════════════════════════╗
║  CRITICAL SECURITY ERROR: Service Role Key Detected!          ║
╚════════════════════════════════════════════════════════════════╝

The Supabase service role key was detected in client bundle!
This is a CRITICAL security vulnerability.

Service role keys bypass Row Level Security and must NEVER be
exposed to the client.

Problematic files:
${problematicFiles.map(f => `  - ${f}`).join('\n')}

How to fix:
1. Only use SUPABASE_SERVICE_ROLE_KEY in server-side code
2. Use NEXT_PUBLIC_SUPABASE_ANON_KEY for client-side code
3. Never import server-side code into client components

Build aborted for security.
              `
              compilation.errors.push(new Error(errorMsg))
              throw new Error('CRITICAL: Service role key in client bundle - build aborted')
            }
          })
        },
      })
    }

    return config
  },

  // SECURITY: Block dev-auth endpoint in production
  async redirects() {
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'

    if (isProduction) {
      return [
        {
          source: '/api/dev-auth',
          destination: '/404',
          permanent: false,
        },
      ]
    }

    return []
  },
}

module.exports = nextConfig