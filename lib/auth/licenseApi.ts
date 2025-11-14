/**
 * License Verification API Integration
 * Connects to kratools.com for license validation
 */

const API_BASE = 'https://kratools.com/api'

export interface LicenseVerificationResult {
  live: boolean
  expired?: boolean
  error?: string
  message?: string
}

/**
 * Get client IP from kratools API
 */
export async function getClientIP(): Promise<string> {
  try {
    const response = await fetch(`${API_BASE}/get-ip`, {
      method: 'GET',
    })
    
    const data = await response.json()
    return data.ip || '127.0.0.1'
  } catch (error) {
    return '127.0.0.1'
  }
}

/**
 * Verify license token with kratools API
 */
export async function verifyLicenseToken(token: string): Promise<LicenseVerificationResult> {
  try {
    const formData = new FormData()
    formData.append('code', token)
    
    const response = await fetch(`${API_BASE}/key`, {
      method: 'POST',
      body: formData
    })
    
    const data = await response.json()
    
    // API returns:
    // Success: {"live": true, "expired": false}
    // Failed: {"live": false, "error": "Invalid token"}
    // Expired: {"live": false, "expired": true}
    // IP Blocked: {"live": true, "expired": false, "message": "Access denied: IP not allowed"}
    
    return {
      live: data.live || false,
      expired: data.expired || false,
      error: data.error,
      message: data.message
    }
  } catch (error) {
    return {
      live: false,
      error: 'Network error - please try again'
    }
  }
}

/**
 * Register current IP with license token
 * This tells the server to allow this IP for this token
 */
export async function registerIPWithToken(token: string, ip: string): Promise<boolean> {
  // TODO: If your API has an endpoint to register/add IPs
  // Implement it here
  return true
}

