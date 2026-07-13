import { AgentBase } from '../../core/agent-base.js';
import { MODELS } from '../../core/llm-client.js';
import { createApprovalRequest } from '../../core/approval-manager.js';

const CAPTION_VARIANT_SCHEMA = {
  tiktok: 'string (hook-first, 3-5 hashtags, casual tone)',
  instagram: 'string (professional, 5-10 hashtags, clean line breaks)',
  facebook: 'string (utility-focused, 0-3 hashtags, shareable CTA)'
};

export class SocialMediaAgent extends AgentBase {
  constructor() {
    super({
      name: 'social-media-agent',
      model: MODELS.CEREBRAS_FAST,
      tools: ['social-post', 'web-fetch', 'exa-search'],
      outputSchema: CAPTION_VARIANT_SCHEMA,
      systemPrompt: `You are the Social Media Manager for MFM Corporation, reporting to the CMO.
Platforms managed: Facebook, Instagram, TikTok.
Brand voice: professional yet approachable, confident, culturally relevant to Malaysia.

You MUST respond with valid JSON matching this schema:
{
  "tiktok": "hook-first caption with 3-5 trending hashtags, casual tone",
  "instagram": "professional caption with 5-10 niche hashtags, clean line breaks",
  "facebook": "utility-focused caption with 0-3 hashtags, shareable CTA"
}

PLATFORM RULES:
- Facebook: 1-3 paragraphs max, can include links, business-focused audience
- Instagram: punchy caption + 5-10 hashtags, visual-forward, lifestyle/brand feel
- TikTok: hook in first 3 words, casual tone, trending angle, requires videoUrl

CONTENT FRAMEWORK (apply to all 3 variants):
- Hook: First line stops the scroll
- Value: What does the audience get from reading this?
- CTA: Follow, comment, visit, or share — one action only

TIMING (MYT UTC+8): Best post times:
- Facebook: 9am, 1pm, 7pm
- Instagram: 8am, 12pm, 6pm
- TikTok: 7am, 2pm, 9pm

VIDEO POSTING WORKFLOW:
- When CEO shares a video file/URL, create an approval request first
- For TikTok: create approval request with platform="tiktok", videoUrl, caption
- For Instagram Reels: create approval request with platform="instagram", videoUrl, caption
- If CEO doesn't have a video yet, tell them: "Ask media-producer for a video prompt, generate it with Kling or Seedance, then share the URL here and I'll post it."

CONTENT CREATION WORKFLOW (no video needed):
- Generate 3 platform-optimised caption variants in JSON format
- Create approval request for the requested platform with the appropriate variant
- For image posts, auto-generate image using the AI image tool if no imageUrl provided

APPROVAL WORKFLOW:
- Before posting, create an approval request using the approval system
- Include platform, content, media URL, and scheduled time in the request
- Return the approval ID to CEO for review
- Once approved, the post will be automatically scheduled/published
- If rejected, ask CEO for revisions

Never post without explicit CEO approval unless instructed to auto-publish.`
    });
  }

  async run(userMessage, userId, env, options = {}) {
    // Check if this is a post request
    const lowerMessage = userMessage.toLowerCase();
    const isPostRequest = lowerMessage.includes('post') || lowerMessage.includes('publish') || lowerMessage.includes('share');
    
    if (isPostRequest && !options.skipApproval) {
      // Parse platform from message
      let platform = null;
      if (lowerMessage.includes('tiktok')) platform = 'tiktok';
      else if (lowerMessage.includes('instagram')) platform = 'instagram';
      else if (lowerMessage.includes('facebook')) platform = 'facebook';
      
      if (platform) {
        // Generate content first using the base agent
        const content = await super.run(userMessage, userId, options);
        
        try {
          // Create approval request
          const approvalRequest = await createApprovalRequest({
            platform,
            content,
            mediaUrl: options.mediaUrl || null,
            scheduledFor: options.scheduledFor || null,
            metadata: {
              originalMessage: userMessage,
              generatedAt: new Date().toISOString()
            }
          }, userId, env);
          
          const expiresFormatted = new Date(approvalRequest.expires_at).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' });
          
          return `✅ **Approval Request Created**

I've prepared your ${platform} post for review:

**Content Preview:**
${content.slice(0, 300)}${content.length > 300 ? '...' : ''}

**Approval ID:** ${approvalRequest.id}
**Status:** Pending approval
**Expires:** ${expiresFormatted}

To approve this post, use the approval endpoint or dashboard with the approval ID above.
The post will be published automatically once approved.`;
        } catch (error) {
          // If approval system fails, fall back to direct posting
          return `⚠️ Approval system unavailable. Falling back to direct posting.\n\n${content}`;
        }
      }
    }
    
    // Default behavior for non-post requests or when approval is skipped
    return super.run(userMessage, userId, options);
  }
}
