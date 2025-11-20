'use client'

import { Turnstile } from '@marsidev/react-turnstile'
import type { CaptchaTemplateProps } from './CaptchaTemplateFriendly'

export function CaptchaTemplateProfessional({
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Professional Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <svg
                className="w-10 h-10 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Security Verification Required
            </h1>
            <p className="text-sm text-gray-600">
              Complete the security check to continue
            </p>
          </div>

          {/* Cloudflare Turnstile Widget */}
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
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-xs text-gray-500">Loading verification...</p>
                </div>
              </div>
            )}
          </div>

          {/* Status messages */}
          {status === 'waiting' && !captchaToken && scriptLoaded && (
            <div className="text-center mb-4">
              <p className="text-xs text-gray-400">
                Click the checkbox above to verify
              </p>
            </div>
          )}

          {status === 'verifying' && (
            <div className="text-center mb-4">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center mb-4">
              <div className="flex items-center justify-center space-x-2">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className="text-sm text-green-600 font-medium">Verification successful</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          {captchaToken && status !== 'verifying' && status !== 'success' && (
            <button
              onClick={onVerifyClick}
              disabled={isVerifying || !captchaToken}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded text-sm transition-colors duration-200"
            >
              {isVerifying ? 'Verifying...' : 'Continue'}
            </button>
          )}

          {/* Professional Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Protected by{' '}
              <span className="font-semibold text-gray-600">Cloudflare</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}






