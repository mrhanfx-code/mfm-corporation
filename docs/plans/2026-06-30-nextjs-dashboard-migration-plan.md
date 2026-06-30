---
goal: Make the Next.js (v2) dashboard the single live, login-protected dashboard at mfm-corp.cc.cd (access for CEO Remy only), and retire the Vite dashboard
version: 1.0
date_created: 2026-06-30
last_updated: 2026-06-30
owner: CEO Remy / MFM Corporation
status: 'In progress'
tags: ['migration', 'architecture', 'security', 'deployment']
---

# Introduction

![Status: In progress](https://img.shields.io/badge/status-In%20progress-yellow)

The repository currently contains two competing dashboards: a Vite + React SPA on `master` and a Next.js app on `feat/security-hardening-v2`. The Next.js app already includes a single-admin login (NextAuth Credentials + bcrypt). This plan makes the Next.js dashboard the one and only live dashboard, restricted to a single admin user (CEO Remy), and retires the Vite dashboard. It also resolves the Cloudflare deployment so the app actually serves at `mfm-corp.cc.cd`.

## 1. Requirements & Constraints

- **REQ-001**: The live dashboard at `mfm-corp.cc.cd` must be the Next.js (v2) app.
- **REQ-002**: Only one user (admin = CEO Remy) may log in; no public sign-up.
- **REQ-003**: Chat must continue to work, routed to the Worker `/ask` orchestrator.
- **REQ-004**: The Worker security fixes already merged in PR #6 (CORS, security headers) must be preserved.
- **SEC-001**: No secrets (admin password hash, auth secret, dashboard secret) may be committed to git. Use Cloudflare secrets / env vars only.
- **SEC-002**: The Worker `/ask` `DASHBOARD_SECRET` must NOT be exposed in client-side code. The Next.js server (api route) must hold it server-side.
- **CON-001**: Next.js app uses server features (NextAuth, middleware, API routes) and cannot deploy as static files; a Cloudflare adapter is required.
- **CON-002**: PowerShell environment; run git commands individually (no `&&`/`||`).
- **GUD-001**: Do not commit directly to `master`; use a feature branch + PR.
- **GUD-002**: Do not delete tests or weaken security without explicit approval.
- **PAT-001**: Keep the Vite dashboard in git history; archive + document rather than hard-delete the source.

## 2. Implementation Steps

### Implementation Phase 1 — Branch & dashboard port

- GOAL-001: Create an integration branch from `master` and replace the Vite dashboard with the Next.js dashboard from v2, preserving master's Worker security fixes.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Fetch latest; create branch `feature/nextjs-dashboard` from `origin/master` | | |
| TASK-002 | Remove the Vite `dashboard/` source on the new branch (archive note kept in README/TODO) | | |
| TASK-003 | Port the Next.js `dashboard/` tree from `origin/feat/security-hardening-v2` into the branch | | |
| TASK-004 | Remove the temporary `dashboard/wrangler.toml` (Vite/`dist`) added earlier; it no longer applies | | |

### Implementation Phase 2 — Cloudflare deployment adapter

- GOAL-002: Make the Next.js app deployable on Cloudflare.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-005 | Add `@opennextjs/cloudflare` adapter (recommended) OR `@cloudflare/next-on-pages` to `dashboard/package.json` | | |
| TASK-006 | Add adapter config (`open-next.config.ts` or `wrangler` Pages config) and build script | | |
| TASK-007 | Set Cloudflare Pages/Workers build command + output dir to match the adapter output | | |

### Implementation Phase 3 — Single-admin login config

- GOAL-003: Configure NextAuth so only CEO Remy can log in.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-008 | Generate a bcrypt hash of the chosen admin password; base64-encode it | | |
| TASK-009 | Set Cloudflare secrets: `ADMIN_PASSWORD_HASH_B64`, `AUTH_SECRET` (NextAuth), `NEXTAUTH_URL`/`AUTH_URL` = https://mfm-corp.cc.cd | | |
| TASK-010 | Set server-side `DASHBOARD_SECRET` (or Worker token) for the api proxy to call Worker `/ask` | | |

### Implementation Phase 4 — Retire Vite dashboard & document

- GOAL-004: Cleanly retire the Vite dashboard and record it.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-011 | Add note to `README.md` + `DEVELOPMENT-TODO-LIST.md`: Vite dashboard retired, available in git history at tag/branch | | |
| TASK-012 | Create git tag `vite-dashboard-archive` on the last commit containing the Vite app | | |

### Implementation Phase 5 — Deploy, verify, cleanup

- GOAL-005: Ship and verify, then clean up stale branches.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-013 | Open PR `feature/nextjs-dashboard` -> `master`; merge after review | | |
| TASK-014 | Verify live: login required, wrong creds rejected, chat replies work | | |
| TASK-015 | Delete stale branches: `feat/security-hardening` (95 behind), old `feature/security-fixes-clean` after Pages note merged | | |
| TASK-016 | Decide fate of `feature/sprint-6` (20 commits ahead) — separate review | | |

## 3. Alternatives

- **ALT-001**: Keep the Vite dashboard and add a login wall to it. Rejected: weaker (single shared secret in browser), duplicates effort; v2 already has proper per-user login.
- **ALT-002**: Deploy Next.js to Vercel instead of Cloudflare. Rejected (for now): infra is standardized on Cloudflare (Worker, KV, D1, R2); keep one platform.
- **ALT-003**: Static export (`next export`). Rejected: incompatible with NextAuth/middleware/server API routes.

## 4. Dependencies

- **DEP-001**: `@opennextjs/cloudflare` (or `@cloudflare/next-on-pages`) for Cloudflare deployment of Next.js.
- **DEP-002**: `next-auth@5`, `bcryptjs` (already in v2 dashboard).
- **DEP-003**: Cloudflare account access to set Pages/Workers build config and secrets.

## 5. Files

- **FILE-001**: `dashboard/` — replaced (Vite) with Next.js app from v2.
- **FILE-002**: `dashboard/src/auth.ts` — single-admin NextAuth config (already present in v2).
- **FILE-003**: `dashboard/next.config.ts` + adapter config — deployment.
- **FILE-004**: `README.md`, `DEVELOPMENT-TODO-LIST.md` — document Vite retirement.
- **FILE-005**: `dashboard/wrangler.toml` (Vite/dist) — removed.

## 6. Testing

- **TEST-001**: Visiting `mfm-corp.cc.cd` without a session redirects to `/login`.
- **TEST-002**: Wrong username/password is rejected; correct admin creds succeed.
- **TEST-003**: After login, sending a chat message returns a reply from the Worker `/ask`.
- **TEST-004**: `DASHBOARD_SECRET`/Worker token is NOT present in any client-downloaded JS.

## 7. Risks & Assumptions

- **RISK-001**: Next.js 16 + React 19 + NextAuth v5 beta compatibility with the Cloudflare adapter may need version pinning.
- **RISK-002**: Cloudflare Pages settings are managed in the dashboard; code changes alone may not flip build config — manual settings change likely required.
- **RISK-003**: Porting v2's dashboard onto master may surface differences if v2 also expected Worker changes not in master.
- **ASSUMPTION-001**: `mfm-corp.cc.cd` currently points to the Cloudflare Pages project; DNS unchanged.
- **ASSUMPTION-002**: CEO Remy is the only required user; username `admin` is acceptable.

## 8. Related Specifications / Further Reading

- docs/SECURITY-FIXES-IMPLEMENTATION-GUIDE.md
- Cloudflare: Deploy a Next.js app (https://developers.cloudflare.com/workers/frameworks/framework-guides/nextjs/)
- OpenNext Cloudflare adapter (https://opennext.js.org/cloudflare)
- NextAuth v5 (https://authjs.dev)
