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
  sharedFolder: string
  owner: string
  members: string
  storage: string
  syncing: string
  footer: string
}

export default function CloudStorageScreen({
  duration,
  language,
  onComplete,
  onBehaviorTracked,
  onHoneypotTriggered
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [translations, setTranslations] = useState<Translations | null>(null)
  const [cloudFloat, setCloudFloat] = useState(0)

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const response = await fetch('/api/get-translations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template: 'cloudStorage' })
        })
        const data = await response.json()
        setTranslations(data.translations)
      } catch (error) {
        setTranslations({
          title: 'CloudVault',
          subtitle: 'Cloud Storage',
          sharedFolder: 'Shared Folder',
          owner: 'Owner',
          members: 'Members',
          storage: 'Storage',
          syncing: 'Syncing files...',
          footer: 'Encrypted · Auto-sync'
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

    const floatInterval = setInterval(() => {
      setCloudFloat(prev => (prev + 1) % 20)
    }, 100)

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
      clearInterval(floatInterval)
      window.removeEventListener('mousemove', trackMouse)
      window.removeEventListener('scroll', trackScroll)
      honeypot.remove()
    }
  }, [duration, onComplete, onBehaviorTracked, onHoneypotTriggered])

  if (!translations) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const floatOffset = Math.sin(cloudFloat / 3) * 10

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
        {/* Cloud Icon with Float Animation & Upload Arrow */}
        <div style={{
          width: '140px',
          height: '140px',
          margin: '0 auto 35px',
          position: 'relative',
          transform: `translateY(${floatOffset}px)`,
          transition: 'transform 0.3s ease'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            margin: '0 auto',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '65px',
            boxShadow: '0 15px 40px rgba(102, 126, 234, 0.4)'
          }}>
            ☁️
          </div>
          
          {/* Animated Upload Arrow */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '30px',
            animation: 'floatUp 1.5s ease-in-out infinite'
          }}>
            ⬆️
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
          {translations.sharedFolder}
        </h1>

        {/* Storage Info */}
        <div style={{
          background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
          borderRadius: '16px',
          padding: '25px',
          marginBottom: '30px',
          border: '1px solid #e2e8f0'
        }}>
          {[
            { label: translations.owner, value: 'admin@company.jp' },
            { label: translations.members, value: '12' },
            { label: translations.storage, value: '2.4 GB / 5 GB', highlight: true }
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
              <span style={{
                fontSize: item.highlight ? '16px' : '14px',
                fontWeight: item.highlight ? '800' : '600',
                color: item.highlight ? '#667eea' : '#2d3748'
              }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* File Sync Animation */}
        <div style={{
          marginBottom: '30px',
          display: 'flex',
          justifyContent: 'center',
          gap: '8px'
        }}>
          {['📄', '📁', '📊', '📷'].map((icon, i) => (
            <div
              key={i}
              style={{
                fontSize: '24px',
                animation: `bounce 1.5s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
                opacity: progress > (i * 25) ? 1 : 0.3,
                transition: 'opacity 0.3s'
              }}
            >
              {icon}
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
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              transition: 'width 0.3s ease',
              position: 'relative',
              boxShadow: '0 0 15px rgba(102, 126, 234, 0.6)'
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
            <span style={{ fontSize: '13px', color: '#718096' }}>{translations.syncing}</span>
            <span style={{ fontSize: '13px', color: '#667eea', fontWeight: '700' }}>{Math.round(progress)}%</span>
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
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes floatUp { 0%, 100% { transform: translateY(0) translateX(-50%); opacity: 1; } 50% { transform: translateY(-15px) translateX(-50%); opacity: 0.7; } }
      `}</style>
    </div>
  )
}
