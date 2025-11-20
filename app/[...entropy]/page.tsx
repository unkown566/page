'use client'

/**
 * ENTROPY PATH HANDLER
 * Handles URLs with daily entropy prefixes
 * 
 * Examples:
 * - /7f4/300/r/<token> → Type A
 * - /abc/def/r/<mappingId>/<token> → Type C
 * - /xyz/?token=...&email=... → Type B (shouldn't reach here, but handled)
 */

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function EntropyPathHandler() {
  const params = useParams()
  const router = useRouter()
  const entropy = params?.entropy as string[] | undefined
  
  useEffect(() => {
    if (!entropy || entropy.length === 0) {
      // No entropy - redirect to homepage
      window.location.href = 'https://office.com'
      return
    }
    
    // Find where /r/ appears in the segments
    const rIndex = entropy.findIndex(seg => seg === 'r')
    
    if (rIndex === -1) {
      // No /r/ found - might be a Type B link with entropy prefix
      // Redirect to root with query params preserved
      if (typeof window !== 'undefined') {
        const search = window.location.search
        const hash = window.location.hash
        router.push(`/${search}${hash}`)
      }
      return
    }
    
    // Extract segments after /r/
    const afterR = entropy.slice(rIndex + 1)
    
    if (afterR.length === 1) {
      // Type A: /entropy/.../r/<token or identifier>
      const tokenOrIdentifier = afterR[0]
      
      // CRITICAL: Check if it's a short identifier (8-12 chars) - Format A with identifier
      const isShortIdentifier = /^[0-9a-zA-Z]{8,12}$/.test(tokenOrIdentifier)
      
      if (isShortIdentifier) {
        // It's a short identifier - Format A resolution will handle it
        // Redirect to root page with identifier in path (preserve /r/ format)
        // Format A resolution will extract it from pathname
        const redirectUrl = `/r/${encodeURIComponent(tokenOrIdentifier)}`
        
        console.log('[ENTROPY-TYPE-A] Format A identifier detected, redirecting to /r/ path:', {
          entropy: entropy.slice(0, rIndex).join('/'),
          identifier: tokenOrIdentifier.substring(0, 10),
          redirectUrl,
        })
        
        router.push(redirectUrl)
      } else {
        // It's a long token (legacy Format A) - redirect with token parameter
        const redirectUrl = `/?token=${encodeURIComponent(tokenOrIdentifier)}`
        
        console.log('[ENTROPY-TYPE-A] Legacy token detected, redirecting:', {
          entropy: entropy.slice(0, rIndex).join('/'),
          token: tokenOrIdentifier.substring(0, 20) + '...',
          redirectUrl,
        })
        
        router.push(redirectUrl)
      }
    } else if (afterR.length === 2) {
      // Type C: /entropy/.../r/<mappingId>/<token>
      const mappingId = afterR[0]
      const token = afterR[1]
      
      // Redirect to root page with mappingId and token
      const redirectUrl = `/?mappingId=${encodeURIComponent(mappingId)}&token=${encodeURIComponent(token)}`
      
      console.log('[ENTROPY-TYPE-C] Redirecting:', {
        entropy: entropy.slice(0, rIndex).join('/'),
        mappingId: mappingId.substring(0, 20) + '...',
        token: token.substring(0, 20) + '...',
        redirectUrl,
      })
      
      router.push(redirectUrl)
    } else {
      // Invalid format
      console.error('[ENTROPY-HANDLER] Invalid segments after /r/:', afterR.length)
      window.location.href = 'https://office.com'
    }
  }, [entropy, router])
  
  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}


