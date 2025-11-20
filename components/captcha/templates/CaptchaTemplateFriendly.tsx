'use client'

import { Turnstile } from '@marsidev/react-turnstile'

export interface CaptchaTemplateProps {
  turnstileSiteKey: string | null
  scriptLoaded: boolean
  turnstileRef: React.RefObject<any>
  onSuccess: (token: string) => void
  onError: () => void
  onExpire: () => void
  status: 'waiting' | 'verifying' | 'success' | 'error'
  error: string | null
  isVerifying: boolean
  captchaToken: string | null
  onVerifyClick: () => void
}

export function CaptchaTemplateFriendly({
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100">
      <div className="w-full max-w-md p-8">
        <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-orange-100">
          {/* Friendly Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <span className="text-5xl">👋</span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Hey there!
            </h1>
            <p className="text-base text-gray-600">
              Just a quick human check to keep things safe...
            </p>
          </div>

          {/* Cloudflare Turnstile Widget */}
          <div className="flex justify-center mb-6">
            {!turnstileSiteKey ? (
              <div className="w-[300px] h-[65px] bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
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
              <div className="w-[300px] h-[65px] bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mx-auto mb-2"></div>
                  <p className="text-xs text-gray-500">Loading verification...</p>
                </div>
              </div>
            )}
          </div>

          {/* Status messages */}
          {status === 'waiting' && !captchaToken && scriptLoaded && (
            <div className="text-center mb-4">
              <p className="text-sm text-gray-500">
                Click the checkbox above to verify 👆
              </p>
            </div>
          )}

          {status === 'verifying' && (
            <div className="text-center mb-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
                <p className="text-sm text-gray-600">Verifying...</p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center mb-4">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl">✅</span>
                <p className="text-sm text-green-600 font-medium">Verification successful!</p>
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
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg text-base transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {isVerifying ? 'Verifying...' : 'Continue →'}
            </button>
          )}

          {/* Friendly Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Protected by{' '}
              <span className="font-semibold text-gray-600">Cloudflare</span>
              {' '}🔒
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}






