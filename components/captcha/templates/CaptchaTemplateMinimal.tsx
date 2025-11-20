'use client'

import { Turnstile } from '@marsidev/react-turnstile'
import type { CaptchaTemplateProps } from './CaptchaTemplateFriendly'

export function CaptchaTemplateMinimal({
  turnstileSiteKey,
  scriptLoaded,
  turnstileRef,
  onSuccess,
  onError,
  onExpire,
  status,
  error,
  isVerifying,
  captchaToken,
  onVerifyClick,
}: CaptchaTemplateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm">
        {/* Ultra Minimal - Almost no UI */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-500">Please verify.</p>
        </div>

        {/* Cloudflare Turnstile Widget - Centered, no container */}
        <div className="flex justify-center mb-6">
          {!turnstileSiteKey ? (
            <div className="w-[300px] h-[65px] bg-red-50 border border-red-200 rounded flex items-center justify-center">
              <div className="text-center">
                <p className="text-xs text-red-600 font-medium">CAPTCHA not configured</p>
                <p className="text-xs text-red-500 mt-1">Please configure Turnstile keys</p>
              </div>
            </div>
          ) : scriptLoaded || (typeof window !== 'undefined' && (window as any).turnstile) ? (
            <Turnstile
              ref={turnstileRef}
              siteKey={turnstileSiteKey}
              onSuccess={onSuccess}
              onError={onError}
              onExpire={onExpire}
              options={{
                theme: 'light',
                size: 'normal',
              }}
            />
          ) : (
            <div className="w-[300px] h-[65px] bg-gray-100 rounded border border-gray-300 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mx-auto mb-2"></div>
                <p className="text-xs text-gray-500">Loading...</p>
              </div>
            </div>
          )}
        </div>

        {/* Minimal Status - Only if needed */}
        {status === 'verifying' && (
          <div className="text-center mb-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center mb-4">
            <p className="text-xs text-gray-500">Verified</p>
          </div>
        )}

        {error && (
          <div className="text-center mb-4">
            <p className="text-xs text-red-500">{error}</p>
          </div>
        )}

        {captchaToken && status !== 'verifying' && status !== 'success' && (
          <div className="text-center">
            <button
              onClick={onVerifyClick}
              disabled={isVerifying || !captchaToken}
              className="text-sm text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isVerifying ? 'Verifying...' : 'Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}





