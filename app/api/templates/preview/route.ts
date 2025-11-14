import { NextRequest, NextResponse } from 'next/server'
import { getTemplateById } from '@/lib/templateStorage'
import { SupportedLanguage } from '@/lib/templateTypes'

// Force Node.js runtime (needed for fs/promises in templateStorage)
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    const language = (searchParams.get('language') || 'ja') as SupportedLanguage
    
    if (!id) {
      return new NextResponse('Missing template ID', { status: 400 })
    }
    
    const template = await getTemplateById(id)
    
    if (!template) {
      return new NextResponse('Template not found', { status: 404 })
    }
    
    const content = template.translations[language]
    
    // Generate preview HTML
    const html = `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${content.title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: ${template.background.type === 'color' ? template.background.value : '#f5f5f5'};
            ${template.background.type === 'image' ? `background-image: url('${template.background.value}');` : ''}
            ${template.background.type === 'image' ? 'background-size: cover;' : ''}
            ${template.background.type === 'image' ? 'background-position: center;' : ''}
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          
          .container {
            max-width: ${template.layout.containerWidth};
            width: 100%;
            background: ${template.theme.backgroundColor};
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          
          .logo {
            text-align: center;
            margin-bottom: 30px;
            color: ${template.theme.primaryColor};
            font-size: 24px;
            font-weight: bold;
          }
          
          .label {
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
            font-weight: 500;
            color: ${template.theme.textColor};
          }
          
          .input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin-bottom: 16px;
            font-size: 14px;
            color: ${template.theme.textColor};
          }
          
          .input:focus {
            outline: none;
            border-color: ${template.theme.primaryColor};
          }
          
          .button {
            width: 100%;
            padding: 14px;
            background: ${template.theme.primaryColor};
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.2s;
          }
          
          .button:hover {
            background: ${template.theme.accentColor};
          }
          
          .checkbox-label {
            display: flex;
            align-items: center;
            font-size: 14px;
            color: ${template.theme.textColor};
            margin-bottom: 12px;
          }
          
          .checkbox {
            margin-right: 8px;
          }
          
          .link {
            color: ${template.theme.primaryColor};
            text-decoration: none;
            font-size: 14px;
          }
          
          .link:hover {
            text-decoration: underline;
          }
          
          .notice {
            background: #FFF8E1;
            padding: 16px;
            border-radius: 4px;
            margin-bottom: 24px;
            font-size: 14px;
            color: #856404;
            border-left: 4px solid ${template.theme.accentColor};
          }
          
          ${template.customCSS || ''}
        </style>
      </head>
      <body>
        <div class="container">
          ${template.features.showLogo ? `
            <div class="logo">
              ${template.logo.url ? `<img src="${template.logo.url}" alt="${template.name}" style="width: ${template.logo.width}px; height: ${template.logo.height}px;">` : template.logo.text || content.title}
            </div>
          ` : ''}
          
          ${template.features.showNotices && content.notices?.twoFactorAuth ? `
            <div class="notice">
              ${content.notices.twoFactorAuth}
            </div>
          ` : ''}
          
          <form>
            <div>
              <label class="label">${content.emailLabel}</label>
              <input type="email" class="input" placeholder="${content.emailPlaceholder}" value="preview@example.com" readonly>
            </div>
            
            <div>
              <label class="label">${content.passwordLabel}</label>
              <input type="password" class="input" placeholder="${content.passwordPlaceholder}">
            </div>
            
            ${template.features.showRememberMe ? `
              <label class="checkbox-label">
                <input type="checkbox" class="checkbox" checked>
                ${content.rememberMe}
              </label>
            ` : ''}
            
            <button type="button" class="button">${content.submitButton}</button>
            
            ${template.features.showForgotPassword ? `
              <div style="margin-top: 20px; text-align: center;">
                <a href="#" class="link">${content.forgotPassword}</a>
              </div>
            ` : ''}
          </form>
        </div>
      </body>
      </html>
    `
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    return new NextResponse('Failed to generate preview', { status: 500 })
  }
}

