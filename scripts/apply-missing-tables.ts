/**
 * Apply Missing Tables Migration
 * Adds consumed_tokens and mutations tables if they don't exist
 */

import { getDb } from '../lib/db'

async function applyMissingTables() {
  const db = getDb()
  
  console.log('🔧 Applying missing tables...')
  
  // Create consumed_tokens table
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS consumed_tokens (
        token_hash TEXT PRIMARY KEY,
        link_id TEXT NOT NULL,
        consumed_at INTEGER NOT NULL,
        ip TEXT,
        user_agent TEXT,
        FOREIGN KEY (link_id) REFERENCES links(id) ON DELETE CASCADE
      )
    `)
    
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_consumed_tokens_link_id ON consumed_tokens(link_id)
    `)
    
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_consumed_tokens_consumed_at ON consumed_tokens(consumed_at)
    `)
    
    console.log('✅ consumed_tokens table created')
  } catch (error) {
    console.error('❌ Error creating consumed_tokens:', error)
  }
  
  // Create mutations table
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS mutations (
        id TEXT PRIMARY KEY,
        user_agent TEXT,
        ip TEXT,
        mutation_key TEXT UNIQUE NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        last_used_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `)
    
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_mutations_ip_ua ON mutations(ip, user_agent)
    `)
    
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_mutations_key ON mutations(mutation_key)
    `)
    
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_mutations_created ON mutations(created_at)
    `)
    
    console.log('✅ mutations table created')
  } catch (error) {
    console.error('❌ Error creating mutations:', error)
  }
  
  console.log('✅ Migration complete')
}

applyMissingTables().catch(console.error)





