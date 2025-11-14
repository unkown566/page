'use client'

interface TemplateLoadingScreenProps {
  templateName?: string
  email?: string
  state?: 'loading' | 'verifying' | 'preparing'
}

export default function TemplateLoadingScreen({
  templateName = 'NTT Docomo d-account',
  email,
  state = 'loading',
}: TemplateLoadingScreenProps) {
  // Template-specific colors and logos
  const templateStyles: Record<string, {
    primary: string
    secondary: string
    logo: string
    text: string
    gradient: string
  }> = {
    'NTT Docomo d-account': {
      primary: '#d32f2f',
      secondary: '#f44336',
      logo: '🔴', // Docomo red
      text: 'd-account',
      gradient: 'from-red-600 to-red-800'
    },
    '@nifty Mail': {
      primary: '#f9a825',
      secondary: '#fbc02d',
      logo: '🟡', // Nifty yellow
      text: '@nifty',
      gradient: 'from-yellow-500 to-yellow-600'
    },
    'NIFTY Mail': {
      primary: '#f9a825',
      secondary: '#fbc02d',
      logo: '🟡', // Nifty yellow
      text: '@nifty',
      gradient: 'from-yellow-500 to-yellow-600'
    },
    'BIGLOBE Mail': {
      primary: '#1976d2',
      secondary: '#2196f3',
      logo: '🔵', // Biglobe blue
      text: 'BIGLOBE',
      gradient: 'from-blue-600 to-blue-800'
    },
    'SAKURA Internet': {
      primary: '#e91e63',
      secondary: '#f06292',
      logo: '🌸', // Sakura pink
      text: 'SAKURA',
      gradient: 'from-pink-500 to-pink-700'
    },
  }

  // Try to match template name (case-insensitive, partial match)
  const matchedTemplate = Object.keys(templateStyles).find(
    key => templateName.toLowerCase().includes(key.toLowerCase()) || 
           key.toLowerCase().includes(templateName.toLowerCase())
  )
  
  const style = matchedTemplate 
    ? templateStyles[matchedTemplate]
    : templateStyles['NTT Docomo d-account']

  // Different messages based on state
  const messages: Record<string, string> = {
    loading: 'Preparing secure access...',
    verifying: 'Verifying credentials...',
    preparing: 'Loading your documents...'
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${style.gradient} dark:from-gray-900 dark:to-gray-800`}>
      <div className="text-center">
        {/* Logo */}
        <div className="text-6xl mb-6 animate-pulse">
          {style.logo}
        </div>

        {/* Loading spinner */}
        <div className="inline-block">
          <div 
            className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"
            style={{ borderTopColor: 'transparent' }}
          ></div>
        </div>

        {/* Template name or verifying text */}
        <h2 className="mt-6 text-2xl font-bold text-white">
          {state === 'verifying' ? 'Verifying...' : style.text}
        </h2>

        {/* Loading text */}
        <p className="mt-3 text-white text-opacity-90">
          {messages[state] || messages.loading}
        </p>

        {/* Email (if provided) */}
        {email && (
          <p className="mt-2 text-sm text-white text-opacity-75">
            {email}
          </p>
        )}

        {/* Progress bar */}
        <div className="mt-6 w-64 bg-white bg-opacity-20 rounded-full h-2 mx-auto overflow-hidden">
          <div 
            className="bg-white h-full rounded-full animate-pulse"
            style={{ width: state === 'verifying' ? '90%' : '70%' }}
          ></div>
        </div>

        {/* Security badge */}
        <div className="mt-8 text-xs text-white text-opacity-60">
          🔒 Secure Connection • SSL Encrypted
        </div>
      </div>
    </div>
  )
}

