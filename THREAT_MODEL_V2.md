# Threat Model v2 - Enhanced Security Analysis

## Overview

This document outlines the comprehensive threat model for the secure document access system, including recent enhancements for replay attack prevention, anomaly detection, and token binding.

## High Protection ✅

### Automated Bots & Scanners
- **Protection**: Multi-layered detection (fingerprinting, CAPTCHA, IP bans)
- **Mechanisms**:
  - Cloudflare Bot Management integration
  - Browser fingerprinting with entropy analysis
  - Header order anomaly detection
  - Security tool pattern matching
  - Progressive confidence scoring

### Email Security Scanners
- **Protection**: 302 redirect to safe sites
- **Detection**: User-Agent patterns, security headers (Proofpoint, Mimecast, etc.)
- **Response**: Silent redirect to legitimate sites

### Replay Attacks
- **Protection**: Request deduplication + request ID validation
- **Mechanisms**:
  - Request signature caching (60s TTL)
  - Explicit request ID tracking
  - Duplicate detection adds +40 confidence
- **Status**: ✅ Implemented

### Token Theft
- **Protection**: Token binding to fingerprint + IP
- **Mechanisms**:
  - Optional fingerprint binding in tokens
  - IP binding with tolerance for mobile/VPN
  - Strict/lenient validation modes
- **Status**: ✅ Implemented

### Session Hijacking
- **Protection**: Short-lived + signed sessions
- **Mechanisms**: HMAC signatures, expiration checks

### Headless Browsers
- **Protection**: Multi-point detection
- **Indicators**: Screen dimensions, plugin counts, fingerprint entropy

## Moderate Protection ⚠️

### Token Enumeration
- **Protection**: Rate limiting per IP/fingerprint
- **Status**: ⚠️ Needs implementation (recommend Upstash Rate Limit)
- **Risk**: Attacker tries multiple token values systematically

### Distributed Attacks (DDoS)
- **Protection**: Individual IP bans + Cloudflare
- **Status**: ⚠️ Limited - needs Cloudflare rate limiting
- **Risk**: Multiple IPs overwhelming filter endpoint

### Determined Attackers with Valid Tokens
- **Protection**: Rate limiting + anomaly detection
- **Mechanisms**:
  - Behavior tracking (request rate, failure rate)
  - Fingerprint change detection
  - Geographic hopping detection
- **Status**: ✅ Anomaly detection implemented

### CSRF Attacks
- **Protection**: Origin/Referer validation
- **Status**: ⚠️ Basic protection - could add CSRF tokens
- **Risk**: Attacker tricks user into making unwanted requests

### Credential Stuffing
- **Protection**: CAPTCHA + rate limiting
- **Status**: ⚠️ Partially protected
- **Enhancement**: Could integrate HaveIBeenPwned API

## Limited/No Protection ❌

### Man-in-the-Middle (MITM)
- **Status**: ❌ Requires HTTPS (infrastructure level)
- **Mitigation**: Ensure TLS/SSL properly configured

### Social Engineering
- **Status**: ❌ User training required
- **Mitigation**: User education, email verification

### Compromised Email Accounts
- **Status**: ❌ Out of scope
- **Note**: If attacker has email access, they can generate tokens

### Phishing/Fake Domains
- **Status**: ❌ Not protected
- **Risk**: Attacker clones page, hosts on their domain
- **Mitigation**: 
  - CSP headers (✅ Implemented)
  - User education
  - Email authentication

### Zero-Day Browser Exploits
- **Status**: ❌ Vendor responsibility
- **Note**: Keep browsers updated

### Physical Access to User Devices
- **Status**: ❌ Out of scope
- **Note**: If device is compromised, all bets are off

### Legal/Subpoena Requests
- **Status**: ❌ Compliance required
- **Note**: Legal obligations override security measures

## Monitoring & Detection 🔍

### Security Event Logging
- **Status**: ✅ Implemented
- **Events Tracked**:
  - `bot_detected` - Bot detection with confidence scoring
  - `token_invalid` - Invalid token attempts
  - `rate_limit` - Rate limiting triggers
  - `anomaly` - Suspicious behavior patterns
  - `replay_attack` - Duplicate request detection
  - `honeypot_triggered` - Honeypot field interactions
  - `ip_banned` - IP ban events
  - `suspicious_behavior` - Behavior anomalies

### Behavior Tracking
- **Metrics**:
  - Request rate (requests per minute)
  - Failure rate (failed attempts ratio)
  - Fingerprint changes (evasion attempts)
  - Geographic hops (VPN/proxy abuse)
- **Status**: ✅ Implemented

### Anomaly Scoring
- **Triggers**:
  - High request rate (> 10/min): +20 confidence
  - High failure rate (> 50%): +30 confidence
  - Frequent fingerprint changes (> 3): +25 confidence
  - Geographic hopping (> 2): +20 confidence
- **Status**: ✅ Implemented

## Security Enhancements Implemented

### 1. Request Deduplication ✅
- **File**: `lib/requestDeduplication.ts`
- **Features**:
  - Request signature generation
  - 60-second cache TTL
  - Automatic cleanup
  - Request ID validation

### 2. Anomaly Detection ✅
- **File**: `lib/anomalyDetection.ts`
- **Features**:
  - Behavior tracking per IP+fingerprint
  - Anomaly score calculation
  - Pattern detection (rate, failures, fingerprint changes, geo hops)

### 3. Security Monitoring ✅
- **File**: `lib/securityMonitoring.ts`
- **Features**:
  - Event logging with severity levels
  - Event statistics
  - Critical event alerting
  - Development mode logging

### 4. Token Binding ✅
- **File**: `lib/tokens.ts`
- **Features**:
  - Optional fingerprint binding
  - Optional IP binding
  - Strict/lenient validation modes
  - Backward compatible

### 5. Response Timing Consistency ✅
- **Implementation**: Random 50-100ms delays
- **Purpose**: Prevent timing attacks
- **Applied**: All bot filter responses

### 6. CSP Headers ✅
- **Implementation**: Content Security Policy headers
- **Coverage**: Bot filter API responses
- **Includes**: CAPTCHA providers (Turnstile, PrivateCaptcha)

## Recommendations for Future Enhancements

### High Priority
1. **Rate Limiting**: Implement Upstash Rate Limit for token enumeration protection
2. **Token Binding**: Update token generation to include fingerprint/IP when available
3. **Monitoring Dashboard**: Visualize security events and patterns

### Medium Priority
1. **HaveIBeenPwned Integration**: Check credentials against breach database
2. **CSRF Tokens**: Add explicit CSRF token validation
3. **IP Subnet Analysis**: Better IP binding tolerance for mobile networks

### Low Priority
1. **Fingerprint Similarity**: Enhanced fingerprint matching (not just exact)
2. **ASN Analysis**: Track Autonomous System Numbers for patterns
3. **Machine Learning**: Anomaly detection with ML models

## Testing Checklist

- [ ] Test replay attack prevention
- [ ] Test token binding validation
- [ ] Test anomaly detection triggers
- [ ] Test security event logging
- [ ] Test behavior tracking accuracy
- [ ] Test false positive rates
- [ ] Test with real security tools
- [ ] Load testing for DDoS resilience

## Security Event Severity Levels

- **Low**: Minor anomalies, lenient warnings
- **Medium**: Suspicious patterns, increased monitoring
- **High**: Strong bot indicators, potential bans
- **Critical**: Definite bot/attack, immediate action required

## Threat Model Refinement: Critical Questions

### 1. Value of a Compromised Token

**What damage can one valid token do?**

#### Token Capabilities
- **Access Granted**: Single-use session creation (15-minute TTL)
- **Scope**: Access to one specific document/email combination
- **Time Window**: Token valid for 30 minutes (default, configurable)
- **Binding**: Optional fingerprint/IP binding limits reuse

#### Attack Scenarios & Impact

**Scenario A: Token Theft via URL Extraction**
- **Risk**: Medium-High
- **Impact**: 
  - Attacker can access the specific document associated with the token
  - Limited to single use (token consumed after verification)
  - Time-limited (expires in 30 minutes)
- **Mitigation**: ✅ Token binding (fingerprint/IP) prevents reuse from different device/IP
- **Damage Assessment**: 
  - **Low**: If token binding enabled - attacker needs same device/IP
  - **Medium**: If token binding disabled - attacker can use from any device
  - **High**: If token contains sensitive document ID - document exposed

**Scenario B: Token Replay Attack**
- **Risk**: Low
- **Impact**: Minimal - tokens are single-use (consumed after first verification)
- **Mitigation**: ✅ Request deduplication prevents replay
- **Damage Assessment**: **Low** - Already mitigated

**Scenario C: Token Enumeration**
- **Risk**: Medium
- **Impact**: 
  - Attacker systematically tries token values
  - Could discover valid tokens if pattern is predictable
- **Mitigation**: ⚠️ Rate limiting needed (not yet implemented)
- **Damage Assessment**: **Medium** - Depends on token entropy and rate limiting

**Scenario D: Compromised Token + Session Hijacking**
- **Risk**: High
- **Impact**: 
  - Attacker uses token to create session
  - Then hijacks session to access document
- **Mitigation**: ✅ Session IP/UA binding prevents hijacking
- **Damage Assessment**: **Medium-High** - Limited by session binding

#### Token Value Matrix

| Token Type | Binding | Single-Use | Expiration | Value |
|------------|---------|------------|------------|-------|
| Standard | None | ✅ Yes | 30 min | **Medium** |
| Bound (FP+IP) | ✅ Yes | ✅ Yes | 30 min | **Low** |
| Long-lived | None | ✅ Yes | 60+ min | **High** |
| Bound + Short | ✅ Yes | ✅ Yes | 15 min | **Very Low** |

**Recommendation**: 
- Use fingerprint/IP binding for high-value documents
- Keep token expiration short (15-30 minutes)
- Implement token revocation mechanism (⚠️ Not yet implemented)

---

### 2. Acceptable False Positive Rate

**How many real users can you afford to block?**

#### Current False Positive Sources

1. **Bot Detection Confidence Scoring**
   - Threshold: 70% confidence triggers redirect
   - Risk: Legitimate users with unusual fingerprints
   - Current mitigation: CAPTCHA verification reduces confidence by 40

2. **IP Blocklist**
   - Risk: Legitimate users from blocked IP ranges
   - Current mitigation: Development mode whitelist for localhost

3. **Fingerprint Binding**
   - Risk: Browser updates change fingerprint
   - Current mitigation: Lenient mode allows fingerprint changes

4. **Anomaly Detection**
   - Risk: High request rate from legitimate power users
   - Current mitigation: Behavior tracking with tolerance

#### Recommended False Positive Targets

| User Type | Acceptable FP Rate | Current Risk | Mitigation |
|-----------|-------------------|--------------|------------|
| **Standard Users** | < 0.1% (1 in 1000) | Low | CAPTCHA verification bypass |
| **Power Users** | < 0.5% (1 in 200) | Medium | Anomaly detection tuning |
| **VPN Users** | < 1% (1 in 100) | Medium-High | IP binding leniency |
| **Mobile Users** | < 0.2% (1 in 500) | Low | Fingerprint leniency |
| **Corporate Networks** | < 0.1% (1 in 1000) | Low | IP range whitelisting |

#### False Positive Monitoring

**Metrics to Track**:
- Bot detection confidence distribution
- CAPTCHA verification success rate
- IP blocklist false positives
- Anomaly detection false positives
- User complaints/support tickets

**Alerting Thresholds**:
- **Critical**: FP rate > 1% for any user segment
- **High**: FP rate > 0.5% for standard users
- **Medium**: FP rate > 0.2% for power users

**Recommendation**:
- Implement user feedback mechanism (⚠️ Not yet implemented)
- Track false positive patterns
- Adjust confidence thresholds based on real-world data
- Maintain whitelist for known legitimate patterns

---

### 3. Attack Surface

**Public internet? Behind VPN? Geographic restrictions?**

#### Current Attack Surface

**Public Internet Access**: ✅ Yes
- System is publicly accessible
- No VPN requirement
- No geographic restrictions
- **Risk**: High - accessible to anyone

**Entry Points**:
1. **Token Links** (`/t/[token]` or `/?token=...`)
   - Publicly accessible
   - Token required for access
   - **Risk**: Medium - token provides access

2. **Bot Filter Endpoint** (`/api/bot-filter`)
   - Publicly accessible
   - No authentication required
   - **Risk**: High - can be probed/attacked

3. **CAPTCHA Verification** (`/api/verify-captcha`)
   - Publicly accessible
   - Requires valid token
   - **Risk**: Medium - protected by token

4. **Session Management** (`/api/verify-access`)
   - Publicly accessible
   - Requires token + CAPTCHA
   - **Risk**: Low - multi-factor protection

#### Attack Surface Analysis

| Component | Public | Auth Required | Protection | Risk Level |
|-----------|--------|---------------|------------|------------|
| Token Links | ✅ Yes | Token | Token validation | **Medium** |
| Bot Filter | ✅ Yes | None | Bot detection | **High** |
| CAPTCHA Verify | ✅ Yes | Token | Token + CAPTCHA | **Medium** |
| Session Create | ✅ Yes | Token + CAPTCHA | Multi-factor | **Low** |
| Document Access | ✅ Yes | Session | Session validation | **Low** |

#### Geographic Considerations

**Current State**: No geographic restrictions
- **Risk**: Attackers from any country can access
- **Mitigation**: IP blocklist includes known scanner ranges
- **Recommendation**: 
  - Consider geographic restrictions for high-value documents
  - Implement country-based rate limiting
  - Monitor unusual geographic patterns

#### Network Considerations

**VPN/Proxy Access**: ✅ Allowed
- **Risk**: Attackers can hide behind VPNs
- **Mitigation**: Fingerprint binding helps identify users
- **Recommendation**: 
  - Monitor VPN/proxy usage patterns
  - Consider VPN detection and additional verification

**Corporate Networks**: ✅ Allowed
- **Risk**: Email security scanners trigger redirects
- **Mitigation**: ✅ Email scanner detection and safe redirects
- **Status**: Working as designed

#### Attack Surface Reduction Recommendations

**High Priority**:
1. **Rate Limiting**: Implement on all public endpoints
2. **Geographic Restrictions**: Optional for high-value documents
3. **VPN Detection**: Additional verification for VPN users

**Medium Priority**:
1. **IP Reputation**: Integrate with IP reputation services
2. **ASN Analysis**: Track Autonomous System Numbers
3. **Country-Based Rules**: Different rules per country

**Low Priority**:
1. **VPN Whitelist**: Allow known legitimate VPNs
2. **Corporate Network Detection**: Special handling for corporate IPs
3. **Time-Based Restrictions**: Limit access to business hours

---

### 4. Incident Response Plan

**What happens when you detect a breach?**

#### Current Detection Capabilities

**Security Events Tracked**:
- ✅ `bot_detected` - Bot detection with confidence
- ✅ `token_invalid` - Invalid token attempts
- ✅ `replay_attack` - Replay attack detection
- ✅ `anomaly` - Suspicious behavior patterns
- ✅ `ip_banned` - IP ban events
- ✅ `token_invalid` - Token validation failures

**Monitoring**: ✅ Console logging (development)
- ⚠️ **Gap**: No centralized logging/alerting system
- ⚠️ **Gap**: No automated incident response

#### Incident Response Workflow

**Phase 1: Detection** (Current: ✅ Automated)
1. Security event logged via `logSecurityEvent()`
2. Event includes: type, IP, fingerprint, severity, details
3. **Gap**: No real-time alerting

**Phase 2: Assessment** (Current: ⚠️ Manual)
1. Review security event logs
2. Determine severity (Low/Medium/High/Critical)
3. **Gap**: No automated severity assessment

**Phase 3: Containment** (Current: ✅ Partial)
1. **IP Blocking**: ✅ Automatic via `banIP()`
2. **Token Revocation**: ❌ Not implemented
3. **Session Invalidation**: ✅ Automatic (sessions expire)
4. **Rate Limiting**: ⚠️ Not implemented

**Phase 4: Eradication** (Current: ⚠️ Manual)
1. Identify attack vector
2. Patch vulnerability
3. **Gap**: No automated patching

**Phase 5: Recovery** (Current: ⚠️ Manual)
1. Restore normal operations
2. Monitor for recurrence
3. **Gap**: No automated recovery

**Phase 6: Post-Incident** (Current: ❌ Not implemented)
1. Document incident
2. Update threat model
3. Improve detection/prevention

#### Recommended Incident Response Plan

**Immediate Actions** (Automated):
1. **Critical Events** (confidence > 90):
   - ✅ Immediate IP ban
   - ✅ Log security event
   - ⚠️ Send alert to security team (not implemented)
   - ⚠️ Revoke related tokens (not implemented)

2. **High Events** (confidence 70-90):
   - ✅ IP ban after 3 occurrences
   - ✅ Log security event
   - ⚠️ Send alert to security team (not implemented)

3. **Medium Events** (confidence 50-70):
   - ✅ Log security event
   - ✅ Increase monitoring
   - ⚠️ Alert if pattern detected (not implemented)

**Short-Term Actions** (Within 1 hour):
1. Review security event logs
2. Identify attack patterns
3. Update IP blocklist if needed
4. Revoke compromised tokens (⚠️ Manual process)

**Long-Term Actions** (Within 24 hours):
1. Document incident
2. Update threat model
3. Improve detection rules
4. Test incident response procedures

#### Incident Response Checklist

**Detection**:
- [x] Automated security event logging
- [ ] Real-time alerting system
- [ ] Security dashboard
- [ ] Anomaly detection alerts

**Containment**:
- [x] Automatic IP blocking
- [x] Session expiration
- [ ] Token revocation mechanism
- [ ] Rate limiting
- [ ] Geographic blocking

**Recovery**:
- [ ] Incident documentation template
- [ ] Post-incident review process
- [ ] Threat model updates
- [ ] Security improvement tracking

#### Recommended Tools

**High Priority**:
1. **SIEM Integration**: Send events to Splunk/ELK/Datadog
2. **Alerting**: PagerDuty/Slack for critical events
3. **Token Revocation**: Redis-based revocation list
4. **Rate Limiting**: Upstash Rate Limit

**Medium Priority**:
1. **Security Dashboard**: Visualize security events
2. **Incident Management**: Jira/ServiceNow integration
3. **Forensics**: Log retention and analysis

**Low Priority**:
1. **ML-Based Detection**: Anomaly detection with ML
2. **Threat Intelligence**: Integrate threat feeds
3. **Automated Response**: Auto-block known bad actors

---

## Notes

- All security features are backward compatible
- Development mode allows testing without blocking
- Production mode enforces all security measures
- Monitoring helps identify false positives for tuning
- **Incident response requires manual intervention** - automation recommended
- **Token revocation not yet implemented** - high priority enhancement
- **Rate limiting not yet implemented** - high priority enhancement

