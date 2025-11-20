// Simple in-memory rate limiting
// For production, use Redis-based rate limiting

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  max: number // Maximum requests per window
  keyGenerator?: (request: Request) => string // Custom key generator
}

export async function checkRateLimit(
  request: Request,
  options: RateLimitOptions
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             request.headers.get('cf-connecting-ip') ||
             'unknown'
  
  const key = options.keyGenerator ? options.keyGenerator(request) : `rate_limit:${ip}`
  const now = Date.now()
  
  let entry = rateLimitStore.get(key)
  
  // Reset if window expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + options.windowMs
    }
  }
  
  entry.count++
  rateLimitStore.set(key, entry)
  
  const allowed = entry.count <= options.max
  const remaining = Math.max(0, options.max - entry.count)
  
  return {
    allowed,
    remaining,
    resetAt: entry.resetAt
  }
}

// Pre-configured limiters
export const apiLimiter = {
  check: (request: Request) => checkRateLimit(request, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // Max 100 requests per window
  })
}

export const authLimiter = {
  check: (request: Request) => checkRateLimit(request, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // Max 5 login attempts per window
  })
}

export const smtpTestLimiter = {
  check: (request: Request) => checkRateLimit(request, {
    windowMs: 60 * 1000, // 1 minute
    max: 10 // Max 10 SMTP tests per minute
  })
}









