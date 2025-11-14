'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreateTemplatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    provider: 'custom' as 'biglobe' | 'sakura' | 'docomo' | 'nifty' | 'custom',
  })
  
  async function handleCreate() {
    if (!formData.name) {
      alert('Please enter a template name')
      return
    }
    
    setLoading(true)
    
    try {
      // For now, just redirect to edit page of first template as a base
      // In a real implementation, we'd create a new template here
      alert('Template creation coming soon! For now, duplicate an existing template by editing it and using "Save as New"')
      router.push('/mamacita/templates')
    } catch (error) {
      alert('Failed to create template')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <div className="flex items-center gap-2 mb-6">
          <Link 
            href="/mamacita/templates"
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <span>←</span>
            <span>Back to Templates</span>
          </Link>
        </div>
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Create New Template
          </h1>
          <p className="text-gray-400">
            Start with a base template and customize it to your needs
          </p>
        </div>
        
        {/* Form */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Yahoo! Japan Mail"
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Base Template
              </label>
              <select
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value as any })}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="biglobe">BIGLOBE Mail (Yellow/Orange)</option>
                <option value="sakura">SAKURA Internet (Blue)</option>
                <option value="docomo">NTT Docomo (Red)</option>
                <option value="nifty">@nifty Mail (Yellow)</option>
                <option value="sfexpress">SF Express (Red/White)</option>
                <option value="outlook">Outlook Web App (Blue)</option>
                <option value="owaserver">OWA Server Data (Blue/Green)</option>
                <option value="custom">Blank Template</option>
              </select>
              <p className="text-xs text-gray-400 mt-2">
                Choose a template to start from, or create from scratch
              </p>
            </div>
            
            <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                💡 <strong>Tip:</strong> For now, the best way to create a new template is to:
              </p>
              <ol className="text-sm text-blue-300 mt-2 ml-4 space-y-1 list-decimal">
                <li>Go back to templates list</li>
                <li>Edit an existing template similar to what you want</li>
                <li>Make your changes</li>
                <li>Click "Save as New" to duplicate it</li>
              </ol>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {loading ? 'Creating...' : 'Create Template'}
              </button>
              
              <Link
                href="/mamacita/templates"
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 font-medium"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}




