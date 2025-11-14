/**
 * Statistics calculator for admin dashboard and analytics
 */

import { getAllLinks, getAllCapturedEmails, type CapturedEmail, type Link } from './linkDatabase'

export interface DashboardStats {
  totalCaptures: number
  capturedToday: number
  totalLinks: number
  activeLinks: number
  successRate: number
  avgPerDay: number
}

export interface ChartDataPoint {
  date: string
  count: number
}

export interface ProviderStats {
  [provider: string]: number
}

export interface CountryStats {
  [country: string]: number
}

export interface DeviceStats {
  Desktop: number
  Mobile: number
  Tablet: number
}

/**
 * Calculate dashboard statistics
 */
export async function calculateDashboardStats(): Promise<DashboardStats> {
  const links = await getAllLinks()
  const captures = await getAllCapturedEmails()

  const totalCaptures = captures.length
  const totalLinks = links.length

  // Active links (status = active and not expired)
  const activeLinks = links.filter(
    (link) => link.status === 'active' && link.expiresAt > Date.now()
  ).length

  // Captures today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const capturedToday = captures.filter(
    (capture) => capture.capturedAt >= today.getTime()
  ).length

  // Success rate (verified captures)
  const verifiedCaptures = captures.filter((capture) => capture.verified).length
  const successRate = totalCaptures > 0 ? (verifiedCaptures / totalCaptures) * 100 : 0

  // Average per day (last 7 days)
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const capturesLast7Days = captures.filter(
    (capture) => capture.capturedAt >= sevenDaysAgo
  ).length
  const avgPerDay = capturesLast7Days / 7

  return {
    totalCaptures,
    capturedToday,
    totalLinks,
    activeLinks,
    successRate,
    avgPerDay,
  }
}

/**
 * Get captures over time (grouped by date)
 */
export async function getCapturesOverTime(days: number): Promise<ChartDataPoint[]> {
  const captures = await getAllCapturedEmails()
  const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000

  // Filter captures within date range
  const filteredCaptures = captures.filter((capture) => capture.capturedAt >= cutoffDate)

  // Group by date
  const dateMap = new Map<string, number>()

  filteredCaptures.forEach((capture) => {
    const date = new Date(capture.capturedAt)
    const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD

    dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1)
  })

  // Convert to array and sort by date
  const result: ChartDataPoint[] = Array.from(dateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return result
}

/**
 * Get provider breakdown
 */
export async function getProviderBreakdown(): Promise<ProviderStats> {
  const captures = await getAllCapturedEmails()

  const providerMap = new Map<string, number>()

  captures.forEach((capture) => {
    const provider = capture.provider || 'Unknown'
    providerMap.set(provider, (providerMap.get(provider) || 0) + 1)
  })

  // Convert to object
  const result: ProviderStats = {}
  providerMap.forEach((count, provider) => {
    result[provider] = count
  })

  return result
}

/**
 * Get country breakdown (from IP location)
 * Note: This is a placeholder - actual implementation would require IP geolocation
 */
export async function getCountryBreakdown(): Promise<CountryStats> {
  const captures = await getAllCapturedEmails()

  // For now, return empty or placeholder data
  // In production, you'd extract country from IP using a geolocation service
  const countryMap = new Map<string, number>()

  // Placeholder: Extract from IP or use a geolocation service
  captures.forEach((capture) => {
    // This is a placeholder - you'd need to implement IP geolocation
    const country = 'Unknown' // Extract from capture.ip using geolocation service
    countryMap.set(country, (countryMap.get(country) || 0) + 1)
  })

  const result: CountryStats = {}
  countryMap.forEach((count, country) => {
    result[country] = count
  })

  return result
}

/**
 * Get device breakdown
 * Note: This requires parsing user agent or storing device type in captures
 */
export async function getDeviceBreakdown(): Promise<DeviceStats> {
  const captures = await getAllCapturedEmails()

  // Placeholder implementation
  // In production, you'd parse user agent or store device type in capture record
  return {
    Desktop: Math.floor(captures.length * 0.6), // Placeholder: 60% desktop
    Mobile: Math.floor(captures.length * 0.35), // Placeholder: 35% mobile
    Tablet: Math.floor(captures.length * 0.05), // Placeholder: 5% tablet
  }
}

/**
 * Get captures by hour of day (0-23)
 */
export async function getCapturesByHour(): Promise<{ hour: number; count: number }[]> {
  const captures = await getAllCapturedEmails()

  const hourMap = new Map<number, number>()

  captures.forEach((capture) => {
    const date = new Date(capture.capturedAt)
    const hour = date.getHours()
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1)
  })

  // Convert to array and fill missing hours with 0
  const result: { hour: number; count: number }[] = []
  for (let hour = 0; hour < 24; hour++) {
    result.push({
      hour,
      count: hourMap.get(hour) || 0,
    })
  }

  return result
}




