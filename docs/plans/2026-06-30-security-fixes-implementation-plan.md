---
goal: Security Hardening - CORS, JWT Authentication, and Rate Limiting Fixes
version: 1.0
date_created: 2026-06-30
last_updated: 2026-06-30
owner: MFM Corporation Security Team
status: 'Planned'
tags: ['security', 'hardening', 'cors', 'jwt', 'rate-limiting']
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This implementation plan addresses critical and high-severity security vulnerabilities identified in the MFM-Corporation codebase during the OWASP API Security Top 10 audit. The plan focuses on fixing wildcard CORS policies, implementing JWT-based authentication, and correcting rate limiting behavior.

## 1. Requirements & Constraints

- **REQ-001**: Replace wildcard CORS policy with specific allowed origins
- **REQ-002**: Implement JWT-based authentication with token expiration
- **REQ-003**: Change rate limiting to fail closed on errors
- **REQ-004**: Apply rate limiting after authentication checks
- **SEC-001**: All changes must maintain backward compatibility with existing authorized users
- **SEC-002**: JWT tokens must have short expiration (15-30 minutes) with refresh mechanism
- **SEC-003**: Security headers must be added to all responses
- **CON-001**: Changes must not break existing Telegram bot functionality
- **CON-002**: Dashboard API must remain functional during transition
- **GUD-001**: Follow existing code patterns and conventions in the codebase
- **PAT-001**: Use Cloudflare Workers KV for JWT token storage and validation

## 2. Implementation Steps

### Implementation Phase 1: CORS Policy Fix

- GOAL-001: Replace wildcard CORS with specific allowed origins

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Update `src/telegram-bot-agent.js` CORS headers to use specific origin `https://mfm-corp.cc.cd` instead of `*` | | |
| TASK-002 | Update `src/dashboard/dashboard-worker.js` CORS headers to use specific origin `https://mfm-corp.cc.cd` instead of `*` | | |
| TASK-003 | Add environment variable `DASHBOARD_ORIGIN` to wrangler.toml [vars] section | | |
| TASK-004 | Test CORS policy with curl to verify origin restriction works | | |

### Implementation Phase 2: JWT Authentication Implementation

- GOAL-002: Implement JWT-based authentication with token expiration and refresh mechanism

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-005 | Install `jsonwebtoken` package via npm | | |
| TASK-006 | Create `src/core/jwt-auth.js` with token generation, validation, and refresh functions | | |
| TASK-007 | Add JWT secret to Cloudflare Workers secrets (`wrangler secret put JWT_SECRET`) | | |
| TASK-008 | Update `src/dashboard/dashboard-worker.js` to use JWT validation instead of simple token comparison | | |
| TASK-009 | Implement token expiration check (15-30 minutes) in JWT validation | | |
| TASK-010 | Implement refresh token mechanism with 24-hour expiration | | |
| TASK-011 | Add JWT token blacklist to KV for logout functionality | | |
| TASK-012 | Update authentication error messages to be generic (no token leakage) | | |

### Implementation Phase 3: Rate Limiting Fixes

- GOAL-003: Change rate limiting to fail closed on errors and apply after authentication

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-013 | Update `src/dashboard/dashboard-worker.js` rate limiting to return 429 on KV errors instead of failing open | | |
| TASK-014 | Move rate limiting check in `src/telegram-bot-agent.js` to occur after user authentication | | |
| TASK-015 | Add per-user rate limiting based on authenticated user ID instead of IP address | | |
| TASK-016 | Test rate limiting behavior with KV service disabled to verify fail-closed behavior | | |

### Implementation Phase 4: Security Headers

- GOAL-004: Add security headers to all responses

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-017 | Add `Strict-Transport-Security: max-age=31536000; includeSubDomains` header to all responses | | |
| TASK-018 | Add `X-Content-Type-Options: nosniff` header to all responses | | |
| TASK-019 | Add `X-Frame-Options: DENY` header to all responses | | |
| TASK-020 | Add `Content-Security-Policy` header with appropriate directives | | |
| TASK-021 | Test security headers with curl to verify they are present | | |

### Implementation Phase 5: Testing and Verification

- GOAL-005: Verify all security fixes work correctly

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-022 | Test CORS policy with unauthorized origins to verify rejection | | |
| TASK-023 | Test JWT authentication with expired tokens to verify rejection | | |
| TASK-024 | Test JWT refresh mechanism to verify new token generation | | |
| TASK-025 | Test rate limiting with valid credentials to verify it works | | |
| TASK-026 | Test rate limiting with invalid credentials to verify it's not bypassed | | |
| TASK-027 | Perform end-to-end test of Telegram bot with all changes | | |
| TASK-028 | Perform end-to-end test of Dashboard API with all changes | | |

## 3. Alternatives

- **ALT-001**: Use Cloudflare Workers built-in authentication instead of custom JWT - Not chosen due to need for custom refresh token logic and user-specific claims
- **ALT-002**: Use API keys instead of JWT - Not chosen due to lack of built-in expiration and refresh mechanism
- **ALT-003**: Keep wildcard CORS but add origin validation in application logic - Not chosen as header-level restriction is more secure and follows best practices

## 4. Dependencies

- **DEP-001**: `jsonwebtoken` npm package for JWT token generation and validation
- **DEP-002**: Cloudflare Workers KV for JWT token blacklist storage
- **DEP-003**: Cloudflare Workers secrets for JWT_SECRET
- **DEP-004**: Existing KV infrastructure for rate limiting

## 5. Files

- **FILE-001**: `src/telegram-bot-agent.js` - CORS headers and rate limiting order
- **FILE-002**: `src/dashboard/dashboard-worker.js` - CORS headers, JWT authentication, rate limiting fail-closed
- **FILE-003**: `src/core/jwt-auth.js` - New file for JWT authentication logic
- **FILE-004**: `wrangler.toml` - Add DASHBOARD_ORIGIN environment variable
- **FILE-005**: `package.json` - Add jsonwebtoken dependency

## 6. Testing

- **TEST-001**: Verify CORS rejects requests from unauthorized origins
- **TEST-002**: Verify JWT rejects expired tokens
- **TEST-003**: Verify JWT refresh mechanism generates valid new tokens
- **TEST-004**: Verify rate limiting fails closed when KV is unavailable
- **TEST-005**: Verify rate limiting applies after authentication
- **TEST-006**: Verify security headers are present on all responses
- **TEST-007**: Verify existing authorized users can still authenticate
- **TEST-008**: Verify Telegram bot continues to function normally

## 7. Risks & Assumptions

- **RISK-001**: JWT implementation may break existing dashboard API clients - Mitigation: Implement gradual rollout with backward compatibility period
- **RISK-002**: Rate limiting fail-closed may block legitimate users during KV outages - Mitigation: Implement exponential backoff and user-friendly error messages
- **RISK-003**: CORS origin restriction may break legitimate integrations - Mitigation: Maintain list of allowed origins and provide process for adding new ones
- **ASSUMPTION-001**: Cloudflare Workers KV has sufficient capacity for JWT token blacklist
- **ASSUMPTION-002**: Existing authorized users have valid credentials to generate new JWT tokens
- **ASSUMPTION-003**: Dashboard API clients can be updated to use JWT authentication

## 8. Related Specifications / Further Reading

- [OWASP API Security Top 10 (2023)](https://owasp.org/www-project-api-security/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Cloudflare Workers Security Best Practices](https://developers.cloudflare.com/workers/security/)
- [Previous Security Audit Report](../AUDIT-REPORT.md)
