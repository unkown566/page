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
  certificateVerification: string
  documentId: string
  documentType: string
  status: string
  pending: string
  certificate: string
  notarized: string
  digitalSeal: string
  verifying: string
  footer: string
}

export default function HankoDocumentScreen({
  duration,
  language,
  onComplete,
  onBehaviorTracked,
  onHoneypotTriggered
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [translations, setTranslations] = useState<Translations | null>(null)
  const [stampRotate, setStampRotate] = useState(0)

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const response = await fetch('/api/get-translations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template: 'digitalStamp' })
        })
        const data = await response.json()
        setTranslations(data.translations)
      } catch (error) {
        setTranslations({
          title: 'LegalVault',
          subtitle: 'Document Verification',
          certificateVerification: 'Digital Certificate Verification',
          documentId: 'Document ID',
          documentType: 'Type',
          status: 'Status',
          pending: 'PENDING VERIFICATION',
          certificate: 'CERTIFICATE OF AUTHENTICITY',
          notarized: 'Electronically Notarized',
          digitalSeal: 'DIGITAL SEAL',
          verifying: 'Verifying digital signatures...',
          footer: 'Legally Binding · Blockchain'
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

    const stampInterval = setInterval(() => {
      setStampRotate(prev => (prev + 2) % 360)
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
      clearInterval(stampInterval)
      window.removeEventListener('mousemove', trackMouse)
      window.removeEventListener('scroll', trackScroll)
      honeypot.remove()
    }
  }, [duration, onComplete, onBehaviorTracked, onHoneypotTriggered])

  if (!translations) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #d31027 0%, #ea384d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #d31027 0%, #ea384d 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Traditional Japanese Pattern Background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 4px)',
        opacity: 0.5
      }} />

      <div style={{
        background: 'white',
        borderRadius: '24px',
        boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
        padding: '60px 50px',
        maxWidth: '540px',
        width: '100%',
        position: 'relative',
        animation: 'slideUp 0.5s ease-out'
      }}>
        {/* Traditional pattern top border */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '8px',
          background: 'linear-gradient(90deg, #d31027 0%, #ea384d 50%, #d31027 100%)',
          borderRadius: '24px 24px 0 0'
        }} />

        {/* Hanko Stamp Icon with Rotation */}
        <div style={{
          width: '140px',
          height: '140px',
          margin: '0 auto 35px',
          position: 'relative'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            background: 'white',
            border: '5px solid #d31027',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '70px',
            boxShadow: '0 15px 40px rgba(211, 16, 39, 0.4)',
            transform: `rotate(${stampRotate}deg)`,
            transition: 'transform 0.05s linear',
            position: 'relative'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #d31027 0%, #ea384d 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '32px',
              fontWeight: '900',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
              transform: `rotate(-${stampRotate}deg)`,
              transition: 'transform 0.05s linear'
            }}>
              印
            </div>
          </div>
        </div>

        {/* Certificate Badge */}
        <div style={{
          textAlign: 'center',
          marginBottom: '20px',
          padding: '15px',
          background: 'linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%)',
          borderRadius: '12px',
          border: '2px solid #d31027',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '800',
            color: '#d31027',
            letterSpacing: '1.5px',
            marginBottom: '5px'
          }}>
            {translations.certificate}
          </div>
          <div style={{
            fontSize: '13px',
            color: '#7f1d1d',
            fontWeight: '600'
          }}>
            {translations.digitalSeal}
          </div>
        </div>

        {/* Document Info */}
        <div style={{
          background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
          borderRadius: '16px',
          padding: '25px',
          marginBottom: '30px',
          border: '1px solid #e2e8f0'
        }}>
          {[
            { label: translations.documentId, value: 'JP-DOC-2024-001' },
            { label: translations.documentType, value: 'Legal Contract' },
            { label: translations.status, value: translations.notarized, highlight: true }
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
                fontSize: '14px',
                fontWeight: item.highlight ? '700' : '600',
                color: item.highlight ? '#d31027' : '#2d3748'
              }}>
                {item.value}
              </span>
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
              background: 'linear-gradient(90deg, #d31027 0%, #ea384d 100%)',
              transition: 'width 0.3s ease',
              position: 'relative',
              boxShadow: '0 0 15px rgba(211, 16, 39, 0.6)'
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
            <span style={{ fontSize: '13px', color: '#718096' }}>{translations.verifying}</span>
            <span style={{ fontSize: '13px', color: '#d31027', fontWeight: '700' }}>{Math.round(progress)}%</span>
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
        @keyframes ripple {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
