/**
 * Automated Pattern Update System
 * Scrapes vendor documentation, GitHub repos, and community sources
 * Updates sandbox detection patterns automatically
 */

import { SandboxPattern } from './globalSandboxPatterns'

export interface UpdateSource {
  name: string
  type: 'vendor-docs' | 'github' | 'api' | 'community'
  url: string
  scrapeFunction: () => Promise<Partial<SandboxPattern>[]>
  enabled: boolean
  lastCheck?: string
  lastUpdate?: string
}

export interface UpdateResult {
  success: boolean
  source: string
  newPatterns: number
  updatedPatterns: number
  errors: string[]
  timestamp: string
}

// ========== UPDATE SOURCES ==========

export const UPDATE_SOURCES: UpdateSource[] = [
  {
    name: 'GitHub Bad Bot Blocker',
    type: 'github',
    url: 'https://raw.githubusercontent.com/mitchellkrogza/apache-ultimate-bad-bot-blocker/master/_generator_lists/bad-user-agents.list',
    scrapeFunction: async () => {
      try {
        const response = await fetch(
          'https://raw.githubusercontent.com/mitchellkrogza/apache-ultimate-bad-bot-blocker/master/_generator_lists/bad-user-agents.list',
          {
            signal: AbortSignal.timeout(10000), // 10 second timeout
          }
        )
        const text = await response.text()
        const userAgents = text
          .split('\n')
          .filter((line) => line && !line.startsWith('#'))
          .map((ua) => ua.trim().toLowerCase())
          .filter((ua) => ua.length > 0)

        return [
          {
            id: 'community-bad-bots',
            vendor: 'Community Bad Bots',
            region: 'Global',
            userAgentPatterns: userAgents,
            ipRanges: [],
            refererPatterns: [],
            headerSignatures: [],
            lastUpdated: new Date().toISOString().split('T')[0],
            source: 'github',
            confidence: 7,
          },
        ]
      } catch (error) {
        return []
      }
    },
    enabled: true,
  },
  {
    name: 'URLhaus Malicious URLs',
    type: 'api',
    url: 'https://urlhaus-api.abuse.ch/v1/urls/recent/',
    scrapeFunction: async () => {
      try {
        const response = await fetch(
          'https://urlhaus-api.abuse.ch/v1/urls/recent/',
          {
            signal: AbortSignal.timeout(10000),
          }
        )
        const data = await response.json()

        // Extract domains from malicious URLs
        const domains =
          data.urls
            ?.map((item: any) => {
              try {
                return new URL(item.url).hostname
              } catch {
                return null
              }
            })
            .filter(Boolean) || []

        return [
          {
            id: 'urlhaus-malicious',
            vendor: 'URLhaus Malicious Domains',
            region: 'Global',
            userAgentPatterns: [],
            ipRanges: [],
            refererPatterns: Array.from(new Set(domains)),
            headerSignatures: [],
            lastUpdated: new Date().toISOString().split('T')[0],
            source: 'urlhaus',
            confidence: 6,
          },
        ]
      } catch (error) {
        return []
      }
    },
    enabled: true,
  },
  {
    name: 'Matomo Device Detector',
    type: 'github',
    url: 'https://raw.githubusercontent.com/matomo-org/device-detector/master/regexes/bots.yml',
    scrapeFunction: async () => {
      // Note: Would need YAML parser for full implementation
      // For now, return empty - can be implemented with js-yaml package
      return []
    },
    enabled: false,
  },
]

// ========== UPDATE FUNCTIONS ==========

/**
 * Check all sources for updates
 */
export async function checkForUpdates(): Promise<UpdateResult[]> {
  const results: UpdateResult[] = []

  for (const source of UPDATE_SOURCES) {
    if (!source.enabled) continue

    try {

      const patterns = await source.scrapeFunction()

      results.push({
        success: true,
        source: source.name,
        newPatterns: patterns.length,
        updatedPatterns: 0,
        errors: [],
        timestamp: new Date().toISOString(),
      })

    } catch (error) {
      results.push({
        success: false,
        source: source.name,
        newPatterns: 0,
        updatedPatterns: 0,
        errors: [
          error instanceof Error ? error.message : 'Unknown error',
        ],
        timestamp: new Date().toISOString(),
      })
    }
  }

  return results
}

/**
 * Apply updates to pattern database
 */
export async function applyUpdates(
  newPatterns: Partial<SandboxPattern>[]
): Promise<boolean> {
  try {
    // Read current patterns file
    const fs = await import('fs').then((m) => m.promises)
    const path = await import('path')

    const patternsPath = path.join(
      process.cwd(),
      'lib',
      'globalSandboxPatterns.ts'
    )
    let fileContent = await fs.readFile(patternsPath, 'utf-8')

    // TODO: Merge new patterns with existing ones
    // This is complex - needs careful merging logic
    // For now, just log the new patterns

    // Save update log
    const logPath = path.join(process.cwd(), '.pattern-updates.json')
    let log: any[] = []
    try {
      const content = await fs.readFile(logPath, 'utf-8')
      log = JSON.parse(content)
    } catch {
      // File doesn't exist yet
    }

    log.push({
      timestamp: new Date().toISOString(),
      patternsAdded: newPatterns.length,
      patterns: newPatterns,
    })

    // Keep only last 100 updates
    if (log.length > 100) {
      log = log.slice(-100)
    }

    await fs.writeFile(logPath, JSON.stringify(log, null, 2))

    return true
  } catch (error) {
    return false
  }
}

/**
 * Get update history
 */
export async function getUpdateHistory(): Promise<any[]> {
  try {
    const fs = await import('fs').then((m) => m.promises)
    const path = await import('path')

    const logPath = path.join(process.cwd(), '.pattern-updates.json')
    const content = await fs.readFile(logPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return []
  }
}

