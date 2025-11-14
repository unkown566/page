'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  BarChart3,
  Download,
} from 'lucide-react'
// Stats will be fetched from API

const COLORS = ['#0078D4', '#107C10', '#FFB900', '#E81123', '#5C2D91', '#00BCF2']

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState(30)
  const [loading, setLoading] = useState(true)
  const [capturesOverTime, setCapturesOverTime] = useState<any[]>([])
  const [providerBreakdown, setProviderBreakdown] = useState<any[]>([])
  const [deviceBreakdown, setDeviceBreakdown] = useState<any[]>([])
  const [capturesByHour, setCapturesByHour] = useState<any[]>([])
  const [successRate, setSuccessRate] = useState(0)
  const [totalCaptures, setTotalCaptures] = useState(0)

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const [analyticsData, stats] = await Promise.all([
        fetch(`/api/admin/analytics?days=${dateRange}`).then((r) => r.json()),
        fetch('/api/admin/stats').then((r) => r.json()),
      ])

      if (analyticsData.success) {
        setCapturesOverTime(analyticsData.capturesOverTime || [])
        setProviderBreakdown(analyticsData.providerBreakdown || [])
        setDeviceBreakdown(analyticsData.deviceBreakdown || [])
        setCapturesByHour(analyticsData.capturesByHour || [])
      }

      setSuccessRate(stats.successRate || 0)
      setTotalCaptures(stats.totalCaptures || 0)
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Detailed insights into your campaigns
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {totalCaptures === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No data available
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Analytics will appear here once you have captures
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Capture Rate Over Time */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Capture Rate Over Time
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={capturesOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#0078D4" fill="#0078D4" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Provider Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Provider Breakdown
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={providerBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {providerBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Success Rate */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Success Rate
              </h2>
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-center">
                  <div className="text-6xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {successRate.toFixed(1)}%
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {totalCaptures > 0
                      ? `${Math.round((successRate / 100) * totalCaptures)} of ${totalCaptures} verified`
                      : 'No captures yet'}
                  </p>
                </div>
              </div>
            </div>

            {/* Device Types */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Device Types
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deviceBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0078D4" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Capture Timeline */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Capture Timeline (Last 24 Hours)
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={capturesByHour}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0078D4" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

