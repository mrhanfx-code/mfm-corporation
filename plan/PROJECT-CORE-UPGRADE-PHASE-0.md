---
goal: Security Hardening - Convert Secrets to Cloudflare Bindings and Restrict CORS
version: 1.0
date_created: 2026-05-29
last_updated: 2026-05-29
owner: MFM Corporation CTO Office
status: 'Completed'
tags: ['upgrade', 'security', 'cloudflare', 'cors', 'secrets']
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-brightgreen)

This implementation plan outlines the critical security hardening steps for MFM Corporation, focusing on converting exposed secrets to Cloudflare secret bindings and restricting CORS from wildcard to specific origins. This is Phase 0 of the comprehensive implementation plan and must be completed before any other phases can proceed.

## 1. Requirements & Constraints

- **REQ-001**: All secrets must be converted from plaintext to Cloudflare secret bindings
- **REQ-002**: CORS must be restricted from wildcard (*) to specific origins
- **REQ-003**: Configuration must be updated to latest Cloudflare Workers standards
- **REQ-004**: Updated code must be deployed and verified operational
- **SEC-001**: No secrets may remain in plaintext in wrangler.toml
- **SEC-002**: No secrets may remain in plaintext in .env.example
- **SEC-003**: All endpoints must remain operational after deployment
- **CON-001**: Phase must complete within 2 weeks
- **CON-002**: No downtime during deployment
- **GUD-001**: Follow Cloudflare Workers best practices
- **GUD-002**: Use wrangler CLI for secret management
- **PAT-001**: Backup current configuration before changes
- **PAT-002**: Test in staging environment before production

## 2. Implementation Steps

### Implementation Phase 1: Secret Conversion

- GOAL-001: Convert all exposed secrets to Cloudflare secret bindings

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Backup current wrangler.toml configuration | | |
| TASK-002 | Backup current .env.example file | | |
| TASK-003 | Create Cloudflare secret for SENDGRID_API_KEY using wrangler secret put | | |
| TASK-004 | Create Cloudflare secret for TELEGRAM_BOT_TOKEN using wrangler secret put | | |
| TASK-005 | Create Cloudflare secret for WEBHOOK_SECRET using wrangler secret put | | |
| TASK-006 | Remove SENDGRID_API_KEY plaintext value from wrangler.toml | | |
| TASK-007 | Remove TELEGRAM_BOT_TOKEN plaintext value from wrangler.toml | | |
| TASK-008 | Remove WEBHOOK_SECRET plaintext value from wrangler.toml | | |
| TASK-009 | Remove real bot token value from .env.example | | |
| TASK-010 | Replace with placeholder value in .env.example | | |
| TASK-011 | Verify secrets load correctly in local development | | |

### Implementation Phase 2: CORS Restriction

- GOAL-002: Restrict CORS from wildcard to specific origins

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-012 | Identify all CORS configuration locations in codebase | | |
| TASK-013 | Replace wildcard (*) with GitHub Pages origin (https://mrhanfx-code.github.io/mfm-corporation) | | |
| TASK-014 | Add mfm-corp.cc.cd origin (https://mfm-corp.cc.cd) | | |
| TASK-015 | Add localhost origin for development (http://localhost:*) | | |
| TASK-016 | Test CORS configuration with each origin | | |
| TASK-017 | Verify no unauthorized origins can access endpoints | | |

### Implementation Phase 3: Configuration Updates

- GOAL-003: Update configuration to latest Cloudflare Workers standards

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-018 | Update compatibility_date in wrangler.toml to 2025-01-01 | | |
| TASK-019 | Add nodejs_compat flag to wrangler.toml | | |
| TASK-020 | Enable observability traces in wrangler.toml | | |
| TASK-021 | Verify configuration syntax is valid | | |
| TASK-022 | Test configuration in local development environment | | |

### Implementation Phase 4: Deployment and Verification

- GOAL-004: Deploy updated code and verify operational status

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-023 | Deploy telegram-bot-fixed.js to Cloudflare Workers | | |
| TASK-024 | Deploy api/index.js to Cloudflare Workers | | |
| TASK-025 | Verify webhook endpoint is operational | | |
| TASK-026 | Verify API endpoints are operational | | |
| TASK-027 | Test all agent tool integrations | | |
| TASK-028 | Run security audit using wrangler tail | | |
| TASK-029 | Verify no secrets exposed in logs | | |
| TASK-030 | Document security audit results | | |

### Implementation Phase 5: Cascade Security Review

- GOAL-005: Audit Cascade tool parameters for security issues

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-031 | Audit all Cascade tool parameters for sensitive data | | |
| TASK-032 | Add input validation to all Cascade tools | | |
| TASK-033 | Implement rate limiting for Cascade API calls | | |
| TASK-034 | Test Cascade security measures | | |

## 3. Alternatives

- **ALT-001**: Use environment variables instead of Cloudflare secrets. Not chosen because Cloudflare secrets provide better security and are platform-native.
- **ALT-002**: Keep wildcard CORS for development. Not chosen because security risk outweighs convenience.
- **ALT-003**: Use third-party secret management service. Not chosen because Cloudflare secrets are already integrated and cost-effective.

## 4. Dependencies

- **DEP-001**: wrangler CLI must be installed and configured
- **DEP-002**: Cloudflare account must have Workers access
- **DEP-003**: Current wrangler.toml must be backed up before changes
- **DEP-004**: Local development environment must be functional
- **DEP-005**: Test data must be available for endpoint verification

## 5. Files

- **FILE-001**: wrangler.toml (main configuration file)
- **FILE-002**: .env.example (environment example file)
- **FILE-003**: src/telegram-bot-fixed.js (bot worker)
- **FILE-004**: api/index.js (API worker)
- **FILE-005**: src/core/security-manager.js (security configuration)
- **FILE-006**: src/tools/sendgrid-tool.js (SendGrid integration)
- **FILE-007**: src/tools/telegram-tool.js (Telegram integration)

## 6. Testing

- **TEST-001**: Verify SENDGRID_API_KEY loads from Cloudflare secret
- **TEST-002**: Verify TELEGRAM_BOT_TOKEN loads from Cloudflare secret
- **TEST-003**: Verify WEBHOOK_SECRET loads from Cloudflare secret
- **TEST-004**: Verify CORS allows GitHub Pages origin
- **TEST-005**: Verify CORS allows mfm-corp.cc.cd origin
- **TEST-006**: Verify CORS allows localhost for development
- **TEST-007**: Verify CORS blocks unauthorized origins
- **TEST-008**: Verify webhook endpoint operational after deployment
- **TEST-009**: Verify API endpoints operational after deployment
- **TEST-010**: Verify no secrets exposed in logs or error messages

## 7. Risks & Assumptions

- **RISK-001**: Secret conversion may break existing integrations. Mitigation: Test in staging environment first, rollback plan ready.
- **RISK-002**: CORS restriction may break legitimate access. Mitigation: Include all known origins, add monitoring for blocked requests.
- **RISK-003**: Configuration updates may cause deployment issues. Mitigation: Test configuration locally first, have rollback plan.
- **RISK-004**: Deployment may cause downtime. Mitigation: Deploy during low-traffic period, have rollback plan.
- **ASSUMPTION-001**: wrangler CLI is compatible with current Node.js v24.14.0
- **ASSUMPTION-002**: Cloudflare account has sufficient permissions for secret management
- **ASSUMPTION-003**: All origins are known and can be specified in CORS configuration
- **ASSUMPTION-004**: Current configuration is backed up and can be restored if needed

## 8. Related Specifications / Further Reading

- [COMPREHENSIVE-IMPLEMENTATION-PLAN.md](../COMPREHENSIVE-IMPLEMENTATION-PLAN.md)
- [SECURITY-AUDIT-REPORT-2026-05-28.md](../SECURITY-AUDIT-REPORT-2026-05-28.md)
- [resource-binding-guide.md](../resource-binding-guide.md)
- [wrangler-enhanced.toml](../wrangler-enhanced.toml)
