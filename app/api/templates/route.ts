import { NextRequest, NextResponse } from 'next/server'
import { loadTemplates, createTemplate, updateTemplate, deleteTemplate, getTemplateById } from '@/lib/templateStorage'
import { Template } from '@/lib/templateTypes'

// Force Node.js runtime (needed for fs/promises in templateStorage)
export const runtime = 'nodejs'

// GET - List all templates
export async function GET(request: NextRequest) {
  try {
    console.log('[TEMPLATES API] GET request received')
    console.log('[TEMPLATES API] process.cwd():', process.cwd())
    
    let templates: Template[] = []
    
    try {
      templates = await loadTemplates()
      console.log('[TEMPLATES API] loadTemplates() returned', templates?.length || 0, 'templates')
    } catch (loadError: any) {
      console.error('[TEMPLATES API] Error in loadTemplates():', loadError?.message || loadError)
      console.error('[TEMPLATES API] Error stack:', loadError?.stack)
      
      // loadTemplates should auto-initialize, but if it fails, return error
      return NextResponse.json({
        success: false,
        error: 'Failed to load templates',
        details: loadError?.message || String(loadError),
      }, { status: 500 })
    }
    
    // If no templates exist, loadTemplates should have auto-initialized them
    // If it didn't, return empty array (don't try to force re-init - that's dangerous)
    if (!templates || templates.length === 0) {
      console.warn('[TEMPLATES API] No templates found after loadTemplates()')
      console.warn('[TEMPLATES API] This might indicate a parse error or missing file')
      // Return empty array - loadTemplates() handles initialization internally
      // Don't try to delete/re-init here as that could cause data loss
    }
    
    // Filter by enabled status if requested
    const searchParams = request.nextUrl.searchParams
    const onlyEnabled = searchParams.get('enabled') === 'true'
    
    const filtered = onlyEnabled 
      ? templates.filter(t => t.enabled)
      : templates
    
    console.log('[TEMPLATES API] Returning', filtered.length, 'templates (onlyEnabled:', onlyEnabled, ')')
    
    return NextResponse.json({
      success: true,
      templates: filtered,
      count: filtered.length,
    })
  } catch (error: any) {
    console.error('[TEMPLATES API] Unexpected error:', error?.message || error)
    console.error('[TEMPLATES API] Error stack:', error?.stack)
    return NextResponse.json({
      success: false,
      error: 'Failed to load templates',
      details: error?.message || String(error),
    }, { status: 500 })
  }
}

// POST - Create new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.provider) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, provider',
      }, { status: 400 })
    }
    
    const template = await createTemplate(body)
    
    return NextResponse.json({
      success: true,
      template,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to create template',
    }, { status: 500 })
  }
}

// PUT - Update template
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json({
        success: false,
        error: 'Missing template ID',
      }, { status: 400 })
    }
    
    const template = await updateTemplate(body.id, body)
    
    if (!template) {
      return NextResponse.json({
        success: false,
        error: 'Template not found',
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      template,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to update template',
    }, { status: 500 })
  }
}

// DELETE - Delete template
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing template ID',
      }, { status: 400 })
    }
    
    // Check if template is default - prevent deletion
    const template = await getTemplateById(id)
    if (template?.isDefault) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete default template',
      }, { status: 400 })
    }
    
    const deleted = await deleteTemplate(id)
    
    if (!deleted) {
      return NextResponse.json({
        success: false,
        error: 'Template not found',
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to delete template',
    }, { status: 500 })
  }
}

