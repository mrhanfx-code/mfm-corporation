# Security Fixes Implementation Guide

This guide provides step-by-step instructions for implementing the security fixes identified in the audit report.

## Overview

The following security vulnerabilities need to be addressed:
1. Wildcard CORS policy (High)
2. Simple token authentication (High)
3. Rate limiting fails open (Medium)
4. Rate limiting before authentication (Medium)

## Prerequisites

- Access to the MFM-Corporation GitHub repository
- Cloudflare Workers CLI (wrangler) installed
- Node.js 18+ installed

## Step 1: Install JWT Dependencies

```bash
npm install jsonwebtoken
```

## Step 2: Add Environment Variables

### Update wrangler.toml

Add to the `[vars]` section:

```toml
[vars]
DASHBOARD_ORIGIN = "https://mfm-corp.cc.cd"
# ... existing vars
```

### Set JWT Secret

```bash
wrangler secret put JWT_SECRET
# Generate a strong secret and paste it when prompted
```

## Step 3: Update CORS Headers

### Update src/telegram-bot-agent.js

Replace the wildcard CORS policy:

```javascript
// OLD (Line ~25)
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

// NEW
const cors = {
  'Access-Control-Allow-Origin': env.DASHBOARD_ORIGIN || 'https://mfm-corp.cc.cd',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};
```

### Update src/dashboard/dashboard-worker.js

Replace the wildcard CORS policy in the same way.

## Step 4: Implement JWT Authentication

### Import JWT Auth Module

Add to the top of `src/dashboard/dashboard-worker.js`:

```javascript
import { validateToken, generateAccessToken, revokeToken } from '../core/jwt-auth.js';
```

### Replace Simple Token Check

Find the token validation code (around line 30-40) and replace:

```javascript
// OLD
if (token !== env.DASHBOARD_SECRET) {
  console.error('[Dashboard] Invalid token provided');
  return null;
}

// NEW
const payload = await validateToken(token, env);
if (!payload) {
  console.error('[Dashboard] Invalid or expired token');
  return null;
}
```

### Add Token Generation Endpoint

Add a new endpoint for token generation:

```javascript
if (url.pathname === '/api/v1/auth/login') {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: cors });
  
  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Bad Request' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
  
  if (!body?.userId) {
    return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
  
  // Verify user is authorized
  const authorizedIds = (env.AUTHORIZED_USER_IDS || '').split(',').map(s => s.trim());
  if (!authorizedIds.includes(String(body.userId))) {
    return new Response(JSON.stringify({ error: 'Unauthorized user' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
  
  try {
    const accessToken = await generateAccessToken(body.userId, env);
    return new Response(JSON.stringify({ accessToken, expiresIn: 900 }), { 
      status: 200, 
      headers: { ...cors, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Token generation failed' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
}
```

## Step 5: Fix Rate Limiting

### Change to Fail Closed

In `src/dashboard/dashboard-worker.js`, find the rate limiting check (around line 60-70) and change:

```javascript
// OLD
} catch (error) {
  console.error('[Dashboard] Rate limit check failed:', error);
  // Fail open on rate limit errors
  return true;
}

// NEW
} catch (error) {
  console.error('[Dashboard] Rate limit check failed:', error);
  // Fail closed on rate limit errors
  return false;
}
```

### Move Rate Limiting After Authentication

In `src/telegram-bot-agent.js`, move the rate limiting check to occur after user authorization:

```javascript
// OLD (rate limiting before auth)
if (env.KV) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const now = Math.floor(Date.now() / 60000);
  const rateKey = `ask_rate:${ip}:${now}`;
  const hits = parseInt(await env.KV.get(rateKey) || '0');
  if (hits >= 20) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 });
  }
}

// ... authorization check ...

// NEW (rate limiting after auth)
// ... authorization check first ...

// Then rate limit based on user ID
if (env.KV) {
  const now = Math.floor(Date.now() / 60000);
  const userRateKey = `msg_rate:${userId}:${now}`;
  const userHits = parseInt(await env.KV.get(userRateKey) || '0');
  if (userHits >= 30) {
    await sendTelegramMessage(chatId, '⏳ Rate limit: max 30 messages/minute. Please slow down.', env);
    return new Response('OK');
  }
  await env.KV.put(userRateKey, String(userHits + 1), { expirationTtl: 120 });
}
```

## Step 6: Add Security Headers

Add security headers to the CORS object in both files:

```javascript
const cors = {
  'Access-Control-Allow-Origin': env.DASHBOARD_ORIGIN || 'https://mfm-corp.cc.cd',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
  // Security headers
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
};
```

## Step 7: Update package.json

Add jsonwebtoken to dependencies:

```bash
npm install jsonwebtoken
```

## Step 8: Deploy and Test

### Deploy Changes

```bash
wrangler deploy
```

### Test CORS Policy

```bash
curl -H "Origin: https://evil.com" https://mfm-corp.cc.cd/health
# Should not include Access-Control-Allow-Origin header
```

### Test JWT Authentication

```bash
# Get token
curl -X POST https://mfm-corp.cc.cd/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_USER_ID"}'

# Use token
curl https://mfm-corp.cc.cd/api/v1/dashboard/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Rate Limiting

```bash
# Make 21 requests quickly
for i in {1..21}; do
  curl https://mfm-corp.cc.cd/api/v1/dashboard/status \
    -H "Authorization: Bearer YOUR_TOKEN"
done
# Should get 429 on 21st request
```

## Verification Checklist

- [ ] CORS policy rejects unauthorized origins
- [ ] JWT authentication works with valid tokens
- [ ] JWT authentication rejects expired tokens
- [ ] Rate limiting fails closed when KV is unavailable
- [ ] Rate limiting applies after authentication
- [ ] Security headers are present on all responses
- [ ] Existing authorized users can still authenticate
- [ ] Telegram bot continues to function normally

## Rollback Plan

If issues arise, rollback by:

```bash
git revert <commit-hash>
wrangler deploy
```

## Next Steps

After implementing these fixes:
1. Run the security audit again to verify fixes
2. Update the audit report with new findings
3. Document any additional issues discovered
