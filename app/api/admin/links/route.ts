/**
 * ADMIN LINKS API - PATCH 6
 * 
 * Returns links with attempts, behaviorScore, humanScore, brainDecision
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { sql } from '@/lib/sql'
import { getAttempts } from '@/lib/attemptTracker'
import { getBehaviorScoreForRequest } from '@/lib/behavioral/behaviorModel'
import { calculateHumanScore } from '@/lib/validationEngine'
import type { LinkRecord } from '@/lib/linkDatabaseSql'

export async function GET(request: NextRequest) {
  // CHECK AUTHENTICATION
  const authError = await requireAdmin(request)
  if (authError) return authError

  const timerLabel = `[ADMIN-LINKS API] ${Date.now()}`
  console.time(timerLabel)
  
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'all' | 'personalized' | 'generic'
    const status = searchParams.get('status') // 'active' | 'expired' | 'archived' | 'deleted'

    if (process.env.NODE_ENV === 'development') {
      console.log('[ADMIN-LINKS] Querying SQLite for all links...')
    }
    
    // Ensure index exists for faster group queries
    sql.run('CREATE INDEX IF NOT EXISTS idx_captured_emails_linkid ON captured_emails (link_id)')

    const linkRecords = sql.all<LinkRecord>('SELECT * FROM links ORDER BY created_at DESC')

    const capturedCountsRows = sql.all<{ link_id: string; count: number }>(
      'SELECT link_id, COUNT(*) as count FROM captured_emails GROUP BY link_id'
    )
    const capturedCountsMap = new Map<string, number>()
    capturedCountsRows.forEach((row) => {
      capturedCountsMap.set(row.link_id, row.count)
    })
    
    // Debug: Log results
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ADMIN-LINKS] Found ${linkRecords.length} links in database`)
    }
    
    // Convert LinkRecord to Link format for admin panel
    let links = linkRecords.map((record): any => {
      // Get email from email_id_mappings if needed (Type A/C)
      // Type A/C links may have email in links.email OR in email_id_mappings table
      let email: string | null = record.email
      if (!email) {
        const mapping = sql.get<{ email: string }>(
          'SELECT email FROM email_id_mappings WHERE link_id = ? LIMIT 1',
          [record.id]
        )
        email = mapping?.email || null
      }
      
      // Get allowed emails for Type B links
      let allowedEmails: string[] | null = null
      if (record.link_format === 'B' || record.type === 'generic') {
        const allowlistRows = sql.all<{ email: string }>(
          'SELECT email FROM email_allowlists WHERE link_id = ?',
          [record.id]
        )
        allowedEmails = allowlistRows.map(row => row.email)
      }
      
      const capturedCount = capturedCountsMap.get(record.id.toString()) || 0
      
      return {
        id: record.id.toString(),
        type: record.type === 'personalized' ? 'personalized' : 'generic',
        sessionIdentifier: record.session_identifier || record.link_token,
        linkToken: record.link_token || record.session_identifier,
        name: record.name,
        email,
        createdAt: record.created_at ? Math.floor(record.created_at * 1000) : Date.now(),
        expiresAt: record.expires_at ? Math.floor(record.expires_at * 1000) : Date.now() + 86400000,
        status: record.status === 'active' && (record.expires_at ? Math.floor(record.expires_at * 1000) : Date.now()) > Date.now() && !record.used
          ? 'active'
          : record.used
          ? 'used'
          : (record.expires_at ? Math.floor(record.expires_at * 1000) : Date.now()) <= Date.now()
          ? 'expired'
          : record.status || 'active',
        used: record.used === 1,
        usedAt: record.used_at ? Math.floor(record.used_at * 1000) : null,
        fingerprint: record.fingerprint,
        ip: record.ip,
        templateId: record.template_id,
        templateMode: record.template_mode,
        language: record.language,
        loadingScreen: record.loading_screen,
        loadingDuration: record.loading_duration,
        allowedEmails,
        totalEmails: allowedEmails?.length || null,
        capturedCount,
        pendingCount: allowedEmails ? (allowedEmails.length - capturedCount) : null,
        link_format: record.link_format || 'A',
      }
    })

    // Filter by type
    if (type && type !== 'all') {
      links = links.filter((link) => link.type === type)
    }

    // Filter by status
    if (status) {
      if (status === 'active') {
        // Show active links (not used, not expired, not deleted)
        links = links.filter((link) => 
          link.status === 'active' && 
          link.expiresAt > Date.now() &&
          !link.used
        )
      } else if (status === 'expired') {
        // Show expired links (expired but not used)
        links = links.filter((link) => 
          link.status === 'active' && 
          link.expiresAt <= Date.now() &&
          !link.used
        )
      } else if (status === 'archived') {
        // Show archived links: used links OR deleted links
        links = links.filter((link) => 
          link.status === 'used' || 
          link.status === 'deleted' ||
          (link.type === 'personalized' && link.used === true)
        )
      }
    }

    // PATCH 6: Enrich links with attempts, behaviorScore, humanScore, brainDecision
    const enrichedLinks = await Promise.all(
      links.map(async (link) => {
        const email = link.email
        if (!email) {
          return {
            ...link,
            attempts: 0,
            behaviorScore: undefined,
            humanScore: undefined,
            brainDecision: undefined,
          }
        }

        // Get attempts
        const attempts = await getAttempts(email)

        // Get behavior score
        let behaviorScore: { score: number; category: string } | undefined
        try {
          const behaviorResult = await getBehaviorScoreForRequest(
            link.ip || 'unknown',
            'unknown', // userAgent not stored in link
            undefined, // fingerprint
            undefined, // attemptData
            300 // 5 minutes
          )
          behaviorScore = {
            score: behaviorResult.score,
            category: behaviorResult.category,
          }
        } catch (error) {
          // Fail silently
        }

        // Get human score (simplified - would need full context)
        let humanScore: number | undefined
        try {
          // Create minimal context for human score calculation
          const context = {
            token: link.sessionIdentifier || link.linkToken || '',
            email,
            fingerprint: link.fingerprint || undefined,
            ip: link.ip || undefined,
            userAgent: 'unknown',
          }
          humanScore = calculateHumanScore(context)
        } catch (error) {
          // Fail silently
        }

        return {
          ...link,
          attempts,
          behaviorScore,
          humanScore,
          brainDecision: undefined, // Would need to run full brain decision - too expensive for list view
        }
      })
    )

    // Sort by created date (newest first)
    enrichedLinks.sort((a, b) => b.createdAt - a.createdAt)

    const response = NextResponse.json({
      success: true,
      links: enrichedLinks,
      count: enrichedLinks.length,
    })
    return response
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch links',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  } finally {
    console.timeEnd(timerLabel)
  }
}

