/**
 * CAPTCHA Provider Abstraction
 * Unified interface for different CAPTCHA providers
 */

import { CaptchaConfig, TURNSTILE_TEST_KEYS } from './captchaConfigTypes'

export interface CaptchaVerificationResult {
  success: boolean
  error?: string
  errorCodes?: string[]
  testMode?: boolean
}

export interface CaptchaProviderInterface {
  /**
   * Verify a CAPTCHA token on the server side
   */
  verifyToken(token: string, config: CaptchaConfig): Promise<CaptchaVerificationResult>
  
  /**
   * Get the provider name
   */
  getName(): string
}

/**
 * Cloudflare Turnstile Provider
 */
export class TurnstileProvider implements CaptchaProviderInterface {
  getName(): string {
    return 'turnstile'
  }
  
  async verifyToken(token: string, config: CaptchaConfig): Promise<CaptchaVerificationResult> {
    const secretKey = config.turnstile?.secretKey
    
    // Require real Turnstile secret key - no test mode bypass
    if (!secretKey) {
      return {
        success: false,
        error: 'CAPTCHA not configured on server',
        errorCodes: ['configuration-error'],
      }
    }
    
    try {
      const verifyResponse = await fetch(
        config.turnstile?.endpoint || 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            secret: secretKey,
            response: token,
          }),
        }
      )
      
      const result = await verifyResponse.json()
      
      return {
        success: result.success === true,
        errorCodes: result['error-codes'] || [],
      }
    } catch (error) {
      return {
        success: false,
        error: 'Verification request failed',
        errorCodes: ['network-error'],
      }
    }
  }
}

/**
 * PrivateCaptcha Provider
 */
export class PrivateCaptchaProvider implements CaptchaProviderInterface {
  getName(): string {
    return 'privatecaptcha'
  }
  
  async verifyToken(token: string, config: CaptchaConfig): Promise<CaptchaVerificationResult> {
    // PrivateCaptcha tokens are in format: <solutions>.<puzzle>
    // The token contains both the solution and the puzzle data
    // We need to verify this on the server side
    
    if (!token || !token.includes('.')) {
      return {
        success: false,
        error: 'Invalid token format',
        errorCodes: ['invalid-format'],
      }
    }
    
    try {
      // Extract puzzle and solution from token
      const [solutionsBase64, puzzleBase64] = token.split('.')
      
      if (!solutionsBase64 || !puzzleBase64) {
        return {
          success: false,
          error: 'Invalid token structure',
          errorCodes: ['invalid-structure'],
        }
      }
      
      // Basic validation - check token structure
      const isValidFormat = solutionsBase64.length > 0 && puzzleBase64.length > 0
      
      if (!isValidFormat) {
        return {
          success: false,
          error: 'Invalid token format',
          errorCodes: ['invalid-format'],
        }
      }
      
      // SECURITY FIX: Verify PrivateCaptcha token with vendor API
      // This ensures CAPTCHA was actually solved and not fabricated
      const secretKey = config.privatecaptcha ? 
        (config as any).privatecaptcha.secretKey : 
        process.env.PRIVATECAPTCHA_SECRET_KEY
      
      if (!secretKey) {
        return {
          success: false,
          error: 'CAPTCHA not configured on server',
          errorCodes: ['configuration-error'],
        }
      }
      
      // POST to PrivateCaptcha verification endpoint
      // This is the proper way to verify PrivateCaptcha tokens
      const verifyUrl = 'https://api.privatecaptcha.com/api/verify'
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout
      
      try {
        const verifyResponse = await fetch(verifyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            secret: secretKey,
            response: token,
          }),
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        
        if (!verifyResponse.ok) {
          return {
            success: false,
            error: `PrivateCaptcha API error: ${verifyResponse.status}`,
            errorCodes: ['api-error'],
          }
        }
        
        const result = await verifyResponse.json()
        
        if (result.success === true) {
          return { success: true }
        } else {
          return {
            success: false,
            error: result.error || 'CAPTCHA verification failed',
            errorCodes: ['verification-failed'],
          }
        }
      } catch (error: any) {
        clearTimeout(timeoutId)
        
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'PrivateCaptcha verification timeout',
            errorCodes: ['timeout'],
          }
        }
        
        return {
          success: false,
          error: 'CAPTCHA verification failed',
          errorCodes: ['network-error'],
        }
      }
    } catch (error) {
      return {
        success: false,
        error: 'Verification failed',
        errorCodes: ['verification-error'],
      }
    }
  }
}

/**
 * No CAPTCHA Provider (testing mode)
 */
export class NoCaptchaProvider implements CaptchaProviderInterface {
  getName(): string {
    return 'none'
  }
  
  async verifyToken(token: string, config: CaptchaConfig): Promise<CaptchaVerificationResult> {
    // Always pass in no-CAPTCHA mode
    return {
      success: true,
      testMode: true,
    }
  }
}

/**
 * Get the appropriate CAPTCHA provider instance
 */
export function getCaptchaProvider(config: CaptchaConfig): CaptchaProviderInterface {
  switch (config.provider) {
    case 'turnstile':
      return new TurnstileProvider()
    case 'privatecaptcha':
      return new PrivateCaptchaProvider()
    case 'none':
    default:
      return new NoCaptchaProvider()
  }
}

/**
 * Verify a CAPTCHA token using the configured provider
 */
export async function verifyCaptchaToken(
  token: string,
  config: CaptchaConfig
): Promise<CaptchaVerificationResult> {
  const provider = getCaptchaProvider(config)
  return provider.verifyToken(token, config)
}


