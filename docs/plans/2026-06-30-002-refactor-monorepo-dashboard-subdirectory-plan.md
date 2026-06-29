---
title: "refactor: restructure mfm-corporation into proper monorepo with dashboard/ subdirectory"
date: 2026-06-30
type: refactor
status: ready
---

# refactor: restructure mfm-corporation into proper monorepo with dashboard/ subdirectory

**Target repo:** mrhanfx-code/mfm-corporation

---

## Summary

The `mfm-corporation` repo is a monorepo hosting two separate deployments — the Cloudflare Workers telegram bot (lives on `master`) and the Next.js security-hardened dashboard (currently on `feat/security-hardening` at the repo root). Because both use `src/` at the root for completely different codebases, they conflict structurally. The fix is to move the Next.js dashboard into a `dashboard/` subdirectory on a fresh branch off `master`, update Cloudflare Pages to build from that subdirectory, close the broken PR #1 (targeting `main`), and open a correct PR targeting `master`.

---

## Problem Frame

| Item | Detail |
|---|---|
| `master` branch | Cloudflare Workers bot at root — `wrangler.toml`, `src/telegram-bot-agent.js`, `src/agents/`, etc. |
| `feat/security-hardening` | Next.js dashboard at root — its own `src/`, `package.json`, `next.config.ts` |
| Root conflict | Both branches claim `src/` and `package.json` for different things |
| PR #1 state | Open, base = `main` (a stub with only README), 2 of 3 Cloudflare checks failing |
| `main` vs `master` | `main` has only a README; `master` is the real production branch |

The Cloudflare Workers check fails on `feat/security-hardening` because `wrangler.toml` (which lives on `master`) is absent. Moving the dashboard into `dashboard/` and rebasing onto `master` resolves all three check failures at once.

---

## Requirements

- R1: Next.js dashboard code must live under `dashboard/` subdirectory in the repo
- R2: Workers bot code (`wrangler.toml`, root `src/`) must remain at repo root
- R3: All 3 Cloudflare CI checks must pass on the final PR
- R4: PR must target `master` (not `main`)
- R5: `dashboard/` must be self-contained — its own `package.json`, `tsconfig.json`, `.gitignore` additions, `next.config.ts`, `src/`, `public/`, `docs/`
- R6: Cloudflare Pages project `mfm-corporation` must be reconfigured to build from `dashboard/` root
- R7: Old PR #1 (broken, targeting `main`) must be closed
- R8: The security hardening work (39 files, 8670 additions from PR #1) must be fully preserved

---

## Key Technical Decisions

**KTD-1: New branch from `master` rather than rebasing `feat/security-hardening`**
The two branches have incompatible root structures (`src/` trees mean entirely different things). A rebase would produce hundreds of conflicts. The clean approach is: create `feat/security-hardening-v2` from `master`, then move the dashboard files into `dashboard/` in one atomic commit. This preserves all security work and avoids a conflict storm.

**KTD-2: `dashboard/` as the subdirectory name, not `app/` or `nextjs/`**
`master` already has `src/dashboard/` (a Workers agent subdirectory), so `dashboard/` at the root is semantically distinct — it is the standalone Next.js application. The name matches what Cloudflare Pages will be configured to use as its root directory.

**KTD-3: Dashboard gets its own `.gitignore`; root `.gitignore` gets only `dashboard/.next/` appended**
The dashboard's current `.gitignore` uses root-anchored patterns (`/node_modules`, `/.next/`). If these were merged into the repo root `.gitignore`, the anchoring would point to the repo root — not `dashboard/` — so `dashboard/.next/` would go unignored. The correct approach is to copy the dashboard's `.gitignore` as `dashboard/.gitignore` (anchors then apply relative to `dashboard/`, which is correct). The root `.gitignore` on `master` already covers bare `node_modules/` and `.env.local` at any depth via non-anchored patterns; only `dashboard/.next/` needs to be appended since `.next` is absent from `master`'s `.gitignore`.

**KTD-4: Cloudflare Pages `mfm-corporation` build settings updated in the Cloudflare dashboard (manual step)**
There is no `wrangler.toml` for Pages projects that supports `root_dir` via CLI push. The subdirectory must be set in the Cloudflare Pages project settings UI: Root directory = `dashboard`, Build command = `npm run build`, Output directory = `.next`.

**KTD-5: New branch based on `master`, not `feature/sprint-6`**
The repo has two active Workers branches: `master` (SHA `a2136ae`) and `feature/sprint-6` (SHA `a212cfe`). `master` is chosen because its `wrangler.toml` does not include a hardcoded `account_id`, making it safer for a public repository. `feature/sprint-6` appears to be an in-progress development branch not yet merged to `master`.

---

## Scope Boundaries

### In scope
- Create `feat/security-hardening-v2` from `master`
- Move all Next.js dashboard files into `dashboard/` in one commit
- Merge root-level config files (`.gitignore`, `.env.example`, `README.md`)
- Push branch, open new PR targeting `master`
- Close old PR #1
- Update Cloudflare Pages project settings (manual, guided)

### Deferred to Follow-Up Work
- Migrating `main` branch to match `master` (out of scope — `main` appears intentionally minimal)
- Adding GitHub Actions CI for the dashboard (separate concern)
- Adding a root-level `Makefile` or workspace scripts to run both Workers and dashboard locally

### Out of scope
- Modifying any of the security hardening code itself (all 39 files remain unchanged)
- Changes to the Workers bot code (`src/telegram-bot-agent.js`, `wrangler.toml`)
- Cloudflare Workers secrets or environment variables

---

## Output Structure

```
mfm-corporation/                       ← repo root (master content stays)
├── wrangler.toml                      ← Workers bot config (unchanged)
├── wrangler-enhanced.toml             ← Workers extended config (unchanged)
├── src/                               ← Workers bot source (unchanged)
│   ├── telegram-bot-agent.js
│   ├── agents/
│   ├── core/
│   ├── db/
│   └── tools/
├── package.json                       ← Workers package.json (unchanged)
├── .gitignore                         ← merged: Workers + dashboard entries
├── .env.example                       ← merged: Workers + dashboard variables
├── README.md                          ← updated: monorepo overview
├── dashboard/                         ← NEW: entire Next.js app here
│   ├── src/                           ← Next.js App Router source
│   │   ├── app/
│   │   ├── auth.ts
│   │   ├── middleware.ts
│   │   └── lib/
│   ├── package.json                   ← Next.js dependencies
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── postcss.config.mjs
│   ├── eslint.config.mjs
│   ├── .env.example                   ← dashboard-specific env vars
│   ├── .gitignore                     ← Next.js-specific ignores (anchored to dashboard/)
│   ├── public/
│   └── docs/
│       └── plans/                     ← plan files stay with the dashboard
└── [all other master files]           ← AUDIT-REPORT.md, DESIGN.md, etc.
```

---

## High-Level Technical Design

### Branch strategy

```
master ──────────────────────────────────────── (base)
         \
          feat/security-hardening-v2
          └── commit: "refactor: move Next.js dashboard into dashboard/ subdir"
                      (all 39 security files inside dashboard/)
```

### File movement map

```
[feat/security-hardening root]      →   [feat/security-hardening-v2]
─────────────────────────────────────────────────────────────────────
src/                                →   dashboard/src/
package.json            (Next.js)   →   dashboard/package.json
next.config.ts                      →   dashboard/next.config.ts
tsconfig.json                       →   dashboard/tsconfig.json
postcss.config.mjs                  →   dashboard/postcss.config.mjs
eslint.config.mjs                   →   dashboard/eslint.config.mjs
public/                             →   dashboard/public/
docs/                               →   dashboard/docs/
.env.example            (Next.js)   →   dashboard/.env.example
package-lock.json       (Next.js)   →   dashboard/package-lock.json
.gitignore              (Next.js)   →   dashboard/.gitignore  (copy as-is; patterns anchor to dashboard/)
README.md                           →   merged into root README.md
root .gitignore                     →   append dashboard/.next/ only

Note: next-env.d.ts is NOT copied — auto-generated by Next.js on first build.
```

### Cloudflare CI check resolution

| Check | Current status | After restructure |
|---|---|---|
| Cloudflare Pages: mfm-corporation | ✅ Pass | ✅ Pass (now builds from `dashboard/`) |
| Workers Builds: mfm-corporation-telegram-bot | ❌ Fail (no wrangler.toml) | ✅ Pass (wrangler.toml from master is at root) |
| Cloudflare Pages: mfm-corporation-git | ❌ Fail | ✅ Pass (proper branch from master) |

---

## Implementation Units

### U0. Pre-migration: back up Next.js dashboard files to staging

**Goal:** Preserve all dashboard files in a safe location before switching branches. Checking out `feat/security-hardening-v2` from `origin/master` replaces the working tree — without this step, the Next.js source will disappear when the branch is created.

**Requirements:** R8

**Dependencies:** none

**Files:**
- No git operations — local filesystem copy only

**Approach:**
While still on `feat/security-hardening`, copy the working tree to a temp directory:
```powershell
New-Item -ItemType Directory -Path "C:\Users\DELL\temp\dashboard-backup" -Force
Copy-Item -Path "C:\Users\DELL\MY Workspace\projects\project5\dashboard\*" `
  -Destination "C:\Users\DELL\temp\dashboard-backup\" `
  -Recurse -Force
```
`node_modules/` and `.next/` may be copied but will not be committed (gitignored). The backup only needs the source files.

**Test scenarios:**
- `C:\Users\DELL\temp\dashboard-backup\src\app\` exists
- `C:\Users\DELL\temp\dashboard-backup\package.json` exists
- `C:\Users\DELL\temp\dashboard-backup\src\middleware.ts` exists
- `C:\Users\DELL\temp\dashboard-backup\src\auth.ts` exists
- `C:\Users\DELL\temp\dashboard-backup\package-lock.json` exists

**Verification:** Backup directory is non-empty with all source files; safe to switch branches.

---

### U1. Fetch `master` and create `feat/security-hardening-v2`

**Goal:** Set up the new branch with the full Workers codebase as the starting point.

**Requirements:** R4, R2

**Dependencies:** U0

**Files:**
- Local git state only (no file changes)

**Approach:**
- From the local `dashboard/` project directory, fetch `origin/master`
- Create `feat/security-hardening-v2` from `origin/master`
- Verify `wrangler.toml` and `src/telegram-bot-agent.js` are present at root

**Test scenarios:**
- `git log --oneline -3` shows `feat/security-hardening-v2` head matches `master`'s latest commit
- `wrangler.toml` exists at root and contains `name = "mfm-corporation-telegram-bot"`
- `src/telegram-bot-agent.js` exists at root
- **[Q1 investigation]** Confirm in the Cloudflare dashboard whether `mfm-corporation-git` is the same Pages project as `mfm-corporation` or a separate Git-linked integration — if separate, schedule a U5b to update its root directory config

**Verification:** Branch exists locally, clean working tree, Workers files visible, Q1 resolved.

---

### U2. Move all Next.js dashboard files into `dashboard/` subdirectory

**Goal:** Create the `dashboard/` directory and copy every Next.js file from the old branch into it, preserving all security hardening work intact.

**Requirements:** R1, R5, R8

**Dependencies:** U1

**Files:**
- `dashboard/src/` (entire directory tree from old branch)
- `dashboard/package.json`
- `dashboard/next.config.ts`
- `dashboard/tsconfig.json`
- `dashboard/postcss.config.mjs`
- `dashboard/eslint.config.mjs`
- `dashboard/package-lock.json`
- `dashboard/.gitignore`
- `dashboard/public/` (entire directory)
- `dashboard/docs/plans/` (plan files)
- `dashboard/.env.example`

**Approach:**
After completing U0, the backup lives at `C:\Users\DELL\temp\dashboard-backup\`. On the new branch, create the `dashboard/` folder and copy the following from that backup:
- `src/` → `dashboard/src/`
- `package.json` → `dashboard/package.json`
- `next.config.ts` → `dashboard/next.config.ts`
- `tsconfig.json` → `dashboard/tsconfig.json`
- `postcss.config.mjs` → `dashboard/postcss.config.mjs`
- `eslint.config.mjs` → `dashboard/eslint.config.mjs`
- `package-lock.json` → `dashboard/package-lock.json`
- `.gitignore` → `dashboard/.gitignore`
- `public/` → `dashboard/public/`
- `docs/` → `dashboard/docs/`
- `.env.example` → `dashboard/.env.example`

Do NOT copy `.env.local` (gitignored), `node_modules/`, `.next/`, or `next-env.d.ts` (auto-generated by Next.js — will be regenerated on first build).

**Test scenarios:**
- `dashboard/src/app/` exists and contains App Router pages
- `dashboard/src/middleware.ts` exists (the security-hardened middleware)
- `dashboard/src/auth.ts` exists (NextAuth credentials provider)
- `dashboard/package.json` has `next` as a dependency
- `dashboard/docs/plans/` contains the security hardening plan file
- `dashboard/.gitignore` exists and contains `/.next/` and `/node_modules` patterns
- `dashboard/package-lock.json` exists
- Root `src/` still contains Workers bot source (not overwritten)

**Verification:** `git status` shows only `dashboard/` as new additions; Workers files at root are untouched.

---

### U3. Merge root-level config files

**Goal:** Combine `.gitignore` and `README.md` from both branches without losing either side's content.

**Requirements:** R5

**Dependencies:** U2

**Files:**
- `.gitignore` (root)
- `README.md` (root)

**Approach:**

**`dashboard/.gitignore`** — copy the dashboard's `.gitignore` from the U0 backup (`C:\Users\DELL\temp\dashboard-backup\.gitignore`) as `dashboard/.gitignore`. Root-anchored patterns (`/.next/`, `/node_modules`, `/out/`) anchor relative to `dashboard/` when the `.gitignore` lives inside it — correct behaviour, no modifications needed.

**Root `.gitignore`** — `master`'s `.gitignore` already covers `node_modules/` and `.env.local` at any depth via non-anchored patterns. Append only the one missing entry:
```
# Dashboard (Next.js)
dashboard/.next/
```

**README.md** — replace with a monorepo overview:
- Section 1: What this repo is (monorepo hosting two services)
- Section 2: Cloudflare Workers bot — brief description, link to `wrangler.toml`
- Section 3: Next.js Dashboard — brief description, `cd dashboard && npm install && npm run dev`

**Test scenarios:**
- `dashboard/.next/` is gitignored — `git check-ignore dashboard/.next` returns a match (from root `.gitignore` `dashboard/.next/` entry)
- `dashboard/.env.local` is gitignored — already matched by `master`'s non-anchored `.env.local` pattern
- `dashboard/node_modules/` is gitignored — already matched by `master`'s non-anchored `node_modules/` pattern
- `dashboard/.gitignore` file exists with `/.next/`, `/node_modules`, etc.
- Workers root `node_modules/` still gitignored

**Verification:** `git check-ignore -v dashboard/.next` returns a match. `dashboard/.gitignore` is present and committed. README renders correctly on GitHub.

---

### U4. Commit and push `feat/security-hardening-v2`

**Goal:** Commit all changes as a single atomic commit and push to remote.

**Requirements:** R1, R2, R4, R8

**Dependencies:** U3

**Files:**
- All files staged in U2 and U3

**Approach:**
Stage everything under `dashboard/` plus the updated root `.gitignore` and `README.md`. Commit with message:
```
refactor: move Next.js dashboard into dashboard/ subdirectory

- Moves all Next.js security-hardened dashboard files from repo root
  into dashboard/ subdirectory
- Preserves Workers bot code (wrangler.toml, src/) at repo root
- Merges .gitignore and README.md for monorepo structure
- Enables Cloudflare Pages to build from dashboard/ root dir

Part of security hardening plan (see dashboard/docs/plans/)
```

Push: `git push origin feat/security-hardening-v2`

**Test scenarios:**
- `git log --oneline` shows one new commit on top of `master`
- `git show --stat HEAD` lists only `dashboard/` additions and updated root files
- No `src/telegram-bot-agent.js` in the diff (it must be untouched)
- Push succeeds, branch appears on GitHub

**Verification:** Branch visible at `https://github.com/mrhanfx-code/mfm-corporation/tree/feat/security-hardening-v2`

---

### U5. Reconfigure Cloudflare Pages `mfm-corporation` project

**Goal:** Tell Cloudflare Pages to build from `dashboard/` instead of repo root, so the `mfm-corporation` Pages check continues to pass.

**Requirements:** R3, R6

**Dependencies:** U4

**Files:**
- No code files — this is a Cloudflare dashboard UI change

**Approach:**
Navigate to the Cloudflare Pages project settings for `mfm-corporation`:

1. Go to: `https://dash.cloudflare.com/7cd8ba743d303bcd9f4633ca0105bbdf/pages/view/mfm-corporation`
2. Click **Settings → Build & deployments**
3. Update:
   - **Root directory:** `dashboard`
   - **Build command:** `npm run build`
   - **Build output directory:** `.next`
   - **Node.js version:** `18` (or higher)
4. Save and trigger a new deployment to verify

**Test scenarios:**
- Cloudflare Pages build picks up `dashboard/package.json` (not root `package.json`)
- Build output is the Next.js app, not the Workers static site
- Deployment URL shows the Next.js login page (not a static HTML page)

**Verification:** New Pages deployment succeeds and the dashboard login page loads at the Pages URL.

---

### U6. Close PR #1 and open PR #2 targeting `master`

**Goal:** Replace the broken PR with a correct one that passes all 3 Cloudflare CI checks.

**Requirements:** R4, R7

**Dependencies:** U4, U5

**Files:**
- No code files — GitHub PR operations

**Approach:**
1. Close PR #1 (`main ← feat/security-hardening`) with a comment explaining it is superseded by PR #2
2. Open PR #2:
   - Base: `master`
   - Head: `feat/security-hardening-v2`
   - Title: `feat(security): harden dashboard auth, API proxy, and CSP`
   - Body: link to `dashboard/docs/plans/feature-security-hardening-1.md`; list the 5 security phases delivered

**Test scenarios:**
- PR #2 page shows diff with `dashboard/` prefix on all added files
- All 3 Cloudflare checks go green on PR #2's head commit
- PR #1 shows as closed on GitHub

**Verification:** All 3 checks green at `https://github.com/mrhanfx-code/mfm-corporation/pull/2`

---

## Open Questions

| # | Question | Status |
|---|---|---|
| Q1 | Does `mfm-corporation-git` Pages project need a separate directory config? Its failure cause is unclear. | **Must investigate during U1** — confirm in Cloudflare dashboard whether `mfm-corporation-git` is the same project as `mfm-corporation` or a separate Git-linked Pages integration. If separate, it requires its own root directory config update (add U5b). Do not assume it resolves automatically — R3 depends on it. |
| Q2 | Should `dashboard/node_modules/` be committed to a `.npmrc` or handled by Cloudflare's install step? | Deferred to implementation — Cloudflare Pages auto-runs `npm install` in the root directory |

---

## Risks & Dependencies

| Risk | Likelihood | Mitigation |
|---|---|---|
| Root `package.json` conflict — `master`'s root `package.json` is for Workers; our `dashboard/package.json` is for Next.js | Low | They live in different directories; no conflict at git level |
| Cloudflare Pages `mfm-corporation-git` check still fails after restructure | Medium | Investigate during U1 (not after U5) — determine if it is a separate Pages project requiring its own root directory config update. If separate, add U5b before U6. |
| `dashboard/node_modules/` accidentally committed | Low | Root `.gitignore` + `dashboard/.gitignore` both exclude it; verify with `git status` before committing |
| Cloudflare Pages build fails to find `dashboard/package.json` | Low | Setting Root directory to `dashboard` in Pages settings makes Cloudflare treat it as the project root |

---

## Sources & Research

- PR #1 check run analysis: 3 checks fired; `mfm-corporation` Pages ✅, Workers bot ❌ (no wrangler.toml), `mfm-corporation-git` Pages ❌
- `master` branch `wrangler.toml`: `name = "mfm-corporation-telegram-bot"`, `main = "src/telegram-bot-agent.js"` — Workers bot, not Pages
- `master` branch `src/`: `telegram-bot-agent.js`, `agents/`, `core/`, `db/`, `tools/` — entirely different from Next.js `src/`
- Cloudflare Pages subdirectory support: configured via project Settings → Build & deployments → Root directory
