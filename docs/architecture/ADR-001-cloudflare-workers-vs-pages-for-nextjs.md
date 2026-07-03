# ADR-001: Cloudflare Workers vs Pages for Next.js

## Status

Accepted

## Context

The MFM Corporation dashboard uses Next.js 16.2.6 with the `@opennextjs/cloudflare` adapter for Cloudflare deployment. The dashboard was initially deployed to Cloudflare Pages, but this resulted in 404 errors for assets after successful builds.

## Problem

**Architecture Mismatch:**
- Code uses `@opennextjs/cloudflare` adapter (designed for Cloudflare Workers)
- Currently deployed to Cloudflare Pages (static site hosting)
- OpenNext generates `.open-next/worker.js` (Worker executable)
- Pages cannot execute Workers - serves static files only
- Result: Build succeeds but assets return 404 errors

**Root Cause:**
The `@opennextjs/cloudflare` adapter transforms Next.js applications to run on Cloudflare Workers runtime. Cloudflare Pages is designed for static site hosting only and cannot execute Workers. This architectural incompatibility causes the deployment failure.

## Decision

**Deploy to Cloudflare Workers using the official OpenNext deployment method.**

## Drivers

1. **Official Cloudflare Recommendation:** Cloudflare explicitly recommends `@opennextjs/cloudflare` for Next.js deployment to Workers, not Pages
2. **Adapter Design:** OpenNext adapter is designed specifically for Workers runtime, not Pages
3. **Feature Compatibility:** Workers deployment supports full Next.js features (SSR, ISR, Middleware) that Pages cannot handle
4. **Performance:** Workers deployment provides better performance for dynamic applications with SSR

## Alternatives Considered

### Option A: Cloudflare Workers (Selected)
- **Pros:**
  - Full Next.js SSR support
  - Official Cloudflare recommendation
  - Better performance for dynamic applications
  - Proper OpenNext adapter support
- **Cons:**
  - Requires manual Cloudflare dashboard configuration
  - Custom domain migration required
  - Secrets need to be reconfigured

### Option B: Next.js Static Export for Pages
- **Pros:**
  - Works with existing Pages setup
  - Simpler deployment
  - No manual Cloudflare actions
- **Cons:**
  - No SSR support
  - NextAuth may not work properly
  - Requires removing `@opennextjs/cloudflare` adapter
  - Worse performance for dynamic applications
  - Not the recommended approach

### Option C: Alternative Hosting (Vercel, Netlify)
- **Pros:**
  - Better Next.js support
  - No architectural mismatch
- **Cons:**
  - Additional cost
  - Not using existing Cloudflare infrastructure
  - More complex setup

## Consequences

### Positive
- Correct architecture for OpenNext adapter
- Full Next.js feature support (SSR, ISR, Middleware)
- Better performance for dynamic applications
- Follows Cloudflare best practices

### Negative
- Manual Cloudflare dashboard configuration required
- Custom domain DNS migration (24-48 hours propagation)
- Secrets need to be reconfigured for Workers
- Temporary downtime during migration

### Risks
- DNS propagation may cause temporary downtime
- Worker deployment may have different performance characteristics
- Manual configuration steps increase chance of human error

## Mitigation Strategies

1. **Backup:** Document and backup current Pages deployment before migration
2. **Rollback Plan:** Document rollback procedure if Workers deployment fails
3. **DNS Planning:** Schedule migration during low-traffic window
4. **Testing:** Thoroughly test Workers deployment before deleting Pages
5. **Monitoring:** Monitor performance metrics after migration

## Implementation

See implementation plan: `docs/plans/2026-07-01-workers-deployment-fix.md`

## References

- Cloudflare Workers Next.js Guide: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- OpenNext Cloudflare Documentation: https://opennext.js.org/cloudflare/get-started
- Cloudflare Blog: Deploying Next.js Apps to Cloudflare Workers with OpenNext Adapter
