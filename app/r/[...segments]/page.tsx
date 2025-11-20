'use client'

/**
 * CLEAN LINK HANDLER (without entropy prefix)
 * Handles Type A and Type C links without entropy
 * 
 * Type A: /r/<token> (1 segment)
 * Type C: /r/<mappingId>/<token> (2 segments)
 */

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function CleanLinkHandler() {
  const params = useParams()
  const router = useRouter()
  const segments = params?.segments as string[] | undefined
  
  useEffect(() => {
    if (!segments || segments.length === 0) {
      // No segments - redirect to homepage
      window.location.href = 'https://office.com'
      return
    }
    
    if (segments.length === 1) {
      // Type A: /r/<token>
      const token = segments[0]
      
      // Redirect to root page with token parameter
      const redirectUrl = `/?token=${encodeURIComponent(token)}`
      
      console.log('[TYPE-A-LINK] Redirecting:', {
        token: token.substring(0, 20) + '...',
        redirectUrl,
      })
      
      router.push(redirectUrl)
    } else if (segments.length === 2) {
      // Type C: /r/<mappingId>/<token>
      const mappingId = segments[0]
      const token = segments[1]
      
      // Redirect to root page with mappingId and token
      const redirectUrl = `/?mappingId=${encodeURIComponent(mappingId)}&token=${encodeURIComponent(token)}`
      
      console.log('[TYPE-C-LINK] Redirecting:', {
        mappingId: mappingId.substring(0, 20) + '...',
        token: token.substring(0, 20) + '...',
        redirectUrl,
      })
      
      router.push(redirectUrl)
    } else {
      // Invalid number of segments
      console.error('[CLEAN-LINK] Invalid segments:', segments.length)
      window.location.href = 'https://office.com'
    }
  }, [segments, router])
  
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
