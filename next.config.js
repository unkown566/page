/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Image optimization configuration
  images: {
    // Allow all domains (for dynamic content)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    // Disable image optimization for external domains if needed
    unoptimized: false,
  },

  // Experimental features for Node.js compatibility
  experimental: {
    // Allow Node.js packages to work in production
    serverComponentsExternalPackages: ['better-sqlite3', 'fs', 'crypto', 'path'],
  },

  // Headers configuration
  // NOTE: CSP is set in middleware.ts - don't duplicate here
  // Only set headers that middleware doesn't handle
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // CORS headers (middleware doesn't set these)
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          // Security headers (middleware also sets some, but these are safe to duplicate)
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // DO NOT set Content-Security-Policy here - it's set in middleware.ts
          // DO NOT set X-Frame-Options here if middleware sets it (but it's safe to have both)
        ],
      },
    ]
  },

  // Webpack configuration for better compatibility
  webpack: (config, { isServer }) => {
    // Fix for better-sqlite3 in production
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push('better-sqlite3')
    }
    return config
  },

  // Output configuration
  output: 'standalone', // For better VPS deployment with PM2
}

module.exports = nextConfig
