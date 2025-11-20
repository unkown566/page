import * as net from 'net'
import * as tls from 'tls'
import { SMTP_TEST_CONFIGS, detectSMTPProvider } from './smtpTestConfig'

export interface SMTPTestResult {
  success: boolean
  provider: string
  host: string
  port: number
  responseTime: number
  smtpBanner?: string
  error?: string
  details: string[]
}

async function testSMTPConnection(
  host: string,
  port: number,
  timeout: number,
  useTLS: boolean
): Promise<SMTPTestResult> {
  const startTime = Date.now()
  const details: string[] = []
  
  return new Promise((resolve) => {
    let socket: net.Socket | tls.TLSSocket
    let resolved = false
    
    const cleanup = () => {
      if (socket) {
        socket.destroy()
      }
    }
    
    const timeoutHandle = setTimeout(() => {
      if (!resolved) {
        resolved = true
        cleanup()
        resolve({
          success: false,
          provider: 'Unknown',
          host,
          port,
          responseTime: Date.now() - startTime,
          error: 'Connection timeout',
          details: [...details, 'Connection timed out']
        })
      }
    }, timeout)
    
    try {
      if (useTLS) {
        socket = tls.connect({
          host,
          port,
          rejectUnauthorized: false
        })
      } else {
        socket = net.connect({ host, port })
      }
      
      socket.setEncoding('utf8')
      
      socket.on('connect', () => {
        details.push(`Connected to ${host}:${port}`)
      })
      
      socket.on('data', (data: string) => {
        if (!resolved) {
          const banner = data.toString().trim()
          details.push(`Received: ${banner}`)
          
          // Check for SMTP banner (220)
          if (banner.startsWith('220')) {
            resolved = true
            clearTimeout(timeoutHandle)
            cleanup()
            
            resolve({
              success: true,
              provider: 'Unknown',
              host,
              port,
              responseTime: Date.now() - startTime,
              smtpBanner: banner,
              details
            })
          }
        }
      })
      
      socket.on('error', (err: Error) => {
        if (!resolved) {
          resolved = true
          clearTimeout(timeoutHandle)
          cleanup()
          
          details.push(`Error: ${err.message}`)
          
          resolve({
            success: false,
            provider: 'Unknown',
            host,
            port,
            responseTime: Date.now() - startTime,
            error: err.message,
            details
          })
        }
      })
      
      socket.on('timeout', () => {
        if (!resolved) {
          resolved = true
          clearTimeout(timeoutHandle)
          cleanup()
          
          details.push('Socket timeout')
          
          resolve({
            success: false,
            provider: 'Unknown',
            host,
            port,
            responseTime: Date.now() - startTime,
            error: 'Socket timeout',
            details
          })
        }
      })
      
    } catch (error: any) {
      if (!resolved) {
        resolved = true
        clearTimeout(timeoutHandle)
        
        details.push(`Exception: ${error.message}`)
        
        resolve({
          success: false,
          provider: 'Unknown',
          host,
          port,
          responseTime: Date.now() - startTime,
          error: error.message,
          details
        })
      }
    }
  })
}

async function testSMTPConnectionMultiPort(
  host: string,
  ports: number[],
  timeout: number
): Promise<SMTPTestResult> {
  
  // Try each port sequentially
  for (const port of ports) {
    
    const useTLS = port === 465 // Port 465 uses implicit TLS
    
    try {
      const result = await testSMTPConnection(host, port, timeout, useTLS)
      
      if (result.success) {
        return result
      } else {
      }
    } catch (error) {
      continue
    }
  }
  
  // All ports failed
  return {
    success: false,
    provider: 'Unknown',
    host,
    port: ports[0],
    responseTime: 0,
    error: `All ports failed: ${ports.join(', ')}`,
    details: [`Tested ports: ${ports.join(', ')}`, 'All connection attempts failed']
  }
}

export async function testEmailSMTP(
  email: string,
  mxRecord?: string
): Promise<SMTPTestResult> {
  
  // Detect provider
  const providerKey = mxRecord ? detectSMTPProvider(mxRecord) : null
  
  if (!providerKey) {
    return {
      success: false,
      provider: 'Unknown',
      host: 'unknown',
      port: 0,
      responseTime: 0,
      error: 'Provider not recognized',
      details: ['No SMTP configuration available for this provider']
    }
  }
  
  const config = SMTP_TEST_CONFIGS[providerKey]
  
  if (!config) {
    return {
      success: false,
      provider: providerKey,
      host: 'unknown',
      port: 0,
      responseTime: 0,
      error: 'SMTP config not found',
      details: ['Provider recognized but no SMTP config available']
    }
  }
  
  // Handle dynamic hostnames (Sakura, Xserver, etc.)
  let testHost = config.host
  
  if (!testHost || testHost === '') {
    // Extract domain from email for hosting providers
    const domain = email.split('@')[1]
    
    if (providerKey === 'sakura') {
      testHost = domain // Use user's domain (xxx.sakura.ne.jp)
    } else if (providerKey === 'xserver') {
      // Cannot test without knowing server number
      return {
        success: false,
        provider: config.provider,
        host: 'sv***.xserver.jp',
        port: config.primaryPort,
        responseTime: 0,
        error: 'Cannot determine Xserver server number',
        details: ['Xserver requires specific server number (sv***.xserver.jp)', 'Check Server Panel → Server Information']
      }
    } else {
      testHost = domain // Fallback to email domain
    }
  }
  
  
  // Try primary port first, then fallback to other ports
  const portOrder = [
    config.primaryPort,
    ...config.ports.filter(p => p !== config.primaryPort)
  ]
  
  const result = await testSMTPConnectionMultiPort(
    testHost,
    portOrder,
    config.timeout
  )
  
  result.provider = config.provider
  
  return result
}










