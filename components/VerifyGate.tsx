'use client'

import { useState } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import type { Translations } from '@/lib/locales'

interface VerifyGateProps {
  onVerified: (sessionId: string) => void
  email: string
  translations: Translations
}

export default function VerifyGate({ onVerified, email, translations }: VerifyGateProps) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const handleVerify = async () => {
    const hasCaptchaConfig = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && 
                             process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY.trim() !== ''
    
    if (hasCaptchaConfig && !captchaToken) {
      setError(translations.verifyAccessSubtitle)
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      // Get token from URL
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('token')

      // If no token, create a test session for backward compatibility
      if (!token) {
        // Generate a simple session ID for testing
        const testSessionId = 'test-' + Math.random().toString(36).substring(7)
        onVerified(testSessionId)
        return
      }

      const response = await fetch('/api/verify-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          turnstileResponse: captchaToken || 'test-token',
          email,
        }),
      })

      const result = await response.json()

      if (result.ok && result.sessionId) {
        onVerified(result.sessionId)
      } else {
        setError(result.error || 'Verification failed. Please try again.')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {translations.verifyAccess}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {translations.verifyAccessSubtitle}
        </p>
      </div>

      <div className="flex justify-center">
        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY.trim() !== '' ? (
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            onSuccess={(token) => {
              if (token) {
                setCaptchaToken(token)
                setError(null)
              }
            }}
            onError={() => {
              setCaptchaToken(null)
              setError('CAPTCHA verification failed')
            }}
            onExpire={() => {
              setCaptchaToken(null)
            }}
          />
        ) : null}
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <button
        onClick={handleVerify}
        disabled={
          isVerifying || 
          !!(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && 
           process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY.trim() !== '' && 
           !captchaToken)
        }
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
      >
        {isVerifying ? translations.verifying : translations.verifyContinue}
      </button>
    </div>
  )
}

