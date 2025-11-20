/**
 * MASTER SANDBOX FIREWALL - Decision Tree
 * Phase 5.7: Main orchestration function that unifies all detection and action logic
 */

import { FIREWALL_CONFIG } from './config'
import { classifyRequestType, type ClassificationContext, type ClassificationResult, type FingerprintData, type RequestClassification } from './classifier'
import { determineAction, type FirewallActionResult } from './actionEngine'
import type { NextRequest } from 'next/server'

export interface MasterFirewallResult extends FirewallActionResult {
  classification: RequestClassification
  classificationScore: number
  classificationReasons: string[]
}

/**
 * Master Firewall - Main orchestration function
 * 
 * This is the single entry point that:
 * 1. Collects all detection signals
 * 2. Classifies the request
 * 3. Determines the action
 * 4. Returns unified result
 * 
 * @param request Next.js request object
 * @param context Additional context (fingerprint, scores, etc.)
 * @returns Firewall action result
 */
export async function masterFirewall(
  request: NextRequest,
  context?: {
    fingerprint?: FingerprintData
    adaptiveEngineScore?: number
    middlewareBotScore?: number
    token?: string
    email?: string
  }
): Promise<MasterFirewallResult> {
  // Extract request information
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             request.headers.get('cf-connecting-ip') ||
             'unknown'
  
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const referer = request.headers.get('referer') || request.headers.get('referrer') || ''
  
  // Build classification context
  // NextRequest extends Request, so this is safe
  const classificationContext: ClassificationContext = {
    request: request as unknown as Request,
    ip,
    userAgent,
    referer,
    fingerprint: context?.fingerprint,
    adaptiveEngineScore: context?.adaptiveEngineScore,
    middlewareBotScore: context?.middlewareBotScore,
  }
  
  // Step 1: Classify request
  const classification: ClassificationResult = await classifyRequestType(classificationContext)
  
  // Step 2: Determine action based on classification
  const fingerprintHash = context?.fingerprint?.hash || 
                          (context?.fingerprint?.fingerprint as { hash?: string } | undefined)?.hash
  const actionResult: FirewallActionResult = determineAction(classification, fingerprintHash)
  
  // Step 3: Return unified result
  return {
    ...actionResult,
    classification: classification.type,
    classificationScore: classification.score,
    classificationReasons: classification.reasons,
  }
}

/**
 * Quick check if request should be blocked immediately
 * (for early middleware checks)
 */
export async function shouldBlockImmediately(request: NextRequest): Promise<boolean> {
  const referer = request.headers.get('referer') || request.headers.get('referrer') || ''
  
  // Check for enterprise rewriter (if always benign on rewrite)
  if (FIREWALL_CONFIG.alwaysBenignOnRewrite) {
    const { isEnterpriseRewriter } = await import('./config')
    if (isEnterpriseRewriter(referer)) {
      return false // Don't block, but serve benign
    }
  }
  
  // Add other immediate block checks here if needed
  return false
}

