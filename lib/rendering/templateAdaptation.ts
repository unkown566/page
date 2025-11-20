/**
 * TEMPLATE-SPECIFIC ADAPTATION
 * 
 * Provides per-template adaptation strategies:
 * - Provider-specific optimizations
 * - Template customization
 * - Adaptive rendering
 * 
 * Each template gets unique adaptation patterns
 */

import { mutateTemplate } from '../stealth/mutationEngine'
import type { Template } from '../templateTypes'

export interface TemplateAdaptationConfig {
  provider: Template['provider']
  adaptationLevel: 'low' | 'medium' | 'high' | 'apt'
  enableProviderSpecific: boolean
}

export interface TemplateAdaptationResult {
  adapted: boolean
  originalTemplate: string
  adaptedTemplate: string
  techniques: string[]
  providerSpecific: boolean
}

/**
 * Apply template-specific adaptation
 */
export function applyTemplateSpecificAdaptation(
  template: Template,
  templateHTML: string,
  config: Partial<TemplateAdaptationConfig> = {}
): TemplateAdaptationResult {
  const defaultConfig: TemplateAdaptationConfig = {
    provider: template.provider,
    adaptationLevel: 'apt',
    enableProviderSpecific: true,
  }

  const finalConfig = { ...defaultConfig, ...config }

  // Base adaptation (always applied)
  const baseAdaptation = mutateTemplate(templateHTML, finalConfig.adaptationLevel)
  
  let adapted = baseAdaptation.mutatedTemplate
  const techniques = [baseAdaptation.technique]

  // ============================================
  // PROVIDER-SPECIFIC ADAPTATIONS
  // ============================================
  if (finalConfig.enableProviderSpecific) {
    switch (template.provider) {
      case 'outlook':
        adapted = applyOutlookAdaptations(adapted)
        techniques.push('outlook-specific')
        break

      case 'docomo':
        adapted = applyDocomoAdaptations(adapted)
        techniques.push('docomo-specific')
        break

      case 'biglobe':
        adapted = applyBiglobeAdaptations(adapted)
        techniques.push('biglobe-specific')
        break

      case 'sakura':
        adapted = applySakuraAdaptations(adapted)
        techniques.push('sakura-specific')
        break

      case 'nifty':
        adapted = applyNiftyAdaptations(adapted)
        techniques.push('nifty-specific')
        break

      case 'sfexpress':
        adapted = applySFExpressAdaptations(adapted)
        techniques.push('sfexpress-specific')
        break

      case 'owaserver':
        adapted = applyOWAServerAdaptations(adapted)
        techniques.push('owaserver-specific')
        break

      default:
        // No provider-specific adaptations
        break
    }
  }

  return {
    adapted: adapted !== templateHTML,
    originalTemplate: templateHTML,
    adaptedTemplate: adapted,
    techniques,
    providerSpecific: finalConfig.enableProviderSpecific,
  }
}

/**
 * Outlook-specific adaptations
 */
function applyOutlookAdaptations(html: string): string {
  // Outlook-specific: Microsoft-style class names
  html = html.replace(/class="([^"]+)"/g, (match, classes) => {
    const adapted = classes.split(' ').map((cls: string) => {
      if (cls.startsWith('ms-')) {
        return `ms-${Math.random().toString(36).substring(2, 6)}`
      }
      return cls
    }).join(' ')
    return `class="${adapted}"`
  })

  // Outlook-specific: Office-style IDs
  html = html.replace(/id="([^"]+)"/g, (match, id) => {
    if (id.startsWith('office-')) {
      return `id="office-${Math.random().toString(36).substring(2, 8)}"`
    }
    return match
  })

  return html
}

/**
 * Docomo-specific adaptations
 */
function applyDocomoAdaptations(html: string): string {
  // Docomo-specific: Japanese-style attributes
  html = html.replace(/data-([^=]+)="([^"]+)"/g, (match, attr, value) => {
    // Add random suffix to data attributes
    return `data-${attr}="${value}_${Math.random().toString(36).substring(2, 5)}"`
  })

  return html
}

/**
 * Biglobe-specific adaptations
 */
function applyBiglobeAdaptations(html: string): string {
  // Biglobe-specific: Add random whitespace
  html = html.replace(/>\s+</g, () => {
    const spaces = ' '.repeat(Math.floor(Math.random() * 3) + 1)
    return `>${spaces}<`
  })

  return html
}

/**
 * Sakura-specific adaptations
 */
function applySakuraAdaptations(html: string): string {
  // Sakura-specific: Comment injection
  const comments = [
    '<!-- Sakura Internet -->',
    '<!-- Server optimization -->',
    '<!-- Performance enhancement -->',
  ]
  const randomComment = comments[Math.floor(Math.random() * comments.length)]
  
  if (html.includes('<head>')) {
    html = html.replace('<head>', `<head>\n${randomComment}\n`)
  }

  return html
}

/**
 * Nifty-specific adaptations
 */
function applyNiftyAdaptations(html: string): string {
  // Nifty-specific: Attribute reordering
  html = html.replace(/<(\w+)([^>]+)>/g, (match, tag, attrs) => {
    const attrList = attrs.match(/\w+="[^"]*"/g) || []
    if (attrList.length > 1) {
      // Shuffle attributes
      for (let i = attrList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [attrList[i], attrList[j]] = [attrList[j], attrList[i]]
      }
      return `<${tag} ${attrList.join(' ')}>`
    }
    return match
  })

  return html
}

/**
 * SF Express-specific adaptations
 */
function applySFExpressAdaptations(html: string): string {
  // SF Express-specific: Chinese-style encoding
  html = html.replace(/[\u4e00-\u9fa5]+/g, (match) => {
    // Add slight variation to Chinese characters (if any)
    return match
  })

  return html
}

/**
 * OWA Server-specific adaptations
 */
function applyOWAServerAdaptations(html: string): string {
  // OWA Server-specific: Exchange-style adaptations
  html = html.replace(/href="([^"]+)"/g, (match, href) => {
    if (href.includes('owa')) {
      // Add random parameter
      const separator = href.includes('?') ? '&' : '?'
      return `href="${href}${separator}_=${Math.random().toString(36).substring(2, 8)}"`
    }
    return match
  })

  return html
}

