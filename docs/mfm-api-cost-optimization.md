# MFM Corporation — API Cost Optimization & Scaling Plan

*Generated: May 24, 2026 | Constraint: Zero Personal Capital | Rule: Revenue Must Cover Costs Before Upgrading*

## Executive Summary

MFM Corporation's entire infrastructure runs on **free tiers** — Cloudflare Workers (100K requests/day), OpenRouter free models, Cloudflare D1 (500MB), KV (1GB), R2 (10GB/month), and Supabase (500MB). This document details the architecture, cost thresholds, fallback strategies, and scaling plan that ensures MFM never pays for infrastructure until client revenue justifies it. The guiding principle: **if revenue doesn't cover the cost, the cost doesn't happen.**

---

## 1. Free-Tier Architecture Stack

### 1.1 Current Infrastructure

| Layer | Service | Free Tier Limit | Paid Tier Cost | Upgrade Trigger |
|-------|---------|----------------|----------------|-----------------|
| **Compute** | Cloudflare Workers | 100K requests/day | $5/mo (Workers Paid) | Daily requests > 80K |
| **Database** | Cloudflare D1 | 500MB storage | Pro: $5/mo | Storage > 400MB |
| **Cache** | Cloudflare KV | 1GB storage | Pro: $5/mo | Storage > 800MB |
| **Storage** | Cloudflare R2 | 10GB/month | $0.015/GB | Storage > 8GB |
| **LLM API** | OpenRouter (free) | Rate limited | $0.60-2/M tokens | Rate limits hit daily |
| **LLM Fallback** | Cloudflare Workers AI | 10K requests/day | $0.011-0.056/1K images | Daily > 8K requests |
| **Email** | SendGrid | 100 emails/day | $19.95/mo (Essentials) | Daily > 80 emails |
| **Alt Database** | Supabase | 500MB | Pro: $25/mo | Storage > 400MB |
| **Frontend** | GitHub Pages | 1GB bandwidth, 100GB | None (free) | Bandwidth > 900MB |
| **Monitoring** | Cloudflare Analytics | Basic | Pro: $20/mo | Need advanced metrics |

### 1.2 Total Monthly Cost at Current Scale

| Category | Cost |
|----------|------|
| Compute | MYR 0 |
| Database | MYR 0 |
| Cache | MYR 0 |
| Storage | MYR 0 |
| LLM API | MYR 0 |
| Email | MYR 0 |
| Frontend | MYR 0 |
| **Total** | **MYR 0** |

---

## 2. Cost Threshold Analysis

### 2.1 Threshold 1: OpenRouter Free Rate Limits

**Current:** OpenRouter free tier provides access to free models (deepseek-chat-v3-0324:free, llama-3.3-70b-instruct:free, qwen2.5-72b-instruct:free)

**Limits:**
- Daily request caps (varies by model, typically 200-500 requests/day)
- Rate limiting per minute (typically 10-20 requests/minute)
- No guaranteed availability (free tier deprioritized during peak)

**Trigger:** When MFM agents consistently hit daily rate limits (e.g., 200+ requests/day on primary model)

**Mitigation (Before Paying):**
1. **Model Fallback Chain:**
   - Primary: deepseek-chat-v3-0324:free (best free model)
   - Fallback 1: meta-llama/llama-3.3-70b-instruct:free
   - Fallback 2: qwen/qwen2.5-72b-instruct:free
   - Fallback 3: Cloudflare Workers AI (10K requests/day)
   - Fallback 4: Local rule-based responses (no API call)

2. **Request Batching:**
   - Batch non-urgent tasks into single API calls
   - Queue tasks and process during off-peak hours
   - Reduce per-task API calls from 3 to 1

3. **Aggressive Caching:**
   - Cache common agent responses in KV for 1-24 hours
   - Store frequently requested research in D1
   - Estimated cache hit rate: 40-60% for repetitive queries

4. **Client-Specific Rate Limiting:**
   - Each client gets daily quota based on service tier
   - Basic: 50 requests/day
   - Pro: 200 requests/day
   - Enterprise: 500 requests/day

**When to Upgrade:** Only when revenue exceeds estimated API cost by 3x

### 2.2 Threshold 2: Cloudflare Workers Free Limit

**Current:** 100,000 requests/day

**At MFM Scale:**
- CEO interactions: ~50/day
- Agent tasks: ~100-200/day (early phase)
- Webhook pings: ~50/day
- Health checks: ~1,440/day (1/min)
- **Total: ~1,640/day** (1.6% of limit)

**Headroom:** 98.4% remaining — sufficient for 60x growth before hitting limit

**Trigger:** Daily requests > 80,000 (80% of limit)

**Mitigation (Before Paying):**
1. Optimize health check frequency (every 5 min instead of 1 min)
2. Batch webhook processing
3. Use Cloudflare Queues for async task processing
4. Implement request deduplication

**Upgrade Cost:** $5/month (Workers Paid) — unlimited requests

### 2.3 Threshold 3: Database Storage (D1 + Supabase)

**Current:** D1 (500MB) + Supabase (500MB) = 1GB total

**At MFM Scale:**
- Agent memory: ~10MB/month
- Task history: ~50MB/month
- Decision logs: ~5MB/month
- Metrics: ~2MB/month
- Client data: ~20MB/month
- **Total: ~87MB/month**

**Headroom:** ~11 months before hitting D1 limit; unlimited with Supabase

**Trigger:** D1 storage > 400MB (80% of limit)

**Mitigation (Before Paying):**
1. Archive old data to R2 (cheaper storage)
2. Compress JSON payloads
3. Delete unused agent memory after 90 days
4. Use Supabase as primary when D1 fills

**Upgrade Cost:** $5/month (D1 Pro) or $25/month (Supabase Pro)

### 2.4 Threshold 4: KV Cache Storage

**Current:** 1GB limit

**At MFM Scale:**
- Per-agent memory: ~5MB per active user
- Active users: 10-50 (early phase)
- **Total: ~50-250MB**

**Headroom:** 75-95% remaining

**Trigger:** KV storage > 800MB (80% of limit)

**Mitigation (Before Paying):**
1. Reduce memory retention from 20 turns to 10 turns
2. Compress conversation history
3. Delete inactive user sessions after 7 days

**Upgrade Cost:** $5/month (KV Pro)

### 2.5 Threshold 5: R2 File Storage

**Current:** 10GB/month

**At MFM Scale:**
- Client uploads: ~100MB/month
- Agent-generated files: ~50MB/month
- **Total: ~150MB/month**

**Headroom:** 98.5% remaining

**Trigger:** Storage > 8GB/month

**Mitigation (Before Paying):**
1. Compress images before upload
2. Delete temporary files after 30 days
3. Use external image hosting (Imgur, Cloudinary free tier)

**Upgrade Cost:** $0.015/GB (negligible until massive scale)

### 2.6 Threshold 6: SendGrid Email

**Current:** 100 emails/day

**At MFM Scale:**
- CEO notifications: ~5/day
- Client reports: ~10/day
- Marketing emails: ~20/day
- **Total: ~35/day**

**Headroom:** 65% remaining

**Trigger:** Daily emails > 80

**Mitigation (Before Paying):**
1. Batch daily reports into single email
2. Use Telegram for non-critical notifications
3. Reduce marketing email frequency

**Upgrade Cost:** $19.95/month (SendGrid Essentials, 50K emails/month)

---

## 3. Fallback Strategy Matrix

### 3.1 LLM Model Fallback Chain

```
User Request
    |
    v
[OpenRouter Free] → deepseek-chat-v3-0324:free
    |
    +---> Success: Return response
    |
    +---> Rate limited / Down:
    |       |
    |       v
    |   [OpenRouter Free] → llama-3.3-70b-instruct:free
    |       |
    |       +---> Success: Return response
    |       |
    |       +---> Rate limited / Down:
    |               |
    |               v
    |           [OpenRouter Free] → qwen2.5-72b-instruct:free
    |               |
    |               +---> Success: Return response
    |               |
    |               +---> Rate limited / Down:
    |                       |
    |                       v
    |                   [Cloudflare Workers AI] → llama-3.1-8b
    |                       |
    |                       +---> Success: Return response
    |                       |
    |                       +---> Down:
    |                               |
    |                               v
    |                           [Local Rule-Based]
    |                               |
    |                               +---> Return pre-programmed response
```

### 3.2 Service Degradation Levels

| Level | Condition | Behavior |
|-------|-----------|----------|
| **Normal** | All services operational | Full agent capabilities |
| **Degraded** | OpenRouter rate limited | Use fallback models, slower responses |
| **Limited** | Multiple free tiers hit | Essential agents only, batch processing |
| **Emergency** | All free LLM APIs down | Rule-based responses, queue for later |

### 3.3 Client Communication During Degradation

| Level | Client Notification | Action |
|-------|-------------------|--------|
| **Normal** | None | Business as usual |
| **Degraded** | "Processing may take 2-3x longer" | Continue with slower models |
| **Limited** | "Non-urgent tasks queued for later" | Pause non-critical tasks |
| **Emergency** | "Temporary outage, ETA 1 hour" | Queue all tasks, notify CEO |

---

## 4. Scaling Without Personal Capital

### 4.1 Revenue-Funded Upgrade Path

| Revenue Level | Upgrade Actions | Monthly Cost | Justification |
|---------------|----------------|--------------|---------------|
| **MYR 0-5K** | All free tiers | MYR 0 | Bootstrapping phase |
| **MYR 5K-20K** | Workers Paid ($5), D1 Pro ($5) if needed | ~MYR 45 | 1% of revenue |
| **MYR 20K-50K** | Paid LLM API (Cerebras: $0.60/M tokens) | ~MYR 200-500 | 1-2% of revenue |
| **MYR 50K-100K** | Supabase Pro ($25), SendGrid ($20) | ~MYR 600 | 1% of revenue |
| **MYR 100K+** | Dedicated infrastructure, multi-region | ~MYR 1,500+ | 1-2% of revenue |

### 4.2 Cost as % of Revenue Target

**Rule:** Infrastructure cost should never exceed 5% of monthly revenue.

| Phase | Revenue | Max Infrastructure Cost | Actual (Estimated) |
|-------|---------|------------------------|-------------------|
| **Month 1-3** | MYR 5K-10K | MYR 250-500 | MYR 0 |
| **Month 4-6** | MYR 10K-25K | MYR 500-1,250 | MYR 0-100 |
| **Month 7-9** | MYR 25K-50K | MYR 1,250-2,500 | MYR 100-500 |
| **Month 10-12** | MYR 50K-120K | MYR 2,500-6,000 | MYR 500-1,500 |
| **Year 2** | MYR 200K-400K | MYR 10K-20K | MYR 2,000-5,000 |
| **Year 3** | MYR 500K-1M | MYR 25K-50K | MYR 5,000-15,000 |

### 4.3 Caching ROI Calculation

**Scenario:** Without caching, MFM makes 500 LLM API calls/day.

| Metric | No Cache | With Cache (50% hit rate) |
|--------|----------|----------------------------|
| Daily API calls | 500 | 250 |
| Monthly API calls | 15,000 | 7,500 |
| Cost at Cerebras ($0.60/M tokens, ~1K tokens/call) | ~MYR 90/mo | ~MYR 45/mo |
| Cache storage cost (KV) | MYR 0 | MYR 0 |
| **Monthly savings** | — | **MYR 45** |
| **Annual savings** | — | **MYR 540** |

**Recommendation:** Implement aggressive caching immediately — zero cost, immediate savings.

---

## 5. Monitoring & Alerting

### 5.1 Metrics to Track Daily

| Metric | Tool | Alert Threshold |
|--------|------|-----------------|
| Cloudflare Workers requests | Cloudflare Analytics | > 80K/day |
| D1 storage usage | Cloudflare Dashboard | > 400MB |
| KV storage usage | Cloudflare Dashboard | > 800MB |
| R2 storage usage | Cloudflare Dashboard | > 8GB |
| OpenRouter rate limit hits | Custom metric in D1 | > 5/day |
| SendGrid emails sent | SendGrid Dashboard | > 80/day |
| Response time (p95) | Cloudflare Analytics | > 2 seconds |
| Error rate | Cloudflare Analytics | > 1% |

### 5.2 Alert Channels

| Severity | Channel | Response Time |
|----------|---------|---------------|
| **Warning** (80% of limit) | Telegram to CEO Remy | Review within 24 hours |
| **Critical** (95% of limit) | Telegram + Email | Review within 2 hours |
| **Emergency** (Limit hit) | Telegram + Email + Dashboard | Immediate |

### 5.3 Monthly Cost Review

**Process:**
1. First Monday of each month: Review all usage metrics
2. Compare actual vs. projected usage
3. Identify any services approaching limits
4. Apply mitigations or plan upgrades
5. Document in D1 `cost_review` table

---

## 6. Vendor Lock-In Mitigation

### 6.1 Current Vendor Dependencies

| Vendor | Service | Lock-In Risk | Mitigation |
|--------|---------|------------|------------|
| **Cloudflare** | Workers, D1, KV, R2 | Medium | All code is standard JS/WASM; portable to Deno Deploy, Vercel Edge |
| **OpenRouter** | LLM API routing | Low | Standard OpenAI-compatible API; switch to direct provider |
| **Supabase** | PostgreSQL | Low | Standard PostgreSQL; exportable to any Postgres host |
| **SendGrid** | Email | Very Low | Standard SMTP; switch to Mailgun, AWS SES |
| **GitHub** | Pages, repo | Very Low | Standard static files; deploy to Netlify, Vercel |

### 6.2 Portability Plan

If any vendor changes pricing or terms:
1. **Cloudflare → Deno Deploy / Vercel Edge:** Workers code is standard ES modules; D1 (SQLite) portable to any SQLite host
2. **OpenRouter → Direct API:** Switch to Cerebras, OpenAI, or Anthropic direct
3. **Supabase → Self-hosted Postgres:** Docker container on any VPS
4. **SendGrid → AWS SES:** Lower cost at scale ($0.10 per 1,000 emails)

**Estimated migration cost:** 2-4 days of development time per vendor switch.

---

## 7. Key Takeaways

1. **All infrastructure is free** — Cloudflare, OpenRouter, Supabase, SendGrid, GitHub Pages
2. **100K requests/day headroom** — Current usage is <2% of Workers limit; 60x growth possible
3. **Model fallback chain prevents downtime** — 4 layers of fallback before rule-based responses
4. **Caching reduces API calls by 50%+** — Zero cost, immediate ROI
5. **Upgrade only when revenue justifies 3x the cost** — Never pay from personal capital
6. **Daily monitoring prevents surprises** — Track usage, set alerts at 80% threshold
7. **Vendor lock-in is minimal** — All services use standard APIs; portable in days
8. **Year 1 cost: MYR 0** — Free tiers sufficient until MYR 50K+ revenue

---

*End of API Cost Optimization Report. All 6 deliverables complete.*
