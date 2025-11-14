import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const domain = searchParams.get('domain')

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.SCREENSHOT_API_KEY || ''
    const url = `https://${domain}`
    
    let screenshotUrl: string
    
    // Try multiple free screenshot services
    if (apiKey) {
      // Option 1: screenshotapi.net (requires free API key from https://screenshotapi.net/)
      screenshotUrl = `https://api.screenshotapi.net/screenshot?url=${encodeURIComponent(url)}&width=1920&height=1080&api_key=${apiKey}`
    } else {
      // Option 2: Use a free service without API key
      // Using screenshotlayer.com free tier (limited but works)
      // Or use screenshotapi.net public endpoint (may have rate limits)
      
      // Try screenshotlayer.com (has free tier, no key needed for basic usage)
      // Format: https://api.screenshotlayer.com/api/capture?access_key=YOUR_ACCESS_KEY&url=URL
      // But they require API key, so let's use alternative
      
      // Option 3: Use a simple web service that doesn't require auth
      // Using screenshotapi.net without key (may work for limited requests)
      screenshotUrl = `https://api.screenshotapi.net/screenshot?url=${encodeURIComponent(url)}&width=1920&height=1080`
      
      // Alternative: Use a placeholder service that generates gradients
      // Or use: https://api.thumbnail.ws/ (requires API key but has free tier)
    }

    // Fetch the screenshot
    try {
      // Create timeout controller
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch(screenshotUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Screenshot API returned ${response.status}`)
      }

      const contentType = response.headers.get('content-type')
      
      if (contentType?.startsWith('image/')) {
        // Return the image URL instead of proxying (better performance)
        return NextResponse.json({
          url: screenshotUrl,
          cached: true,
        })
      } else {
        // If it's a JSON response with URL
        const data = await response.json()
        if (data.url || data.screenshot) {
          return NextResponse.json({
            url: data.url || data.screenshot,
            cached: true,
          })
        }
        throw new Error('Unexpected response format')
      }
    } catch (fetchError: any) {
      if (fetchError.name === 'AbortError') {
      } else {
      }
      
      // Return a beautiful gradient placeholder based on domain
      // Create a gradient background using the domain name as seed
      const domainHash = domain.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      const colors = [
        ['4F46E5', '7C3AED'], // indigo to purple
        ['059669', '0891B2'], // emerald to cyan
        ['DC2626', 'EA580C'], // red to orange
        ['2563EB', '7C3AED'], // blue to purple
      ]
      const colorPair = colors[domainHash % colors.length]
      
      return NextResponse.json({
        fallback: true,
        url: `https://via.placeholder.com/1920x1080/${colorPair[0]}/${colorPair[1]}?text=${encodeURIComponent(domain.toUpperCase())}`,
      })
    }
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Internal server error',
        fallback: true,
        url: 'https://via.placeholder.com/1920x1080/4F46E5/7C3AED?text=Secure+Access',
      },
      { status: 200 }
    )
  }
}

