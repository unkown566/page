/**
 * HTML Mutator Engine
 * Phase 5.8: Polymorphic HTML mutation for cloaking
 */

/**
 * Generate deterministic random string based on seed
 */
function seededRandom(seed: string): () => number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash = hash & hash
  }
  let state = Math.abs(hash)
  
  return () => {
    state = (state * 9301 + 49297) % 233280
    return state / 233280
  }
}

/**
 * Generate random class name (4-8 chars)
 */
function generateClassName(rand: () => number): string {
  const length = Math.floor(rand() * 5) + 4 // 4-8 chars
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(rand() * chars.length)]
  }
  return result
}

/**
 * Randomize class names in HTML
 */
export function randomizeClassNames(html: string, mutationKey: string): string {
  const rand = seededRandom(mutationKey)
  const classMap = new Map<string, string>()
  
  // Find all class attributes
  return html.replace(/\s+class=["']([^"']+)["']/gi, (match, classes) => {
    const classList = classes.split(/\s+/).filter((c: string) => c.trim())
    const newClasses = classList.map((cls: string) => {
      if (!classMap.has(cls)) {
        classMap.set(cls, generateClassName(rand))
      }
      return classMap.get(cls)!
    }).join(' ')
    return ` class="${newClasses}"`
  })
}

/**
 * Shuffle attributes in HTML tags
 */
export function shuffleAttributes(html: string, mutationKey: string): string {
  const rand = seededRandom(mutationKey)
  
  return html.replace(/<(\w+)([^>]*)>/gi, (match, tag, attrs) => {
    if (!attrs.trim()) return match
    
    // Parse attributes
    const attrList: Array<{ name: string; value: string }> = []
    const attrRegex = /(\w+)=["']([^"']*)["']/gi
    let attrMatch
    const seen = new Set<string>()
    
    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      const name = attrMatch[1]
      if (!seen.has(name)) {
        seen.add(name)
        attrList.push({ name, value: attrMatch[2] })
      }
    }
    
    // Shuffle deterministically
    for (let i = attrList.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[attrList[i], attrList[j]] = [attrList[j], attrList[i]]
    }
    
    // Rebuild attributes string
    const newAttrs = attrList.map(a => `${a.name}="${a.value}"`).join(' ')
    return `<${tag} ${newAttrs}>`
  })
}

/**
 * Inject ghost nodes (hidden elements with random data)
 */
export function injectGhostNodes(html: string, mutationKey: string): string {
  const rand = seededRandom(mutationKey)
  const ghostCount = Math.floor(rand() * 5) + 3 // 3-7 ghost nodes
  
  // Generate random hash
  const generateHash = () => {
    const chars = '0123456789abcdef'
    let hash = ''
    for (let i = 0; i < 16; i++) {
      hash += chars[Math.floor(rand() * chars.length)]
    }
    return hash
  }
  
  let modified = html
  
  // Insert ghost nodes before closing body tag
  if (modified.includes('</body>')) {
    const ghostNodes = Array.from({ length: ghostCount }, () => {
      const hash = generateHash()
      const type = Math.floor(rand() * 2) === 0 ? 'div' : 'span'
      if (type === 'div') {
        return `<div style="display:none" data-ghost="${hash}">${hash}</div>`
      } else {
        return `<span data-ghost="${hash}" aria-hidden="true">${hash}</span>`
      }
    }).join('\n')
    
    modified = modified.replace('</body>', `${ghostNodes}\n</body>`)
  }
  
  return modified
}

/**
 * Insert fake meta tags
 */
export function insertFakeMeta(html: string, mutationKey: string): string {
  const rand = seededRandom(mutationKey)
  const metaCount = Math.floor(rand() * 3) + 2 // 2-4 fake meta tags
  
  const fakeMetas = [
    { name: 'generator', content: 'CMS v' + Math.floor(rand() * 10) + '.' + Math.floor(rand() * 10) },
    { name: 'author', content: 'Team ' + String.fromCharCode(65 + Math.floor(rand() * 26)) },
    { name: 'keywords', content: ['web', 'design', 'modern', 'responsive'][Math.floor(rand() * 4)] },
    { 'http-equiv': 'X-UA-Compatible', content: 'IE=edge' },
  ]
  
  const selectedMetas = fakeMetas.slice(0, metaCount)
  const metaTags = selectedMetas.map(meta => {
    if ('name' in meta) {
      return `<meta name="${meta.name}" content="${meta.content}">`
    } else {
      return `<meta http-equiv="${meta['http-equiv']}" content="${meta.content}">`
    }
  }).join('\n    ')
  
  // Insert after <head> tag
  if (html.includes('<head>')) {
    return html.replace(/<head[^>]*>/i, (match) => `${match}\n    ${metaTags}`)
  }
  
  return html
}

/**
 * Mutate DOM structure (wrap elements in random containers)
 */
export function mutateDOMStructure(html: string, mutationKey: string): string {
  const rand = seededRandom(mutationKey)
  let modified = html
  
  // Wrap random elements in ghost wrappers
  const wrapperCount = Math.floor(rand() * 3) + 1 // 1-3 wrappers
  const wrapperClass = generateClassName(rand)
  
  // Find main content areas and wrap them
  const contentPatterns = [
    /<main([^>]*)>([\s\S]*?)<\/main>/gi,
    /<section([^>]*)>([\s\S]*?)<\/section>/gi,
    /<div class="container"([^>]*)>([\s\S]*?)<\/div>/gi,
  ]
  
  contentPatterns.forEach((pattern, idx) => {
    if (idx < wrapperCount) {
      modified = modified.replace(pattern, (match, attrs, content) => {
        const wrapperClass = generateClassName(rand)
        return `<div class="${wrapperClass}-wrapper">${match}</div>`
      })
    }
  })
  
  return modified
}

/**
 * Apply all HTML mutations
 */
export function applyHTMLMutations(html: string, mutationKey: string): string {
  let mutated = html
  
  // Apply mutations in order
  mutated = randomizeClassNames(mutated, mutationKey)
  mutated = shuffleAttributes(mutated, mutationKey)
  mutated = injectGhostNodes(mutated, mutationKey)
  mutated = insertFakeMeta(mutated, mutationKey)
  mutated = mutateDOMStructure(mutated, mutationKey)
  
  return mutated
}





