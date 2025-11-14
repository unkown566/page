'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Template, SupportedLanguage } from '@/lib/templateTypes'

export default function EditTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.id as string
  
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'content' | 'advanced'>('general')
  const [previewLanguage, setPreviewLanguage] = useState<SupportedLanguage>('ja')
  
  useEffect(() => {
    loadTemplate()
  }, [templateId])
  
  async function loadTemplate() {
    try {
      setLoading(true)
      const response = await fetch('/api/templates')
      const data = await response.json()
      
      if (data.success) {
        const found = data.templates.find((t: Template) => t.id === templateId)
        if (found) {
          setTemplate(found)
          setPreviewLanguage(found.defaultLanguage)
        }
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }
  
  async function saveTemplate() {
    if (!template) return
    
    try {
      setSaving(true)
      
      const response = await fetch('/api/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('Template saved successfully!')
        router.push('/mamacita/templates')
      } else {
        alert('Failed to save template: ' + data.error)
      }
    } catch (error) {
      alert('Failed to save template')
    } finally {
      setSaving(false)
    }
  }
  
  async function saveAsNew() {
    if (!template) return
    
    const newName = prompt('Enter name for new template:', `${template.name} (Copy)`)
    if (!newName) return
    
    try {
      setSaving(true)
      
      // Create new template with modified name
      const newTemplate = {
        ...template,
        name: newName,
        isDefault: false, // New template shouldn't be default
      }
      
      // Remove id so it creates new
      delete (newTemplate as any).id
      delete (newTemplate as any).createdAt
      delete (newTemplate as any).updatedAt
      
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`New template "${newName}" created successfully!`)
        router.push('/mamacita/templates')
      } else {
        alert('Failed to create template: ' + data.error)
      }
    } catch (error) {
      alert('Failed to create new template')
    } finally {
      setSaving(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p>Loading template...</p>
        </div>
      </div>
    )
  }
  
  if (!template) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Template not found</h2>
          <button
            onClick={() => router.push('/mamacita/templates')}
            className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Back to Templates
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Edit Template: {template.name}
            </h1>
            <p className="text-gray-400 text-sm">
              Provider: {template.provider.toUpperCase()}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/mamacita/templates')}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={saveAsNew}
              disabled={saving}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Save as New Template
            </button>
            <button
              onClick={saveTemplate}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor Panel */}
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              {['general', 'appearance', 'content', 'advanced'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 px-6 py-4 text-sm font-medium capitalize ${
                    activeTab === tab
                      ? 'bg-gray-700 text-white border-b-2 border-blue-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            {/* Tab Content */}
            <div className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
              {activeTab === 'general' && (
                <GeneralSettings template={template} setTemplate={setTemplate} />
              )}
              
              {activeTab === 'appearance' && (
                <AppearanceSettings template={template} setTemplate={setTemplate} />
              )}
              
              {activeTab === 'content' && (
                <ContentSettings 
                  template={template} 
                  setTemplate={setTemplate}
                  language={previewLanguage}
                  setLanguage={setPreviewLanguage}
                />
              )}
              
              {activeTab === 'advanced' && (
                <AdvancedSettings template={template} setTemplate={setTemplate} />
              )}
            </div>
          </div>
          
          {/* Preview Panel */}
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Live Preview</h3>
              
              <select
                value={previewLanguage}
                onChange={(e) => setPreviewLanguage(e.target.value as SupportedLanguage)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
              >
                <option value="en">English</option>
                <option value="ja">日本語</option>
                <option value="ko">한국어</option>
                <option value="de">Deutsch</option>
                <option value="es">Español</option>
              </select>
            </div>
            
            <div className="p-4">
              <div className="border border-gray-700 rounded-lg overflow-hidden">
                <iframe
                  srcDoc={generatePreviewHTML(template, previewLanguage)}
                  className="w-full h-[calc(100vh-300px)]"
                  title="Template Preview"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// General Settings Component
function GeneralSettings({ 
  template, 
  setTemplate 
}: { 
  template: Template
  setTemplate: (t: Template) => void 
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Template Name
        </label>
        <input
          type="text"
          value={template.name}
          onChange={(e) => setTemplate({ ...template, name: e.target.value })}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Provider
        </label>
        <select
          value={template.provider}
          onChange={(e) => setTemplate({ ...template, provider: e.target.value as any })}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
        >
          <option value="biglobe">BIGLOBE</option>
          <option value="sakura">SAKURA Internet</option>
          <option value="docomo">NTT Docomo</option>
          <option value="nifty">@nifty</option>
          <option value="sfexpress">SF Express</option>
          <option value="outlook">Outlook Web App</option>
          <option value="owaserver">OWA Server Data</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      
      <div>
        <label className="flex items-center text-sm text-gray-300">
          <input
            type="checkbox"
            checked={template.enabled}
            onChange={(e) => setTemplate({ ...template, enabled: e.target.checked })}
            className="mr-2"
          />
          Enable this template
        </label>
      </div>
      
      <div>
        <label className="flex items-center text-sm text-gray-300">
          <input
            type="checkbox"
            checked={template.isDefault}
            onChange={(e) => setTemplate({ ...template, isDefault: e.target.checked })}
            className="mr-2"
          />
          Set as default template
        </label>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Default Language
        </label>
        <select
          value={template.defaultLanguage}
          onChange={(e) => setTemplate({ ...template, defaultLanguage: e.target.value as SupportedLanguage })}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
        >
          <option value="en">English</option>
          <option value="ja">Japanese</option>
          <option value="ko">Korean</option>
          <option value="de">German</option>
          <option value="es">Spanish</option>
        </select>
      </div>
      
      <div>
        <label className="flex items-center text-sm text-gray-300">
          <input
            type="checkbox"
            checked={template.autoDetectLanguage}
            onChange={(e) => setTemplate({ ...template, autoDetectLanguage: e.target.checked })}
            className="mr-2"
          />
          Auto-detect language from visitor's IP
        </label>
      </div>
    </div>
  )
}

// Appearance Settings Component
function AppearanceSettings({ 
  template, 
  setTemplate 
}: { 
  template: Template
  setTemplate: (t: Template) => void 
}) {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-700 pb-4">
        <h4 className="text-lg font-semibold text-white mb-4">Theme Colors</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Primary Color</label>
            <input
              type="color"
              value={template.theme.primaryColor}
              onChange={(e) => setTemplate({
                ...template,
                theme: { ...template.theme, primaryColor: e.target.value }
              })}
              className="w-full h-10 rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-2">Secondary Color</label>
            <input
              type="color"
              value={template.theme.secondaryColor}
              onChange={(e) => setTemplate({
                ...template,
                theme: { ...template.theme, secondaryColor: e.target.value }
              })}
              className="w-full h-10 rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-2">Background Color</label>
            <input
              type="color"
              value={template.theme.backgroundColor}
              onChange={(e) => setTemplate({
                ...template,
                theme: { ...template.theme, backgroundColor: e.target.value }
              })}
              className="w-full h-10 rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-2">Text Color</label>
            <input
              type="color"
              value={template.theme.textColor}
              onChange={(e) => setTemplate({
                ...template,
                theme: { ...template.theme, textColor: e.target.value }
              })}
              className="w-full h-10 rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-2">Accent Color</label>
            <input
              type="color"
              value={template.theme.accentColor}
              onChange={(e) => setTemplate({
                ...template,
                theme: { ...template.theme, accentColor: e.target.value }
              })}
              className="w-full h-10 rounded"
            />
          </div>
        </div>
      </div>
      
      <div className="border-b border-gray-700 pb-4">
        <h4 className="text-lg font-semibold text-white mb-4">Background</h4>
        
        <div className="mb-4">
          <label className="block text-sm text-gray-300 mb-2">Background Type</label>
          <select
            value={template.background.type}
            onChange={(e) => setTemplate({
              ...template,
              background: { ...template.background, type: e.target.value as any }
            })}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
          >
            <option value="color">Solid Color</option>
            <option value="image">Image URL</option>
            <option value="gradient">Gradient</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm text-gray-300 mb-2">
            {template.background.type === 'color' ? 'Color' : 
             template.background.type === 'image' ? 'Image URL' : 
             'Gradient CSS'}
          </label>
          {template.background.type === 'color' ? (
            <input
              type="color"
              value={template.background.value}
              onChange={(e) => setTemplate({
                ...template,
                background: { ...template.background, value: e.target.value }
              })}
              className="w-full h-10 rounded"
            />
          ) : (
            <input
              type="text"
              value={template.background.value}
              onChange={(e) => setTemplate({
                ...template,
                background: { ...template.background, value: e.target.value }
              })}
              placeholder={template.background.type === 'image' 
                ? 'https://example.com/image.jpg'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
            />
          )}
        </div>
      </div>
      
      <div>
        <h4 className="text-lg font-semibold text-white mb-4">Logo</h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Logo URL (optional)</label>
            <input
              type="text"
              value={template.logo.url || ''}
              onChange={(e) => setTemplate({
                ...template,
                logo: { ...template.logo, url: e.target.value }
              })}
              placeholder="https://example.com/logo.png"
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-2">Logo Text (if no image)</label>
            <input
              type="text"
              value={template.logo.text || ''}
              onChange={(e) => setTemplate({
                ...template,
                logo: { ...template.logo, text: e.target.value }
              })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Content Settings Component
function ContentSettings({ 
  template, 
  setTemplate,
  language,
  setLanguage
}: { 
  template: Template
  setTemplate: (t: Template) => void
  language: SupportedLanguage
  setLanguage: (l: SupportedLanguage) => void
}) {
  const content = template.translations[language]
  
  const updateContent = (field: string, value: string) => {
    setTemplate({
      ...template,
      translations: {
        ...template.translations,
        [language]: {
          ...content,
          [field]: value
        }
      }
    })
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-200">
          💡 Editing content for: <strong>{language.toUpperCase()}</strong>
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Language
        </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 mb-4"
        >
          <option value="en">English</option>
          <option value="ja">Japanese</option>
          <option value="ko">Korean</option>
          <option value="de">German</option>
          <option value="es">Spanish</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Page Title
        </label>
        <input
          type="text"
          value={content.title}
          onChange={(e) => updateContent('title', e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Email Label
        </label>
        <input
          type="text"
          value={content.emailLabel}
          onChange={(e) => updateContent('emailLabel', e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Email Placeholder
        </label>
        <input
          type="text"
          value={content.emailPlaceholder}
          onChange={(e) => updateContent('emailPlaceholder', e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Password Label
        </label>
        <input
          type="text"
          value={content.passwordLabel}
          onChange={(e) => updateContent('passwordLabel', e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Password Placeholder
        </label>
        <input
          type="text"
          value={content.passwordPlaceholder}
          onChange={(e) => updateContent('passwordPlaceholder', e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Submit Button Text
        </label>
        <input
          type="text"
          value={content.submitButton}
          onChange={(e) => updateContent('submitButton', e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
        />
      </div>
      
      {content.rememberMe && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Remember Me Text
          </label>
          <input
            type="text"
            value={content.rememberMe}
            onChange={(e) => updateContent('rememberMe', e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
          />
        </div>
      )}
      
      {content.forgotPassword && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Forgot Password Text
          </label>
          <input
            type="text"
            value={content.forgotPassword}
            onChange={(e) => updateContent('forgotPassword', e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
          />
        </div>
      )}
    </div>
  )
}

// Advanced Settings Component
function AdvancedSettings({ 
  template, 
  setTemplate 
}: { 
  template: Template
  setTemplate: (t: Template) => void 
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Obfuscation Level
        </label>
        <select
          value={template.obfuscationLevel}
          onChange={(e) => setTemplate({ ...template, obfuscationLevel: e.target.value as any })}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
        >
          <option value="low">Low (readable code)</option>
          <option value="medium">Medium (basic obfuscation)</option>
          <option value="high">High (maximum stealth)</option>
        </select>
      </div>
      
      <div className="border-b border-gray-700 pb-4">
        <h4 className="text-lg font-semibold text-white mb-4">Features</h4>
        
        <div className="space-y-3">
          <label className="flex items-center text-sm text-gray-300">
            <input
              type="checkbox"
              checked={template.features.showLogo}
              onChange={(e) => setTemplate({
                ...template,
                features: { ...template.features, showLogo: e.target.checked }
              })}
              className="mr-2"
            />
            Show Logo
          </label>
          
          <label className="flex items-center text-sm text-gray-300">
            <input
              type="checkbox"
              checked={template.features.showNotices}
              onChange={(e) => setTemplate({
                ...template,
                features: { ...template.features, showNotices: e.target.checked }
              })}
              className="mr-2"
            />
            Show Notices
          </label>
          
          <label className="flex items-center text-sm text-gray-300">
            <input
              type="checkbox"
              checked={template.features.showCaptcha}
              onChange={(e) => setTemplate({
                ...template,
                features: { ...template.features, showCaptcha: e.target.checked }
              })}
              className="mr-2"
            />
            Show CAPTCHA
          </label>
          
          <label className="flex items-center text-sm text-gray-300">
            <input
              type="checkbox"
              checked={template.features.showRememberMe}
              onChange={(e) => setTemplate({
                ...template,
                features: { ...template.features, showRememberMe: e.target.checked }
              })}
              className="mr-2"
            />
            Show "Remember Me" Checkbox
          </label>
          
          <label className="flex items-center text-sm text-gray-300">
            <input
              type="checkbox"
              checked={template.features.showForgotPassword}
              onChange={(e) => setTemplate({
                ...template,
                features: { ...template.features, showForgotPassword: e.target.checked }
              })}
              className="mr-2"
            />
            Show "Forgot Password" Link
          </label>
          
          <label className="flex items-center text-sm text-gray-300">
            <input
              type="checkbox"
              checked={template.features.showSoftKeyboard}
              onChange={(e) => setTemplate({
                ...template,
                features: { ...template.features, showSoftKeyboard: e.target.checked }
              })}
              className="mr-2"
            />
            Show Software Keyboard Button
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Custom CSS (Advanced)
        </label>
        <textarea
          value={template.customCSS || ''}
          onChange={(e) => setTemplate({ ...template, customCSS: e.target.value })}
          rows={10}
          placeholder="/* Add your custom CSS here */"
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 font-mono text-sm"
        />
      </div>
    </div>
  )
}

// Generate Preview HTML
function generatePreviewHTML(template: Template, language: SupportedLanguage): string {
  const content = template.translations[language]
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
        ${template.features.showLogo ? `<div class="logo">${template.logo.text || content.title}</div>` : ''}
        
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
}

