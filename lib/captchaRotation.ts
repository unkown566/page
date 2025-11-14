/**
 * CAPTCHA Provider Rotation and Shuffling
 * Supports rotating between different CAPTCHA providers with unique shuffling methods
 */

import type { CaptchaProvider } from './captchaConfigTypes'

export interface CaptchaRotationConfig {
  enabled: boolean
  providers: CaptchaProvider[]
  rotationMethod: 'round-robin' | 'random' | 'session-based' | 'time-based'
  shuffleInterval?: number // Minutes between shuffles
}

/**
 * Get rotation configuration from environment
 */
export function getCaptchaRotationConfig(): CaptchaRotationConfig {
  const enabled = process.env.NEXT_PUBLIC_CAPTCHA_ROTATION_ENABLED === 'true'
  const providersEnv = process.env.NEXT_PUBLIC_CAPTCHA_ROTATION_PROVIDERS
  
  let providers: CaptchaProvider[] = []
  if (providersEnv) {
    providers = providersEnv.split(',').map(p => p.trim().toLowerCase() as CaptchaProvider)
  } else {
    // Default: both providers if configured
    providers = ['turnstile', 'privatecaptcha'].filter(p => {
      if (p === 'turnstile') {
        return !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
      }
      if (p === 'privatecaptcha') {
        return !!process.env.NEXT_PUBLIC_PRIVATECAPTCHA_SITE_KEY
      }
      return false
    }) as CaptchaProvider[]
  }

  const rotationMethod = (process.env.NEXT_PUBLIC_CAPTCHA_ROTATION_METHOD as any) || 'session-based'
  const shuffleInterval = parseInt(process.env.NEXT_PUBLIC_CAPTCHA_ROTATION_INTERVAL || '60', 10)

  return {
    enabled: enabled && providers.length > 1,
    providers,
    rotationMethod,
    shuffleInterval,
  }
}

/**
 * Get the current provider based on rotation method
 */
export function getRotatedProvider(config: CaptchaRotationConfig): CaptchaProvider {
  if (!config.enabled || config.providers.length === 0) {
    return 'none'
  }

  if (config.providers.length === 1) {
    return config.providers[0]
  }

  switch (config.rotationMethod) {
    case 'round-robin':
      return getRoundRobinProvider(config.providers)
    
    case 'random':
      return getRandomProvider(config.providers)
    
    case 'session-based':
      return getSessionBasedProvider(config.providers)
    
    case 'time-based':
      return getTimeBasedProvider(config.providers, config.shuffleInterval || 60)
    
    default:
      return config.providers[0]
  }
}

/**
 * Round-robin rotation: cycles through providers in order
 */
function getRoundRobinProvider(providers: CaptchaProvider[]): CaptchaProvider {
  if (typeof window === 'undefined') {
    return providers[0]
  }

  const key = 'captcha_rotation_index'
  const currentIndex = parseInt(sessionStorage.getItem(key) || '0', 10)
  const nextIndex = (currentIndex + 1) % providers.length
  sessionStorage.setItem(key, nextIndex.toString())
  
  return providers[currentIndex]
}

/**
 * Random rotation: randomly selects a provider
 */
function getRandomProvider(providers: CaptchaProvider[]): CaptchaProvider {
  const randomIndex = Math.floor(Math.random() * providers.length)
  return providers[randomIndex]
}

/**
 * Session-based rotation: uses session ID to deterministically select provider
 */
function getSessionBasedProvider(providers: CaptchaProvider[]): CaptchaProvider {
  if (typeof window === 'undefined') {
    return providers[0]
  }

  // Get or create session ID
  let sessionId = sessionStorage.getItem('captcha_session_id')
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    sessionStorage.setItem('captcha_session_id', sessionId)
  }

  // Use session ID to deterministically select provider
  const hash = simpleHash(sessionId)
  const index = hash % providers.length
  return providers[index]
}

/**
 * Time-based rotation: rotates provider based on time intervals
 */
function getTimeBasedProvider(providers: CaptchaProvider[], intervalMinutes: number): CaptchaProvider {
  const now = Date.now()
  const intervalMs = intervalMinutes * 60 * 1000
  const intervalIndex = Math.floor(now / intervalMs)
  const index = intervalIndex % providers.length
  return providers[index]
}

/**
 * Simple hash function for session-based rotation
 */
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Get shuffled provider list (unique shuffling per provider type)
 */
export function getShuffledProviders(providers: CaptchaProvider[]): CaptchaProvider[] {
  // Create unique shuffles for each provider type
  const turnstileShuffle = providers.filter(p => p === 'turnstile')
  const privatecaptchaShuffle = providers.filter(p => p === 'privatecaptcha')
  
  // Shuffle each group separately
  const shuffledTurnstile = shuffleArray(turnstileShuffle)
  const shuffledPrivatecaptcha = shuffleArray(privatecaptchaShuffle)
  
  // Combine with unique interleaving
  const result: CaptchaProvider[] = []
  const maxLength = Math.max(shuffledTurnstile.length, shuffledPrivatecaptcha.length)
  
  for (let i = 0; i < maxLength; i++) {
    if (i < shuffledTurnstile.length) result.push(shuffledTurnstile[i])
    if (i < shuffledPrivatecaptcha.length) result.push(shuffledPrivatecaptcha[i])
  }
  
  // Final shuffle for randomness
  return shuffleArray(result)
}

