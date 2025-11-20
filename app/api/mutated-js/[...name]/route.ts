/**
 * Mutated JavaScript API - Dynamic Route
 * Phase 7.1: Serves mutated JS shards with proper Next.js routing
 * 
 * Handles: /api/mutated-js/{mutationKey}-{index}.js
 */

import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs/promises'
import * as path from 'path'
import { getCachedSettings } from '@/lib/adminSettings'

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string[] } }
) {
  try {
    // PHASE 7.1 FIX: Extract filename from dynamic route params
    // params.name is an array for catch-all routes: ['mut_mi25z3h9_ih9yynn4gy-0.js']
    const filename = params.name.join('/')
    
    // Extract mutation key and shard index from filename
    // Format: {mutationKey}-{index}.js
    const match = filename.match(/^([^-]+)-(\d+)\.js$/)
    
    if (!match) {
      return NextResponse.json({ error: 'Invalid shard path format' }, { status: 400 })
    }
    
    const [, mutationKey, shardIndex] = match
    
    const settings = getCachedSettings()
    
    // Check if polymorphic cloaking is enabled
    if (settings.security?.enablePolymorphicCloaking === false) {
      return NextResponse.json({ error: 'Polymorphic cloaking disabled' }, { status: 403 })
    }
    
    // PHASE 7.1 FIX: Read and serve JS shard with graceful fallback
    const shardFilePath = path.join(
      process.cwd(),
      'public',
      'autogen',
      `${mutationKey}-${shardIndex}.js`
    )
    
    try {
      const js = await fs.readFile(shardFilePath, 'utf-8')
      
      return new NextResponse(js, {
        headers: {
          'Content-Type': 'application/javascript',
          'x-mutation-key': mutationKey,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    } catch (error) {
      // PHASE 7.1 FIX: If shard not found, try to build it on-demand
      try {
        const { buildMutatedTemplate } = await import('@/mutator/buildEngine')
        // Build template with default template name (will generate JS shards)
        await buildMutatedTemplate('corporate', mutationKey)
        
        // Try reading again
        const js = await fs.readFile(shardFilePath, 'utf-8')
        return new NextResponse(js, {
          headers: {
            'Content-Type': 'application/javascript',
            'x-mutation-key': mutationKey,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        })
      } catch (buildError) {
        // PHASE 7.1 FIX: If build fails, return empty JS instead of 404
        // This prevents broken page loads
        console.warn(`[MUTATED-JS] Failed to build shard ${mutationKey}-${shardIndex}.js:`, buildError)
        return new NextResponse('// Shard not available', {
          headers: {
            'Content-Type': 'application/javascript',
            'x-mutation-key': mutationKey,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        })
      }
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}



