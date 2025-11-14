'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface PrivateCaptchaGateProps {
  onVerified: (token: string) => void
  siteKey: string
  endpoint?: string
  displayMode?: 'widget' | 'popup' | 'hidden'
  theme?: 'light' | 'dark'
  lang?: string
  startMode?: 'click' | 'auto'
}

export default function PrivateCaptchaGate({
  onVerified,
  siteKey,
  endpoint = 'https://api.privatecaptcha.com/puzzle',
  displayMode = 'widget',
  theme = 'light',
  lang = 'en',
  startMode = 'click',
}: PrivateCaptchaGateProps) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const captchaRef = useRef<HTMLDivElement>(null)
  const privateCaptchaInstance = useRef<any>(null)

  // Load PrivateCaptcha script from official CDN
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if script already loaded
    if ((window as any).privateCaptcha) {
      setScriptLoaded(true)
      initializeCaptcha()
      return
    }

    // Load the official PrivateCaptcha script
    // Official CDN: https://privatecaptcha.com/
    const script = document.createElement('script')
    script.src = 'https://cdn.privatecaptcha.com/captcha.js'
    script.async = true
    script.defer = true
    script.crossOrigin = 'anonymous'
    script.onload = () => {
      setScriptLoaded(true)
      initializeCaptcha()
    }
    script.onerror = () => {
      setError('Failed to load PrivateCaptcha script. Please check your connection.')
    }
    document.head.appendChild(script)

    return () => {
      // Cleanup
      if (privateCaptchaInstance.current) {
        // PrivateCaptcha cleanup if available
      }
    }
  }, [])

  const initializeCaptcha = () => {
    if (!captchaRef.current || !(window as any).privateCaptcha) {
      return
    }

    try {
      // Initialize PrivateCaptcha using official API
      // The script from https://privatecaptcha.com/ auto-initializes elements with .private-captcha class
      const setup = (window as any).privateCaptcha?.setup
      if (setup && typeof setup === 'function') {
        setup()
      }

      // Wait a bit for the script to initialize the element
      setTimeout(() => {
        const captchaElement = captchaRef.current?.querySelector('.private-captcha')
        if (captchaElement) {
          // Set up event listeners for PrivateCaptcha events
          // PrivateCaptcha fires custom events when verification completes
          captchaElement.addEventListener('finished', handleCaptchaFinished)
          captchaElement.addEventListener('errored', handleCaptchaError)
        } else {
        }
      }, 500)
    } catch (err) {
      setError('Failed to initialize CAPTCHA')
    }
  }

  const handleCaptchaFinished = (event: any) => {
    // PrivateCaptcha provides solution in event.detail or as the event itself
    // The solution format is: <solutions>.<puzzle>
    const solution = event.detail?.solution || event.detail?.value || event.detail
    
    if (solution && typeof solution === 'string') {
      setIsVerifying(true)
      onVerified(solution)
    } else {
      // Try to get solution from the element's data attribute or value
      const captchaElement = captchaRef.current?.querySelector('.private-captcha')
      if (captchaElement) {
        const elementSolution = (captchaElement as any).value || 
                                (captchaElement as any).getAttribute('data-solution')
        if (elementSolution) {
          setIsVerifying(true)
          onVerified(elementSolution)
          return
        }
      }
      
      setError('CAPTCHA verification failed')
      setIsVerifying(false)
    }
  }

  const handleCaptchaError = (event: any) => {
    setError('CAPTCHA verification failed. Please try again.')
  }

  // Set up the captcha element with data attributes
  useEffect(() => {
    if (!captchaRef.current || !scriptLoaded) return

    const captchaDiv = captchaRef.current.querySelector('.private-captcha')
    if (captchaDiv) {
      // Set data attributes for PrivateCaptcha configuration
      ;(captchaDiv as HTMLElement).setAttribute('data-sitekey', siteKey)
      if (endpoint) {
        ;(captchaDiv as HTMLElement).setAttribute('data-puzzle-endpoint', endpoint)
      }
      if (displayMode) {
        ;(captchaDiv as HTMLElement).setAttribute('data-display-mode', displayMode)
      }
      if (theme) {
        ;(captchaDiv as HTMLElement).setAttribute('data-theme', theme)
      }
      if (lang) {
        ;(captchaDiv as HTMLElement).setAttribute('data-lang', lang)
      }
      if (startMode) {
        ;(captchaDiv as HTMLElement).setAttribute('data-start-mode', startMode)
      }
    }
  }, [scriptLoaded, siteKey, endpoint, displayMode, theme, lang, startMode])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md p-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <svg
                className="w-12 h-12"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="#F6821F"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="#F6821F"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="#F6821F"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Verify you're human
            </h1>
            <p className="text-sm text-gray-600">
              Complete the security check to continue
            </p>
          </div>

          {/* PrivateCaptcha Widget */}
          <div className="flex justify-center mb-6" ref={captchaRef}>
            {scriptLoaded ? (
              <div
                className="private-captcha"
                data-sitekey={siteKey}
                data-puzzle-endpoint={endpoint}
                data-display-mode={displayMode}
                data-theme={theme}
                data-lang={lang}
                data-start-mode={startMode}
              />
            ) : (
              <div className="w-[300px] h-[65px] bg-gray-100 rounded border border-gray-300 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mx-auto mb-2"></div>
                  <p className="text-xs text-gray-500">Loading verification...</p>
                </div>
              </div>
            )}
          </div>

          {/* Status messages */}
          {isVerifying && (
            <div className="text-center">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Protected by{' '}
              <span className="font-semibold text-gray-600">PrivateCaptcha</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


