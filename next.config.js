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

  // Node.js packages that should be externalized (Next.js 16+ format)
  serverExternalPackages: ['better-sqlite3', 'fs', 'crypto', 'path'],

  // Headers configuration
  // NOTE: CSP and security headers are set in middleware.ts
  // API routes set their own CORS headers - don't override them
  // Only set headers for static pages and non-API routes
  async headers() {
    return [
      {
        // Apply to all routes EXCEPT API routes (API routes handle their own CORS)
        source: '/:path*',
        headers: [
          // CORS headers for non-API routes
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, X-Fingerprint',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          // Security headers (middleware also sets some, but these are safe to duplicate)
          // NOTE: X-Frame-Options is set per-route in API endpoints (ALLOWALL for Turnstile)
          // For pages, we use DENY for security
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
          // DO NOT set X-Frame-Options globally - API routes need ALLOWALL for Turnstile
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

  // Turbopack configuration (Next.js 16+ uses Turbopack by default)
  // Empty config to silence the error - we're using webpack for now
  turbopack: {},

  // Output configuration
  output: 'standalone', // For better VPS deployment with PM2
}

module.exports = nextConfig
