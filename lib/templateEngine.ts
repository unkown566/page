import { Template, SupportedLanguage, TemplateContent } from './templateTypes'

// Get content for specific language
export function getTemplateContent(
  template: Template,
  language: SupportedLanguage
): TemplateContent {
  return template.translations[language]
}

// Generate obfuscated CSS class names
export function obfuscateClassName(className: string, level: 'low' | 'medium' | 'high'): string {
  if (level === 'low') return className
  
  const hash = Array.from(className).reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0
  }, 0)
  
  const obfuscated = Math.abs(hash).toString(36)
  
  if (level === 'medium') {
    return `_${obfuscated.substring(0, 6)}`
  }
  
  // High level: Add random prefix and suffix
  const prefix = Math.random().toString(36).substring(2, 5)
  const suffix = Math.random().toString(36).substring(2, 4)
  return `${prefix}${obfuscated.substring(0, 4)}${suffix}`
}

// Generate obfuscated inline styles
export function obfuscateStyles(styles: Record<string, string>): string {
  return Object.entries(styles)
    .map(([key, value]) => `${key}:${value}`)
    .join(';')
}

// Sanitize custom HTML
export function sanitizeHTML(html: string): string {
  // Remove script tags
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Remove event handlers
  html = html.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
  html = html.replace(/\son\w+\s*=\s*[^\s>]*/gi, '')
  
  return html
}

// Apply custom CSS with obfuscation
export function applyCustomCSS(css: string, obfuscationLevel: 'low' | 'medium' | 'high'): string {
  if (obfuscationLevel === 'low') return css
  
  // Obfuscate class names in CSS
  const classPattern = /\.([a-zA-Z0-9_-]+)/g
  const obfuscated = css.replace(classPattern, (match, className) => {
    return `.${obfuscateClassName(className, obfuscationLevel)}`
  })
  
  return obfuscated
}

// Generate template styles
export function generateTemplateStyles(template: Template): string {
  const { theme, background, layout } = template
  
  const backgroundStyle = 
    background.type === 'image' 
      ? `background-image: url('${background.value}'); background-size: cover; background-position: center;`
      : background.type === 'gradient'
      ? `background: ${background.value};`
      : `background-color: ${background.value};`
  
  return `
    .template-container {
      ${backgroundStyle}
      ${background.opacity ? `opacity: ${background.opacity};` : ''}
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    
    .template-form-wrapper {
      max-width: ${layout.containerWidth};
      width: 100%;
      background: ${theme.backgroundColor};
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .template-logo {
      text-align: center;
      margin-bottom: 30px;
      color: ${theme.primaryColor};
      font-size: 24px;
      font-weight: bold;
    }
    
    .template-input {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      color: ${theme.textColor};
      margin-bottom: 16px;
    }
    
    .template-input:focus {
      outline: none;
      border-color: ${theme.primaryColor};
    }
    
    .template-button {
      width: 100%;
      padding: 14px;
      background: ${theme.primaryColor};
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .template-button:hover {
      background: ${theme.accentColor};
    }
    
    .template-link {
      color: ${theme.primaryColor};
      text-decoration: none;
      font-size: 14px;
    }
    
    .template-link:hover {
      text-decoration: underline;
    }
    
    .template-notice {
      background: #FFF8E1;
      padding: 16px;
      border-radius: 4px;
      margin-bottom: 24px;
      font-size: 14px;
      color: #856404;
      border-left: 4px solid ${theme.accentColor};
    }
    
    .template-checkbox {
      margin-right: 8px;
    }
    
    .template-checkbox-label {
      font-size: 14px;
      color: ${theme.textColor};
      display: flex;
      align-items: center;
      margin-bottom: 12px;
    }
  `
}




