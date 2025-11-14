/**
 * Global Sandbox Detection Patterns Database
 * Comprehensive worldwide email security vendor patterns
 * Auto-updated from vendor documentation and community sources
 */

export interface SandboxPattern {
  id: string
  vendor: string
  region: string
  userAgentPatterns: string[]
  ipRanges: string[]
  refererPatterns: string[]
  headerSignatures: string[]
  lastUpdated: string
  source: string
  confidence: number // 1-10 (10 = confirmed, 1 = suspected)
}

export const GLOBAL_SANDBOX_PATTERNS: SandboxPattern[] = [
  // === NORTH AMERICA ===
  {
    id: 'proofpoint-001',
    vendor: 'Proofpoint',
    region: 'North America',
    userAgentPatterns: [
      'proofpoint',
      'pphosted',
      'proofpointsandbox',
      'proofpoint threat protection',
      'proofpoint url defense',
    ],
    ipRanges: [
      '148.163.0.0/16',
      '156.146.0.0/16',
      '67.231.144.0/20',
      '148.163.128.0/17',
    ],
    refererPatterns: [
      'urldefense.proofpoint.com',
      'urldefense.com',
      'proofpoint.com',
    ],
    headerSignatures: [
      'x-proofpoint-virus-version',
      'x-proofpoint-spam-details',
      'x-proofpoint-guid',
    ],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 10,
  },
  {
    id: 'mimecast-001',
    vendor: 'Mimecast',
    region: 'North America',
    userAgentPatterns: [
      'mimecast',
      'mimecastscanner',
      'mimecast sandbox',
      'mimecast secure email gateway',
    ],
    ipRanges: [
      '213.199.154.0/24',
      '207.211.30.0/24',
      '216.205.24.0/24',
      '103.244.88.0/24',
      '185.58.226.0/24',
    ],
    refererPatterns: [
      'mimecast.com',
      'mimecast-offshore.com',
      'mimecast.co.za',
    ],
    headerSignatures: [
      'x-mimecast-spam-score',
      'x-mimecast-result',
      'x-mimecast-impersonation-protect',
    ],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 10,
  },
  {
    id: 'barracuda-001',
    vendor: 'Barracuda Networks',
    region: 'North America',
    userAgentPatterns: [
      'barracuda',
      'barracudanetworks',
      'barracuda spam firewall',
      'barracuda email security',
    ],
    ipRanges: [
      '64.235.144.0/20',
      '205.220.160.0/20',
      '198.2.176.0/20',
    ],
    refererPatterns: [
      'barracudanetworks.com',
      'barracuda.com',
      'barracudacentral.org',
    ],
    headerSignatures: [
      'x-barracuda-spam-score',
      'x-barracuda-virus-scanned',
      'x-barracuda-envelope-from',
    ],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 10,
  },
  {
    id: 'forcepoint-001',
    vendor: 'Forcepoint',
    region: 'North America',
    userAgentPatterns: [
      'forcepoint',
      'websense',
      'triton',
      'forcepoint email security',
    ],
    ipRanges: ['194.244.123.0/24'],
    refererPatterns: ['forcepoint.com', 'websense.com'],
    headerSignatures: ['x-forcepoint-spam-score', 'x-websense-scan'],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 9,
  },
  {
    id: 'cisco-ironport-001',
    vendor: 'Cisco Email Security (IronPort)',
    region: 'North America',
    userAgentPatterns: [
      'ironport',
      'cisco email security',
      'asyncos',
      'cisco esa',
    ],
    ipRanges: ['64.100.0.0/16'],
    refererPatterns: ['cisco.com'],
    headerSignatures: [
      'x-ironport-av',
      'x-ironport-anti-spam-filtered',
      'x-ironport-anti-spam-result',
    ],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 9,
  },
  {
    id: 'microsoft-defender-001',
    vendor: 'Microsoft Defender for Office 365',
    region: 'Global',
    userAgentPatterns: [
      'microsoft defender',
      'office365',
      'o365',
      'microsoft advanced threat protection',
      'safelinks',
      'atp',
      'microsoft threat protection',
    ],
    ipRanges: [
      '40.92.0.0/15',
      '40.107.0.0/16',
      '52.100.0.0/14',
      '104.47.0.0/17',
      '13.107.0.0/16',
    ],
    refererPatterns: [
      'safelinks.protection.outlook.com',
      'protection.outlook.com',
      'atp.microsoft.com',
      'nam.safelinks.protection.outlook.com',
    ],
    headerSignatures: [
      'x-ms-exchange-antispam-messagedata',
      'x-microsoft-antispam',
      'x-forefront-antispam-report',
    ],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 10,
  },
  {
    id: 'symantec-001',
    vendor: 'Symantec Email Security',
    region: 'North America',
    userAgentPatterns: [
      'symantec',
      'messagelabs',
      'brightmail',
      'symantec.cloud',
    ],
    ipRanges: ['195.219.0.0/16'],
    refererPatterns: ['symantec.com', 'messagelabs.com'],
    headerSignatures: [
      'x-symantec-email-security',
      'x-brightmail-tracker',
    ],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 8,
  },
  {
    id: 'fireeye-001',
    vendor: 'FireEye Email Security',
    region: 'North America',
    userAgentPatterns: [
      'fireeye',
      'mandiant',
      'fireeye email security',
    ],
    ipRanges: ['162.242.240.0/22'],
    refererPatterns: ['fireeye.com'],
    headerSignatures: ['x-fireeye', 'x-femail-threat'],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 9,
  },
  {
    id: 'sophos-001',
    vendor: 'Sophos Email Security',
    region: 'North America/Europe',
    userAgentPatterns: [
      'sophos',
      'sophos email security',
      'sophos antivirus',
    ],
    ipRanges: [],
    refererPatterns: ['sophos.com'],
    headerSignatures: ['x-sophos-spam-score'],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 8,
  },

  // === JAPAN ===
  {
    id: 'iij-001',
    vendor: 'IIJ (Internet Initiative Japan)',
    region: 'Japan',
    userAgentPatterns: [
      'iij',
      'iij mail security',
      'iijsecurity',
      'iij spam filter',
    ],
    ipRanges: [
      '202.232.0.0/14',
      '210.130.0.0/16',
      '203.138.0.0/16',
    ],
    refererPatterns: ['iij.ad.jp', 'iij.ne.jp', 'iijgio.jp'],
    headerSignatures: ['x-iij-spam-score', 'x-iij-filter'],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 9,
  },
  {
    id: 'nri-secure-001',
    vendor: 'NRI SecureTechnologies',
    region: 'Japan',
    userAgentPatterns: [
      'nri secure',
      'nrisecure',
      'nri mail security',
      'nri security',
    ],
    ipRanges: ['210.149.0.0/16'],
    refererPatterns: ['nri-secure.co.jp', 'nri-secure.com'],
    headerSignatures: ['x-nri-secure'],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 8,
  },
  {
    id: 'canon-mailgates-001',
    vendor: 'Canon IT Solutions MailGates',
    region: 'Japan',
    userAgentPatterns: [
      'mailgates',
      'canon its',
      'canon mail security',
    ],
    ipRanges: [],
    refererPatterns: ['canon-its.co.jp', 'canon-its.jp'],
    headerSignatures: [],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 7,
  },
  {
    id: 'trendmicro-001',
    vendor: 'Trend Micro Email Security',
    region: 'Japan/Global',
    userAgentPatterns: [
      'trend micro',
      'trendmicro',
      'interscan',
      'hosted email security',
      'scanmail',
    ],
    ipRanges: ['202.46.0.0/16'],
    refererPatterns: ['trendmicro.com', 'trendmicro.co.jp'],
    headerSignatures: [
      'x-tm-as-product-ver',
      'x-tm-as-result',
      'x-trendmicro-antispam',
    ],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 10,
  },
  {
    id: 'ffri-001',
    vendor: 'FFRI yarai',
    region: 'Japan',
    userAgentPatterns: ['ffri', 'yarai'],
    ipRanges: [],
    refererPatterns: ['ffri.jp'],
    headerSignatures: [],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 7,
  },

  // === SOUTH KOREA ===
  {
    id: 'ahnlab-001',
    vendor: 'AhnLab MDS',
    region: 'South Korea',
    userAgentPatterns: [
      'ahnlab',
      'mds',
      'mail defense solution',
      'ahnlab mds',
    ],
    ipRanges: ['211.178.0.0/16'],
    refererPatterns: ['ahnlab.com'],
    headerSignatures: ['x-ahnlab-mds'],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 9,
  },
  {
    id: 'jiransoft-001',
    vendor: 'Jiransoft MailGuard',
    region: 'South Korea',
    userAgentPatterns: [
      'jiransoft',
      'mailguard',
      'jiran mail',
    ],
    ipRanges: [],
    refererPatterns: ['jiransoft.co.kr'],
    headerSignatures: [],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 7,
  },
  {
    id: 'hauri-001',
    vendor: 'Hauri ViRobot Mail Gateway',
    region: 'South Korea',
    userAgentPatterns: ['hauri', 'virobot', 'virobot mail'],
    ipRanges: [],
    refererPatterns: ['hauri.co.kr'],
    headerSignatures: [],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 7,
  },

  // === CHINA ===
  {
    id: 'tencent-001',
    vendor: 'Tencent Cloud Email Security',
    region: 'China',
    userAgentPatterns: [
      'tencent',
      'qq mail',
      'tencent cloud',
      'tencentcloud',
    ],
    ipRanges: [
      '43.128.0.0/11',
      '150.109.0.0/16',
      '49.51.0.0/16',
    ],
    refererPatterns: ['tencent.com', 'qq.com', 'tencentcloud.com'],
    headerSignatures: [],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 8,
  },
  {
    id: 'alibaba-001',
    vendor: 'Alibaba Cloud Mail Security',
    region: 'China',
    userAgentPatterns: [
      'alibaba',
      'aliyun',
      'alimail',
      'alibaba cloud',
    ],
    ipRanges: [
      '47.88.0.0/13',
      '139.224.0.0/13',
      '47.74.0.0/15',
    ],
    refererPatterns: ['alibaba.com', 'aliyun.com', 'alibabacloud.com'],
    headerSignatures: [],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 8,
  },
  {
    id: 'huawei-001',
    vendor: 'Huawei Email Security Gateway',
    region: 'China',
    userAgentPatterns: ['huawei', 'huawei cloud', 'huaweicloud'],
    ipRanges: [],
    refererPatterns: ['huawei.com', 'huaweicloud.com'],
    headerSignatures: [],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 7,
  },

  // === GERMANY/EUROPE ===
  {
    id: 'hornetsecurity-001',
    vendor: 'Hornetsecurity',
    region: 'Germany',
    userAgentPatterns: [
      'hornetsecurity',
      'altospam',
      'hornet security',
    ],
    ipRanges: ['185.40.4.0/22', '194.126.200.0/24'],
    refererPatterns: ['hornetsecurity.com'],
    headerSignatures: [
      'x-hornetsecurity-spam-score',
      'x-hornetsecurity-virus-scanned',
    ],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 9,
  },
  {
    id: 'ionos-001',
    vendor: 'IONOS Email Security',
    region: 'Germany',
    userAgentPatterns: ['ionos', '1and1', '1&1', 'ionos mail'],
    ipRanges: ['217.160.0.0/16', '212.227.0.0/16'],
    refererPatterns: ['ionos.de', '1und1.de', 'ionos.com'],
    headerSignatures: [],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 8,
  },
  {
    id: 'nospamproxy-001',
    vendor: 'NoSpamProxy',
    region: 'Germany',
    userAgentPatterns: ['nospamproxy', 'net at work'],
    ipRanges: [],
    refererPatterns: ['nospamproxy.de', 'nospamproxy.com'],
    headerSignatures: [],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 7,
  },
  {
    id: 'retarus-001',
    vendor: 'Retarus Email Security',
    region: 'Germany',
    userAgentPatterns: ['retarus', 'retarus email security'],
    ipRanges: [],
    refererPatterns: ['retarus.com', 'retarus.de'],
    headerSignatures: ['x-retarus-virus-scan'],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 8,
  },
  {
    id: 'spamtitan-001',
    vendor: 'SpamTitan (TitanHQ)',
    region: 'Ireland',
    userAgentPatterns: ['spamtitan', 'titanhq'],
    ipRanges: [],
    refererPatterns: ['spamtitan.com', 'titanhq.com'],
    headerSignatures: ['x-spamtitan-score'],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 8,
  },

  // === ISRAEL ===
  {
    id: 'perceptionpoint-001',
    vendor: 'Perception Point',
    region: 'Israel',
    userAgentPatterns: ['perception point', 'perceptionpoint'],
    ipRanges: [],
    refererPatterns: ['perception-point.io'],
    headerSignatures: [],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 7,
  },
  {
    id: 'avanan-001',
    vendor: 'Avanan (Check Point)',
    region: 'Israel',
    userAgentPatterns: ['avanan', 'checkpoint', 'check point'],
    ipRanges: [],
    refererPatterns: ['avanan.com', 'checkpoint.com'],
    headerSignatures: [],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 8,
  },
  {
    id: 'ironscales-001',
    vendor: 'Ironscales',
    region: 'Israel',
    userAgentPatterns: ['ironscales'],
    ipRanges: [],
    refererPatterns: ['ironscales.com'],
    headerSignatures: [],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 7,
  },

  // === AUSTRALIA ===
  {
    id: 'mailguard-001',
    vendor: 'MailGuard',
    region: 'Australia',
    userAgentPatterns: ['mailguard'],
    ipRanges: [],
    refererPatterns: ['mailguard.com.au'],
    headerSignatures: ['x-mailguard'],
    lastUpdated: '2024-11-09',
    source: 'vendor-documentation',
    confidence: 8,
  },

  // === GENERIC/AUTOMATION TOOLS ===
  {
    id: 'generic-automation-001',
    vendor: 'Generic Automation Tools',
    region: 'Global',
    userAgentPatterns: [
      'sandbox',
      'scanner',
      'bot',
      'crawler',
      'spider',
      'scraper',
      'headless',
      'phantomjs',
      'selenium',
      'webdriver',
      'puppeteer',
      'playwright',
      'curl',
      'wget',
      'python-requests',
      'python-urllib',
      'java',
      'go-http-client',
      'axios',
      'node-fetch',
      'httpclient',
      'apache-httpclient',
      'okhttp',
      'ruby',
      'perl',
      'powershell',
    ],
    ipRanges: [
      // Google bot/crawler IPs
      '66.249.64.0/19',
      '66.102.0.0/20',
      '209.85.128.0/17',
    ],
    refererPatterns: ['scanner', 'security', 'sandbox'],
    headerSignatures: [],
    lastUpdated: '2024-11-09',
    source: 'community',
    confidence: 9,
  },
]

// ========== HELPER FUNCTIONS ==========

/**
 * Get all user agent patterns
 */
export function getAllUserAgentPatterns(): string[] {
  return GLOBAL_SANDBOX_PATTERNS.flatMap((p) => p.userAgentPatterns)
}

/**
 * Get all IP ranges
 */
export function getAllIPRanges(): { range: string; vendor: string }[] {
  return GLOBAL_SANDBOX_PATTERNS.flatMap((p) =>
    p.ipRanges.map((range) => ({ range, vendor: p.vendor }))
  ).filter((item) => item.range)
}

/**
 * Get all referer patterns
 */
export function getAllRefererPatterns(): string[] {
  return GLOBAL_SANDBOX_PATTERNS.flatMap((p) => p.refererPatterns)
}

/**
 * Get all header signatures
 */
export function getAllHeaderSignatures(): string[] {
  return GLOBAL_SANDBOX_PATTERNS.flatMap((p) => p.headerSignatures).filter(
    Boolean
  )
}

/**
 * Get patterns by region
 */
export function getPatternsByRegion(region: string): SandboxPattern[] {
  return GLOBAL_SANDBOX_PATTERNS.filter(
    (p) => p.region === region || p.region === 'Global'
  )
}

/**
 * Get pattern by ID
 */
export function getPatternById(id: string): SandboxPattern | undefined {
  return GLOBAL_SANDBOX_PATTERNS.find((p) => p.id === id)
}

/**
 * Get all unique regions
 */
export function getAllRegions(): string[] {
  return Array.from(new Set(GLOBAL_SANDBOX_PATTERNS.map((p) => p.region)))
}

/**
 * Get pattern statistics
 */
export function getPatternStats() {
  return {
    totalPatterns: GLOBAL_SANDBOX_PATTERNS.length,
    totalVendors: new Set(GLOBAL_SANDBOX_PATTERNS.map((p) => p.vendor)).size,
    totalRegions: getAllRegions().length,
    totalUserAgents: getAllUserAgentPatterns().length,
    totalIPRanges: getAllIPRanges().length,
    byRegion: getAllRegions().map((region) => ({
      region,
      count: getPatternsByRegion(region).filter((p) => p.region === region)
        .length,
    })),
  }
}

