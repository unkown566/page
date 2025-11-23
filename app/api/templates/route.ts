import { NextRequest, NextResponse } from 'next/server'
import { loadTemplates, createTemplate, updateTemplate, deleteTemplate, getTemplateById } from '@/lib/templateStorage'
import { Template } from '@/lib/templateTypes'

// Force Node.js runtime (needed for fs/promises in templateStorage)
export const runtime = 'nodejs'

// GET - List all templates
export async function GET(request: NextRequest) {
  try {
    let templates = await loadTemplates()
    
    // If no templates exist, this means loadTemplates should have initialized them
    // But if it didn't, ensure we have at least one
    if (!templates || templates.length === 0) {
      console.log('[TEMPLATES API] No templates found, forcing re-initialization...')
      // Force re-initialization by deleting the file and reloading
      const { default: fs } = await import('fs/promises')
      const pathModule = await import('path')
      
      // Resolve project root correctly (handles standalone mode)
      let projectRoot = process.cwd()
      if (projectRoot.endsWith('.next/standalone')) {
        projectRoot = pathModule.resolve(projectRoot, '../..')
      }
      
      const templatesFile = pathModule.join(projectRoot, '.templates', 'templates.json')
      try {
        await fs.unlink(templatesFile)
        console.log('[TEMPLATES API] Deleted templates file, reloading...')
      } catch {
        // File doesn't exist, that's fine
        console.log('[TEMPLATES API] Templates file not found, will be created by loadTemplates')
      }
      templates = await loadTemplates()
    }
    
    // Filter by enabled status if requested
    const searchParams = request.nextUrl.searchParams
    const onlyEnabled = searchParams.get('enabled') === 'true'
    
    const filtered = onlyEnabled 
      ? templates.filter(t => t.enabled)
      : templates
    
    return NextResponse.json({
      success: true,
      templates: filtered,
      count: filtered.length,
    })
  } catch (error) {
    console.error('[TEMPLATES API] Error loading templates:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to load templates',
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

