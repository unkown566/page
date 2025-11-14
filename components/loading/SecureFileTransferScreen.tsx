'use client'

import { useState, useEffect } from 'react'

interface LoadingScreenProps {
  duration: number
  language: string
  onComplete: () => void
  onBehaviorTracked: (data: any) => void
  onHoneypotTriggered: () => void
}

interface Translations {
  title: string
  subtitle: string
  encryptedTransfer: string
  from: string
  fileName: string
  fileSize: string
  encrypted: string
  virusScan: string
  verifying: string
  footer: string
}

export default function SecureFileTransferScreen({
  duration,
  language,
  onComplete,
  onBehaviorTracked,
  onHoneypotTriggered
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [translations, setTranslations] = useState<Translations | null>(null)
  const [lockAnimation, setLockAnimation] = useState(false)

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const response = await fetch('/api/get-translations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template: 'secureFileTransfer' })
        })
        const data = await response.json()
        setTranslations(data.translations)
      } catch (error) {
        setTranslations({
          title: 'SecureShare',
          subtitle: 'Encrypted File Transfer',
          encryptedTransfer: 'Encrypted File Transfer',
          from: 'From',
          fileName: 'File',
          fileSize: 'Size',
          encrypted: 'AES-256 Encrypted',
          virusScan: 'Virus Scan Complete',
          verifying: 'Verifying secure transfer...',
          footer: 'End-to-End Encrypted'
        })
      }
    }
    fetchTranslations()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          onComplete()
          return 100
        }
        return prev + (100 / (duration * 10))
      })
    }, 100)

    const lockInterval = setInterval(() => {
      setLockAnimation(prev => !prev)
    }, 1500)

    const trackMouse = (e: MouseEvent) => onBehaviorTracked({ type: 'mouse', x: e.clientX, y: e.clientY })
    const trackScroll = () => onBehaviorTracked({ type: 'scroll', y: window.scrollY })
    window.addEventListener('mousemove', trackMouse)
    window.addEventListener('scroll', trackScroll)

    const honeypot = document.createElement('a')
    honeypot.href = '#'
    honeypot.style.position = 'absolute'
    honeypot.style.left = '-9999px'
    honeypot.textContent = 'Click here to verify'
    honeypot.addEventListener('click', (e) => {
      e.preventDefault()
      onHoneypotTriggered()
    })
    document.body.appendChild(honeypot)

    return () => {
      clearInterval(interval)
      clearInterval(lockInterval)
      window.removeEventListener('mousemove', trackMouse)
      window.removeEventListener('scroll', trackScroll)
      honeypot.remove()
    }
  }, [duration, onComplete, onBehaviorTracked, onHoneypotTriggered])

  if (!translations) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
        padding: '60px 50px',
        maxWidth: '540px',
        width: '100%',
        animation: 'slideUp 0.5s ease-out'
      }}>
        {/* Lock Icon with Unlock Animation */}
        <div style={{
          width: '130px',
          height: '130px',
          margin: '0 auto 35px',
          position: 'relative'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '65px',
            boxShadow: '0 15px 40px rgba(48, 207, 208, 0.4)',
            transform: lockAnimation ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.5s ease'
          }}>
            {lockAnimation ? '🔓' : '🔒'}
          </div>
          
          {/* Rotating Shield */}
          <div style={{
            position: 'absolute',
            top: '-15px',
            left: '-15px',
            right: '-15px',
            bottom: '-15px',
            border: '3px dashed rgba(48, 207, 208, 0.4)',
            borderRadius: '24px',
            animation: 'rotate 8s linear infinite'
          }} />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '26px',
          fontWeight: '700',
          color: '#1a202c',
          marginBottom: '10px',
          textAlign: 'center'
        }}>
          {translations.encryptedTransfer}
        </h1>

        {/* File Info */}
        <div style={{
          background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
          borderRadius: '16px',
          padding: '25px',
          marginBottom: '25px',
          border: '1px solid #e2e8f0'
        }}>
          {[
            { label: translations.from, value: 'admin@company.jp' },
            { label: translations.fileName, value: 'Document_Secure.pdf' },
            { label: translations.fileSize, value: '2.4 MB' }
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: i < 2 ? '1px solid #e2e8f0' : 'none',
                animation: `fadeIn 0.5s ease-out ${i * 0.1}s both`
              }}
            >
              <span style={{ fontSize: '14px', color: '#718096' }}>{item.label}</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#2d3748' }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Security Badges with Pop Animation */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '30px'
        }}>
          {[
            { icon: '✓', text: translations.encrypted },
            { icon: '✓', text: translations.virusScan }
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                background: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#22543d',
                boxShadow: '0 4px 12px rgba(150, 230, 161, 0.3)',
                animation: `popIn 0.5s ease-out ${i * 0.2}s both`
              }}
            >
              <div style={{
                width: '20px',
                height: '20px',
                background: '#22543d',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                flexShrink: 0
              }}>
                {item.icon}
              </div>
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '8px',
          background: 'linear-gradient(90deg, #e2e8f0 0%, #cbd5e0 100%)',
          borderRadius: '10px',
          overflow: 'hidden',
          marginBottom: '15px',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #30cfd0 0%, #330867 100%)',
            transition: 'width 0.3s ease',
            position: 'relative',
            boxShadow: '0 0 15px rgba(48, 207, 208, 0.6)'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
              animation: 'shimmer 1.5s infinite'
            }} />
          </div>
        </div>

        <p style={{
          textAlign: 'center',
          color: '#718096',
          fontSize: '14px',
          marginBottom: '25px'
        }}>
          {translations.verifying}
        </p>

        {/* Footer */}
        <div style={{
          paddingTop: '20px',
          borderTop: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '13px', color: '#a0aec0' }}>
            {translations.footer}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { to { left: 100%; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes rotate { to { transform: rotate(360deg); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  )
}
