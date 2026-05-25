# MFM Corporation — Content Creation Engine

*Generated: May 24, 2026 | Scope: AI Image, Video, Copy | Markets: Malaysia + Global*

## Executive Summary

MFM Corporation's Content Creation Engine is a **self-improving system** that generates images, videos, and copywriting for both internal brand building and client deliverables. Built on top of the 19-agent corporate hierarchy, the engine uses AI-generated visuals (Leonardo AI, Ideogram, CapCut) and AI-written copy that continuously improves based on engagement data. A dedicated **Copy Reviewer Agent** acts as quality gate for all content before publication. This document covers the market opportunity, technical architecture, legal risk assessment, and multi-format strategy.

---

## 1. AI Image Generation Market

### 1.1 Market Size

| Metric | Value | Source |
|--------|-------|--------|
| Market (2025) | USD 11.65 billion | AVB/SkyQuest |
| Market (2026) | USD 15.18 billion | AVB/SkyQuest |
| YoY Growth | 30.3% | AVB/SkyQuest |
| Projected (2030) | USD 60.8 billion | AVB/SkyQuest |
| Projected (2035) | USD 272.8 billion | AVB/SkyQuest |
| CAGR (2025-2035) | 40.5% | SkyQuest |

### 1.2 Platform Landscape

| Platform | Market Share | Strengths | Free Tier |
|----------|-------------|-----------|-----------|
| **Midjourney** | 26.8% | Highest quality, artistic control | Limited (Discord-based) |
| **DALL-E (OpenAI)** | 24.4% | Integration with ChatGPT, photorealistic | 3 images/day |
| **NightCafe** | 23.2% | Community features, style transfer | 5 credits/day |
| **Stable Diffusion** | 15.1% | Open source, self-hostable | Unlimited (self-hosted) |
| **Leonardo AI** | — | 150+ free images/day, good quality | 150 images/day |
| **Ideogram** | — | Text-in-image accuracy | 25 prompts/day |
| **Adobe Firefly** | — | Commercial-safe training data | 25 credits/month |

**Volume:** 34 million AI images generated daily globally. 15 billion+ total since 2022.

### 1.3 MFM Image Strategy

**Tool Selection (Zero-Cost):**
- **Primary:** Leonardo AI (150 free images/day)
- **Secondary:** Ideogram (text-in-image for social graphics)
- **Tertiary:** Stable Diffusion (self-hosted for sensitive client work)
- **Backup:** Adobe Firefly (commercial-safe for enterprise clients)

**Use Cases:**
- Social media graphics (LinkedIn, X, TikTok)
- Blog post headers
- Client pitch deck visuals
- Ad creative for client campaigns
- Carousel slides

---

## 2. AI Video Generation Market

### 2.1 Market Size

| Metric | Value | Source |
|--------|-------|--------|
| Market (2025) | USD 1.225 billion | Intel Market Research |
| Projected (2034) | USD 21.607 billion | Intel Market Research |
| CAGR | 46.0% | Intel Market Research |

### 2.2 Platform Landscape

| Platform | Strengths | Cost | Fit for MFM |
|----------|-----------|------|-------------|
| **Runway** | $300M revenue, industry standard | $15–76/mo | Premium client work |
| **OpenAI Sora** | High quality, long-form | Limited access | Future integration |
| **Pika** | Fast generation, anime/cinematic | $8–72/mo | Short-form content |
| **Kling AI** | Strong motion, realistic | Subscription | TikTok/Reels |
| **CapCut (ByteDance)** | Free, AI features, editing | Free | **Primary tool** |
| **HeyGen** | AI avatars, talking head | $24–72/mo | Client explainer videos |

### 2.3 MFM Video Strategy

**Tool Selection (Zero-Cost First):**
- **Primary:** CapCut (free, AI effects, editing, captions)
- **Secondary:** Leonardo AI motion (image-to-video, 150 free/day)
- **Tertiary:** Pika/Kling (paid for premium client deliverables)

**Use Cases:**
- Short-form social (TikTok, Reels, Shorts): 15–60 seconds
- Explainer videos: 60–90 seconds
- Behind-the-scenes: Screen recordings + AI captions
- Client testimonials: AI-generated B-roll

---

## 3. Copywriting Agent Architecture

### 3.1 Agent Structure

| Agent | Model | Role | Output |
|-------|-------|------|--------|
| **Copywriter** | meta-llama/llama-3.3-70b-instruct:free | Writes all copy | Drafts |
| **Copy Reviewer** | meta-llama/llama-3.3-70b-instruct:free | QA checks all copy | Approve/Reject |
| **Brand Guardian** | deepseek/deepseek-r1:free | Ensures brand consistency | Guidelines enforcement |
| **Engagement Analyst** | deepseek/deepseek-r1:free | Analyzes performance data | Improvement suggestions |

### 3.2 Copy Types Generated

| Type | Description | Examples |
|------|-------------|----------|
| **Social captions** | Platform-optimized posts | LinkedIn thought leadership, X threads, TikTok hooks |
| **Ad copy** | Conversion-focused | Google Ads, Facebook Ads, LinkedIn Ads |
| **Email sequences** | Nurturing campaigns | Welcome series, re-engagement, product launch |
| **Blog posts** | SEO-optimized articles | "AI automation for Malaysian SMEs" |
| **Landing page copy** | Conversion pages | Service descriptions, pricing pages, case studies |
| **Video scripts** | Short-form content | TikTok scripts, explainer voiceovers |
| **Client deliverables** | Custom copy for clients | Product descriptions, announcement posts |

### 3.3 Brand Voice System

**MFM Brand Voice Attributes:**
- **Professional** — No slang, no emojis (unless platform-appropriate)
- **Data-driven** — Specific numbers, statistics, evidence
- **Confident** — Direct statements, no hedging
- **Malaysian-aware** — References local context when relevant
- **Accessible** — Explains technical concepts simply

**Per-Client Brand Voice:**
- Each client gets a "voice profile" stored in D1
- Profile includes: tone, vocabulary preferences, forbidden words, examples of great copy
- Copywriter agent loads client's voice profile before generating
- Copy Reviewer checks against client's voice profile, not just MFM's

---

## 4. Copy Reviewer QA System

### 4.1 Review Workflow

```
Copywriter generates draft
    |
    v
Copy Reviewer scores (0-100) on 6 dimensions
    |
    +---> Score >= 85: Approve → Client review (if client work) → Publish
    |
    +---> Score 70-84: Send back with specific edits → Rewrite → Re-review
    |
    +---> Score < 70: Reject → Full rewrite with feedback → Re-review
    |
    +---> 3 rejections: Escalate to CMO → Human intervention
```

### 4.2 Scoring Dimensions

| Dimension | Weight | What Checks | Auto-Fail Triggers |
|-----------|--------|-------------|-------------------|
| **Brand Voice** | 25% | Matches voice profile | Wrong tone for platform |
| **Grammar & Spelling** | 20% | Zero errors | Any spelling mistake |
| **Persuasiveness** | 20% | Clear CTA, emotional hook | No CTA, weak hook |
| **Accuracy** | 15% | Facts correct, no hallucinations | Unverifiable claim |
| **Platform Fit** | 15% | Right length, hashtags, format | Wrong format for platform |
| **Legal Safety** | 5% | No defamation, no false claims | Defamatory content |

### 4.3 Human Override Rules

**Auto-approved (no human review needed):**
- Score >= 90
- Internal MFM posts on routine topics
- Client posts on approved recurring themes

**Human review required:**
- Score 70-89
- First post for new client
- Posts on sensitive topics (competitors, regulations, pricing)
- Any post with client-specific data

**CMO approval required:**
- Score < 70
- Posts about MFM financials, partnerships, legal matters
- Any post that could affect brand reputation

---

## 5. Content Improvement Loop

### 5.1 Feedback Cycle

1. **Generate:** AI creates image/video/copy draft
2. **Review:** Copy Reviewer scores and approves/rejects
3. **Publish:** Content goes live on scheduled platform
4. **Measure:** System collects engagement metrics (24h, 7d, 30d)
5. **Analyze:** Engagement Analyst compares vs. historical baseline
6. **Learn:** Identify winning patterns
7. **Adapt:** Update generation templates, prompts, and style guides
8. **Repeat:** Next batch incorporates improvements

### 5.2 Engagement Metrics Tracked

| Metric | Platform | What Tells Us |
|--------|----------|---------------|
| **Engagement rate** | All | Overall content health |
| **Save rate** | Instagram/LinkedIn | Value-perceived content |
| **Share rate** | All | Viral potential |
| **Click-through rate** | All | CTA effectiveness |
| **Comment sentiment** | All | Audience reception |
| **Watch time %** | TikTok/Video | Content stickiness |
| **A/B test win rate** | All | Format/template effectiveness |

### 5.3 Learning Priorities

| Pattern | Action | Timeline |
|---------|--------|----------|
| Carousels with 5 slides outperform 10 | Update template to default 5 slides | Immediate |
| Malay-English bilingual captions get 2x engagement | Generate bilingual by default | 1 week |
| Morning posts (8am) outperform evening | Shift schedule to 7-9am | 2 weeks |
| AI-generated faces reduce engagement | Use abstract graphics instead | 1 month |
| Client X's audience prefers technical depth | Increase technical detail for Client X | Ongoing |

---

## 6. Multi-Format Strategy

### 6.1 Content Formats by Platform

| Platform | Primary Formats | Secondary Formats |
|----------|----------------|-------------------|
| **LinkedIn** | Text + image carousel, Document posts | Native video, Polls |
| **X/Twitter** | Threads (3-7 tweets), Single tweet + image | Quote tweets, Polls |
| **TikTok** | 15-60s video with captions | Stitches, Duets, Carousel |
| **Instagram** | Reels, Carousel posts | Stories, Static posts |
| **YouTube** | Shorts (60s), Long-form (5-10 min) | Community posts |
| **Blog** | 1,000-2,000 word articles | Listicles, Guides |
| **Email** | Newsletter (weekly), Drip sequences | Announcements |

### 6.2 Format-Specific Generation

**Carousels (LinkedIn/Instagram):**
- Copywriter: Write hook slide + 3-5 content slides + CTA slide
- Visual Agent: Generate each slide as separate image
- Reviewer: Check narrative flow across all slides

**X/Twitter Threads:**
- Copywriter: Write hook tweet + 3-6 value tweets + CTA tweet
- Reviewer: Check thread coherence, each tweet standalone-readable

**TikTok Videos:**
- Copywriter: Write 15-60s script with hook
- Visual Agent: Generate B-roll images or select from library
- CapCut: Assemble video with AI captions, transitions, music
- Reviewer: Check script against brand voice

**Blog Posts:**
- Research Agent: Gather facts, statistics, sources
- Copywriter: Write article with headers, bullet points, CTA
- Reviewer: Check accuracy, readability, SEO keywords
- Visual Agent: Generate header image, inline graphics

---

## 7. AI Content IP & Legal Risk Assessment

### 7.1 Global Copyright Status

| Jurisdiction | AI-Generated Content Status | Risk Level |
|--------------|---------------------------|------------|
| **United States** | No copyright protection for purely AI-generated works | High for commercial use |
| **European Union** | Unclear; AI Act proposed but not finalized | Medium-High |
| **United Kingdom** | Copyright possible if "sufficient human involvement" | Medium |
| **Malaysia** | No specific AI copyright law; Copyright Act 1987 applies | Medium |
| **China** | Copyright possible with human creative input | Medium |

### 7.2 Malaysia-Specific Considerations

**Current Legal Framework:**
- Malaysia **Copyright Act 1987** — protects "original" works; AI authorship status unclear
- **PDPA 2010** — regulates personal data; may apply to AI training data containing personal info
- **No AI-specific regulation** as of 2026, but MDEC monitoring global developments
- **49% of Malaysian businesses** hope future regulations provide stable framework (AWS/TechWire Asia)
- **42%** worry about increased compliance costs from future AI regulation

### 7.3 Risk Mitigation Strategy

| Risk | Mitigation | Responsibility |
|------|-----------|--------------|
| **AI image copyright claim** | Hybrid workflow: AI generates → Human edits → Human claims authorship | CMO + Legal review |
| **AI copy plagiarism** | Copy Reviewer runs similarity check; all claims sourced | Copy Reviewer Agent |
| **Client contract disputes** | Clear contract terms: "AI-assisted, human-reviewed deliverables" | CFO |
| **Deepfake/misrepresentation** | Never generate realistic faces of real people without consent | Brand Guardian |
| **Trademark infringement** | No use of client competitors' trademarks in generated content | Copy Reviewer |
| **Defamation** | No negative claims about competitors or individuals | Copy Reviewer (auto-flag) |

### 7.4 Client Contract Terms (AI Content)

**Recommended clauses:**

1. **Ownership:** "Deliverables are AI-assisted and human-reviewed. Client receives full usage rights upon payment. MFM retains the right to use anonymized techniques for future work."

2. **Revision Rights:** "Client may request up to 2 rounds of revisions per deliverable. Additional revisions charged at standard rates."

3. **Liability Limit:** "MFM's liability for any deliverable is limited to the amount paid for that specific deliverable."

4. **AI Disclosure:** "Client acknowledges that deliverables incorporate AI-generated elements, reviewed and approved by human oversight."

5. **No Guarantee:** "MFM does not guarantee specific engagement metrics, viral performance, or conversion rates from content deliverables."

### 7.5 Insurance Recommendation

- **Professional Indemnity Insurance:** Consider once revenue exceeds MYR 50,000/year
- **Coverage:** MYR 100,000–500,000 for claims related to content IP, defamation, or client disputes
- **Cost estimate:** MYR 1,000–3,000/year for small business policy
- **Trigger:** Purchase before signing first enterprise client contract

---

## 8. Tool Stack & Costs

| Function | Tool | Free Tier | Upgrade Trigger |
|----------|------|-----------|-----------------|
| **AI Images** | Leonardo AI | 150 images/day | Client demand > 150/day |
| **AI Images (alt)** | Ideogram | 25 prompts/day | Text-in-image needs |
| **AI Images (self-host)** | Stable Diffusion | Unlimited | Sensitive client work |
| **AI Video** | CapCut | Free | Premium effects needed |
| **AI Video (paid)** | Runway / Pika | — | Client pays for premium |
| **Design** | Canva | Free | Team collaboration needed |
| **Copy QA** | Built-in (Copy Reviewer) | Free | Always |
| **Plagiarism Check** | Quetext / Grammarly | Limited | Client requires proof |
| **Social Scheduling** | Buffer | 3 channels | Client has >3 channels |

---

## 9. Key Takeaways

1. **Image market is massive** — $15.18B in 2026, 40.5% CAGR; Leonardo AI provides 150 free images/day
2. **Video market growing faster** — 46% CAGR; CapCut is the zero-cost entry point
3. **Copy Reviewer is non-negotiable** — Prevents brand damage, legal risk, and quality inconsistency
4. **Hybrid human-AI workflow** — AI generates, human reviews, human claims authorship (copyright safety)
5. **Malaysia has no AI copyright law yet** — Opportunity window; monitor MDEC for regulatory changes
6. **Client contracts must disclose AI use** — Transparency builds trust, limits liability
7. **Content improves iteratively** — Engagement data feeds back into generation templates
8. **Multi-format is essential** — Same message adapted for LinkedIn, X, TikTok, blog, email

---

*End of Content Creation Engine Report. Next deliverable: API Cost Optimization.*
