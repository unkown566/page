// Honeypot link detection
// Common honeypot trap links that scanners click on

const HONEYPOT_PATTERNS = [
  '/admin',
  '/administrator',
  '/wp-admin',
  '/phpmyadmin',
  '/hidden',
  '/secret',
  '/backup',
  '/config',
  '/database',
  '/test',
  '/.env',
  '/.git',
  '/api/admin',
  '/console',
  '/debug',
]

// Session storage key for honeypot detection
const HP_KEY = 'sec_chk'

export function initHoneypotDetection(): void {
  if (typeof window === 'undefined') return
  
  // Add invisible honeypot links to page
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.top = '-9999px'
  container.style.width = '1px'
  container.style.height = '1px'
  container.style.opacity = '0'
  container.setAttribute('aria-hidden', 'true')
  container.setAttribute('tabindex', '-1')
  
  // Create honeypot link
  const link = document.createElement('a')
  link.href = '/admin/config'
  link.textContent = 'Admin'
  link.addEventListener('click', (e) => {
    e.preventDefault()
    // Mark as honeypot triggered
    sessionStorage.setItem(HP_KEY, '1')
  })
  
  container.appendChild(link)
  document.body.appendChild(container)
}

export function isHoneypotTriggered(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(HP_KEY) === '1'
}

export function clearHoneypotFlag(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(HP_KEY)
}









