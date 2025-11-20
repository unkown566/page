/**
 * MUTATION API
 * 
 * Applies mutations to tokens, templates, fingerprints, and timing
 * All mutation logic runs server-side
 * Returns mutated values for frontend use
 * 
 * POST /api/mutation/apply
 */

import { NextRequest, NextResponse } from 'next/server'
import { executeMutationEngine, type MutationConfig } from '@/lib/stealth/mutationEngine'
import { loadSettings } from '@/lib/adminSettings'

export async function POST(request: NextRequest) {
  let requestBody: any = null
  try {
    const body = await request.json()
    requestBody = body
    const {
      token,
      template,
      fingerprint,
      baseTiming,
      requestCount = 1,
    } = body

    // Get settings
    const settings = await loadSettings()
    const securitySettings = settings.security as any
    const mutationLevel = securitySettings?.mutationLevel || 'medium'
    const enableMutations = securitySettings?.enableMutations !== false

    // ============================================
    // SERVER-SIDE MUTATION ENGINE
    // ============================================
    const mutationConfig: Partial<MutationConfig> = {
      enableTokenMutation: enableMutations,
      tokenMutationLevel: mutationLevel,
      enableTemplateMutation: enableMutations,
      templateMutationLevel: mutationLevel,
      enableFingerprintMutation: enableMutations,
      fingerprintMutationLevel: mutationLevel,
      enableTimingMutation: enableMutations,
      timingMutationLevel: mutationLevel,
      mutationInterval: 5,
      mutationSeed: fingerprint || Date.now(),
    }

    const mutationResult = await executeMutationEngine(
      {
        token,
        template,
        fingerprint,
        baseTiming,
        requestCount,
      },
      mutationConfig
    )

    // ============================================
    // RETURN MUTATED VALUES
    // ============================================
    return NextResponse.json({
      ok: true,
      mutations: {
        token: mutationResult.tokenMutated
          ? {
              mutated: true,
              value: mutationResult.mutatedToken,
              technique: mutationResult.tokenMutationTechnique,
            }
          : { mutated: false, value: token },
        
        template: mutationResult.templateMutated
          ? {
              mutated: true,
              value: mutationResult.mutatedTemplate,
              technique: mutationResult.templateMutationTechnique,
            }
          : { mutated: false, value: template },
        
        fingerprint: mutationResult.fingerprintMutated
          ? {
              mutated: true,
              value: mutationResult.mutatedFingerprint,
              technique: mutationResult.fingerprintMutationTechnique,
            }
          : { mutated: false, value: fingerprint },
        
        timing: mutationResult.timingMutated
          ? {
              mutated: true,
              value: mutationResult.mutatedTiming,
              technique: mutationResult.timingMutationTechnique,
            }
          : { mutated: false, value: baseTiming },
      },
      mutationScore: mutationResult.mutationScore,
      mutationsApplied: mutationResult.mutationsApplied,
    })
  } catch (error) {
    // Fail open: return original values (no mutations)
    return NextResponse.json({
      ok: false,
      mutations: {
        token: { mutated: false, value: requestBody?.token },
        template: { mutated: false, value: requestBody?.template },
        fingerprint: { mutated: false, value: requestBody?.fingerprint },
        timing: { mutated: false, value: requestBody?.baseTiming },
      },
      mutationScore: 0,
      mutationsApplied: 0,
    })
  }
}

