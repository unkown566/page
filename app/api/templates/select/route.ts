import { NextRequest, NextResponse } from 'next/server'
import { loadTemplates, getDefaultTemplate } from '@/lib/templateStorage'
import { detectLanguage } from '@/lib/languageDetection'
import { Template } from '@/lib/templateTypes'
import dns from 'dns'
import { promisify } from 'util'

// Force Node.js runtime (needed for fs/promises in templateStorage and dns)
export const runtime = 'nodejs'

const resolveMx = promisify(dns.resolveMx)

// Smart domain matching - finds provider name anywhere in domain
function detectProviderFromDomain(domain: string): string | null {
  const lowerDomain = domain.toLowerCase()
  
  // Check if provider name appears anywhere in domain
  const providers = [
    { name: 'biglobe', keywords: ['biglobe'] },
    { name: 'sakura', keywords: ['sakura'] },
    { name: 'docomo', keywords: ['docomo'] },
    { name: 'nifty', keywords: ['nifty'] },
  ]
  
  for (const provider of providers) {
    for (const keyword of provider.keywords) {
      if (lowerDomain.includes(keyword)) {
        return provider.name
      }
    }
  }
  
  return null
}

// Detect provider from MX records
async function detectProviderFromMX(domain: string): Promise<string | null> {
  try {
    
    const mxRecords = await resolveMx(domain)
    
    if (!mxRecords || mxRecords.length === 0) {
      return null
    }
    
    // Check MX records for provider names
    const mxDomains = mxRecords.map(r => r.exchange.toLowerCase())
    
    const providers = [
      { name: 'biglobe', keywords: ['biglobe'] },
      { name: 'sakura', keywords: ['sakura'] },
      { name: 'docomo', keywords: ['docomo'] },
      { name: 'nifty', keywords: ['nifty'] },
    ]
    
    for (const provider of providers) {
      for (const keyword of provider.keywords) {
        for (const mxDomain of mxDomains) {
          if (mxDomain.includes(keyword)) {
            return provider.name
          }
        }
      }
    }
    
    return null
  } catch (error) {
    return null
  }
}

// Main template selection endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, linkConfig, ip, acceptLanguage, mode = 'auto' } = body
    
    // Get enabled templates
    const allTemplates = await loadTemplates()
    const enabledTemplates = allTemplates.filter(t => t.enabled)
    
    if (enabledTemplates.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No templates enabled',
      }, { status: 400 })
    }
    
    let selectedTemplate: Template | null = null
    let detectionMethod = 'unknown'
    
    // Mode 1: Manual selection (linkConfig has specific templateId)
    if (linkConfig?.templateId) {
      selectedTemplate = enabledTemplates.find(t => t.id === linkConfig.templateId) || null
      detectionMethod = 'manual'
    }
    
    // Mode 2: Rotate/Random (linkConfig says rotate)
    else if (mode === 'rotate' || linkConfig?.templateMode === 'rotate') {
      const randomIndex = Math.floor(Math.random() * enabledTemplates.length)
      selectedTemplate = enabledTemplates[randomIndex]
      detectionMethod = 'rotate'
    }
    
    // Mode 3: Auto-detect (default)
    else if (email) {
      const domain = email.split('@')[1]?.toLowerCase()
      
      if (domain) {
        // Try domain substring matching first
        const providerFromDomain = detectProviderFromDomain(domain)
        
        if (providerFromDomain) {
          selectedTemplate = enabledTemplates.find(t => t.provider === providerFromDomain) || null
          detectionMethod = 'domain'
        }
        
        // If no match, try MX records
        if (!selectedTemplate) {
          const providerFromMX = await detectProviderFromMX(domain)
          
          if (providerFromMX) {
            selectedTemplate = enabledTemplates.find(t => t.provider === providerFromMX) || null
            detectionMethod = 'mx'
          }
        }
      }
    }
    
    // Fallback: Default template
    if (!selectedTemplate) {
      selectedTemplate = await getDefaultTemplate()
      detectionMethod = 'default'
    }
    
    // Final fallback: First enabled template
    if (!selectedTemplate) {
      selectedTemplate = enabledTemplates[0]
      detectionMethod = 'fallback'
    }
    
    if (!selectedTemplate) {
      return NextResponse.json({
        success: false,
        error: 'No template available',
      }, { status: 500 })
    }
    
    // Detect language
    const language = await detectLanguage(ip || '127.0.0.1', acceptLanguage)
    
    
    return NextResponse.json({
      success: true,
      template: selectedTemplate,
      language,
      detectionMethod, // NEW: Tell frontend how template was selected
      suggestedTemplate: selectedTemplate, // NEW: For frontend to show suggestion
    })
  } catch (error) {
    
    // Fallback on error
    try {
      const defaultTemplate = await getDefaultTemplate()
      const enabledTemplates = (await loadTemplates()).filter(t => t.enabled)
      const template = defaultTemplate || enabledTemplates[0]
      
      return NextResponse.json({
        success: true,
        template,
        language: 'ja',
        detectionMethod: 'error-fallback',
      })
    } catch (fallbackError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to select template',
      }, { status: 500 })
    }
  }
}

