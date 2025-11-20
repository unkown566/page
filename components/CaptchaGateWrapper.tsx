'use client'

import CaptchaGateUnified from './CaptchaGateUnified'

interface CaptchaGateWrapperProps {
  onVerified: () => void
}

export default function CaptchaGateWrapper({ onVerified }: CaptchaGateWrapperProps) {
  // Removed Suspense wrapper - CaptchaGateUnified handles its own loading state
  // This fixes the double CAPTCHA loading issue
  return <CaptchaGateUnified onVerified={onVerified} />
}


