// PHASE 🦊 SPEED FIX: Shared development/runtime helpers
export const IS_DEV = process.env.NODE_ENV === 'development'

const DEV_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1'])

export const IS_LOCALHOST =
  typeof window !== 'undefined' ? DEV_HOSTS.has(window.location.hostname) : false


