export interface Member {
  memberId: string
  passwordHash: string
  serviceCode?: string
  securityEnabled: boolean
  securitySecret?: string
  createdAt: number
}

export interface ConnectCredentials {
  memberId: string
  password: string
  verificationCode?: string
}

export interface RegisterCredentials {
  serviceCode: string
  password: string
  confirmPassword: string
}

export async function authenticateMember(credentials: ConnectCredentials) {
  // TODO: Replace with real API call
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  if (credentials.password.length < 8) {
    throw new Error('Invalid credentials')
  }
  
  return {
    success: true,
    memberId: credentials.memberId,
    requiresVerification: false,
  }
}

export async function registerMember(credentials: RegisterCredentials, memberId: string) {
  if (credentials.password !== credentials.confirmPassword) {
    throw new Error('Passwords do not match')
  }
  
  const { validateService, getClientIP } = await import('./serviceClient')
  
  const clientIP = await getClientIP()
  
  const verification = await validateService(credentials.serviceCode)
  
  if (!verification.live) {
    if (verification.expired) {
      throw new Error('Service code has expired')
    }
    throw new Error(verification.error || 'Invalid service code')
  }
  
  if (verification.message && verification.message.includes('IP not allowed')) {
    throw new Error('Your IP address is not authorized for this service. Please contact support.')
  }
  
  
  return {
    success: true,
    memberId,
  }
}

export async function verifySecurityCode(memberId: string, code: string) {
  await new Promise(resolve => setTimeout(resolve, 500))
  
  if (code.length !== 6) {
    throw new Error('Invalid verification code')
  }
  
  return { success: true }
}

