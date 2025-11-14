'use client'

interface WhiteLoadingScreenProps {
  title?: string
  subtitle?: string
  showSpinner?: boolean
  email?: string
}

export default function WhiteLoadingScreen({
  title = 'Secure Access',
  subtitle = 'Please wait...',
  showSpinner = true,
  email,
}: WhiteLoadingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Logo/Icon */}
        <div className="mb-8">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
          {title}
        </h2>

        {/* Subtitle */}
        <p className="text-gray-600 mb-8">
          {subtitle}
        </p>

        {/* Spinner */}
        {showSpinner && (
          <div className="flex justify-center mb-6">
            <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        )}

        {/* Progress bar */}
        <div className="w-full max-w-xs mx-auto">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
        </div>

        {/* Email (if provided) */}
        {email && (
          <p className="mt-4 text-sm text-gray-500">
            {email}
          </p>
        )}

        {/* Security badge */}
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Secure Connection</span>
        </div>
      </div>
    </div>
  )
}



