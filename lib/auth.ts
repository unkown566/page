import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export interface Session {
  isAuthenticated: boolean
  isAdmin: boolean
  userId?: string
  username?: string
}

/**
 * Check if request has valid admin session
 * For now, use a simple password-based auth
 * TODO: Implement proper session management
 */
export async function getAdminSession(request: NextRequest): Promise<Session | null> {
  // Check for admin password in cookie or header
  const cookieStore = await cookies()
  
  // SECURITY FIX: Never use published default password
  // Require explicit admin password or allow bypass only in development with explicit flag
  const adminPassword = process.env.ADMIN_PASSWORD
  
  if (!adminPassword) {
    // Check if development mode with explicit bypass flag
    const allowInsecureAdmin = process.env.ALLOW_INSECURE_ADMIN_PASSWORD === 'true'
    
    if (process.env.NODE_ENV !== 'development' || !allowInsecureAdmin) {
      // Production or dev without explicit flag: no admin access
      return null
    }
    
    // Development mode with explicit flag: use temporary password
    
    // Generate a temporary password for this session (not persistent)
    const tempPassword = process.env.ADMIN_PASSWORD || Math.random().toString(36).substring(2, 15)
    
    const authCookie = cookieStore.get('admin_auth')?.value
    const authHeader = request.headers.get('authorization')
    
    if (authCookie === tempPassword || authHeader?.startsWith('Bearer ' + tempPassword)) {
      return {
        isAuthenticated: true,
        isAdmin: true,
        username: 'admin (dev mode)'
      }
    }
    
    return null
  }
  
  // Check cookie
  const authCookie = cookieStore.get('admin_auth')?.value
  if (authCookie === adminPassword) {
    return {
      isAuthenticated: true,
      isAdmin: true,
      username: 'admin'
    }
  }
  
  // Check Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    if (token === adminPassword) {
      return {
        isAuthenticated: true,
        isAdmin: true,
        username: 'admin'
      }
    }
  }
  
  return null
}

/**
 * Middleware to require admin authentication
 * Checks both password and session expiry
 */
export async function requireAdmin(request: NextRequest): Promise<Response | null> {
  // Never allow bypassing auth in production
  if (process.env.NODE_ENV === 'development' && process.env.DISABLE_ADMIN_AUTH === 'true') {
    return null // Allow access
  }
  
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('admin_auth')?.value
  const sessionCookie = cookieStore.get('admin_session')?.value
  const adminPassword = process.env.ADMIN_PASSWORD
  
  // Check if cookies exist and password matches
  if (!authCookie || !sessionCookie || !adminPassword || authCookie !== adminPassword) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized - Admin access required' }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
  
  // Check session expiry
  try {
    const sessionData = JSON.parse(Buffer.from(sessionCookie, 'base64').toString())
    const now = Date.now()
    
    // Check if session has expired (30 minutes of inactivity)
    if (now > sessionData.expiry) {
      return new Response(
        JSON.stringify({ error: 'Session expired - Please login again' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Session valid
    return null
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Invalid session - Please login again' }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

