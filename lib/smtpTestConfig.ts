export interface SMTPTestConfig {
  provider: string
  host: string
  ports: number[] // Multiple ports to try
  primaryPort: number // Preferred port
  security: 'SSL' | 'TLS' | 'STARTTLS'
  testMethod: 'connection' | 'vrfy' | 'rcpt'
  timeout: number
}

export const SMTP_TEST_CONFIGS: Record<string, SMTPTestConfig> = {
  // === GLOBAL PROVIDERS ===
  
  'office365': {
    provider: 'Microsoft Office 365',
    host: 'smtp.office365.com',
    ports: [587, 465], // Both supported
    primaryPort: 587,
    security: 'STARTTLS',
    testMethod: 'connection',
    timeout: 10000
  },
  
  'outlook': {
    provider: 'Outlook.com',
    host: 'smtp-mail.outlook.com',
    ports: [587], // Only STARTTLS
    primaryPort: 587,
    security: 'STARTTLS',
    testMethod: 'connection',
    timeout: 10000
  },
  
  'google': {
    provider: 'Gmail / Google Workspace',
    host: 'smtp.gmail.com',
    ports: [587, 465, 25], // All three supported
    primaryPort: 587,
    security: 'STARTTLS',
    testMethod: 'connection',
    timeout: 10000
  },
  
  'zoho': {
    provider: 'Zoho Mail',
    host: 'smtp.zoho.com', // Free accounts
    ports: [465, 587], // Both supported
    primaryPort: 465, // SSL preferred
    security: 'SSL',
    testMethod: 'connection',
    timeout: 10000
  },
  
  'zoho-paid': {
    provider: 'Zoho Mail (Paid)',
    host: 'smtppro.zoho.com', // Paid accounts
    ports: [465, 587],
    primaryPort: 465,
    security: 'SSL',
    testMethod: 'connection',
    timeout: 10000
  },
  
  'fastmail': {
    provider: 'FastMail',
    host: 'smtp.fastmail.com',
    ports: [465, 587], // Both supported
    primaryPort: 465, // SSL/TLS preferred
    security: 'SSL',
    testMethod: 'connection',
    timeout: 10000
  },
  
  'icloud': {
    provider: 'iCloud Mail',
    host: 'smtp.mail.me.com',
    ports: [587], // Only STARTTLS
    primaryPort: 587,
    security: 'STARTTLS',
    testMethod: 'connection',
    timeout: 10000
  },
  
  'yahoo': {
    provider: 'Yahoo Mail',
    host: 'smtp.mail.yahoo.com',
    ports: [465, 587], // Both supported
    primaryPort: 465, // SSL preferred
    security: 'SSL',
    testMethod: 'connection',
    timeout: 10000
  },
  
  'aol': {
    provider: 'AOL Mail',
    host: 'smtp.aol.com',
    ports: [465, 587], // Both supported
    primaryPort: 465,
    security: 'SSL',
    testMethod: 'connection',
    timeout: 10000
  },
  
  // === JAPANESE ISP PROVIDERS ===
  
  'biglobe': {
    provider: 'Biglobe',
    host: 'mail.biglobe.ne.jp',
    ports: [465, 587], // Both supported
    primaryPort: 465, // SSL/TLS primary
    security: 'SSL',
    testMethod: 'connection',
    timeout: 12000
  },
  
  'so-net': {
    provider: 'So-net',
    host: 'mail.so-net.ne.jp',
    ports: [587], // Only STARTTLS
    primaryPort: 587,
    security: 'STARTTLS',
    testMethod: 'connection',
    timeout: 12000
  },
  
  'ocn': {
    provider: 'OCN',
    host: 'smtp.ocn.ne.jp',
    ports: [465, 587], // Both supported
    primaryPort: 465, // SSL/TLS recommended
    security: 'SSL',
    testMethod: 'connection',
    timeout: 12000
  },
  
  'nifty': {
    provider: 'Nifty',
    host: 'smtp.nifty.com',
    ports: [465, 587], // Both supported
    primaryPort: 465,
    security: 'SSL',
    testMethod: 'connection',
    timeout: 12000
  },
  
  'plala': {
    provider: 'Plala',
    host: 'secure.plala.or.jp',
    ports: [465, 587], // Both supported
    primaryPort: 465,
    security: 'SSL',
    testMethod: 'connection',
    timeout: 12000
  },
  
  'yahoo-japan': {
    provider: 'Yahoo Japan',
    host: 'smtp.mail.yahoo.co.jp',
    ports: [465, 587], // Both supported (TLS terminology)
    primaryPort: 465,
    security: 'SSL',
    testMethod: 'connection',
    timeout: 12000
  },
  
  'rakuten': {
    provider: 'Rakuten Broadband',
    host: 'mail.gol.com',
    ports: [465, 587], // Both supported
    primaryPort: 465,
    security: 'SSL',
    testMethod: 'connection',
    timeout: 12000
  },
  
  // === JAPANESE HOSTING PROVIDERS ===
  
  'sakura': {
    provider: 'Sakura Internet',
    host: '', // Domain-specific (xxx.sakura.ne.jp)
    ports: [465, 587], // Both supported
    primaryPort: 465, // SSL primary
    security: 'SSL',
    testMethod: 'connection',
    timeout: 12000
  },
  
  'xserver': {
    provider: 'Xserver',
    host: '', // Server-specific (sv***.xserver.jp)
    ports: [465, 587], // Both supported
    primaryPort: 465,
    security: 'SSL',
    testMethod: 'connection',
    timeout: 12000
  },
  
  'conoha': {
    provider: 'ConoHa',
    host: '', // Contract-specific (mail####.conoha.ne.jp)
    ports: [465, 587], // Both supported
    primaryPort: 465,
    security: 'SSL',
    testMethod: 'connection',
    timeout: 12000
  },
  
  'lolipop': {
    provider: 'Lolipop',
    host: 'smtp.lolipop.jp', // Standardized
    ports: [465, 587], // Research shows both
    primaryPort: 465,
    security: 'SSL',
    testMethod: 'connection',
    timeout: 12000
  },
  
  'kagoya': {
    provider: 'Kagoya',
    host: 'smtp.kagoya.net', // Generic (or customer-specific)
    ports: [587, 465], // Both supported
    primaryPort: 587,
    security: 'STARTTLS',
    testMethod: 'connection',
    timeout: 12000
  },
  
  'value-domain': {
    provider: 'Value-Domain',
    host: '', // Service-specific
    ports: [587, 465], // Both supported
    primaryPort: 587,
    security: 'STARTTLS',
    testMethod: 'connection',
    timeout: 12000
  },
  
  'heteml': {
    provider: 'Heteml',
    host: '', // User-specific
    ports: [587, 465], // Both supported
    primaryPort: 587,
    security: 'STARTTLS',
    testMethod: 'connection',
    timeout: 12000
  },
  
  'muumuu': {
    provider: 'Muumuu Mail',
    host: 'smtp.muumuu-mail.com', // Standardized
    ports: [465], // Only SSL/TLS (mandatory per research)
    primaryPort: 465,
    security: 'SSL',
    testMethod: 'connection',
    timeout: 12000
  }
}

export function detectSMTPProvider(mxRecord: string): string | null {
  const mx = mxRecord.toLowerCase()
  
  // Microsoft
  if (mx.includes('.protection.outlook.com') || mx.includes('.office365.com')) {
    return 'office365'
  }
  if (mx.includes('outlook.com')) {
    return 'outlook'
  }
  
  // Google
  if (mx.includes('aspmx.l.google.com') || mx.includes('gmail')) {
    return 'google'
  }
  
  // Zoho
  if (mx.includes('mx.zoho.com')) {
    return 'zoho'
  }
  if (mx.includes('smtppro.zoho.com')) {
    return 'zoho-paid'
  }
  
  // FastMail
  if (mx.includes('fastmail.com')) {
    return 'fastmail'
  }
  
  // iCloud
  if (mx.includes('icloud.com') || mx.includes('mail.me.com')) {
    return 'icloud'
  }
  
  // Yahoo
  if (mx.includes('yahoodns.net') || mx.includes('mta7.am0.yahoodns.net')) {
    return 'yahoo'
  }
  
  // AOL
  if (mx.includes('mx.aol.com')) {
    return 'aol'
  }
  
  // Japanese ISPs
  if (mx.includes('biglobe.ne.jp')) return 'biglobe'
  if (mx.includes('so-net.ne.jp')) return 'so-net'
  if (mx.includes('ocn.ne.jp')) return 'ocn'
  if (mx.includes('nifty.com')) return 'nifty'
  if (mx.includes('plala.or.jp')) return 'plala'
  if (mx.includes('yahoo.co.jp')) return 'yahoo-japan'
  if (mx.includes('gol.com')) return 'rakuten'
  
  // Japanese Hosting
  if (mx.includes('sakura.ne.jp')) return 'sakura'
  if (mx.includes('xserver.jp')) return 'xserver'
  if (mx.includes('conoha.ne.jp')) return 'conoha'
  if (mx.includes('lolipop.jp')) return 'lolipop'
  if (mx.includes('kagoya.net')) return 'kagoya'
  if (mx.includes('value-domain.com')) return 'value-domain'
  if (mx.includes('heteml.jp')) return 'heteml'
  if (mx.includes('muumuu-mail.com')) return 'muumuu'
  
  return null
}










