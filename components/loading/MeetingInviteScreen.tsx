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
  from: string
  to: string
  date: string
  time: string
  location: string
  attendees: string
  preparing: string
  footer: string
  loading: string
}

export default function MeetingInviteScreen({
  duration,
  language,
  onComplete,
  onBehaviorTracked,
  onHoneypotTriggered
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [dots, setDots] = useState('.')
  const [translations, setTranslations] = useState<Translations | null>(null)
  const [pulseAnimation, setPulseAnimation] = useState(0)

  // Fetch translations
  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const response = await fetch('/api/get-translations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template: 'meetingInvite' })
        })
        
        const data = await response.json()
        setTranslations(data.translations)
      } catch (error) {
        // Fallback to English
        setTranslations({
          title: 'Meeting Invitation',
          subtitle: 'Secure Meeting Portal',
          from: 'From',
          to: 'To',
          date: 'Date',
          time: 'Time',
          location: 'Location',
          attendees: 'Attendees',
          preparing: 'Preparing meeting details...',
          footer: 'Secure · Confidential',
          loading: 'Loading'
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

    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '.' : prev + '.')
    }, 500)

    const pulseInterval = setInterval(() => {
      setPulseAnimation(prev => (prev + 1) % 2)
    }, 1000)

    const trackMouse = (e: MouseEvent) => {
      onBehaviorTracked({ type: 'mouse', x: e.clientX, y: e.clientY })
    }

    const trackScroll = () => {
      onBehaviorTracked({ type: 'scroll', y: window.scrollY })
    }

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
      clearInterval(dotsInterval)
      clearInterval(pulseInterval)
      window.removeEventListener('mousemove', trackMouse)
      window.removeEventListener('scroll', trackScroll)
      honeypot.remove()
    }
  }, [duration, onComplete, onBehaviorTracked, onHoneypotTriggered])

  // Loading state while fetching translations
  if (!translations) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background circles */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        right: '-50px',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-100px',
        left: '-100px',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 8s ease-in-out infinite reverse'
      }} />

      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        padding: '60px 50px',
        maxWidth: '520px',
        width: '100%',
        position: 'relative',
        animation: 'slideUp 0.5s ease-out'
      }}>
        {/* Calendar Icon with Animation */}
        <div style={{
          width: '120px',
          height: '120px',
          margin: '0 auto 30px',
          position: 'relative',
          transform: pulseAnimation ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 0.5s ease'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '60px',
            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            📅
          </div>
          {/* Rotating ring around icon */}
          <div style={{
            position: 'absolute',
            top: '-10px',
            left: '-10px',
            right: '-10px',
            bottom: '-10px',
            border: '3px solid rgba(102, 126, 234, 0.3)',
            borderTop: '3px solid #667eea',
            borderRadius: '24px',
            animation: 'rotate 3s linear infinite'
          }} />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#1a202c',
          marginBottom: '12px',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          {translations.title}
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: '16px',
          color: '#718096',
          marginBottom: '40px',
          textAlign: 'center',
          lineHeight: '1.6'
        }}>
          {translations.subtitle}
        </p>

        {/* Meeting Info Cards with Slide Animation */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px',
          marginBottom: '35px'
        }}>
          {[
            { label: translations.date, value: 'Nov 14, 2024', delay: '0s' },
            { label: translations.time, value: '10:00 AM', delay: '0.1s' },
            { label: translations.location, value: 'Conference Room A', delay: '0.2s', span: 2 },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                gridColumn: item.span ? `span ${item.span}` : 'span 1',
                padding: '18px',
                background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                animation: `slideInLeft 0.5s ease-out ${item.delay} both`
              }}
            >
              <div style={{ fontSize: '11px', color: '#a0aec0', marginBottom: '5px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#2d3748' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Animated Progress Bar */}
        <div style={{ marginBottom: '25px' }}>
          <div style={{
            width: '100%',
            height: '6px',
            background: 'linear-gradient(90deg, #e2e8f0 0%, #cbd5e0 100%)',
            borderRadius: '10px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '10px',
              transition: 'width 0.3s ease',
              position: 'relative',
              boxShadow: '0 0 10px rgba(102, 126, 234, 0.5)'
            }}>
              {/* Shimmer effect */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                animation: 'shimmer 1.5s infinite'
              }} />
            </div>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '8px'
          }}>
            <span style={{ fontSize: '12px', color: '#a0aec0', fontWeight: '500' }}>
              {translations.preparing}
            </span>
            <span style={{ fontSize: '12px', color: '#667eea', fontWeight: '700' }}>
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Loading Dots Animation */}
        <div style={{
          textAlign: 'center',
          color: '#667eea',
          fontSize: '14px',
          fontWeight: '500',
          height: '20px'
        }}>
          {translations.loading}{dots}
        </div>

        {/* Footer Badge */}
        <div style={{
          marginTop: '35px',
          paddingTop: '25px',
          borderTop: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
            borderRadius: '20px',
            fontSize: '12px',
            color: 'white',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(72, 187, 120, 0.3)'
          }}>
            <span style={{ fontSize: '16px' }}>🔒</span>
            {translations.footer}
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes rotate {
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes shimmer {
          to { left: 100%; }
        }
      `}</style>
    </div>
  )
}
