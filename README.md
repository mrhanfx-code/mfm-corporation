# MFM Corporation Monorepo

This repository hosts two separate deployments:

1. **Cloudflare Workers Telegram Bot** — AI-powered corporate automation with 42 specialized agents
2. **Next.js Security-Hardened Dashboard** — Web interface for monitoring and controlling the bot

---

## Cloudflare Workers Bot

The Workers bot lives at the repository root and handles natural language command processing, agent coordination, and corporate operations.

**Deployment:** `mfm-corporation-telegram-bot.mrhan-fx.workers.dev`

**Key files:**
- `wrangler.toml` — Workers configuration
- `src/telegram-bot-agent.js` — Main entry point
- `src/agents/` — 42 specialized agents
- `src/core/` — Core orchestration logic
- `src/db/` — D1 database operations
- `src/tools/` — Agent tools and utilities

**Getting started locally:**
```bash
npm install
npx wrangler dev
```

---

## Next.js Dashboard

The dashboard lives in the `dashboard/` subdirectory and provides a web interface for CEO Remy to monitor and control the bot.

**Deployment:** https://mfm-corp.cc.cd (Cloudflare Pages)

**Key files:**
- `dashboard/package.json` — Next.js dependencies
- `dashboard/src/app/` — App Router pages
- `dashboard/src/auth.ts` — NextAuth credentials provider
- `dashboard/src/middleware.ts` — Security middleware (CSP, rate limiting)
- `dashboard/src/lib/` — API client and server utilities

**Getting started locally:**
```bash
cd dashboard
npm install
npm run dev
```

The dashboard runs on port 3333 by default.

---

## Security

The dashboard implements multiple security layers:
- NextAuth.js v5 credentials provider with bcrypt password hashing
- HTTP-only cookie session management
- Content Security Policy with dynamic nonce generation
- Rate limiting on API endpoints
- Server-only environment variables for secrets

See `dashboard/docs/plans/feature-security-hardening-1.md` for full security implementation details.

---

## Repository Structure

```
mfm-corporation/
├── wrangler.toml              # Workers bot config
├── src/                       # Workers bot source
├── package.json               # Workers dependencies
├── .gitignore                 # Shared ignores
├── README.md                  # This file
└── dashboard/                 # Next.js dashboard
    ├── src/                   # Next.js App Router
    ├── package.json           # Next.js dependencies
    ├── next.config.ts
    └── docs/                  # Dashboard documentation
```
