/**
 * TEMPLATE-SPECIFIC MUTATIONS
 * 
 * Provides per-template mutation strategies:
 * - Outlook-specific mutations
 * - Docomo-specific mutations
 * - Biglobe-specific mutations
 * - etc.
 * 
 * Each template gets unique mutation patterns
 */

import { mutateTemplate } from './mutationEngine'
import type { Template } from '../templateTypes'

export interface TemplateMutationConfig {
  provider: Template['provider']
  mutationLevel: 'low' | 'medium' | 'high' | 'apt'
  enableProviderSpecific: boolean
}

export interface TemplateMutationResult {
  mutated: boolean
  originalTemplate: string
  mutatedTemplate: string
  techniques: string[]
  providerSpecific: boolean
}

/**
 * Apply template-specific mutations
 */
export function applyTemplateSpecificMutation(
  template: Template,
  templateHTML: string,
  config: Partial<TemplateMutationConfig> = {}
): TemplateMutationResult {
  const defaultConfig: TemplateMutationConfig = {
    provider: template.provider,
    mutationLevel: 'apt',
    enableProviderSpecific: true,
  }

  const finalConfig = { ...defaultConfig, ...config }

  // Base mutation (always applied)
  const baseMutation = mutateTemplate(templateHTML, finalConfig.mutationLevel)
  
  let mutated = baseMutation.mutatedTemplate
  const techniques = [baseMutation.technique]

  // ============================================
  // PROVIDER-SPECIFIC MUTATIONS
  // ============================================
  if (finalConfig.enableProviderSpecific) {
    switch (template.provider) {
      case 'outlook':
        mutated = applyOutlookMutations(mutated)
        techniques.push('outlook-specific')
        break

      case 'docomo':
        mutated = applyDocomoMutations(mutated)
        techniques.push('docomo-specific')
        break

      case 'biglobe':
        mutated = applyBiglobeMutations(mutated)
        techniques.push('biglobe-specific')
        break

      case 'sakura':
        mutated = applySakuraMutations(mutated)
        techniques.push('sakura-specific')
        break

      case 'nifty':
        mutated = applyNiftyMutations(mutated)
        techniques.push('nifty-specific')
        break

      case 'sfexpress':
        mutated = applySFExpressMutations(mutated)
        techniques.push('sfexpress-specific')
        break

      case 'owaserver':
        mutated = applyOWAServerMutations(mutated)
        techniques.push('owaserver-specific')
        break

      default:
        // No provider-specific mutations
        break
    }
  }

  return {
    mutated: mutated !== templateHTML,
    originalTemplate: templateHTML,
    mutatedTemplate: mutated,
    techniques,
    providerSpecific: finalConfig.enableProviderSpecific,
  }
}

/**
 * Outlook-specific mutations
 */
function applyOutlookMutations(html: string): string {
  // Outlook-specific: Microsoft-style class names
  html = html.replace(/class="([^"]+)"/g, (match, classes) => {
    const mutated = classes.split(' ').map((cls: string) => {
      if (cls.startsWith('ms-')) {
        return `ms-${Math.random().toString(36).substring(2, 6)}`
      }
      return cls
    }).join(' ')
    return `class="${mutated}"`
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
 * Docomo-specific mutations
 */
function applyDocomoMutations(html: string): string {
  // Docomo-specific: Japanese-style attributes
  html = html.replace(/data-([^=]+)="([^"]+)"/g, (match, attr, value) => {
    // Add random suffix to data attributes
    return `data-${attr}="${value}_${Math.random().toString(36).substring(2, 5)}"`
  })

  return html
}

/**
 * Biglobe-specific mutations
 */
function applyBiglobeMutations(html: string): string {
  // Biglobe-specific: Add random whitespace
  html = html.replace(/>\s+</g, () => {
    const spaces = ' '.repeat(Math.floor(Math.random() * 3) + 1)
    return `>${spaces}<`
  })

  return html
}

/**
 * Sakura-specific mutations
 */
function applySakuraMutations(html: string): string {
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
 * Nifty-specific mutations
 */
function applyNiftyMutations(html: string): string {
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
 * SF Express-specific mutations
 */
function applySFExpressMutations(html: string): string {
  // SF Express-specific: Chinese-style encoding
  html = html.replace(/[\u4e00-\u9fa5]+/g, (match) => {
    // Add slight variation to Chinese characters (if any)
    return match
  })

  return html
}

/**
 * OWA Server-specific mutations
 */
function applyOWAServerMutations(html: string): string {
  // OWA Server-specific: Exchange-style mutations
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



