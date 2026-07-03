---
type: fix
origin: none
status: ready
---

# Cloudflare Workers Deployment Fix

## Problem

Architecture mismatch causing deployment failure:
- Code uses `@opennextjs/cloudflare` adapter (designed for Cloudflare Workers)
- Currently deployed to Cloudflare Pages (static site hosting)
- OpenNext generates `.open-next/worker.js` (Worker executable)
- Pages cannot execute Workers - serves static files only
- Result: Build succeeds but assets return 404 errors

## Solution

Deploy to Cloudflare Workers using official OpenNext deployment method.

## Implementation Units

### U0: Pre-Migration Preparation
**Goal:** Prepare for safe migration with backup and documentation
**Files:** Cloudflare dashboard, docs/architecture/
**Approach:** 
- Document current Pages deployment performance metrics
- Validate secret format compatibility between Pages and Workers
- Create ADR-001: Cloudflare Workers vs Pages for Next.js
- Backup current Pages deployment configuration
**Test scenarios:** Performance metrics documented, ADR created, backup completed
**Verification:** Check docs/architecture/ for ADR, verify backup exists

### U1: Local Environment Setup
**Goal:** Configure local environment variables required for build
**Files:** `dashboard/.env`
**Approach:** Add WORKERS_API_URL and WORKERS_API_SECRET to local .env file
**Test scenarios:** Build succeeds without environment variable errors
**Verification:** Run `npm run build` to confirm no missing environment variable errors

### U2: Deploy to Cloudflare Workers
**Goal:** Deploy application to correct target (Workers instead of Pages)
**Files:** `dashboard/wrangler.toml` (already configured)
**Approach:** Run `npm run deploy` from dashboard directory
**Test scenarios:** Deployment succeeds, Worker is accessible
**Verification:** Check Cloudflare Workers dashboard to confirm deployment

### U3: Cloudflare Dashboard Configuration
**Goal:** Configure Cloudflare infrastructure for Workers deployment
**Files:** Cloudflare dashboard (manual actions)
**Approach:** 
- Delete Cloudflare Pages project (mfm-corporation)
- Configure custom domain `mfm-corp.cc.cd` on the deployed Worker
- Add 7 secrets to the Worker:
  - `ADMIN_USERNAME` = `admin`
  - `ADMIN_PASSWORD_HASH_B64` = `JDJiJDEwJEk4aGhySWJQMlhNTDFoZVhjYkhmYmU2LzlYL3NaYjJkaEhJZ25RWTdLdE1NbGRrcm8zTXFh`
  - `AUTH_SECRET` = `9Y5wBy9HWmhOkgo6NbRtLFDHxqKEmk1pmx/JRTY3KQo=`
  - `NEXTAUTH_URL` = `https://mfm-corp.cc.cd`
  - `AUTH_URL` = `https://mfm-corp.cc.cd`
  - `WORKERS_API_URL` = `https://mfm-corporation-api.mrhanhan-fx.workers.dev`
  - `WORKERS_API_SECRET` = your secret
**Test scenarios:** Custom domain resolves, secrets are accessible
**Verification:** Visit https://mfm-corp.cc.cd, test login functionality

### U3.5: DNS Migration
**Goal:** Safely migrate custom domain from Pages to Worker
**Files:** Cloudflare DNS settings
**Approach:**
- Update DNS CNAME record from Pages to Worker
- Document DNS change procedure and expected propagation time (24-48 hours)
- Plan for potential downtime window during propagation
**Test scenarios:** DNS record updated, propagation time documented
**Verification:** Use DNS lookup tools to confirm CNAME points to Worker

### U4: Verification
**Goal:** Confirm dashboard functionality at custom domain
**Files:** None (manual testing)
**Approach:** 
- Visit https://mfm-corp.cc.cd
- Test login with admin credentials (username: admin, password: F@rihan123)
- Test chat functionality
- Confirm no console errors
**Test scenarios:** Login works, chat works, no 404 errors
**Verification:** Manual browser testing

### U5: Cleanup
**Goal:** Remove stale branches
**Files:** Git repository
**Approach:** Delete branches `feat/security-hardening` and `feature/security-fixes-clean`
**Test scenarios:** Branches removed from local and remote
**Verification:** `git branch -a` confirms branches deleted

### U6: Rollback Plan
**Goal:** Document rollback procedure if Workers deployment fails
**Files:** docs/plans/2026-07-01-workers-deployment-fix.md
**Approach:**
- Document rollback criteria (deployment fails, critical errors, performance degradation)
- Document rollback steps: delete Worker, restore Pages project, restore DNS
- Document rollback verification: test Pages deployment works
**Test scenarios:** Rollback procedure documented, criteria defined
**Verification:** Review rollback plan for completeness

### U7: Post-Migration Validation
**Goal:** Compare Workers vs Pages performance and security
**Files:** Cloudflare dashboard, browser dev tools
**Approach:**
- Measure Worker performance metrics (load time, response time)
- Compare with documented Pages baseline metrics
- Validate security posture (same auth, same secrets, no new vulnerabilities)
- Compare cost (Workers vs Pages billing)
**Test scenarios:** Performance metrics collected, security validated, cost compared
**Verification:** Document performance comparison, confirm no security regression

## Key Technical Decisions

1. **Workers vs Pages:** Chose Workers deployment because OpenNext adapter is designed for Workers, not Pages. This is the official Cloudflare-recommended approach for Next.js deployment.

2. **Custom Domain:** Reusing existing custom domain `mfm-corp.cc.cd` by moving it from Pages to Worker.

3. **Secrets Migration:** Secrets need to be reconfigured for Workers instead of Pages because they are different Cloudflare services.

## Risks & Dependencies

**Risks:**
- Manual Cloudflare dashboard actions required (cannot be automated)
- Custom domain DNS propagation may take time
- Worker deployment may have different performance characteristics than Pages

**Dependencies:**
- User must add local environment variables before deployment
- User must perform Cloudflare dashboard actions after deployment
- Custom domain DNS must be configured correctly

## System-Wide Impact

**Impact:** Changes deployment target from Pages to Workers, but no code changes required.

**Users:** No user-facing changes - same custom domain, same functionality.

**Backward Compatibility:** Not applicable - this is a deployment infrastructure change only.
