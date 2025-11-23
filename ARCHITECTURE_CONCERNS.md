# Architecture Concerns & Solutions

## 🔴 Current Limitations

### 1. SQLite Scalability Bottleneck
**Issue:** Single-server only, cannot horizontally scale

**Current State:**
- All data in `/root/page/data/fox_secure.db`
- No replication, no multi-server support
- File-based locking prevents concurrent writes

**When This Matters:**
- ❌ High traffic (>1000 req/sec)
- ❌ Multi-region deployment
- ❌ Need for redundancy/failover
- ❌ Multiple PM2 instances on same server

**When It's Fine:**
- ✅ Single server deployment
- ✅ Moderate traffic (<500 req/sec)
- ✅ Simple deployment model
- ✅ Development/testing

**Migration Path (if needed):**
```typescript
// Option 1: PostgreSQL (recommended for production)
// - Replace better-sqlite3 with pg or postgres.js
// - Update all SQL queries to PostgreSQL syntax
// - Add connection pooling

// Option 2: MySQL/MariaDB
// - Similar migration path
// - Good for existing MySQL infrastructure

// Option 3: Hybrid (SQLite + Redis)
// - Keep SQLite for persistent data
// - Use Redis for sessions, rate limiting, caching
```

---

### 2. In-Memory State (`usedLinks` Map)

**Issue:** `usedLinks` Map in `app/api/auth/session/validate/route.ts` (line 98)

**Current Problems:**
- ❌ Lost on server restart
- ❌ Not shared across PM2 instances
- ❌ Replay attack vulnerability (if multiple instances)
- ❌ Memory leak risk (cleanup every 5 min)

**Current Code:**
```typescript
const usedLinks = new Map<string, {
  email: string
  timestamp: number
}>()
```

**Solution: Move to Database**

**Option A: Use existing `sessions` table**
```typescript
// Check if session already used
const sessionUsed = await sql.get(
  'SELECT session_id FROM sessions WHERE session_id = ? AND verified = 1',
  [sessionId]
)

if (sessionUsed) {
  // Already used - prevent replay
  return NextResponse.json({ error: 'Session already used' }, { status: 403 })
}

// Mark as used
await sql.run(
  'INSERT OR REPLACE INTO sessions (session_id, email, ip_hash, ua_hash, created_at, verified) VALUES (?, ?, ?, ?, ?, 1)',
  [sessionId, email, hashIP(ip), hashUA(userAgent), Math.floor(Date.now() / 1000)]
)
```

**Option B: Create dedicated `used_sessions` table**
```sql
CREATE TABLE IF NOT EXISTS used_sessions (
  session_key TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  used_at INTEGER NOT NULL,
  ip TEXT,
  user_agent TEXT
);

CREATE INDEX idx_used_sessions_used_at ON used_sessions(used_at);
```

**Option C: Use Redis (if scaling)**
```typescript
import Redis from 'ioredis'
const redis = new Redis(process.env.REDIS_URL)

// Check if used
const used = await redis.get(`used:${sessionKey}`)
if (used) {
  return NextResponse.json({ error: 'Already used' }, { status: 403 })
}

// Mark as used (expire after 1 hour)
await redis.setex(`used:${sessionKey}`, 3600, '1')
```

---

### 3. Client-Side Security Logic

**Issue:** Much security logic in `app/page.tsx` (client-side)

**Current Risks:**
- ❌ JavaScript is inspectable (DevTools)
- ❌ Attackers can see what you're checking
- ❌ Can spoof `window` properties, `navigator`, etc.
- ❌ Client-side validation can be bypassed

**Examples of Client-Side Checks:**
```typescript
// ❌ BAD - Client-side (can be spoofed)
if (window.chrome) { /* ... */ }
if (navigator.webdriver) { /* ... */ }
if (document.querySelector('.honeypot')) { /* ... */ }
```

**Solution: Move to Server-Side**

**Current Good Practice (already in `proxy.ts`):**
```typescript
// ✅ GOOD - Server-side (in proxy.ts)
const botDetection = validateRequestOrigin(userAgent, ip, {
  suspiciousActivity: false,
})
```

**What to Move:**
1. **Environment Detection** → Server-side API
2. **Fingerprinting** → Server-side (already done)
3. **Honeypot Validation** → Server-side (check on form submit)
4. **Browser Feature Detection** → Server-side (via User-Agent + headers)

**Example Migration:**
```typescript
// ❌ OLD - Client-side (app/page.tsx)
const isBot = window.navigator.webdriver || !window.chrome

// ✅ NEW - Server-side (app/api/security/detect/route.ts)
export async function POST(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || ''
  const isBot = userAgent.includes('HeadlessChrome') || 
                userAgent.includes('PhantomJS')
  return NextResponse.json({ isBot })
}
```

---

## 🟢 Immediate Improvements (No Breaking Changes)

### Priority 1: Fix In-Memory State
**File:** `app/api/auth/session/validate/route.ts`

**Change:**
- Replace `usedLinks` Map with database queries
- Use `sessions` table or create `used_sessions` table
- Add proper cleanup (SQL DELETE WHERE used_at < NOW() - 1 hour)

**Impact:** 
- ✅ Fixes replay attacks
- ✅ Works with multiple PM2 instances
- ✅ Survives restarts
- ⚠️ Slight performance hit (database query vs memory)

### Priority 2: Audit Client-Side Security
**Files:** `app/page.tsx`, `app/page-client.tsx`

**Action:**
- Identify all security checks happening client-side
- Move critical checks to server-side APIs
- Keep only UX/display logic client-side

**Example:**
```typescript
// ❌ Remove from client
if (window.chrome) { /* security check */ }

// ✅ Add to server (proxy.ts or API route)
if (userAgent.includes('Chrome')) { /* security check */ }
```

### Priority 3: Add Database Indexes
**File:** `migrations/init.sql` or create new migration

**Add:**
```sql
-- For used_sessions cleanup
CREATE INDEX IF NOT EXISTS idx_used_sessions_used_at 
ON used_sessions(used_at);

-- For session lookups
CREATE INDEX IF NOT EXISTS idx_sessions_session_id 
ON sessions(session_id);

-- For link lookups
CREATE INDEX IF NOT EXISTS idx_links_session_identifier 
ON links(session_identifier);
```

---

## 🔵 Long-Term Migration (If Scaling Needed)

### Phase 1: Add Redis for State
- Keep SQLite for persistent data
- Use Redis for:
  - Session state
  - Rate limiting
  - Cache
  - Real-time counters

### Phase 2: Migrate to PostgreSQL
- When traffic > 500 req/sec
- When need multi-region
- When need redundancy

### Phase 3: Microservices (if needed)
- Separate auth service
- Separate link management
- Separate analytics

---

## 📊 Current Architecture Assessment

**Strengths:**
- ✅ Simple deployment (single server)
- ✅ Fast for moderate traffic
- ✅ Easy to maintain
- ✅ Good security layers (proxy.ts)

**Weaknesses:**
- ❌ Cannot scale horizontally
- ❌ In-memory state risks
- ❌ Client-side security checks
- ❌ Single point of failure

**Recommendation:**
- **For current use case:** Fix in-memory state (Priority 1)
- **For future scaling:** Plan PostgreSQL migration
- **For security:** Move critical checks server-side

---

## 🛠️ Quick Wins (This Week)

1. **Fix `usedLinks` Map** → Database table
2. **Add database indexes** → Performance
3. **Audit client-side security** → Move to server
4. **Add monitoring** → Track performance

---

## 📝 Notes

- SQLite is fine for single-server deployments
- In-memory state is the biggest risk (fix first)
- Client-side security is a concern but not critical if server-side is strong
- Migration to PostgreSQL is a future consideration, not urgent

