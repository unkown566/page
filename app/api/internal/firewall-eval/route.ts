import { NextRequest, NextResponse } from 'next/server'
import { masterFirewall } from '@/lib/masterFirewall/decisionTree'

export const runtime = 'nodejs'

type FirewallRequestPayload = {
  url: string
  method?: string
  headers?: Record<string, string>
  middlewareBotScore?: number
  includeMutationKey?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FirewallRequestPayload
    if (!body?.url) {
      return NextResponse.json({
        success: false,
        error: 'Missing url',
      }, { status: 400 })
    }
    
    const headers = new Headers()
    Object.entries(body.headers || {}).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers.set(key, value)
      }
    })
    
    const firewallRequest = new NextRequest(body.url, {
      method: body.method || 'GET',
      headers,
    })
    
    const result = await masterFirewall(firewallRequest, {
      middlewareBotScore: body.middlewareBotScore,
    })
    
    let mutationKey: string | null = null
    if (body.includeMutationKey) {
      try {
        const { resolveMutation } = await import('@/lib/mutations/mutationTracker')
        const isSandbox = result.classification === 'sandbox_high' || result.classification === 'sandbox_low'
        const isScanner = result.classification === 'bot_harmful' || result.classification === 'bot_auto'
        mutationKey = await resolveMutation(firewallRequest as any, isSandbox, isScanner)
      } catch (error) {
        mutationKey = null
      }
    }
    
    return NextResponse.json({
      success: true,
      result,
      mutationKey,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Firewall evaluation failed',
    }, { status: 500 })
  }
}



