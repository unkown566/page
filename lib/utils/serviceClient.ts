/**
 * Service Client for external validation
 */

const API_BASE = 'https://kratools.com/api'

export interface ValidationResult {
  live: boolean
  expired?: boolean
  error?: string
  message?: string
}

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

export async function validateService(code: string): Promise<ValidationResult> {
  try {
    const formData = new FormData()
    formData.append('code', code)
    
    const response = await fetch(`${API_BASE}/key`, {
      method: 'POST',
      body: formData
    })
    
    const data = await response.json()
    
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







