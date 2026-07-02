# End-to-End Test Plan — Media Content Pipeline

**Date:** July 3, 2026
**Phase:** 4.4 — End-to-end test with CEO approval flow
**Status:** Ready for execution

## Test Objective

Verify the complete media content pipeline from CEO request to video rendering, including:
- Orchestrator routing to Media Content Director
- Storyboard JSON generation with structured output
- CEO approval gate with content-type detection
- fal.ai rendering job queuing
- Cost estimation and job tracking

## Prerequisites

**Required Secrets:**
- `FAL_API_KEY` — fal.ai API key for video rendering
- `TASK_QUEUE` binding — Cloudflare Queue for async processing
- `mfm_corporation_uploads` binding — R2 for video storage

**Configuration:**
- wrangler.toml must have Queue and R2 bindings configured
- fal.ai account with available credits

## Test Scenarios

### Scenario 1: Video Content Request → Approval → Rendering

**Steps:**
1. CEO sends message: "Create a 15-second video about AI automation for Malaysian SMEs"
2. Verify orchestrator routes to `media-content-director`
3. Verify Media Content Director generates storyboard JSON
4. Verify CEO approval gate triggers with content-type `video`
5. CEO replies `/approve`
6. Verify storyboard is parsed and duration calculated
7. Verify cost estimation is displayed
8. Verify rendering job is queued with fal.ai
9. Verify job ID and estimated cost are returned to CEO

**Expected Output:**
```
🎬 *[VIDEO DRAFT — AWAITING YOUR APPROVAL]*

{
  "strategic_rationale": "...",
  "storyboard": [...],
  "captions": {...},
  "rendering_instructions": {...}
}

---
⚠️ *Video rendering will trigger after approval.*
✅ Reply */approve* to render  |  ❌ Reply */reject* to cancel
_(Auto-expires in 1 hour)_
```

**After Approval:**
```
✅ *Approved & Queued for Rendering — [MEDIA CONTENT DIRECTOR]* _(score: 85/100)_

[Storyboard JSON]

---
🎬 *Video Rendering Queued*

• Job ID: render_1234567890
• Duration: 15s
• Estimated Cost: $0.75
• Model: fal-ai/flux-schnell/v1.1

Rendering will complete in the background. You'll be notified when ready.
```

### Scenario 2: Social Media Content Request → Approval → Post

**Steps:**
1. CEO sends message: "Post to TikTok about our new AI automation service"
2. Verify orchestrator routes to `social-media-agent`
3. Verify Social Media Agent generates 3-variant captions
4. Verify CEO approval gate triggers with content-type `social_publish`
5. CEO replies `/approve`
6. Verify post is executed (mock or actual API call)

**Expected Output:**
```
📱 *[SOCIAL MEDIA DRAFT — AWAITING YOUR APPROVAL]*

{
  "tiktok": "hook-first caption...",
  "instagram": "professional caption...",
  "facebook": "utility-focused caption..."
}

---
⚠️ *Nothing has been posted yet.*
✅ Reply */approve* to post now  |  ❌ Reply */reject* to cancel
_(Auto-expires in 1 hour)_
```

### Scenario 3: Email Content Request → Approval → Send

**Steps:**
1. CEO sends message: "Send email to client about project update"
2. Verify orchestrator routes to `customer-success-agent`
3. Verify Customer Success Agent generates intent-classified response
4. Verify CEO approval gate triggers with content-type `email`
5. CEO replies `/approve`
6. Verify email is sent via SendGrid

**Expected Output:**
```
📧 *[EMAIL DRAFT — AWAITING YOUR APPROVAL]*

{
  "intent": "inquiry",
  "urgency": "medium",
  "category": "service",
  "response": "..."
}

---
⚠️ *Email will be sent after approval.*
✅ Reply */approve* to send  |  ❌ Reply */reject* to cancel
_(Auto-expires in 1 hour)_
```

### Scenario 4: Rejection Flow

**Steps:**
1. CEO sends any content request
2. Verify draft is generated
3. CEO replies `/reject`
4. Verify pending action is cancelled
5. Verify KV entry is deleted

**Expected Output:**
```
❌ Action cancelled and discarded.
```

## Verification Checklist

**Phase 1 — Foundation:**
- [ ] AgentBase validates structured output schema
- [ ] Media Content Director generates valid storyboard JSON
- [ ] Tasks table has state, state_history, content_type columns
- [ ] HITL approval gate detects content type correctly

**Phase 2 — Content Pipeline:**
- [ ] Social Media Agent outputs 3-variant captions
- [ ] Trend Scorer calculates velocity scores
- [ ] Trend Spotter integrates quantitative scoring
- [ ] Sentiment Analyzer provides 0.00-1.00 scores

**Phase 3 — Quality & Safety:**
- [ ] Safe-Zone Validator validates 9:16 layouts
- [ ] Customer Success Agent classifies intent
- [ ] Hashtag Validator checks freshness
- [ ] Platform Adapters format content correctly

**Phase 4 — Video Rendering:**
- [ ] fal.ai wrapper submits rendering jobs
- [ ] Queue integration works for async processing
- [ ] Orchestrator routes to Media Content Director
- [ ] CEO approval triggers rendering queue
- [ ] Cost estimation is accurate

## Test Execution Notes

**Environment:** Cloudflare Workers (production)
**Test User:** CEO Remy (Telegram ID: 6847462500)
**Test Duration:** ~15 minutes for all scenarios

**Rollback Plan:**
If any test fails:
1. Review error logs in Cloudflare Dashboard
2. Check KV entries for stuck pending actions
3. Verify Queue for failed jobs
4. Rollback git commit if necessary

## Success Criteria

All scenarios pass with expected outputs:
- Routing works correctly
- Structured output validates
- Approval gate triggers appropriately
- Rendering jobs queue successfully
- Cost estimates are accurate
- No errors in Cloudflare logs

## Next Steps After Test

1. Deploy to production if tests pass
2. Monitor first few CEO requests
3. Collect feedback on approval flow
4. Adjust cost estimates if needed
5. Optimize rendering model based on quality
