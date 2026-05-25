# Blueprint Concepts Implementation Report for MFM Corporation

**Date**: 24 May 2026  
**Scope**: Marketing & Media Teams + Cross-department skills/tools adoption  
**Objective**: Identify best concepts from the Autonomous Short-Form Media Swarm blueprint, map them to MFM's existing architecture, flag issues, and provide solutions.

---

## CURRENT MFM ARCHITECTURE AUDIT

### What's Built & Working

| Component | Status | Details |
|---|---|---|
| `orchestrator.js` | ✅ Production | Intent classification, 20-agent routing, HITL approval gate (`/approve`, `/reject`, `/draft`, `/edit`), parallel agent dispatch |
| `agent-base.js` | ✅ Production | Base class with tool calling, D1 memory (20-turn history), metrics tracking, draft mode support |
| `llm-client.js` | ✅ Production | Cerebras primary → OpenRouter fallback chain with circuit breaker |
| `quality-reviewer.js` | ✅ Production | 0-100 scoring with auto-rewrite for scores < 70 |
| `context-card.js` | ✅ Production | Dossier pattern: company context, top agents, recent tasks injected into every call |
| CMO Agents | ✅ Built | `content-writer`, `market-analyst`, `customer-success-agent`, `social-media-agent` |
| CINO Agents | ✅ Built | `trend-spotter`, `mcp-llm-agent`, `research-agent`, `idea-generator`, `innovation-coach` |
| COO/CTO/CFO/CLO | ✅ Built | All agent classes exist with system prompts |
| `social-media-tool.js` | ✅ Built | Facebook, Instagram, TikTok posting via official APIs |
| `web-fetch.js` | ✅ Built | Content extraction + Jina AI fallback |
| `d1-store.js` | ✅ Built | Tasks, memory, decisions, metrics, routing scores |
| `telegram-bot-agent.js` | ✅ Production | Webhook handler, rate limiting, deduplication, scheduled briefings |
| D1 Database | ✅ Bound | `tasks`, `agent_memory`, `decisions`, `metrics`, `routing_scores` |
| KV Storage | ✅ Bound | Rate limiting, context caching, pending approvals |
| R2 Storage | ✅ Bound | File uploads (currently empty) |

### What's Missing / Stubbed

| Component | Status | Gap |
|---|---|---|
| Video rendering | ❌ Missing | No FFmpeg, no cloud video API integration |
| Trend scraping (velocity scoring) | ❌ Partial | `trend-spotter` exists but no quantitative velocity equation |
| Storyboard structured output | ❌ Missing | Agents return prose, not JSON storyboards |
| Safe-zone bounding check | ❌ Missing | No 9:16 layout validation |
| Platform caption optimization (3 variants) | ❌ Partial | `social-media-agent` mentions different copy but doesn't enforce structured output |
| Inbound intent classification | ❌ Partial | `customer-success-agent` handles clients but no spam/support/lead/casual auto-tagging |
| Content calendar / scheduling | ❌ Missing | No cron-based publishing beyond scheduled briefings |
| MCP server integration | ❌ Missing | No MCP client in codebase; only direct API calls |
| Analytics feedback loop | ❌ Missing | No performance data ingestion from platform APIs |
| A/B testing framework | ❌ Missing | No content variation testing |

---

## PART 1: ADOPTABLE BLUEPRINT CONCEPTS FOR MARKETING & MEDIA

### 1.1 Storyboard Structure (Hook / Value Core / CTA)

**Blueprint Source**: Section 2.2, 5.1 — "3-part storyboard records comprising Hook (1.5–3.0s), Value Core (3.0–10.0s), Micro-Call-to-Action (2.0s)"

**Current MFM State**: `content-writer` has a "Creative DNA Framework" (Hook/Promise/Proof/CTA) but it's email/article focused, not video-first. `social-media-agent` mentions "Hook/Value/CTA" but doesn't enforce structured output.

**Implementation Plan**:

```
File: src/agents/cmo/media-content-director.js (NEW)
Role: Extends AgentBase with structured storyboard output
Tools: ['web-fetch', 'exa-search']
Output: JSON schema matching blueprint's storyboard format
```

**System Prompt Addition**:
```
You MUST respond with a valid JSON object matching this schema:
{
  "strategic_rationale": "why this trend/topic was chosen",
  "storyboard": [
    {"scene_index": 1, "duration_seconds": 2.5, "visual_description": "...", "on_screen_text": "...", "audio_notes": "..."}
  ],
  "captions": {"tiktok": "...", "instagram": "...", "facebook": "..."},
  "rendering_instructions": {"bg_audio_volume_db": -18, "font_family": "Arial Black", "font_color_hex": "#FFFF00"}
}
```

**Issues & Solutions**:

| Issue | Solution |
|---|---|
| LLMs don't always return valid JSON | Add `parseJSON()` retry loop in `agent-base.js` (already exists in `llm-client.js`); extend to agent outputs |
| No video rendering engine to consume storyboard | See Section 2.2 (Cloud Rendering) below |
| JSON schema too rigid for creative work | Make `storyboard` array flexible (min 2 scenes, max 5); allow `null` for optional fields |

---

### 1.2 HITL Approval Gate Enhancement

**Blueprint Source**: Section 1 — "no destructive or creative state mutation interacts with public APIs without human confirmation"

**Current MFM State**: Already implemented in `orchestrator.js` lines 191-202. `requiresApproval()` checks agent + keywords. `/approve`, `/reject`, `/draft`, `/edit` commands exist.

**Gap**: Approval gate only triggers on keyword detection (`send email`, `post to`, `publish`). It doesn't check if the output contains a video URL or if it's a new content type.

**Implementation Plan**:

```javascript
// In orchestrator.js, expand APPROVAL_KEYWORDS and add content-type detection
const APPROVAL_CONTENT_TYPES = [
  { pattern: /videoUrl|video_url|\.mp4|tiktok/i, label: 'video-content' },
  { pattern: /post to|publish|schedule.*post/i, label: 'social-publish' },
  { pattern: /send email|email to|notify/i, label: 'email-send' }
];
```

**Issues & Solutions**:

| Issue | Solution |
|---|---|
| Keyword list can be bypassed with synonyms | Use LLM-based intent classification for "irreversible external action" instead of regex |
| Pending approvals expire in 1 hour (hardcoded) | Make TTL configurable via `system_settings` table |
| No batch approval for multiple items | Add `/approve-all` command or dashboard UI for bulk actions |

---

### 1.3 Platform-Specific Caption Optimization

**Blueprint Source**: Section 2.4, 5.1 — "TikTok: Leading SEO keywords... Instagram: Professional layout... Facebook: Direct, focus on utility"

**Current MFM State**: `social-media-agent.js` has platform rules (lines 14-18) but outputs prose. The `[TOOL:social-post|...]` syntax expects a single `text`/`caption` field.

**Implementation Plan**:

```javascript
// Enhance social-media-agent.js system prompt:
// "For multi-platform requests, ALWAYS output THREE distinct captions:
// - tiktok_caption: hook-first, 3-5 trending hashtags, casual tone
// - instagram_caption: professional, 5-10 niche hashtags, clean line breaks
// - facebook_caption: utility-focused, 0-3 hashtags, shareable CTA"
```

**Issues & Solutions**:

| Issue | Solution |
|---|---|
| `social-post` tool only accepts one caption at a time | Add `postMultiPlatform()` wrapper that loops through platforms with their respective captions |
| No hashtag validation (trending vs dead) | Add `hashtag-validator` tool using exa-search or web-fetch to check hashtag recency |
| Character limits not enforced | Add pre-flight check in `postSocial()` before calling APIs |

---

### 1.4 Trend Velocity Scoring

**Blueprint Source**: Section 2.1 — `Av = (ΔI3h / Δt) × log(Vtotal)`

**Current MFM State**: `trend-spotter` identifies trends qualitatively but has no quantitative scoring.

**Implementation Plan**:

```javascript
// New tool: src/tools/trend-scorer.js
// Input: trend topic + platform
// Process: 
//   1. web-fetch TikTok Creative Center or similar public metrics page
//   2. Parse engagement impressions (I) and sound usage (V) if available
//   3. Calculate velocity score
// Output: { trend_id, velocity_score, confidence, source_url }
```

**Issues & Solutions**:

| Issue | Solution |
|---|---|
| Platform APIs don't expose raw impression data for trends | Use proxy metrics: hashtag post count growth (via web scraping), Google Trends API, or TikTok Creative Center public data |
| Equation assumes linear time; social trends are non-linear | Replace with simpler heuristic: `score = (posts_last_24h / posts_last_7d_avg) * log(total_posts)` |
| False positives on paid/promoted trends | Flag suspected promoted content; add "organic vs paid" confidence factor |

---

### 1.5 Inbound Intent Classification

**Blueprint Source**: Section 2.6, 5.2 — spam/support/lead/casual tagging with suggested replies

**Current MFM State**: `customer-success-agent` handles client relations but no auto-classification.

**Implementation Plan**:

```javascript
// Enhance customer-success-agent.js system prompt:
// "When given inbound text from social media or email, classify as:
// - spam: drop-shipping, link bots, generic insults
// - support: practical questions, errors
// - lead: buying indicators, pricing requests
// - casual: praise, emojis, basic interactions
// Output JSON: { intent_tag, sentiment_score, confidence, suggested_reply, suggested_dm }"
```

**Issues & Solutions**:

| Issue | Solution |
|---|---|
| Auto-replies may violate platform ToS | Only draft replies; require CEO approval before sending (HITL gate) |
| PDPA compliance for DM handling | Log consent status per user in `inbound_interactions` table; don't store PII without consent |
| Multilingual comments (BM, English, Chinese) | Add language detection to prompt; default to English for internal processing |

---

### 1.6 Safe-Zone Bounding Check

**Blueprint Source**: Section 2.5 — "Checks asset layout positioning against 9:16 safe-zone bounding matrix"

**Current MFM State**: No image/video validation exists.

**Implementation Plan**:

```javascript
// New tool: src/tools/safe-zone-validator.js
// Uses HTML5 Canvas API (available in Workers via OffscreenCanvas or WASM)
// Input: image dimensions, text overlay positions (x, y as ratios)
// Rules:
//   - y must be in [0.20, 0.75] to avoid platform UI overlap
//   - x must be in [0.00, 0.80] to avoid right-side buttons
//   - font size must be >= 24px equivalent for readability
// Output: { pass: boolean, violations: [], recommendations: [] }
```

**Issues & Solutions**:

| Issue | Solution |
|---|---|
| Cloudflare Workers don't support native image processing | Use `@cloudflare/images` binding or call external microservice (fal.ai/img2img for validation) |
| Platform safe zones differ (TikTok vs IG vs FB) | Maintain per-platform matrices; validate against the target platform |
| False positives on artistic edge-case layouts | Allow `forceOverride` flag in rendering instructions for CEO-approved edge cases |

---

## PART 2: VIDEO RENDERING — THE HARD PROBLEM

### Issue: FFmpeg Local Dependency

The blueprint requires local FFmpeg binaries. MFM runs on Cloudflare Workers (serverless, no local binaries, 30-second timeout).

### Solutions (Ranked)

| Solution | Pros | Cons | Effort |
|---|---|---|---|
| **A. Cloudflare Images/Stream** | Native integration, no egress cost, MFM already on Cloudflare | Limited video compositing features; mostly transcode, not stitch/edit | 2 days |
| **B. fal.ai Video API** | High-quality AI video generation, simple REST API, pay-per-use | Cost scales with volume; external dependency | 1 day |
| **C. Replicate API** | Broad model selection (ffmpeg, moviepy, etc. as API) | Per-minute pricing can get expensive | 1 day |
| **D. AWS Elemental MediaConvert** | Enterprise-grade, full FFmpeg feature parity | Complex setup, AWS dependency, not serverless-friendly | 1 week |
| **E. Dedicated Render Worker** | Run FFmpeg on a VPS (Fly.io, Railway) triggered by MFM Worker | Adds infrastructure to manage, breaks $0/month model | 3 days |

**Recommendation**: **Option B (fal.ai)** for rapid prototyping + **Option A (Cloudflare Stream)** for simple transcoding. Combine: storyboard → fal.ai video generation → Cloudflare Stream hosting → social post.

---

## PART 3: SKILLS & TOOLS FROM BLUEPRINT THAT BENEFIT ALL MFM

### 3.1 MCP Server Abstraction Pattern

**Blueprint Source**: Section 3 — "MCP specifications to abstract underlying social platform APIs into unified, declarative tool primitives"

**MFM Application**: MFM currently has hardcoded API calls in `social-media-tool.js` (Facebook Graph API, TikTok API). The MCP pattern would wrap these into declarative tools that any agent can discover and use.

**Benefit for All Teams**:
- **CTO**: New integrations (Slack, Notion, HubSpot) become MCP server additions, not code changes
- **CINO**: MCP-LLM agent can evaluate and onboard new tools dynamically
- **CMO**: Social media, email, CRM all share one tool interface

**Implementation**:
```javascript
// New: src/tools/mcp-client.js
// Lightweight MCP client that connects to stdio or HTTP MCP servers
// Maps MCP tool definitions to AgentBase tool calls
```

---

### 3.2 Structured JSON Output Schemas

**Blueprint Source**: Sections 5.1, 5.2 — All agent outputs must match strict JSON schemas.

**MFM Application**: Currently, MFM agents output prose. QualityReviewer parses and scores prose. Adding structured output enables:
- **CFO**: Financial tables as JSON → auto-rendered charts in dashboard
- **COO**: Task lists as JSON → auto-synced to project management tools
- **CTO**: Code review comments as JSON → auto-created GitHub issues

**Implementation**:
```javascript
// Add to agent-base.js:
// this.outputSchema = options.outputSchema || null;
// If outputSchema is set, AgentBase.run() validates LLM output against schema
// and retries up to 2 times if invalid
```

---

### 3.3 Sentiment Scoring (0.00–1.00)

**Blueprint Source**: Section 5.2 — `sentiment_score: NUMERIC(3,2)`

**MFM Application**: Add sentiment analysis to:
- **Customer Success**: Flag at-risk clients before churn
- **Security Auditor**: Detect negative sentiment in external mentions of MFM
- **Market Analyst**: Gauge market reaction to competitor news

**Implementation**:
```javascript
// New tool: src/tools/sentiment-analyzer.js
// Uses lightweight LLM call (CEREBRAS_FAST) with prompt:
// "Rate the sentiment of this text from 0.00 (extremely negative) to 1.00 (extremely positive).
// Return ONLY a JSON object: { score, confidence, dominant_emotion }"
```

---

### 3.4 Platform API Adapter Pattern

**Blueprint Source**: Section 3 — Vista Social, Eclincher, OneUp as unified adapters.

**MFM Application**: MFM's `social-media-tool.js` directly calls Meta and TikTok APIs. The adapter pattern would create:
```
src/adapters/
  social-adapter.js        // Abstract interface
  meta-adapter.js          // Facebook + Instagram
  tiktok-adapter.js        // TikTok
  linkedin-adapter.js      // Future
  youtube-adapter.js       // Future
```

**Benefit**: Adding a new platform (LinkedIn, YouTube, X) requires only a new adapter file, not changes to agents.

---

### 3.5 Database State Machine (Campaign Lifecycle)

**Blueprint Source**: Section 4 — PostgreSQL enum: `analyzing → scripting → rendering → ready_for_review → approved → rejected → published → failed_execution`

**MFM Application**: MFM's `tasks` table has `status: pending → completed`. Adding a state machine would benefit:
- **All teams**: Tasks can have rich lifecycle states
- **COO**: Bottleneck detection by measuring time-in-state
- **Quality Reviewer**: Auto-flag tasks stuck in `review` > 24 hours

**Implementation**:
```sql
-- Add to D1 schema:
ALTER TABLE tasks ADD COLUMN state TEXT DEFAULT 'pending' 
  CHECK (state IN ('pending','analyzing','drafting','reviewing','approved','rejected','executing','completed','failed'));
ALTER TABLE tasks ADD COLUMN state_history JSONB DEFAULT '[]';
```

---

## PART 4: IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Week 1)

| Task | Files | Owner |
|---|---|---|
| Add structured output support to AgentBase | `src/core/agent-base.js` | CTO |
| Create `media-content-director` agent | `src/agents/cmo/media-content-director.js` | CMO |
| Add state machine to tasks | `src/db/schema.sql`, `src/tools/d1-store.js` | CTO |
| Enhance HITL gate with content-type detection | `src/core/orchestrator.js` | CTO |

### Phase 2: Content Pipeline (Week 2)

| Task | Files | Owner |
|---|---|---|
| Enhance `social-media-agent` with 3-variant caption output | `src/agents/cmo/social-media-agent.js` | CMO |
| Add `trend-scorer` tool | `src/tools/trend-scorer.js` | CINO |
| Enhance `trend-spotter` with quantitative scoring | `src/agents/cino/trend-spotter.js` | CINO |
| Add `sentiment-analyzer` tool | `src/tools/sentiment-analyzer.js` | COO |

### Phase 3: Quality & Safety (Week 3)

| Task | Files | Owner |
|---|---|---|
| Add `safe-zone-validator` tool | `src/tools/safe-zone-validator.js` | Media Team |
| Enhance `customer-success-agent` with intent classification | `src/agents/cmo/customer-success-agent.js` | CMO |
| Add hashtag validator | `src/tools/hashtag-validator.js` | Marketing |
| Create platform adapter abstraction | `src/adapters/` | CTO |

### Phase 4: Video Rendering (Week 4)

| Task | Files | Owner |
|---|---|---|
| Evaluate fal.ai vs Cloudflare Stream | Research | CTO |
| Integrate chosen rendering API | `src/tools/video-renderer.js` | CTO |
| Connect `media-content-director` → renderer → `social-media-agent` | Orchestration | CMO |
| End-to-end test with CEO approval | `tests/` | COO |

---

## PART 5: ISSUE-SOLUTION QUICK REFERENCE

| # | Issue | Impact | Solution | Effort |
|---|---|---|---|---|
| 1 | FFmpeg doesn't run on Workers | BLOCKER for video | Use fal.ai / Replicate / Cloudflare Stream API | 2-3 days |
| 2 | LangGraph is Python; MFM is JS | BLOCKER for engine | Keep MFM's orchestrator; adapt graph patterns to JS | 0 days (already better) |
| 3 | MCP servers (Vista, Eclincher, OneUp) cost money | COST RISK | Build own adapters using existing APIs; evaluate MCP later | 1 week |
| 4 | Hardcoded secrets in blueprint PDF | SECURITY RISK | Rotate any exposed credentials; never use PDF values | 1 hour |
| 5 | No PDPA/GDPR compliance in blueprint | LEGAL RISK | Add consent logging to `inbound_interactions`; audit data retention | 2 days |
| 6 | Audio scraping = copyright violation | LEGAL RISK | Use licensed stock audio or platform-native music | 1 day |
| 7 | Blueprint scope = Reels only | SCOPE RISK | Integrate as CMO sub-team; don't divert from broader marketing | 0 days (design decision) |
| 8 | No analytics feedback loop | QUALITY RISK | Ingest platform metrics (views, engagement) back to `metrics` table | 3 days |
| 9 | QualityReviewer scores prose, not structure | QUALITY RISK | Add schema validation step before QualityReviewer | 1 day |
| 10 | No content scheduling engine | OPS GAP | Extend cron triggers in `telegram-bot-agent.js` for publishing | 2 days |

---

## PART 6: FILES TO CREATE / MODIFY

### New Files
```
src/agents/cmo/media-content-director.js    # Storyboard + caption generation
src/tools/trend-scorer.js                   # Quantitative trend velocity
src/tools/sentiment-analyzer.js             # Text sentiment scoring
src/tools/safe-zone-validator.js            # 9:16 layout validation
src/tools/hashtag-validator.js              # Hashtag freshness check
src/tools/video-renderer.js                 # Cloud rendering API wrapper
src/tools/mcp-client.js                     # MCP server abstraction (future)
src/adapters/social-adapter.js              # Abstract social platform interface
src/adapters/meta-adapter.js               # Facebook + Instagram concrete
src/adapters/tiktok-adapter.js             # TikTok concrete
```

### Modified Files
```
src/core/agent-base.js                      # Add outputSchema validation
src/core/orchestrator.js                    # Enhance HITL gate + content-type detection
src/core/quality-reviewer.js                # Add schema-aware scoring
src/agents/cmo/social-media-agent.js        # 3-variant caption output
src/agents/cmo/customer-success-agent.js    # Intent classification JSON output
src/agents/cino/trend-spotter.js            # Add velocity scoring
src/tools/social-media-tool.js              # Add multi-platform batch post
src/tools/d1-store.js                       # Add state machine helpers
src/db/schema.sql                          # Add state + state_history columns
```

---

## SUMMARY

**Best Concepts to Adopt**:
1. Structured storyboard JSON output (Hook/Value/CTA)
2. Enhanced HITL approval gate with content-type detection
3. Platform-specific caption optimization (3 variants)
4. Trend velocity scoring (quantitative)
5. Inbound intent classification (spam/support/lead/casual)
6. Safe-zone bounding validation

**Cross-Team Skills/Tools**:
- MCP abstraction pattern (CTO/CINO)
- Structured JSON output schemas (All departments)
- Sentiment scoring (Customer Success, Security, Market Analyst)
- Platform adapter pattern (CTO)
- Database state machine (COO, All teams)

**Critical Issues to Solve**:
1. Video rendering: Use fal.ai or Cloudflare Stream (NOT FFmpeg)
2. Security: Do NOT use any credentials from the blueprint PDF
3. Compliance: Add PDPA consent logging before handling DMs/comments
4. Cost: Avoid paid MCP servers; build on MFM's $0/month stack

**Estimated Timeline**: 4 weeks for full Marketing & Media pipeline integration, assuming 1 developer working part-time.
