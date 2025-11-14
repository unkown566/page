export interface FoxUser {
  foxId: string
  passwordHash: string
  licenseToken?: string
  twoFactorEnabled: boolean
  twoFactorSecret?: string
  createdAt: number
}

export interface LoginCredentials {
  foxId: string
  password: string
  twoFactorCode?: string
}

export interface SignupCredentials {
  licenseToken: string
  password: string
  confirmPassword: string
}

/**
 * Mock auth - replace with real implementation
 */
export async function loginUser(credentials: LoginCredentials) {
  // TODO: Replace with real API call
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Simulate validation
  if (credentials.password.length < 8) {
    throw new Error('Invalid credentials')
  }
  
  return {
    success: true,
    foxId: credentials.foxId,
    requiresTwoFactor: false, // Set based on user settings
  }
}

/**
 * Signup with license validation
 */
export async function signupUser(credentials: SignupCredentials, foxId: string) {
  // Validate password match first
  if (credentials.password !== credentials.confirmPassword) {
    throw new Error('Passwords do not match')
  }
  
  // Import license API
  const { verifyLicenseToken, getClientIP } = await import('./licenseApi')
  
  // Get client IP
  const clientIP = await getClientIP()
  
  // Verify license token with kratools API
  const verification = await verifyLicenseToken(credentials.licenseToken)
  
  // Check verification result
  if (!verification.live) {
    if (verification.expired) {
      throw new Error('License token has expired')
    }
    throw new Error(verification.error || 'Invalid license token')
  }
  
  if (verification.message && verification.message.includes('IP not allowed')) {
    throw new Error('Your IP address is not authorized for this license. Please contact support.')
  }
  
  // License valid! Create account
  // TODO: Save to your database
  
  return {
    success: true,
    foxId,
  }
}

/**
 * Verify 2FA code
 */
export async function verifyTwoFactor(foxId: string, code: string) {
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // TODO: Implement real 2FA verification
  if (code.length !== 6) {
    throw new Error('Invalid 2FA code')
  }
  
  return { success: true }
}

