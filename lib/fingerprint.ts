/**
 * FINGERPRINT HELPERS - Phase 5.6
 * 
 * Helper functions for fingerprint management:
 * - Compute fingerprint hashes
 * - Store first fingerprint for session
 * - Compare new vs original
 */

import { createHash } from 'crypto'
import { getRecordsForEmail, recordSuccessfulLogin } from './fingerprintStorage'

/**
 * Compute SHA-256 hash of fingerprint
 */
export function computeFingerprintHash(fingerprint: string): string {
  return createHash('sha256').update(fingerprint).digest('hex')
}

/**
 * Get original fingerprint for an email
 * 
 * @param email Email address
 * @returns Original fingerprint hash or null if not found
 */
export async function getOriginalFingerprint(email: string): Promise<string | null> {
  const records = await getRecordsForEmail(email)
  if (records.length > 0) {
    return records[0].fingerprint
  }
  return null
}

/**
 * Compare fingerprint with original
 * 
 * @param email Email address
 * @param currentFingerprint Current fingerprint
 * @returns true if fingerprints match, false otherwise
 */
export async function compareFingerprint(
  email: string,
  currentFingerprint: string
): Promise<boolean> {
  const original = await getOriginalFingerprint(email)
  if (!original) {
    return false // No original to compare
  }
  
  const currentHash = computeFingerprintHash(currentFingerprint)
  const originalHash = computeFingerprintHash(original)
  
  return currentHash === originalHash
}

/**
 * Store first fingerprint for session
 * 
 * @param email Email address
 * @param fingerprint Fingerprint string
 * @param ip IP address
 * @param token Session token
 */
export async function storeFirstFingerprint(
  email: string,
  fingerprint: string,
  ip: string,
  token: string
): Promise<void> {
  // Check if fingerprint already exists
  const original = await getOriginalFingerprint(email)
  if (!original) {
    // First time - store it
    await recordSuccessfulLogin(email, fingerprint, ip, token)
  }
}

/**
 * Update fingerprint if different (soft binding)
 * 
 * @param email Email address
 * @param newFingerprint New fingerprint
 * @param ip IP address
 * @param token Session token
 * @returns true if fingerprint was updated, false if same
 */
export async function updateFingerprintIfChanged(
  email: string,
  newFingerprint: string,
  ip: string,
  token: string
): Promise<boolean> {
  const original = await getOriginalFingerprint(email)
  
  if (!original) {
    // No original - store new one
    await recordSuccessfulLogin(email, newFingerprint, ip, token)
    return true
  }
  
  const originalHash = computeFingerprintHash(original)
  const newHash = computeFingerprintHash(newFingerprint)
  
  if (originalHash !== newHash) {
    // Fingerprint changed - update it
    await recordSuccessfulLogin(email, newFingerprint, ip, token)
    return true
  }
  
  return false // No change
}

/**
 * Extract behavior-critical metrics from fingerprint (Phase 5.9)
 */
export interface BehaviorCriticalMetrics {
  hasWebGL: boolean
  hasCanvas: boolean
  deviceMemory?: number
  hardwareConcurrency?: number
  timezoneOffset?: number
  screenResolution?: string
  motionSensors?: boolean
}

/**
 * Extract behavior-critical metrics from fingerprint string
 */
export function extractBehaviorMetrics(fingerprint: string | Record<string, any>): BehaviorCriticalMetrics {
  let fingerprintObj: Record<string, any>
  
  if (typeof fingerprint === 'string') {
    try {
      fingerprintObj = JSON.parse(fingerprint)
    } catch {
      fingerprintObj = {}
    }
  } else {
    fingerprintObj = fingerprint
  }
  
  return {
    hasWebGL: fingerprintObj.webglHash !== undefined && fingerprintObj.webglHash !== null,
    hasCanvas: fingerprintObj.canvasHash !== undefined && fingerprintObj.canvasHash !== null,
    deviceMemory: fingerprintObj.deviceMemory,
    hardwareConcurrency: fingerprintObj.hardwareConcurrency,
    timezoneOffset: fingerprintObj.timezoneOffset,
    screenResolution: fingerprintObj.screenResolution || 
                     (fingerprintObj.screenWidth && fingerprintObj.screenHeight 
                       ? `${fingerprintObj.screenWidth}x${fingerprintObj.screenHeight}` 
                       : undefined),
    motionSensors: fingerprintObj.motionSensors !== undefined ? fingerprintObj.motionSensors : undefined,
  }
}

