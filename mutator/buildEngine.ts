/**
 * Build Engine
 * Phase 5.8: Main orchestrator for polymorphic template generation
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { applyHTMLMutations } from './htmlMutator'
import { applyJSMutations, splitIntoShards } from './jsMutator'
import { generateSyntheticTemplate, saveSyntheticTemplate } from './templateMixer'

/**
 * Build mutated template and JS shards
 */
export async function buildMutatedTemplate(
  templateName: string,
  mutationKey: string
): Promise<{
  htmlPath: string
  jsShards: string[]
}> {
  try {
    // Load original template
    const templatePath = path.join(
      process.cwd(),
      'public',
      'benign-templates',
      templateName,
      'index.html'
    )
    
    let originalHTML: string
    try {
      originalHTML = await fs.readFile(templatePath, 'utf-8')
    } catch (error) {
      // Template not found, generate synthetic
      originalHTML = await generateSyntheticTemplate(null, mutationKey)
    }
    
    // Apply template mixer (if enabled)
    let mixedHTML = originalHTML
    try {
      // Try to mix with other templates
      mixedHTML = await generateSyntheticTemplate(templatePath, mutationKey)
    } catch (error) {
      // Fall back to original if mixing fails
      mixedHTML = originalHTML
    }
    
    // Apply HTML mutations
    const mutatedHTML = applyHTMLMutations(mixedHTML, mutationKey)
    
    // Save mutated HTML
    const htmlPath = await saveSyntheticTemplate(mutationKey, mutatedHTML)
    
    // Extract and mutate JavaScript
    const jsShards: string[] = []
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi
    let scriptMatch
    const scripts: string[] = []
    
    while ((scriptMatch = scriptRegex.exec(mutatedHTML)) !== null) {
      const scriptContent = scriptMatch[1]
      if (scriptContent.trim() && !scriptContent.includes('src=')) {
        scripts.push(scriptContent)
      }
    }
    
    // Mutate each script and split into shards
    if (scripts.length > 0) {
      const allJS = scripts.join('\n\n')
      const mutatedJS = applyJSMutations(allJS, mutationKey)
      const shards = splitIntoShards(mutatedJS, mutationKey, 3)
      
      // Save JS shards
      const autogenJsDir = path.join(process.cwd(), 'public', 'autogen')
      try {
        await fs.mkdir(autogenJsDir, { recursive: true })
      } catch {
        // Directory might already exist
      }
      
      for (let i = 0; i < shards.length; i++) {
        const shardPath = path.join(autogenJsDir, `${mutationKey}-${i}.js`)
        await fs.writeFile(shardPath, shards[i], 'utf-8')
        jsShards.push(`/autogen/${mutationKey}-${i}.js`)
      }
    }
    
    return {
      htmlPath: `/templates/autogen/${mutationKey}.html`,
      jsShards,
    }
  } catch (error) {
    console.error(`[MUTATOR] Failed to build template ${templateName}:`, error)
    throw new Error(`Template build failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Check if mutated template exists
 */
export async function mutatedTemplateExists(mutationKey: string): Promise<boolean> {
  const htmlPath = path.join(
    process.cwd(),
    'templates',
    'autogen',
    `${mutationKey}.html`
  )
  
  try {
    await fs.access(htmlPath)
    return true
  } catch {
    return false
  }
}

/**
 * Get mutated template path if exists
 */
export function getMutatedTemplatePath(mutationKey: string): string {
  return `/templates/autogen/${mutationKey}.html`
}

/**
 * Get JS shard paths for mutation key
 */
export function getJSShardPaths(mutationKey: string, shardCount: number = 3): string[] {
  return Array.from({ length: shardCount }, (_, i) => 
    `/autogen/${mutationKey}-${i}.js`
  )
}



