# Network Restrictions Configuration

This document explains how to configure VPN, Proxy, and DataCenter access controls.

## Environment Variables

Add these to your `.env.local` file:

```bash
# VPN Control: 1 = allow, 0 = block (default: block)
ALLOW_VPN=0

# Proxy Control: 1 = allow, 0 = block (default: block)
ALLOW_PROXY=0

# DataCenter Control: 1 = allow, 0 = block (default: block)
ALLOW_DATACENTER=0
```

## Configuration Values

### VPN Control
- `ALLOW_VPN=1` or `ALLOW_VPN=true` - Allow VPN connections
- `ALLOW_VPN=0` or `ALLOW_VPN=false` - Block VPN connections (default)

### Proxy Control
- `ALLOW_PROXY=1` or `ALLOW_PROXY=true` - Allow proxy connections
- `ALLOW_PROXY=0` or `ALLOW_PROXY=false` - Block proxy connections (default)

### DataCenter Control
- `ALLOW_DATACENTER=1` or `ALLOW_DATACENTER=true` - Allow datacenter IPs
- `ALLOW_DATACENTER=0` or `ALLOW_DATACENTER=false` - Block datacenter IPs (default)

## Always Blocked (Cannot Be Disabled)

The following are **always blocked** regardless of settings:

1. **Known Abusers** - IPs in the blocklist (always blocked)
2. **Known Crawlers** - Bots, spiders, scrapers (always blocked)

These cannot be disabled for security reasons.

## Examples

### Allow VPN, Block Proxy and DataCenter
```bash
ALLOW_VPN=1
ALLOW_PROXY=0
ALLOW_DATACENTER=0
```

### Allow All Network Types (Not Recommended)
```bash
ALLOW_VPN=1
ALLOW_PROXY=1
ALLOW_DATACENTER=1
```

### Block Everything (Maximum Security - Default)
```bash
ALLOW_VPN=0
ALLOW_PROXY=0
ALLOW_DATACENTER=0
```

## How It Works

1. **IP Detection**: The system detects if an IP is from a VPN, Proxy, or DataCenter
2. **Configuration Check**: Checks your environment variables
3. **Abuser/Crawler Check**: Always blocks known abusers and crawlers
4. **Action**: Blocks or allows based on configuration

## Detection Methods

### VPN Detection
- ASN (Autonomous System Number) matching
- Known VPN provider IP ranges
- In production, use IP intelligence APIs (ipapi.co, maxmind.com)

### Proxy Detection
- ASN matching for proxy providers
- Known proxy IP ranges
- In production, use IP intelligence APIs

### DataCenter Detection
- Known datacenter IP ranges (AWS, Google Cloud, Azure, Cloudflare)
- CIDR range matching

## Production Recommendations

For production, integrate with IP intelligence services:

1. **ipapi.co** - Free tier available
2. **maxmind.com** - GeoIP2 database
3. **abuseipdb.com** - Abuse detection
4. **ip-api.com** - Free tier available

Example integration:

```typescript
// lib/networkRestrictions.ts

async function checkIPIntelligence(ip: string) {
  const response = await fetch(`https://ipapi.co/${ip}/json/`)
  const data = await response.json()
  
  return {
    isVPN: data.vpn === true,
    isProxy: data.proxy === true,
    isDatacenter: data.type === 'hosting',
    asn: data.asn,
  }
}
```

## Security Considerations

1. **Default to Block**: All network types are blocked by default
2. **Always Block Abusers**: Known abusers are always blocked
3. **Always Block Crawlers**: Known crawlers are always blocked
4. **Logging**: All blocks are logged for security monitoring

## Testing

To test network restrictions:

1. Set environment variables
2. Restart the dev server
3. Visit the site from different network types
4. Check server logs for blocking messages

## Logging

When a request is blocked, you'll see:

```
🚫 [Bot Filter POST] Network restriction blocked: VPN detected (VPN not allowed)
```

Or:

```
🚫 [Bot Filter POST] Network restriction blocked: Known abuser (always blocked)
```

## Related Files

- `lib/networkRestrictions.ts` - Main configuration and detection logic
- `app/api/bot-filter/route.ts` - Integration with bot filter
- `lib/ipBlocklist.ts` - Abuser and crawler blocklist




