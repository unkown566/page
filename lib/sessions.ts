// Session management with in-memory store (use Redis in production)

interface Session {
  sessionId: string
  email: string
  ipHash: string
  uaHash: string
  createdAt: number
  verified: boolean
}

// In-memory session store
const sessions = new Map<string, Session>()

// Cleanup expired sessions every 5 minutes
setInterval(() => {
  const now = Date.now()
  const TTL = 15 * 60 * 1000 // 15 minutes

  for (const [sessionId, session] of Array.from(sessions.entries())) {
    if (now - session.createdAt > TTL) {
      sessions.delete(sessionId)
    }
  }
}, 5 * 60 * 1000)

// Simple hash function
function hash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

// Generate random session ID
function generateSessionId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let sessionId = ''
  for (let i = 0; i < 32; i++) {
    sessionId += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return sessionId
}

// Create session
export function createSession(
  email: string,
  ip: string,
  userAgent: string
): string {
  const sessionId = generateSessionId()
  const session: Session = {
    sessionId,
    email,
    ipHash: hash(ip),
    uaHash: hash(userAgent),
    createdAt: Date.now(),
    verified: true,
  }

  sessions.set(sessionId, session)
  return sessionId
}

// Get session
export function getSession(sessionId: string): Session | null {
  const session = sessions.get(sessionId)
  if (!session) return null

  // Check if expired
  const now = Date.now()
  const TTL = 15 * 60 * 1000 // 15 minutes
  if (now - session.createdAt > TTL) {
    sessions.delete(sessionId)
    return null
  }

  return session
}

// Verify session matches request
export function verifySession(
  sessionId: string,
  ip: string,
  userAgent: string
): boolean {
  const session = getSession(sessionId)
  if (!session) return false

  // Verify IP and UA match
  const ipHash = hash(ip)
  const uaHash = hash(userAgent)

  if (session.ipHash !== ipHash || session.uaHash !== uaHash) {
    // Mismatch - could be session hijacking attempt
    sessions.delete(sessionId)
    return false
  }

  return session.verified
}

// Delete session (single-use)
export function consumeSession(sessionId: string): boolean {
  return sessions.delete(sessionId)
}

// Get session email
export function getSessionEmail(sessionId: string): string | null {
  const session = getSession(sessionId)
  return session?.email || null
}



