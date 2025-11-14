'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import { Info } from 'lucide-react'
import {
  GLOBAL_SANDBOX_PATTERNS,
  getPatternStats,
  getAllRegions,
  getPatternsByRegion,
  type SandboxPattern,
} from '@/lib/globalSandboxPatterns'

export default function PatternsPage() {
  const [stats, setStats] = useState<any>(null)
  const [selectedRegion, setSelectedRegion] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setStats(getPatternStats())
  }, [])

  const regions = ['All', ...getAllRegions()]

  const filteredPatterns = GLOBAL_SANDBOX_PATTERNS.filter((pattern) => {
    // Region filter
    if (selectedRegion !== 'All' && pattern.region !== selectedRegion) {
      return false
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        pattern.vendor.toLowerCase().includes(query) ||
        pattern.userAgentPatterns.some((ua) =>
          ua.toLowerCase().includes(query)
        ) ||
        pattern.refererPatterns.some((ref) =>
          ref.toLowerCase().includes(query)
        )
      )
    }

    return true
  })


  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Sandbox Detection Patterns
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View built-in patterns for detecting email security vendor sandboxes.{' '}
            Configure detection in{' '}
            <Link href="/mamacita/settings" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
              Settings
            </Link>.
          </p>
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <div className="font-medium mb-1">Pattern Information</div>
              <div className="text-blue-700 dark:text-blue-300">
                These detection patterns are built into the codebase. To enable or disable 
                sandbox detection, use the{' '}
                <Link href="/mamacita/settings" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline">
                  Settings page
                </Link>.
                Pattern updates are included with software releases.
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Patterns
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.totalPatterns}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Vendors
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.totalVendors}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Regions
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.totalRegions}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                User Agents
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.totalUserAgents}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-4">
            {/* Region Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Region
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendors, user agents, referers..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Patterns List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Region
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Patterns
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPatterns.map((pattern) => (
                  <tr
                    key={pattern.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {pattern.vendor}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {pattern.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                        {pattern.region}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {pattern.userAgentPatterns.length} UA patterns
                      </div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {pattern.ipRanges.length} IP ranges
                      </div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {pattern.refererPatterns.length} referer patterns
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${pattern.confidence * 10}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {pattern.confidence}/10
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {pattern.lastUpdated}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPatterns.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No patterns found
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

