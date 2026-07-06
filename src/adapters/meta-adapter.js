// Meta Adapter — Facebook and Instagram platform adapter

import { SocialAdapter } from './social-adapter.js';

export class MetaAdapter extends SocialAdapter {
  constructor(config) {
    super(config);
    this.platform = config.platform || 'facebook'; // facebook or instagram
    this.maxTextLength = this.platform === 'instagram' ? 2200 : 63206;
    this.maxMediaSize = 100 * 1024 * 1024; // 100MB
    this.supportedMediaTypes = ['image', 'video', 'carousel'];
    this.maxHashtags = 30;
  }

  /**
   * Post content to Meta platform
   * @param {object} content - Content to post
   * @returns {Promise<object>} - Post result
   */
  async post(content) {
    const validation = this.validateContent(content);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const formatted = this.formatContent(content);
    
    // This would call the actual Meta Graph API
    // For now, return a mock response
    return {
      success: true,
      postId: `meta_${this.platform}_${Date.now()}`,
      platform: this.platform,
      url: `https://${this.platform}.com/p/${Date.now()}`,
      postedAt: new Date().toISOString()
    };
  }

  /**
   * Format content for Meta platform
   * @param {object} content - Raw content
   * @returns {object} - Formatted content
   */
  formatContent(content) {
    const formatted = super.formatContent(content);
    
    // Instagram-specific formatting
    if (this.platform === 'instagram') {
      // Instagram prefers cleaner line breaks
      formatted.text = formatted.text.replace(/\n{3,}/g, '\n\n');
      
      // Ensure hashtags are at the very end
      const hashtags = this.extractHashtags(formatted.text);
      if (hashtags.length > 0) {
        const textWithoutHashtags = formatted.text.replace(/#[\w]+/g, '').trim();
        const hashtagString = this.formatHashtags(hashtags);
        formatted.text = `${textWithoutHashtags}\n\n${hashtagString}`;
      }
    }
    
    // Facebook-specific formatting
    if (this.platform === 'facebook') {
      // Facebook allows more flexibility with formatting
      formatted.text = formatted.text;
    }
    
    return formatted;
  }

  /**
   * Get platform-specific posting guidelines
   * @returns {object} - Posting guidelines
   */
  getPostingGuidelines() {
    if (this.platform === 'instagram') {
      return {
        bestTimes: ['8am', '12pm', '6pm'],
        recommendedHashtags: 10,
        emojiUsage: 'high',
        ctaPlacement: 'end of caption or in first line',
        mediaRequirements: {
          image: '1080x1080 (square) or 1080x1350 (portrait)',
          video: '9:16 aspect ratio, 15-60 seconds for Reels',
          carousel: '1080x1080 per slide, max 10 slides'
        }
      };
    }
    
    return {
      bestTimes: ['9am', '1pm', '7pm'],
      recommendedHashtags: 5,
      emojiUsage: 'moderate',
      ctaPlacement: 'end of caption',
      mediaRequirements: {
        image: '1200x630 (landscape) or 1080x1080 (square)',
        video: '16:9 or 1:1 aspect ratio, up to 240 minutes'
      }
    };
  }

  /**
   * Validate content for Meta platform
   * @param {object} content - Content to validate
   * @returns {object} - Validation result
   */
  validateContent(content) {
    const validation = super.validateContent(content);
    
    // Instagram-specific validation
    if (this.platform === 'instagram') {
      if (content.text && content.text.length > 2200) {
        validation.errors.push('Instagram captions cannot exceed 2200 characters');
      }
      
      if (content.mediaUrl && !content.mediaUrl.match(/\.(jpg|jpeg|png|mp4|mov)$/i)) {
        validation.warnings.push('Instagram supports JPG, PNG, MP4, and MOV formats');
      }
    }
    
    // Facebook-specific validation
    if (this.platform === 'facebook') {
      if (content.text && content.text.length > 63206) {
        validation.errors.push('Facebook posts cannot exceed 63,206 characters');
      }
    }
    
    return validation;
  }
}
