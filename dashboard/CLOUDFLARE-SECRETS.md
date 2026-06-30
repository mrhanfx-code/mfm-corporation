# Cloudflare Secrets Configuration

These secrets need to be configured in Cloudflare for the Next.js dashboard to work.

## Required Secrets

Add these secrets to your Cloudflare Worker/Pages project:

### ADMIN_PASSWORD_HASH_B64
```
JDJiJDEwJEk4aGhySWJQMlhNTDFoZVhjYkhmYmU2LzlYL3NaYjJkaEhJZ25RWTdLdE1NbGRrcm8zTXFh
```
This is the base64-encoded bcrypt hash of the admin password.

### AUTH_SECRET
```
9Y5wBy9HWmhOkgo6NbRtLFDHxqKEmk1pmx/JRTY3KQo=
```
This is the NextAuth secret used for session encryption.

### NEXTAUTH_URL
```
https://mfm-corp.cc.cd
```
The URL where the dashboard is deployed.

### AUTH_URL
```
https://mfm-corp.cc.cd
```
Alternative URL for NextAuth (same as NEXTAUTH_URL).

## How to Add Secrets

Using Wrangler CLI:
```bash
wrangler secret put ADMIN_PASSWORD_HASH_B64
# Paste the hash value above

wrangler secret put AUTH_SECRET
# Paste the auth secret value above

wrangler secret put NEXTAUTH_URL
# Paste: https://mfm-corp.cc.cd

wrangler secret put AUTH_URL
# Paste: https://mfm-corp.cc.cd
```

Or add them via the Cloudflare Dashboard:
1. Go to your Worker/Pages project
2. Settings → Variables and Secrets
3. Add each secret with the name and value above

## Login Credentials

- **Username**: `admin`
- **Password**: `F@rihan123`

## Security Notes

- Never commit these secrets to git
- The password hash is bcrypt with 10 salt rounds
- The AUTH_SECRET is a cryptographically secure random 32-byte value
- These secrets are required for the NextAuth authentication system to work
