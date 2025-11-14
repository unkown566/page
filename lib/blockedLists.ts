/**
 * Blocked IPs, User Agents, and Referrers
 * Replicates .htaccess blocking rules for Next.js
 */

// Security scanning & threat intelligence IP ranges
export const BLOCKED_IP_PATTERNS = [
  /^198\.20\.(6[4-9]|7[0-5]|69|70|99)\./,
  /^71\.6\.(1[3-9][0-9]|146|147|167|232)\./,
  /^209\.126\.136\./,
  /^66\.240\.(205|236)\./,
  /^93\.120\.27\./,
  /^188\.138\.9\./,
  /^162\.142\.125\./,
  /^141\.212\.12[0-2]\./,
  /^167\.94\.(138|145|146)\./,
  /^159\.203\.178\./,
  /^138\.68\.161\./,
  /^159\.89\.214\./,
  /^106\.75\.74\./,
  /^123\.207\.137\./,
  /^88\.202\.190\./,
  /^137\.117\./,
  /^54\.237\.75\./,
  /^154\.16\.1[0-9][0-9]\./,
  /^216\.244\.66\./,
  /^216\.218\.206\./,
  /^45\.79\.84\./,
  /^69\.46\.86\./,
  /^54\.236\./,
  /^52\.70\./,
  /^40\.76\./,
  /^13\.107\./,
  /^35\.247\./,
  /^35\.236\./,
]

// Malicious tools & security scanners
export const BLOCKED_USER_AGENTS = [
  // Security scanning tools
  'havij', 'libwww-perl', 'nikto', 'sqlmap', 'wget', 'python', 'pysql',
  'scan', 'any.run', 'censys', 'shodan', 'masscan', 'nmap', 'zmap', 'zgrab',
  'openvas', 'nuclei', 'burp', 'owasp', 'zap', 'w3af', 'dirb', 'dirbuster',
  'gobuster', 'wfuzz', 'hydra', 'medusa', 'john', 'hashcat', 'metasploit',
  'vega', 'arachni', 'skipfish', 'sqlninja', 'pangolin', 'safe3si', 'appscan',
  'netsparker', 'acunetix', 'nessus', 'qualys', 'rapid7', 'tenable', 'greenbone',
  
  // Reconnaissance tools
  'maltego', 'recon-ng', 'theharvester', 'fierce', 'dnsrecon', 'subfinder',
  'amass', 'aquatone', 'httprobe', 'wayback', 'archive.org', 'waybackmachine',
  'cert-transparency', 'crt.sh',
  
  // Security platforms
  'virustotal', 'hybrid-analysis', 'joe', 'falcon', 'crowdstrike', 'fireeye',
  'paloalto', 'checkpoint', 'fortinet', 'sophos', 'symantec', 'mcafee',
  'kaspersky', 'bitdefender', 'avast', 'avg', 'eset', 'trend', 'malwarebytes',
  'cylance', 'sentinelone', 'carbonblack',
  
  // Bots & crawlers
  'googlebot', 'BlackWidow', 'Bot mailto:craftbot@yahoo.com', 'ChinaClaw',
  'Custo', 'DISCo', 'Download Demon', 'eCatch', 'EirGrabber', 'EmailSiphon',
  'EmailWolf', 'Express WebPictures', 'ExtractorPro', 'EyeNetIE', 'FlashGet',
  'GetRight', 'GetWeb!', 'Go!Zilla', 'Go-Ahead-Got-It', 'GrabNet', 'Grafula',
  'HMView', 'HTTrack', 'Image Stripper', 'Image Sucker', 'Indy Library',
  'InterGET', 'Internet Ninja', 'JetCar', 'JOC Web Spider', 'larbin',
  'LeechFTP', 'Mass Downloader', 'MIDown tool', 'Mister PiX', 'Navroad',
  'NearSite', 'NetAnts', 'NetSpider', 'Net Vampire', 'NetZIP', 'Octopus',
  'Offline Explorer', 'Offline Navigator', 'PageGrabber', 'Papa Foto',
  'pavuk', 'pcBrowser', 'RealDownload', 'ReGet', 'SiteSnagger', 'SmartDownload',
  'SuperBot', 'SuperHTTP', 'Surfbot', 'tAkeOut', 'Teleport Pro', 'VoidEYE',
  'Web Image Collector', 'Web Sucker', 'WebAuto', 'WebCopier', 'WebFetch',
  'WebGo IS', 'WebLeacher', 'WebReaper', 'WebSauger', 'Website eXtractor',
  'Website Quester', 'WebStripper', 'WebWhacker', 'WebZIP', 'Widow',
  'WWWOFFLE', 'Xaldon WebSpider', 'Zeus',
  
  // Search engine crawlers
  'bingbot', 'slurp', 'duckduckbot', 'baiduspider', 'yandexbot',
  'facebookexternalhit', 'twitterbot', 'linkedinbot', 'whatsapp', 'telegrambot',
  'applebot', 'ia_archiver',
  
  // Security services
  'safebrowsing', 'phishtank', 'malwaredomainlist', 'surbl', 'uribl',
  'spamhaus', 'barracuda', 'fortiguard', 'websense', 'bluecoat',
  'urlscan.io', 'urlvoid', 'metadefender', 'jotti', 'threatminer',
  'alienvault', 'otx', 'greynoise', 'shadowserver', 'dnsdb', 'passivetotal',
  'riskiq', 'recorded.future', 'cisco.umbrella', 'quad9', 'opendns',
  'cleanbrowsing', 'adguard', 'nextdns',
  
  // Analysis services
  'joesandbox', 'cuckoo', 'malwr', 'anubis', 'threat.grid', 'wildfire',
  'lastline', 'vmray', 'intezer', 'reversing.labs', 'polyswarm',
  'cape.sandbox', 'malware.hunter', 'malware.lu', 'malshare',
  'bazaar.abuse.ch', 'feodotracker', 'sslbl', 'cybercrime-tracker',
  'malc0de', 'vxvault', 'malwaredb', 'kernelmode', 'contagio', 'vicheck',
  'malware-traffic-analysis',
  
  // Categorization services
  'categorization', 'webpulse', 'brightcloud', 'trustwave', 'forcepoint',
  'lightspeed', 'contentkeeper', 'dansguardian', 'squidguard', 'privoxy',
  'adblocker', 'adblock', 'ublock',
  
  // Penetration testing
  'pentest', 'security', 'assessment', 'vulnerability', 'exploit', 'payload',
  'shellcode', 'backdoor', 'trojan', 'malware', 'virus', 'ransomware',
  'spyware', 'adware', 'rootkit', 'botnet', 'keylogger', 'stealer',
  'infostealer', 'rat', 'remote.access', 'command.control', 'c2', 'cnc',
]

// Threat intelligence & analysis platforms
export const BLOCKED_REFERRERS = [
  'any.run', 'app.any.run', 'censys.io', 'shodan.io', 'virustotal.com',
  'hybrid-analysis.com', 'joe.sandbox.com', 'falcon.crowdstrike.com',
  'malwr.com', 'cuckoo.sandbox', 'fireeye.com', 'archive.org',
  'web.archive.org', 'wayback', 'cert-transparency', 'crt.sh',
  'threatminer.org', 'otx.alienvault.com', 'urlvoid.com',
  'malwaredomainlist.com', 'phishtank.com', 'safebrowsing.google.com',
  'smartscreen.microsoft.com', 'google.com', 'paypal.com', 'firefox.com',
  'safebrowsing-cache.google.com',
]

// Check if IP should be blocked
export function isIPBlocked(ip: string): boolean {
  if (!ip || ip === 'Unknown') return false
  return BLOCKED_IP_PATTERNS.some(pattern => pattern.test(ip))
}

// Check if user agent should be blocked (case-insensitive)
export function isUserAgentBlocked(userAgent: string): boolean {
  if (!userAgent) return false
  const ua = userAgent.toLowerCase()
  return BLOCKED_USER_AGENTS.some(blocked => ua.includes(blocked.toLowerCase()))
}

// Check if referrer should be blocked (case-insensitive)
export function isReferrerBlocked(referrer: string): boolean {
  if (!referrer) return false
  const ref = referrer.toLowerCase()
  return BLOCKED_REFERRERS.some(blocked => ref.includes(blocked.toLowerCase()))
}

