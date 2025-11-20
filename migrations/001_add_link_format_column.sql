-- ============================================
-- Migration: Add link_format column to links table
-- Date: 2025-01-18
-- Phase: 7.4 - Full SQLite Migration
-- ============================================
-- 
-- This migration adds the link_format column to the links table
-- for existing databases that were created before Phase 7.4.
-- 
-- New databases created with init.sql already include this column.
-- 
-- Column details:
--   - name: link_format
--   - type: TEXT
--   - default: 'A'
--   - values: 'A', 'B', 'C' (URL format types)
-- 
-- Format meanings:
--   - A: Clean format - /r/<token> (no email in URL)
--   - B: Query format - /?token=<token>&email=<email>
--   - C: Red-team format - /r/<mappingId>/<token>
-- 
-- ============================================

-- Check if column exists before adding (idempotent)
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- So we rely on the runtime migration check in lib/db.ts

-- Add link_format column if it doesn't exist
-- This will fail silently if column already exists (which is fine)
ALTER TABLE links
ADD COLUMN link_format TEXT DEFAULT 'A';

-- Note: The runtime migration in lib/db.ts handles the existence check
-- This SQL file is for reference and manual migration if needed



