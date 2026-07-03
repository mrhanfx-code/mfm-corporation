# MFM Corporation × Novaread Empire Integration Plan

*Generated: May 24, 2026 | Project: Ebook "Panduan Lengkap Golongan M40 dan B40 Bergaji SGD" | Sprint: 14 Days*

---

## 1. MFM Agent Assignment: Novaread Project

### 1.1 Agent Hierarchy for Ebook Sales

```
CEO Remy (Telegram) — Project overseer, daily status
    |
    v
[Orchestrator] — Routes all Novaread tasks to assigned agents
    |
    +---> COO Department
    |       +---> ops-coordinator → Order fulfillment, delivery pipeline
    |       +---> quality-reviewer → Scores all marketing copy before publish
    |       +---> process-optimizer → Analyzes sales funnel, recommends improvements
    |       +---> data-governance-agent → Manages customer data, PDPA compliance
    |
    +---> CTO Department
    |       +---> tech-advisor → Payment integration, automation tools
    |       +---> devops-monitor → Uptime, delivery reliability
    |       +---> security-auditor → Customer data protection
    |       +---> integration-agent → Carousell, Shopee, WhatsApp API connections
    |
    +---> CMO Department
    |       +---> content-writer → All FB posts, TikTok scripts, WhatsApp messages
    |       +---> market-analyst → Tracks competitor pricing, market trends
    |       +---> customer-success-agent → Post-sale follow-up, testimonial collection
    |
    +---> CFO Department
    |       +---> finance-planner → Revenue tracking, cost analysis
    |       +---> risk-assessor → Fraud detection, refund policy enforcement
    |
    +---> CINO Department
            +---> research-agent → Researches new sales channels, buyer behavior
            +---> idea-generator → New marketing angles, viral content ideas
            +---> trend-spotter → Monitors "kerja Singapore" trending topics
            +---> innovation-coach → Challenges assumptions in marketing strategy
            +---> mcp-llm-agent → Advanced prompt engineering for content
```

### 1.2 Per-Agent Responsibilities

| Agent | Novaread Task | Output | Frequency |
|-------|--------------|--------|-----------|
| **content-writer** | Write 5 FB group posts/day | Ready-to-post Malay copy | Daily |
| **content-writer** | Write 3 TikTok scripts/day | 15–30 sec scripts | Daily |
| **content-writer** | Write WhatsApp DM templates | Response messages | As needed |
| **quality-reviewer** | Review all copy before publish | Score 0–100, approve/reject | Per post |
| **ops-coordinator** | Trigger ebook delivery on payment | Send PDF/EPUB link | Per sale |
| **finance-planner** | Log all sales to D1 | Revenue dashboard | Per sale |
| **market-analyst** | Monitor competitor ebook pricing | Price adjustment recommendations | Weekly |
| **trend-spotter** | Track "kerja Singapore" trends | Content angle suggestions | Daily |
| **customer-success** | Follow up with buyers | Testimonial requests | 3 days post-sale |
| **process-optimizer** | Analyze sales by channel | Channel performance report | Weekly |

---

## 2. Development Todo List

### Phase 1: Foundation (Day 1 — May 24)

| # | Task | Owner | Status | Time |
|---|------|-------|--------|------|
| 1.1 | Create Novaread project workspace in D1 | tech-advisor | Pending | 30 min |
| 1.2 | Configure content-writer agent with Novaread brand voice | CMO | Pending | 1 hour |
| 1.3 | Set up quality-reviewer criteria for Novaread content | COO | Pending | 30 min |
| 1.4 | Create D1 schema: `novaread_leads`, `novaread_sales`, `novaread_content` | tech-advisor | Pending | 1 hour |
| 1.5 | Upload ebook files to R2 (PDF + EPUB) | ops-coordinator | Pending | 15 min |
| 1.6 | Generate signed URLs for ebook delivery | tech-advisor | Pending | 30 min |
| 1.7 | Create Linktree with payment links | ops-coordinator | Pending | 20 min |
| 1.8 | List ebook on Carousell | integration-agent | Pending | 30 min |
| 1.9 | Post Day 1 content to 5 FB groups | content-writer | Pending | 30 min |
| 1.10 | Send WhatsApp broadcast to 50 contacts | ops-coordinator | Pending | 20 min |

### Phase 2: Automation Build (Days 2–3)

| # | Task | Owner | Status | Time |
|---|------|-------|--------|------|
| 2.1 | Build payment webhook handler (DuitNow confirmation → trigger delivery) | tech-advisor | Pending | 2 hours |
| 2.2 | Create auto-DM responder for WhatsApp (detect "PM" → send template) | integration-agent | Pending | 2 hours |
| 2.3 | Build sales tracker dashboard (D1 query → Telegram report) | finance-planner | Pending | 1.5 hours |
| 2.4 | Set up daily content generation prompt for content-writer | CMO | Pending | 1 hour |
| 2.5 | Create TikTok video brief generator (auto-generate hooks from trend data) | trend-spotter | Pending | 1 hour |
| 2.6 | Configure copy-reviewer to check Novaread brand voice compliance | quality-reviewer | Pending | 30 min |

### Phase 3: Marketing Engine (Days 4–7)

| # | Task | Owner | Status | Time |
|---|------|-------|--------|------|
| 3.1 | Daily FB group posting (automated scheduling via Buffer or manual) | content-writer | Pending | 30 min/day |
| 3.2 | Daily TikTok/Reels content creation | content-writer | Pending | 1 hour/day |
| 3.3 | Daily WhatsApp status updates with testimonials | customer-success | Pending | 15 min/day |
| 3.4 | Reply to all DMs within 15 minutes | ops-coordinator | Pending | Ongoing |
| 3.5 | Post in Telegram channels (manual outreach) | integration-agent | Pending | 1 hour/day |
| 3.6 | Weekly channel performance review (which channel drives most sales) | process-optimizer | Pending | 1 hour/week |
| 3.7 | A/B test: Post A vs Post B headlines in FB groups | market-analyst | Pending | 30 min/setup |

### Phase 4: Optimization (Days 8–14)

| # | Task | Owner | Status | Time |
|---|------|-------|--------|------|
| 4.1 | Double down on top 2 performing channels | process-optimizer | Pending | Ongoing |
| 4.2 | Launch affiliate program for Telegram admins | finance-planner | Pending | 1 hour setup |
| 4.3 | Deploy urgency messaging ("Last 3 days promo price") | content-writer | Pending | 30 min |
| 4.4 | Collect and publish testimonials | customer-success | Pending | 30 min/day |
| 4.5 | Final push across all channels | All agents | Pending | Day 13–14 |
| 4.6 | Generate 14-day project report | finance-planner | Pending | 2 hours |

---

## 3. MFM Content Engine: Novaread Marketing

### 3.1 Daily Content Production Targets

| Content Type | Agent | Quantity/Day | Output |
|--------------|-------|-------------|--------|
| FB Group Posts | content-writer | 5–10 | Malay text + hooks |
| TikTok Scripts | content-writer | 3–5 | 15–30 sec voiceover |
| WhatsApp DM Templates | content-writer | 2–3 | Response messages |
| WhatsApp Status | content-writer | 1 | Social proof / urgency |
| Telegram Outreach | content-writer | 5 | Admin messages |
| Follow-up Messages | customer-success | Variable | Post-sale engagement |

### 3.2 Copy Reviewer Checklist (Novaread-Specific)

| Dimension | Weight | Novaread Criteria |
|-----------|--------|-------------------|
| Brand Voice | 25% | Malay language, B40/M40 empathy, no hype words |
| Grammar | 20% | Zero errors in Malay, proper punctuation |
| Persuasiveness | 20% | Clear CTA, emotional hook, price mentioned |
| Platform Fit | 15% | Right length for FB/TikTok/WhatsApp |
| Legal Safety | 15% | No false income claims, no defamation |
| Accuracy | 5% | All SGD/MYR conversions correct |

### 3.3 Content Improvement Loop

```
1. content-writer generates draft
2. quality-reviewer scores 0-100
3. If score >= 85: Schedule/publish
4. If score 70-84: Edit and re-review
5. If score < 70: Rewrite with feedback
6. Publish approved content
7. Measure: Likes, shares, PMs, sales
8. trend-spotter analyzes: What worked?
9. content-writer adapts next batch
10. Repeat
```

---

## 4. Automated Fulfillment Pipeline

### 4.1 Manual Payment Flow (Immediate)

```
Customer pays via DuitNow / Bank Transfer
    |
    v
Customer sends receipt screenshot via WhatsApp
    |
    v
ops-coordinator verifies payment (manual, 1 min)
    |
    v
ops-coordinator sends ebook via WhatsApp:
    - PDF link (R2 signed URL, 7-day expiry)
    - EPUB link (R2 signed URL, 7-day expiry)
    - Template documents (if Complete Package)
    |
    v
finance-planner logs sale in D1:
    - timestamp, channel, amount, customer WA number
    |
    v
customer-success schedules follow-up in 3 days
```

### 4.2 Automated Payment Flow (Build in Phase 2)

```
Customer pays via integrated payment gateway
    |
    v
Webhook fires to Cloudflare Worker
    |
    v
Worker verifies payment signature
    |
    v
Worker generates R2 signed URLs (PDF + EPUB)
    |
    v
Worker sends WhatsApp message via API:
    "Terima kasih! Ebook anda: [links]"
    |
    v
Worker logs sale to D1 automatically
    |
    v
Worker schedules follow-up message (3 days later)
```

### 4.3 D1 Schema

```sql
-- novaread_leads table
CREATE TABLE novaread_leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT, -- 'FB Group', 'WhatsApp', 'TikTok', 'Carousell', etc.
    contact_method TEXT, -- 'WhatsApp', 'Telegram', 'FB Messenger'
    contact_id TEXT, -- phone number or username
    status TEXT, -- 'new', 'contacted', 'paid', 'declined'
    first_contact_at DATETIME,
    last_contact_at DATETIME,
    notes TEXT
);

-- novaread_sales table
CREATE TABLE novaread_sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER,
    amount_rm REAL,
    package TEXT, -- 'Basic', 'Complete', 'Coaching'
    payment_method TEXT, -- 'DuitNow', 'Bank Transfer', 'ShopeePay'
    channel TEXT, -- which marketing channel drove the sale
    created_at DATETIME,
    delivered_at DATETIME,
    FOREIGN KEY (lead_id) REFERENCES novaread_leads(id)
);

-- novaread_content_performance table
CREATE TABLE novaread_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT, -- 'FB Group', 'TikTok', 'WhatsApp', etc.
    content_type TEXT, -- 'post', 'video', 'dm', 'status'
    content TEXT, -- actual copy
    agent TEXT, -- which MFM agent created it
    quality_score INTEGER, -- 0-100 from reviewer
    engagement_likes INTEGER,
    engagement_comments INTEGER,
    engagement_pms INTEGER, -- direct messages received
    sales_attributed INTEGER, -- sales linked to this content
    posted_at DATETIME
);
```

---

## 5. MFM Social Media Strategy for Novaread

### 5.1 Platform Priority (Agent-Assigned)

| Platform | Primary Agent | Content | Posting Frequency |
|----------|--------------|---------|-------------------|
| **Facebook Groups** | content-writer | Value-first posts, soft CTA | 5–10x/day |
| **TikTok/Reels** | content-writer + idea-generator | Short hooks, salary comparisons | 3–5x/day |
| **WhatsApp** | ops-coordinator + customer-success | Broadcasts, DMs, status updates | Daily |
| **Telegram** | integration-agent | Channel outreach, affiliate offers | 5–10 channels/day |
| **Carousell** | integration-agent | Listing optimization, replies | Daily check |
| **Shopee** | integration-agent | Auto-reply, order processing | Daily check |

### 5.2 Weekly Content Themes (Agent-Generated)

| Day | Theme | Agent Prompt |
|-----|-------|-------------|
| Monday | Pain Point Monday | "Write FB post about low MYR salary struggle" |
| Tuesday | Tips Tuesday | "Write 3 tips for Singapore job seekers" |
| Wednesday | Scam Warning Wednesday | "Write warning about fake agents" |
| Thursday | Testimonial Thursday | "Write success story template" |
| Friday | Financial Friday | "Write about managing SGD salary" |
| Saturday | Document Saturday | "Write about required documents checklist" |
| Sunday | Rest / Repost top performer | — |

### 5.3 Trend Spotter Daily Briefing

**trend-spotter agent monitors:**
- "kerja Singapore" search volume on Google Trends
- Trending hashtags on TikTok Malaysia
- New FB group posts about Singapore jobs
- Competitor ebook launches or pricing changes
- News about Malaysia-Singapore border, work permits

**Output:** Daily 8am Telegram briefing to CEO Remy:
```
Trend Report (May 24):
- "Kerja Singapore" TikTok searches +15% this week
- Competitor X launched ebook at RM 67 (higher than ours)
- New FB group "Cari Kerja SG 2026" created (2K members)
- Recommended: Post about IPA delays (trending topic)
```

---

## 6. KPI Dashboard (MFM-Tracked)

### 6.1 Daily Metrics (Auto-Reported to CEO)

| Metric | Target | Tracked By |
|--------|--------|-----------|
| Leads generated (PMs received) | 20+/day | ops-coordinator |
| Sales closed | 3–5/day | finance-planner |
| Revenue (MYR) | RM 141–235/day | finance-planner |
| Content posted | 10+/day | content-writer |
| Copy reviewer approval rate | >90% | quality-reviewer |
| Response time to leads | <15 min | ops-coordinator |
| Delivery time after payment | <5 min | ops-coordinator |

### 6.2 Weekly Review (Every Sunday)

| Review Item | Owner | Output |
|-------------|-------|--------|
| Channel performance | process-optimizer | "FB Groups: 60% of sales. TikTok: 20%. WhatsApp: 20%." |
| Top-performing content | trend-spotter | "Salary comparison post got 45 PMs, 8 sales" |
| Quality scores | quality-reviewer | "Average score: 88. Content improving week-over-week" |
| Financial summary | finance-planner | "Week 1 revenue: RM 1,645. Target: RM 1,645. On track." |
| Process improvements | process-optimizer | "Recommend: Increase FB posts from 5 to 8/day" |

---

## 7. API Cost & Infrastructure

### 7.1 MFM Agent Load for Novaread

| Agent Task | Daily API Calls | Monthly Total | Cost (Free Tier) |
|------------|-----------------|---------------|-----------------|
| content-writer (posts) | 20 | 600 | OpenRouter free |
| quality-reviewer (reviews) | 20 | 600 | OpenRouter free |
| trend-spotter (research) | 5 | 150 | Web fetch + OpenRouter free |
| customer-success (DMs) | 10 | 300 | OpenRouter free |
| ops-coordinator (automation) | 50 | 1,500 | Cloudflare Workers free |
| **Total** | **105** | **3,150** | **MYR 0** |

### 7.2 Free Tier Headroom

- **Cloudflare Workers:** 100K/day limit. Novaread uses ~200/day (0.2% of limit).
- **OpenRouter:** Free tier handles ~500 requests/day. Novaread uses ~55/day (11% of limit).
- **D1:** 500MB limit. Novaread sales data ~5MB/month (1% of limit).
- **R2:** 10GB/month. Ebook files ~50MB (0.5% of limit).
- **KV:** 1GB limit. Session data ~10MB (1% of limit).

**Conclusion:** Novaread project runs entirely within MFM's zero-cost infrastructure.

---

## 8. Risk Mitigation

| Risk | Mitigation | Owner |
|------|-----------|-------|
| **FB group bans** | quality-reviewer checks posts comply with group rules before publishing | quality-reviewer |
| **Payment fraud** | risk-assessor flags suspicious payment patterns; manual verification for first 10 sales | risk-assessor |
| **Ebook piracy** | R2 signed URLs expire after 7 days; watermark PDFs with buyer's phone number | tech-advisor |
| **Lead overflow** | ops-coordinator sets auto-responder; CMO adds more agents if needed | ops-coordinator |
| **Content fatigue** | idea-generator produces new angles weekly; trend-spotter injects fresh topics | idea-generator |
| **Quality drop** | quality-reviewer maintains >85% score threshold; escalates low scores to CMO | quality-reviewer |
| **API rate limits** | Fallback chain: OpenRouter → Workers AI → rule-based responses | tech-advisor |

---

## 9. MFM Project Command

**CEO Remy can issue these commands:**

| Command | Action |
|---------|--------|
| `/novaread status` | Daily sales, leads, revenue summary |
| `/novaread content` | Today's scheduled posts across all platforms |
| `/novaread sales` | Real-time sales tracker |
| `/novaread top channel` | Best performing channel this week |
| `/novaread agent load` | API usage per agent |
| `/novaread review` | Weekly performance report |

---

## 10. Key Takeaways

1. **MFM handles everything** — Content, fulfillment, tracking, optimization, all via 19 agents
2. **Zero additional cost** — Novaread fits within existing free-tier infrastructure
3. **Content engine produces all marketing** — FB posts, TikTok scripts, WhatsApp DMs, all agent-generated
4. **Copy reviewer prevents brand damage** — Every post scored before publication
5. **D1 tracks every lead and sale** — Full funnel visibility for CEO Remy
6. **Automated delivery pipeline** — Payment confirmation → ebook links sent in under 5 minutes
7. **Daily KPIs reported to CEO** — Leads, sales, revenue, response time, all automated
8. **14-day sprint is fully agent-managed** — Human oversight only for payment verification and final approvals

---

*Integration plan complete. Begin Phase 1 (Foundation) immediately.*
