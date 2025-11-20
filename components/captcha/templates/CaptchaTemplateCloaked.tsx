'use client'

import { Turnstile } from '@marsidev/react-turnstile'
import type { CaptchaTemplateProps } from './CaptchaTemplateFriendly'

export function CaptchaTemplateCloaked({
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Corporate Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded"></div>
              <h1 className="text-lg font-semibold text-gray-900">Company Portal</h1>
            </div>
            <div className="text-sm text-gray-500">Secure Access</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
            {/* Cloaked Header */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Sign In
              </h2>
              <p className="text-sm text-gray-600">
                Verify your identity to access the portal
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
                  Complete the security verification above
                </p>
              </div>
            )}

            {status === 'verifying' && (
              <div className="text-center mb-4">
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-600">Verifying...</p>
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

            {/* Corporate Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                © 2024 Company Portal. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Corporate Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <a href="#" className="hover:text-gray-700">Privacy</a>
            <a href="#" className="hover:text-gray-700">Terms</a>
            <a href="#" className="hover:text-gray-700">Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}






