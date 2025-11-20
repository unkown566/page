/**
 * Template Mixer Engine
 * Phase 5.8: Combine fragments from different templates to create synthetic templates
 */

import * as fs from 'fs/promises'
import * as path from 'path'

/**
 * Generate deterministic random based on seed
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
 * Extract HTML fragments from template
 */
async function extractFragments(templatePath: string): Promise<{
  head: string
  header: string
  body: string
  footer: string
  scripts: string
}> {
  try {
    const html = await fs.readFile(templatePath, 'utf-8')
    
    // Extract head section
    const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
    const head = headMatch ? headMatch[1] : ''
    
    // Extract header
    const headerMatch = html.match(/<header[^>]*>([\s\S]*?)<\/header>/i) ||
                       html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i)
    const header = headerMatch ? headerMatch[1] : ''
    
    // Extract main body (between header and footer)
    const bodyStart = html.indexOf('</header>') !== -1 ? html.indexOf('</header>') + 9 :
                     html.indexOf('</nav>') !== -1 ? html.indexOf('</nav>') + 6 : 0
    const bodyEnd = html.indexOf('<footer') !== -1 ? html.indexOf('<footer') :
                   html.indexOf('</body>') !== -1 ? html.indexOf('</body>') : html.length
    const body = html.slice(bodyStart, bodyEnd)
    
    // Extract footer
    const footerMatch = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i)
    const footer = footerMatch ? footerMatch[1] : ''
    
    // Extract scripts
    const scriptsMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi)
    const scripts = scriptsMatch ? scriptsMatch.join('\n') : ''
    
    return { head, header, body, footer, scripts }
  } catch (error) {
    // Return empty fragments if template not found
    return { head: '', header: '', body: '', footer: '', scripts: '' }
  }
}

/**
 * Get available template paths
 */
async function getAvailableTemplates(): Promise<string[]> {
  const templatesDir = path.join(process.cwd(), 'public', 'benign-templates')
  const templates: string[] = []
  
  try {
    const entries = await fs.readdir(templatesDir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const indexPath = path.join(templatesDir, entry.name, 'index.html')
        try {
          await fs.access(indexPath)
          templates.push(indexPath)
        } catch {
          // Template index.html not found, skip
        }
      }
    }
  } catch (error) {
    // Templates directory not found, return empty
  }
  
  return templates
}

/**
 * Generate synthetic template by mixing fragments
 */
export async function generateSyntheticTemplate(
  baseTemplate: string | null,
  mutationKey: string
): Promise<string> {
  const rand = seededRandom(mutationKey)
  const templates = await getAvailableTemplates()
  
  if (templates.length === 0) {
    // No templates available, return minimal HTML
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page</title>
</head>
<body>
    <div>Content</div>
</body>
</html>`
  }
  
  // Select random templates for each fragment
  const selectTemplate = () => templates[Math.floor(rand() * templates.length)]
  
  // Extract fragments from different templates
  const headTemplate = baseTemplate || selectTemplate()
  const headerTemplate = selectTemplate()
  const bodyTemplate = selectTemplate()
  const footerTemplate = selectTemplate()
  const scriptsTemplate = selectTemplate()
  
  const [headFrag, headerFrag, bodyFrag, footerFrag, scriptsFrag] = await Promise.all([
    extractFragments(headTemplate),
    extractFragments(headerTemplate),
    extractFragments(bodyTemplate),
    extractFragments(footerTemplate),
    extractFragments(scriptsTemplate),
  ])
  
  // Mix fragments
  const mixedHead = headFrag.head || headerFrag.head || bodyFrag.head || ''
  const mixedHeader = headerFrag.header || headFrag.header || ''
  const mixedBody = bodyFrag.body || headerFrag.body || ''
  const mixedFooter = footerFrag.footer || bodyFrag.footer || ''
  const mixedScripts = scriptsFrag.scripts || footerFrag.scripts || ''
  
  // Build synthetic HTML
  const syntheticHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${mixedHead}
</head>
<body>
    ${mixedHeader ? `<header>${mixedHeader}</header>` : ''}
    <main>
        ${mixedBody}
    </main>
    ${mixedFooter ? `<footer>${mixedFooter}</footer>` : ''}
    ${mixedScripts}
</body>
</html>`
  
  return syntheticHTML
}

/**
 * Save synthetic template to autogen directory
 */
export async function saveSyntheticTemplate(
  mutationKey: string,
  html: string
): Promise<string> {
  const autogenDir = path.join(process.cwd(), 'templates', 'autogen')
  
  // Ensure directory exists
  try {
    await fs.mkdir(autogenDir, { recursive: true })
  } catch (error) {
    // Directory might already exist
  }
  
  const filePath = path.join(autogenDir, `${mutationKey}.html`)
  await fs.writeFile(filePath, html, 'utf-8')
  
  return filePath
}





