---
goal: Security Hardening — Fix all audit findings from mfm-corp.cc.cd
version: 1.0
date_created: 2026-06-30
last_updated: 2026-06-30
owner: MFM Corporation
status: 'Planned'
tags: [security, feature, authentication, CSP, hardening]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

A comprehensive security hardening plan for the MFM Corporation Command Center dashboard (`mfm-corp.cc.cd`). This plan addresses **all critical, high, and medium findings** from the live site audit conducted on 29 June 2026, implemented in the new Next.js 16 dashboard at `project5/dashboard`. The current live site stores the API secret in plaintext `localStorage`, has no login page, uses a weak CSP, and exposes sensitive internal data to any visitor. This plan fixes every finding from the ground up.

---

## 1. Requirements & Constraints

- **REQ-001**: The dashboard must require authentication before any content is visible — a login page must gate all routes.
- **REQ-002**: The API secret (`mfm_secret`) must NEVER be stored in `localStorage`, `sessionStorage`, or anywhere client-side. It must live in `.env.local` as a server-side-only variable.
- **REQ-003**: All API calls to the Cloudflare Workers backend must be proxied through Next.js API routes — the secret is never sent to the browser.
- **REQ-004**: Sessions must use HTTP-only cookies (not localStorage) so they cannot be accessed by JavaScript.
- **REQ-005**: The Content Security Policy must not include `unsafe-inline` or `unsafe-eval` in `script-src`.
- **REQ-006**: All destructive actions (Pause All, Stop Agent, Deploy Cluster) must require a confirmation dialog before execution.
- **REQ-007**: HSTS (`Strict-Transport-Security`) must be added to all responses.
- **REQ-008**: Rate limiting must be applied to the `/ask` (chat) API route.
- **SEC-001**: Passwords must be hashed with bcrypt — never stored in plaintext.
- **SEC-002**: Session tokens must be signed JWTs with a secret stored in `AUTH_SECRET` env var.
- **SEC-003**: API routes must validate the session before forwarding any request to the Workers backend.
- **CON-001**: Tech stack is Next.js 16 App Router, TypeScript, Tailwind CSS — no changes to these.
- **CON-002**: Auth is NextAuth.js v5 (credentials provider) — chosen for simplicity, no external DB needed for a single-admin system.
- **CON-003**: The Cloudflare Workers backend source is not in this repo. Backend fixes are documented in Phase 6 and must be applied separately in the Workers codebase.
- **GUD-001**: All environment variables must have corresponding entries in `.env.example` with placeholder values and comments.
- **GUD-002**: Zero secrets in source code, git history, or client bundles — verify with `grep` before each commit.
- **PAT-001**: Next.js middleware at `src/middleware.ts` for route protection — check session on every request to protected routes.
- **PAT-002**: All backend API calls go through `src/lib/api.server.ts` (server-only) — this file must never be imported from a client component.

---

## 2. Implementation Steps

### Implementation Phase 1 — Authentication & Secret Management (CRITICAL)

- GOAL-001: Replace the plaintext `localStorage` secret with a proper login page, HTTP-only session cookies, and server-side-only API keys. After this phase, the dashboard requires a password to access and the `mfm_secret` never reaches the browser.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Install `next-auth@beta` (v5), `bcryptjs`, `@types/bcryptjs` | | |
| TASK-002 | Create `.env.local` with `AUTH_SECRET`, `ADMIN_PASSWORD_HASH`, `WORKERS_API_URL`, `WORKERS_API_SECRET`. Run `openssl rand -base64 32` for `AUTH_SECRET`. Hash the password with `bcryptjs.hashSync("yourpassword", 10)` and store as `ADMIN_PASSWORD_HASH`. | | |
| TASK-003 | Create `.env.example` with all env var keys and placeholder values + inline comments explaining each one. | | |
| TASK-004 | Create `src/auth.ts` — NextAuth config with a `CredentialsProvider` that validates `username=admin` and `bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH)`. Export `{ handlers, auth, signIn, signOut }`. | | |
| TASK-005 | Create `src/app/api/auth/[...nextauth]/route.ts` — re-export `handlers` from `src/auth.ts`. | | |
| TASK-006 | Create `src/middleware.ts` — use NextAuth's `auth()` as middleware. Redirect unauthenticated requests to `/login`. Exclude `/login` and `/api/auth/*` from protection. | | |
| TASK-007 | Create `src/app/login/page.tsx` — a clean login form (email/password inputs, submit button). Posts to `signIn("credentials", ...)`. Shows error state on invalid credentials. | | |
| TASK-008 | Create `src/app/login/actions.ts` — server action that calls `signIn("credentials", { username, password, redirectTo: "/" })`. | | |
| TASK-009 | Update `src/app/layout.tsx` — wrap with `SessionProvider` from `next-auth/react` for client components that need session. | | |
| TASK-010 | Delete (or clear) any code that reads/writes `localStorage["mfm_secret"]` — this key must not exist in the new codebase. | | |

### Implementation Phase 2 — API Proxy Layer (CRITICAL)

- GOAL-002: All calls to the Cloudflare Workers backend (`mfm-corporation-telegram-bot.mrhan-fx.workers.dev`) must go through server-side Next.js API routes. The `WORKERS_API_SECRET` never leaves the server.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-011 | Create `src/lib/api.server.ts` — a typed fetch wrapper that reads `WORKERS_API_URL` and `WORKERS_API_SECRET` from `process.env`. Adds `Authorization: Bearer ${secret}` header. Add `"server-only"` import at the top to prevent accidental client-side import. | | |
| TASK-012 | Create `src/app/api/dashboard/status/route.ts` — GET handler that calls `api.get("/api/v1/dashboard/status")` using the server-side client and returns the JSON. Validates session via `auth()` before proxying. | | |
| TASK-013 | Create `src/app/api/dashboard/agents/route.ts` — same pattern as TASK-012 for the agents endpoint. | | |
| TASK-014 | Create `src/app/api/dashboard/tasks/route.ts` — same pattern, accepts `?limit=` query param (max 50, default 20). Filters out sensitive fields (`input`, `output`) unless user is admin. | | |
| TASK-015 | Create `src/app/api/dashboard/ask/route.ts` — POST handler that proxies the chat message to the Workers `/ask` endpoint. Validates session. Applies rate limiting (TASK-021). Returns the response. | | |
| TASK-016 | Create `src/lib/api.client.ts` — a client-side fetch wrapper that calls the Next.js proxy routes (`/api/dashboard/*`) instead of the Workers directly. No secret involved. | | |

### Implementation Phase 3 — Security Headers (HIGH)

- GOAL-003: Harden HTTP response headers — add HSTS, tighten CSP to remove `unsafe-inline`/`unsafe-eval`, enforce frame protection, and configure permissions policy.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-017 | Update `next.config.ts` to add `headers()` — return a `Content-Security-Policy` with `nonce` support: `default-src 'self'; script-src 'self' 'nonce-{nonce}'; style-src 'self' 'unsafe-inline'; connect-src 'self'; font-src 'self'; img-src 'self' data:`. No `unsafe-eval`. | | |
| TASK-018 | Add `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` to `next.config.ts` headers. | | |
| TASK-019 | Add `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy: camera=(), microphone=(), geolocation=()` to `next.config.ts` headers. | | |
| TASK-020 | Create `src/lib/nonce.ts` — a server-side utility that generates a per-request CSP nonce using `crypto.randomBytes(16).toString("base64")`. Pass it via React context or headers to inline scripts. | | |

### Implementation Phase 4 — Rate Limiting (HIGH)

- GOAL-004: Prevent abuse of the `/api/dashboard/ask` chat endpoint with per-IP or per-session rate limiting.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-021 | Install `@upstash/ratelimit` and `@upstash/redis` (or use a simple in-memory `Map` for MVP). | | |
| TASK-022 | Create `src/lib/ratelimit.ts` — configure a sliding window limiter: 10 requests per 60 seconds per user session ID. Export a `checkRateLimit(sessionId)` function that returns `{ success, remaining, reset }`. | | |
| TASK-023 | Apply `checkRateLimit` in the `/api/dashboard/ask/route.ts` handler (TASK-015). Return `429 Too Many Requests` with a `Retry-After` header when the limit is exceeded. | | |

### Implementation Phase 5 — Dashboard UI (CRITICAL UX SAFETY)

- GOAL-005: Build the actual dashboard UI — replacing the default Next.js template — with correct semantic HTML, accessible buttons, and confirmation dialogs on all destructive actions.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-024 | Create `src/components/layout/Sidebar.tsx` — sidebar with navigation groups: "Multi-Agent Teams" (All Agents, Marketing Fleet, Core Engineering, Customer Success, Data Ingestion, Executive Strategy) and "Global Controls" (Settings, System Logs). Uses `<nav>`, `<ul>`, `<li>` semantic structure. | | |
| TASK-025 | Create `src/components/layout/Header.tsx` — top bar with live stats (Total Agents, Active, Tasks/hr, Quality Score), theme toggle, and Sign Out button. Sign Out calls `signOut()` from NextAuth. | | |
| TASK-026 | Create `src/components/ui/ConfirmModal.tsx` — a reusable modal component: `<dialog>` element with title, message, Cancel and Confirm buttons. Accepts `onConfirm`, `onCancel`, `message` props. Use `type="button"` on all buttons. | | |
| TASK-027 | Create `src/components/dashboard/AgentCard.tsx` — displays agent name, status indicator, task count, quality score, last activity. Includes "Control", "Stats", and "Stop" buttons — all with `type="button"`. The "Stop" button opens `ConfirmModal` before sending the stop request. | | |
| TASK-028 | Create `src/components/dashboard/AgentGrid.tsx` — renders a list of `AgentCard` components filtered by selected team. | | |
| TASK-029 | Create `src/components/dashboard/ChatPanel.tsx` — the right-side chat input panel. Uses `src/lib/api.client.ts` to call `/api/dashboard/ask`. Input sanitized client-side, responses rendered as escaped text (never `dangerouslySetInnerHTML`). | | |
| TASK-030 | Create `src/app/(dashboard)/page.tsx` — main dashboard page. Fetches agent and status data via server components. Renders `Sidebar`, `Header`, `AgentGrid`, `ChatPanel`. | | |
| TASK-031 | Add `type="button"` to every `<button>` that is NOT inside a `<form>` submit context. No button should have `type="submit"` unless it is literally submitting a form. | | |
| TASK-032 | Wire `ConfirmModal` to "Pause All" and "+ Deploy Cluster" buttons in `Header.tsx`. These must show a confirmation dialog with a clear message before calling any API. | | |

### Implementation Phase 6 — Cloudflare Workers Backend Fixes (HIGH — Separate Repo)

- GOAL-006: Document and apply the required fixes to the Workers backend (`mfm-corporation-telegram-bot.mrhan-fx.workers.dev`). These changes must be made in the Workers source code repo separately from this Next.js project.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-033 | **[Workers repo]** Tighten CORS: change `access-control-allow-origin` on all endpoints from `*` to only `https://mfm-corp.cc.cd`. Remove `access-control-allow-credentials: true` unless strictly needed. | | |
| TASK-034 | **[Workers repo]** Add authentication validation on every route: verify `Authorization: Bearer <secret>` header matches the configured secret. Return `401` if missing or invalid. Do NOT allow any endpoint to return data without a valid token. | | |
| TASK-035 | **[Workers repo]** Add rate limiting on the `/ask` endpoint using Cloudflare's built-in rate limiting rules (or Workers KV-based counter): max 10 requests per 60 seconds per IP. Return `429` with `Retry-After: 60` header. | | |
| TASK-036 | **[Workers repo]** On the `/api/v1/dashboard/tasks` endpoint: filter the `input` and `output` fields to strip any content that contains PII patterns (email addresses, phone numbers, passport numbers) before returning. | | |
| TASK-037 | **[Workers repo]** Rotate the `mfm_secret` (`F@rihan123`) — generate a new strong random secret (`openssl rand -hex 32`), update it in the Workers environment variables, and update `WORKERS_API_SECRET` in `.env.local`. The old secret must be considered compromised. | | |
| TASK-038 | **[Cloudflare Dashboard]** Enable HSTS via Cloudflare's "HTTP Strict Transport Security" setting under SSL/TLS → Edge Certificates → `max-age=31536000, includeSubDomains, preload`. | | |

### Implementation Phase 7 — Validation & Cleanup

- GOAL-007: Verify all security fixes are in place, run end-to-end tests, and ensure no secrets leaked into the codebase.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-039 | Run `grep -r "localStorage" src/` — must return zero results. | | |
| TASK-040 | Run `grep -r "F@rihan123\|mfm_secret" src/ .env*` — must return zero results (secret not hardcoded). | | |
| TASK-041 | Run `grep -r "unsafe-inline\|unsafe-eval" next.config.ts` — must return zero results in `script-src`. | | |
| TASK-042 | Test login page: navigate to `/` as unauthenticated user → should redirect to `/login`. Enter wrong password → error shown. Enter correct password → redirected to dashboard. | | |
| TASK-043 | Test session cookie: open DevTools → Application → Cookies. The auth cookie must have `HttpOnly: true` and `SameSite: lax` or `strict`. No secrets in localStorage or sessionStorage. | | |
| TASK-044 | Test rate limiting: send 11 `/api/dashboard/ask` requests in 60 seconds → the 11th must return `429`. | | |
| TASK-045 | Test confirmation dialogs: click "Pause All" → modal appears. Click Cancel → no API call made. Click Confirm → API call proceeds. | | |
| TASK-046 | Run `npx next build` — must complete with no TypeScript errors and no `server-only` import violations. | | |
| TASK-047 | Check response headers in browser DevTools → verify `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, and `Content-Security-Policy` are present on all responses. | | |

---

## 3. Alternatives

- **ALT-001: Supabase Auth instead of NextAuth.js** — Supabase Auth supports multiple users, OAuth, and magic links. Rejected for MVP because the current system is single-admin and adding Supabase adds infra cost and complexity. Can be migrated later when multi-user support is needed.
- **ALT-002: Keep the Vite/React SPA and patch it** — Rather than rebuilding in Next.js, we could patch CSP nonces and auth into the existing Vite app. Rejected because the existing source is not local, patching CSP nonces in a Vite SPA is complex, and the new Next.js scaffold is the preferred direction per `Context.md`.
- **ALT-003: HTTP-only cookie set by the Workers backend** — Instead of NextAuth, have the Workers backend issue a session cookie. Rejected because the Workers backend is a Cloudflare Worker on a different domain (`*.workers.dev`), making cross-domain cookie sharing unreliable and complex.
- **ALT-004: Upstash Redis for rate limiting** — A production-grade option using `@upstash/ratelimit`. Recommended for production deploy. For local dev/MVP, a simple in-memory `Map` is acceptable (TASK-021 notes this choice).

---

## 4. Dependencies

- **DEP-001**: `next-auth@beta` (v5) — authentication library with App Router support
- **DEP-002**: `bcryptjs` + `@types/bcryptjs` — password hashing
- **DEP-003**: `server-only` — npm package that throws a build error if a server-only module is imported in a client component
- **DEP-004**: `@upstash/ratelimit` + `@upstash/redis` — (optional, for production rate limiting) — alternatively use in-memory Map for MVP
- **DEP-005**: Node.js `crypto` module — built-in, used for nonce generation in TASK-020

---

## 5. Files

- **FILE-001**: `src/auth.ts` — NextAuth configuration (CredentialsProvider, session strategy)
- **FILE-002**: `src/middleware.ts` — Route protection middleware, redirects unauthenticated users to `/login`
- **FILE-003**: `src/app/api/auth/[...nextauth]/route.ts` — NextAuth catch-all handler
- **FILE-004**: `src/app/login/page.tsx` — Login page UI
- **FILE-005**: `src/app/login/actions.ts` — Server action for sign-in
- **FILE-006**: `src/lib/api.server.ts` — Server-side API client (reads WORKERS_API_SECRET from env, never exposed to browser)
- **FILE-007**: `src/lib/api.client.ts` — Client-side API client (calls Next.js proxy routes only)
- **FILE-008**: `src/lib/ratelimit.ts` — Rate limiting utility
- **FILE-009**: `src/lib/nonce.ts` — CSP nonce generator
- **FILE-010**: `src/app/api/dashboard/status/route.ts` — Proxied status endpoint
- **FILE-011**: `src/app/api/dashboard/agents/route.ts` — Proxied agents endpoint
- **FILE-012**: `src/app/api/dashboard/tasks/route.ts` — Proxied tasks endpoint (with field filtering)
- **FILE-013**: `src/app/api/dashboard/ask/route.ts` — Proxied chat endpoint (with rate limiting)
- **FILE-014**: `src/app/(dashboard)/page.tsx` — Main dashboard page (protected route)
- **FILE-015**: `src/app/(dashboard)/layout.tsx` — Dashboard layout with Sidebar + Header
- **FILE-016**: `src/components/layout/Sidebar.tsx` — Navigation sidebar
- **FILE-017**: `src/components/layout/Header.tsx` — Top status bar with Sign Out
- **FILE-018**: `src/components/ui/ConfirmModal.tsx` — Reusable confirmation dialog
- **FILE-019**: `src/components/dashboard/AgentCard.tsx` — Individual agent display card
- **FILE-020**: `src/components/dashboard/AgentGrid.tsx` — Agent grid with team filtering
- **FILE-021**: `src/components/dashboard/ChatPanel.tsx` — Chat input and response display
- **FILE-022**: `next.config.ts` — Updated with security headers (CSP, HSTS, X-Frame-Options, etc.)
- **FILE-023**: `.env.example` — Template with all required env var keys and descriptions
- **FILE-024**: `.env.local` — Actual secrets (gitignored, never committed)
- **FILE-025**: `.gitignore` — Ensure `.env.local` is listed

---

## 6. Testing

- **TEST-001**: Unauthenticated access — visit `http://localhost:3000/` → must redirect to `/login`. Visit `/api/dashboard/status` without session → must return `401`.
- **TEST-002**: Wrong password login — submit login form with incorrect password → error message shown, no session created.
- **TEST-003**: Correct password login — submit with correct password → redirected to `/`, session cookie set with `HttpOnly=true`.
- **TEST-004**: Sign out — click Sign Out → session destroyed, redirected to `/login`, cannot access `/` without logging in again.
- **TEST-005**: localStorage check — after login, open DevTools → Application → Local Storage → must be empty. No `mfm_secret` key.
- **TEST-006**: Cookie check — open DevTools → Application → Cookies → auth session cookie must show `HttpOnly` flag checked.
- **TEST-007**: CSP header check — open DevTools → Network → click any request → Response Headers must include `Content-Security-Policy` without `unsafe-inline` or `unsafe-eval` in `script-src`.
- **TEST-008**: HSTS header check — Response Headers must include `Strict-Transport-Security: max-age=31536000`.
- **TEST-009**: Rate limit — use a script to send 11 POST requests to `/api/dashboard/ask` within 60 seconds → the 11th must return `HTTP 429` with `Retry-After` header.
- **TEST-010**: Confirmation dialog — click "Pause All" button → modal appears with "Are you sure?" message. Click Cancel → no API request made. Click Confirm → API request made.
- **TEST-011**: Confirmation dialog — click "⏻ Stop" on any agent card → modal appears. Cancel → no action. Confirm → stop request sent.
- **TEST-012**: Secret not in bundle — run `npx next build`, then `grep -r "F@rihan123\|mfm_secret" .next/` → must return zero results.
- **TEST-013**: `server-only` enforcement — create a test client component that imports `api.server.ts` → `next build` must throw a build error.
- **TEST-014**: Button type audit — inspect all buttons in the DOM → every button outside a form must have `type="button"`, not `type="submit"`.

---

## 7. Risks & Assumptions

- **RISK-001**: The `mfm_secret` (`F@rihan123`) is already compromised — it was visible in DevTools to anyone who visited the site. Rotating it (TASK-037) must be done **immediately before or alongside** deploying Phase 1. Delaying rotation means the old secret remains active and exploitable.
- **RISK-002**: NextAuth v5 (beta) has API differences from v4. Verify `src/auth.ts` exports match the installed version's expected API surface before completing TASK-004.
- **RISK-003**: The Cloudflare Workers backend (Phase 6) is in a separate repo. If Phase 6 is not completed, the backend remains vulnerable even after the frontend is fixed. Phase 6 is not optional — it must be tracked separately.
- **RISK-004**: Rotating the secret (TASK-037) will break the existing Vite dashboard (`mfm-corp.cc.cd`) immediately, since it reads the old secret from localStorage. The new Next.js dashboard must be deployed at the same time the secret is rotated.
- **ASSUMPTION-001**: The admin password will be a single shared password (single-user system). If multi-user support is needed in the future, migrate to Supabase Auth (ALT-001).
- **ASSUMPTION-002**: The Cloudflare Pages deployment uses `WORKERS_API_URL` and `WORKERS_API_SECRET` as build/runtime environment variables set in the Cloudflare Pages dashboard, not in the repo.
- **ASSUMPTION-003**: Rate limiting MVP uses an in-memory Map (resets on server restart). For production, upgrade to Upstash Redis (DEP-004) for persistence across instances.

---

## 8. Related Specifications / Further Reading

- [NextAuth.js v5 Docs](https://authjs.dev/getting-started)
- [Next.js Security Headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- Audit Report: run `mfm-corp.cc.cd` comprehensive audit (29 June 2026, see chat history)
