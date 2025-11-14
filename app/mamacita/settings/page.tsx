'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Settings as SettingsIcon, Save, CheckCircle, Shield, Info, AlertCircle, ExternalLink, FileText } from 'lucide-react'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'
import type { AdminSettings } from '@/lib/adminSettingsTypes'
import { getPatternStats } from '@/lib/globalSandboxPatterns'
import { getLoadingScreenOptions } from '@/lib/loadingScreenRegistry'
import LanguageSettings from '@/components/admin/LanguageSettings'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'notifications' | 'security' | 'filtering' | 'templates' | 'redirects'>('notifications')
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [csrfToken, setCsrfToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [testStatus, setTestStatus] = useState<{
    state: 'idle' | 'testing' | 'success' | 'error'
    message?: string
  }>({ state: 'idle' })

  useEffect(() => {
    fetchSettings()
    // Get CSRF token
    fetch('/api/csrf-token')
      .then(r => r.json())
      .then(data => setCsrfToken(data.token))
      .catch(err => console.error('Failed to get CSRF token:', err))
    // Load pattern stats
    setStats(getPatternStats())
  }, [])

  const fetchSettings = async () => {
    try {
      setLoadError(null)
      const response = await fetch('/api/admin/settings')
      
      if (!response.ok) {
        throw new Error(`Failed to load settings: ${response.status}`)
      }
      
      const data = await response.json()
      if (data.success) {
        setSettings(data.settings)
      } else {
        throw new Error(data.error || 'Failed to load settings')
      }
    } catch (error: any) {
      setLoadError(error.message)
      toast.error('Failed to load settings', {
        duration: 5000,
        position: 'top-right'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    if (!csrfToken) {
      toast.error('CSRF token not loaded. Please refresh the page.', {
        duration: 5000,
        position: 'top-right'
      })
      return
    }

    setSaving(true)
    setSaved(false)
    setError(null)
    
    const loadingToast = toast.loading('Saving settings...', {
      position: 'top-right'
    })

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ settings }),
      })

      const data = await response.json()
      if (data.success) {
        // Reload settings from server to confirm
        await fetchSettings()
        
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        
        toast.success('Settings saved successfully!', {
          id: loadingToast,
          duration: 3000,
          position: 'top-right'
        })
      } else {
        throw new Error(data.error || 'Failed to save settings')
      }
    } catch (error: any) {
      setError(error.message)
      toast.error(`Failed to save: ${error.message}`, {
        id: loadingToast,
        duration: 5000,
        position: 'top-right'
      })
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (path: string, value: any) => {
    if (!settings) return

    const keys = path.split('.')
    const newSettings = { ...settings }
    let current: any = newSettings

    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] }
      current = current[keys[i]]
    }

    current[keys[keys.length - 1]] = value
    setSettings(newSettings)
  }

  if (loading || !settings) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <Toaster />
      
      {loadError && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-lg">
          <div className="flex gap-2 items-start">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-red-800 dark:text-red-200">Failed to load settings</div>
              <div className="text-sm text-red-700 dark:text-red-300 mt-1">{loadError}</div>
              <button
                onClick={fetchSettings}
                className="mt-2 px-3 py-1 bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 rounded text-sm text-white"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Configure your admin panel and security settings
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {saved ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Changes'}
              </>
            )}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
          {(['notifications', 'security', 'filtering', 'templates', 'redirects'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-4 py-2 font-medium transition-colors border-b-2 capitalize
                ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {/* Telegram */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Telegram Notifications
              </h2>
              <div className="space-y-4">
                <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-200">
                    <strong>Note:</strong> All operational settings are stored here in the admin panel. 
                    The .env file only contains TOKEN_SECRET for security purposes.
                  </p>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings?.notifications.telegram.enabled || false}
                      onChange={(e) => updateSetting('notifications.telegram.enabled', e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="font-medium text-gray-700 dark:text-gray-300">Enable Telegram notifications</span>
                  </label>
                </div>

                <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings?.notifications.telegram.notifyBotDetections !== false}
                        onChange={(e) => updateSetting('notifications.telegram.notifyBotDetections', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 dark:border-gray-600"
                      />
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Bot Detection Notifications</span>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Send Telegram notifications when bots are detected and blocked in middleware
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bot Token
                  </label>
                  <input
                    type="text"
                    value={settings?.notifications.telegram.botToken || ''}
                    onChange={(e) => updateSetting('notifications.telegram.botToken', e.target.value)}
                    placeholder="7657948339:AAH3vYzjJeod7ZHZyljNrQTWiO8RTSBc1I"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Get your bot token from @BotFather on Telegram
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Chat ID
                  </label>
                  <input
                    type="text"
                    value={settings?.notifications.telegram.chatId || ''}
                    onChange={(e) => updateSetting('notifications.telegram.chatId', e.target.value)}
                    placeholder="6507005533"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Your Telegram chat ID (get it from @userinfobot)
                  </p>
                </div>

                <button
                  onClick={async () => {
                    setTestStatus({ state: 'testing' })
                    
                    try {
                      const response = await fetch('/api/test/telegram-direct')
                      const data = await response.json()
                      
                      
                      if (data.success && data.messageDelivered) {
                        setTestStatus({ 
                          state: 'success', 
                          message: '✅ Test message sent successfully! Check your Telegram app - you should see a message from the bot.' 
                        })
                      } else if (data.success && !data.messageDelivered) {
                        // API returned success but message wasn't delivered
                        const troubleshooting = data.troubleshooting
                        setTestStatus({ 
                          state: 'error', 
                          message: `⚠️ API says success, but message may not be delivered. Check troubleshooting steps below.` 
                        })
                        // Store troubleshooting info for display
                        if (troubleshooting) {
                        }
                      } else {
                        const errorMsg = data.response?.description || data.error || 'Check credentials and server logs'
                        setTestStatus({ 
                          state: 'error', 
                          message: `❌ Failed: ${errorMsg}` 
                        })
                      }
                    } catch (error: any) {
                      setTestStatus({ 
                        state: 'error', 
                        message: `❌ Error: ${error.message || 'Network error'}` 
                      })
                    }
                  }}
                  disabled={testStatus.state === 'testing'}
                  className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                    testStatus.state === 'testing'
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {testStatus.state === 'testing' ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Testing...
                    </span>
                  ) : (
                    'Test Telegram Connection'
                  )}
                </button>

                {testStatus.state !== 'idle' && (
                  <div className={`mt-3 p-4 rounded-lg border ${
                    testStatus.state === 'success'
                      ? 'bg-green-900/30 border-green-700 text-green-200'
                      : testStatus.state === 'error'
                      ? 'bg-red-900/30 border-red-700 text-red-200'
                      : 'bg-gray-900/30 border-gray-700 text-gray-200'
                  }`}>
                    <p className="font-medium">{testStatus.message}</p>
                    {testStatus.state === 'error' && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-semibold opacity-90">Troubleshooting Steps:</p>
                        <ol className="text-sm space-y-1 list-decimal list-inside opacity-80 ml-2">
                          <li>Open Telegram and search for your bot: <code className="bg-gray-800 px-1 rounded">@foxresultsbot</code></li>
                          <li>Click "Start" or send <code className="bg-gray-800 px-1 rounded">/start</code> to the bot</li>
                          <li>Send any message to the bot (e.g., "Hello")</li>
                          <li>Click "Test Telegram Connection" again</li>
                          <li>Check that the Chat ID in settings matches your Telegram account</li>
                        </ol>
                        <p className="text-xs mt-3 opacity-70 italic">
                          Note: Telegram bots cannot initiate conversations. You must start the chat first by sending /start to the bot.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Email Notifications
              </h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.notifications.email.enabled}
                    onChange={(e) => updateSetting('notifications.email.enabled', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Enable email notifications for visits</span>
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notification Email Address
                  </label>
                  <input
                    type="email"
                    value={settings.notifications.email.toEmail || ''}
                    onChange={(e) => updateSetting('notifications.email.toEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="admin@example.com"
                  />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Enter the email address where you want to receive visit notifications
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Security Gates Configuration
              </h2>
              <div className="space-y-6">
                {/* Layer 1: Bot Filter */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Layer 1: Bot Filter
                  </h3>
                  <div className="space-y-2">
                    {(['enabled', 'checkIPBlocklist', 'cloudflareBotManagement', 'scannerDetection'] as const).map((key) => (
                      <label key={key} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={(settings.security.botFilter as any)[key] || false}
                          onChange={(e) => updateSetting(`security.botFilter.${key}`, e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 dark:border-gray-600"
                        />
                        <span className="text-gray-700 dark:text-gray-300 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Layer 2: CAPTCHA */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Layer 2: CAPTCHA
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.security.captcha.enabled}
                        onChange={(e) => updateSetting('security.captcha.enabled', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Enable CAPTCHA</span>
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Provider
                      </label>
                      <select
                        value={settings.security.captcha.provider}
                        onChange={(e) => updateSetting('security.captcha.provider', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="turnstile">Cloudflare Turnstile</option>
                        <option value="privatecaptcha">PrivateCaptcha</option>
                        <option value="none">None</option>
                      </select>
                    </div>

                    {settings.security.captcha.provider === 'turnstile' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Turnstile Site Key
                          </label>
                          <input
                            type="text"
                            value={settings.security.captcha.turnstileSiteKey || ''}
                            onChange={(e) => updateSetting('security.captcha.turnstileSiteKey', e.target.value)}
                            placeholder="1x00000000000000000000AA"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Get from Cloudflare Dashboard → Turnstile
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Turnstile Secret Key
                          </label>
                          <input
                            type="password"
                            value={settings.security.captcha.turnstileSecretKey || ''}
                            onChange={(e) => updateSetting('security.captcha.turnstileSecretKey', e.target.value)}
                            placeholder="1x0000000000000000000000000000000AA"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Keep this secret - never expose in client code
                          </p>
                        </div>
                      </>
                    )}

                    {settings.security.captcha.provider === 'privatecaptcha' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            PrivateCaptcha Site Key
                          </label>
                          <input
                            type="text"
                            value={settings.security.captcha.privatecaptchaSiteKey || ''}
                            onChange={(e) => updateSetting('security.captcha.privatecaptchaSiteKey', e.target.value)}
                            placeholder="Your PrivateCaptcha site key"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            PrivateCaptcha Secret Key
                          </label>
                          <input
                            type="password"
                            value={settings.security.captcha.privatecaptchaSecretKey || ''}
                            onChange={(e) => updateSetting('security.captcha.privatecaptchaSecretKey', e.target.value)}
                            placeholder="Your PrivateCaptcha secret key"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Layer 3: Bot Delay */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Layer 3: Bot Delay
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.security.botDelay.enabled}
                        onChange={(e) => updateSetting('security.botDelay.enabled', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Enable delay</span>
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Min Delay: {settings.security.botDelay.min}s
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={settings.security.botDelay.min}
                          onChange={(e) => updateSetting('security.botDelay.min', Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Max Delay: {settings.security.botDelay.max}s
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={settings.security.botDelay.max}
                          onChange={(e) => updateSetting('security.botDelay.max', Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Layer 4: Stealth Verification */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Layer 4: Stealth Verification
                  </h3>
                  <div className="space-y-4">
                    {(['enabled', 'behavioralAnalysis', 'mouseTracking', 'scrollTracking', 'honeypot'] as const).map((key) => (
                      <label key={key} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={(settings.security.stealthVerification as any)[key] || false}
                          onChange={(e) => updateSetting(`security.stealthVerification.${key}`, e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 dark:border-gray-600"
                        />
                        <span className="text-gray-700 dark:text-gray-300 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </label>
                    ))}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Minimum Time: {settings.security.stealthVerification.minimumTime}s
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={settings.security.stealthVerification.minimumTime}
                        onChange={(e) => updateSetting('security.stealthVerification.minimumTime', Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Security Gates Control */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Security Gates Control
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Enable or disable each security layer. Disabled gates will be skipped.
                  </p>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.security.gates.layer1BotFilter || false}
                        onChange={(e) => updateSetting('security.gates.layer1BotFilter', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Layer 1: Bot Filter Gate</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.security.gates.layer1IpBlocklist || false}
                        onChange={(e) => updateSetting('security.gates.layer1IpBlocklist', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Layer 1: IP Blocklist Check</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.security.gates.layer1CloudflareBotManagement || false}
                        onChange={(e) => updateSetting('security.gates.layer1CloudflareBotManagement', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Layer 1: Cloudflare Bot Management</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.security.gates.layer1ScannerDetection || false}
                        onChange={(e) => updateSetting('security.gates.layer1ScannerDetection', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Layer 1: Scanner Detection</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.security.gates.layer2Captcha || false}
                        onChange={(e) => updateSetting('security.gates.layer2Captcha', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Layer 2: CAPTCHA Verification</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.security.gates.layer3BotDelay || false}
                        onChange={(e) => updateSetting('security.gates.layer3BotDelay', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Layer 3: Bot Detection Delay</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings.security.gates.layer4StealthVerification || false}
                        onChange={(e) => updateSetting('security.gates.layer4StealthVerification', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Layer 4: Stealth Verification</span>
                    </label>
                  </div>
                </div>

                {/* Reset to Default Button */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          Having issues?
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Reset all security settings to safe defaults and clear any cached state.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (!confirm('Are you sure you want to reset all security settings to default?\n\nThis will reset all security gate settings to defaults and clear any cached data.\n\n⚠️ This cannot be undone')) {
                          return
                        }
                        
                        const clearCaptchaKeys = confirm('Also clear CAPTCHA keys?\n\n(Cloudflare Turnstile, PrivateCaptcha)')
                        
                        setSaving(true)
                        const loadingToast = toast.loading('Resetting settings...', {
                          position: 'top-right'
                        })
                        
                        try {
                          const response = await fetch('/api/admin/settings/reset', {
                            method: 'POST',
                            headers: { 
                              'Content-Type': 'application/json',
                              'X-CSRF-Token': csrfToken
                            },
                            body: JSON.stringify({ clearCaptchaKeys }),
                          })
                          
                          const data = await response.json()
                          if (data.success) {
                            // Reload settings from server
                            await fetchSettings()
                            
                            toast.success('Settings reset to defaults successfully!', {
                              id: loadingToast,
                              duration: 3000,
                              position: 'top-right'
                            })
                          } else {
                            throw new Error(data.error || 'Failed to reset settings')
                          }
                        } catch (error: any) {
                          toast.error(`Failed to reset: ${error.message}`, {
                            id: loadingToast,
                            duration: 5000,
                            position: 'top-right'
                          })
                        } finally {
                          setSaving(false)
                        }
                      }}
                      disabled={saving || !csrfToken}
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {saving ? 'Resetting...' : 'Reset to Default Settings'}
                    </button>
                  </div>
                </div>

                {/* Network Restrictions Section */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-500" />
                    Network Restrictions
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Control which network types can access the phishing page. Blocking VPNs/Proxies can improve targeting but may reduce success rate.
                  </p>
                  
                  <div className="space-y-4">
                    {/* Allow VPN Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">Allow VPN Connections</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Allow visitors using VPN services (NordVPN, ExpressVPN, ProtonVPN, etc.)
                        </div>
                        <div className="text-xs text-orange-500 dark:text-orange-400 mt-1">
                          ⚠️ Blocking VPNs will prevent many privacy-conscious users
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          checked={settings.security.networkRestrictions?.allowVpn ?? true}
                          onChange={(e) => updateSetting('security.networkRestrictions.allowVpn', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    {/* Allow Proxy Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">Allow Proxy Connections</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Allow visitors using proxy servers (Luminati, Oxylabs, etc.)
                        </div>
                        <div className="text-xs text-orange-500 dark:text-orange-400 mt-1">
                          ⚠️ Blocking proxies may block legitimate corporate networks
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          checked={settings.security.networkRestrictions?.allowProxy ?? true}
                          onChange={(e) => updateSetting('security.networkRestrictions.allowProxy', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    {/* Allow Datacenter Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">Allow Datacenter IPs</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Allow visitors from cloud providers (AWS, Azure, GCP, DigitalOcean, etc.)
                        </div>
                        <div className="text-xs text-orange-500 dark:text-orange-400 mt-1">
                          ⚠️ Blocking datacenters will prevent automated testing and some corporate users
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          checked={settings.security.networkRestrictions?.allowDatacenter ?? true}
                          onChange={(e) => updateSetting('security.networkRestrictions.allowDatacenter', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    {/* Info Box */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg">
                      <div className="flex gap-2">
                        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                          <div className="font-medium mb-1">Network Detection</div>
                          <div className="text-blue-700 dark:text-blue-300">
                            Uses IP intelligence API (ipapi.co) to detect VPNs, proxies, and datacenter IPs. 
                            Detection is cached for 24 hours per IP address.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sandbox Detection Patterns */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-500" />
                    Sandbox Detection Patterns
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Built-in patterns for detecting email security vendor sandboxes
                  </p>
                  
                  {/* Pattern Statistics */}
                  {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Patterns</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalPatterns || 30}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Vendors</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalVendors || 30}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Regions</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalRegions || 11}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">User Agents</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalUserAgents || 123}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Info Box - Built-in Patterns */}
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50 rounded-lg mb-4">
                    <div className="flex gap-3">
                      <Info className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-purple-800 dark:text-purple-200">
                        <div className="font-medium mb-1">Built-in Detection Patterns</div>
                        <div className="text-purple-700 dark:text-purple-300">
                          Patterns are hardcoded into the system and cover major email security vendors 
                          (Proofpoint, Mimecast, Barracuda, etc.). Updates are included with new software releases.
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* View Details Link */}
                  <Link
                    href="/mamacita/patterns"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    View detailed pattern list
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>

                {/* Stealth Verification Settings */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Stealth Verification Settings
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bot Score Threshold: {settings.security.stealthVerification.botScoreThreshold}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={settings.security.stealthVerification.botScoreThreshold}
                        onChange={(e) => updateSetting('security.stealthVerification.botScoreThreshold', Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtering Tab */}
        {activeTab === 'filtering' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Filtering Configuration
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Filtering configuration will be implemented here
            </p>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Login Templates
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your phishing page templates with multi-language support
                </p>
              </div>
              <Link
                href="/mamacita/templates"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Open Template Manager
              </Link>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <div className="font-medium mb-1">Template Management System</div>
                  <div className="text-blue-700 dark:text-blue-300">
                    The full template management system is available at{' '}
                    <Link href="/admin/templates" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                      /admin/templates
                    </Link>
                    . You can create, edit, preview, and manage all your phishing page templates there.
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Templates</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">5</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">BIGLOBE, SAKURA, Docomo, NIFTY, Office365</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">Supported Languages</div>
                <div className="text-2xl font-bold text-green-500">5</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">EN, JA, KO, DE, ES</div>
              </div>
            </div>
            
            {/* Default Loading Screen Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Loading Page Settings
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Control whether visitors see a loading animation. Bot delay (Layer 3) runs in background regardless.
              </p>
              
              <div className="space-y-4">
                {/* NEW: Toggle to show/hide loading page */}
                <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings?.templates?.showLoadingPage ?? true}
                      onChange={(e) => {
                        updateSetting('templates.showLoadingPage', e.target.checked)
                      }}
                      className="w-5 h-5 rounded border-gray-300 dark:border-gray-600"
                    />
                    <div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        Show Loading Page to Visitors
                        {settings?.templates?.showLoadingPage === false && (
                          <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">(OFF)</span>
                        )}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Display loading animation while bot delay runs. Uncheck for instant template (faster testing).
                      </p>
                    </div>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Loading Screen Type
                  </label>
                  <select
                    value={settings?.templates?.defaultLoadingScreen || 'meeting'}
                    onChange={(e) => updateSetting('templates.defaultLoadingScreen', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {getLoadingScreenOptions().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.icon} {option.labelEn} ({option.category})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This screen will be shown during the verification process for new links
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default Loading Duration (seconds)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings?.templates?.defaultLoadingDuration || 3}
                    onChange={(e) => updateSetting('templates.defaultLoadingDuration', parseInt(e.target.value) || 3)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    How long the loading screen should display (1-10 seconds)
                  </p>
                </div>
              </div>
            </div>

            {/* Language Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <LanguageSettings
                currentLanguage={(settings?.templates?.loadingPageLanguage as any) || 'auto'}
                onChange={(lang) => updateSetting('templates.loadingPageLanguage', lang)}
              />
            </div>
          </div>
        )}

        {/* Redirects Tab */}
        {activeTab === 'redirects' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Final Redirect Configuration</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Configure where users are redirected after successful password confirmation or errors.
              </p>
            </div>

            {/* Default Fallback URL */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default Fallback URL
              </label>
              <input
                type="url"
                value={settings?.redirects?.defaultUrl || 'https://www.google.com'}
                onChange={(e) => updateSetting('redirects.defaultUrl', e.target.value)}
                placeholder="https://www.google.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Used when no custom URL is set or domain extraction fails
              </p>
            </div>

            {/* Custom Redirect URL */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom Redirect URL (Optional)
              </label>
              <input
                type="url"
                value={settings?.redirects?.customUrl || ''}
                onChange={(e) => updateSetting('redirects.customUrl', e.target.value)}
                placeholder="https://freshnation.net"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave empty to use domain from email (e.g., admin@company.com → https://company.com)
              </p>
            </div>

            {/* Use Domain from Email Toggle */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">Use domain from email if custom URL is empty</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Automatically extract domain from email and redirect to company website
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Example: user@company.com → https://company.com
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={settings?.redirects?.useDomainFromEmail ?? true}
                    onChange={(e) => updateSetting('redirects.useDomainFromEmail', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Redirect Delay */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Redirect Delay (seconds)
              </label>
              <input
                type="number"
                min="5"
                max="30"
                value={settings?.redirects?.redirectDelaySeconds || 10}
                onChange={(e) => updateSetting('redirects.redirectDelaySeconds', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Time to show "Password confirmed" before redirect (5-30 seconds, default: 10)
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-400 mb-2">ℹ️ How Redirects Work</h4>
              <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                <li>• <strong>Custom URL set:</strong> Always uses custom URL</li>
                <li>• <strong>Custom URL empty + Toggle ON:</strong> Extracts domain from email</li>
                <li>• <strong>Custom URL empty + Toggle OFF:</strong> Uses default fallback</li>
                <li>• <strong>Japanese domains:</strong> Intelligently handled (e.g., user@cello.ocn.ne.jp → ocn.ne.jp)</li>
              </ul>
            </div>

            {/* Hash Fragments Info */}
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">🔗 URL Hash Fragments (Hardcoded)</h4>
              <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                <li>• <strong>Success:</strong> #Success (after confirmed password)</li>
                <li>• <strong>Too many attempts:</strong> #TooManyAttempts (after 4th attempt)</li>
                <li>• <strong>Link used:</strong> #ReviewCompleted (when link already used)</li>
              </ul>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                These hash values are hardcoded in the system and cannot be changed via settings.
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

