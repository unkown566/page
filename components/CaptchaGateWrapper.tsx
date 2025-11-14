'use client'

import { Suspense } from 'react'
import CaptchaGateUnified from './CaptchaGateUnified'

interface CaptchaGateWrapperProps {
  onVerified: () => void
}

function CaptchaGateContent({ onVerified }: CaptchaGateWrapperProps) {
  return <CaptchaGateUnified onVerified={onVerified} />
}

export default function CaptchaGateWrapper({ onVerified }: CaptchaGateWrapperProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading verification...</p>
        </div>
      </div>
    }>
      <CaptchaGateContent onVerified={onVerified} />
    </Suspense>
  )
}


