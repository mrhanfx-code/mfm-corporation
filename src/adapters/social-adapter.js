// Social Adapter — general social media platform adapter

import { BasePlatformAdapter } from './base-adapter.js';

export class SocialAdapter extends BasePlatformAdapter {
  constructor(config) {
    super(config);
    this.maxTextLength = 2200;
    this.maxMediaSize = 100 * 1024 * 1024; // 100MB
    this.supportedMediaTypes = ['image', 'video'];
    this.maxHashtags = 30;
  }

  /**
   * Post content to social media
   * @param {object} content - Content to post
   * @returns {Promise<object>} - Post result
   */
  async post(content) {
    const validation = this.validateContent(content);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const formatted = this.formatContent(content);
    
    // This would call the actual social media API
    // For now, return a mock response
    return {
      success: true,
      postId: `social_${Date.now()}`,
      platform: this.platform,
      url: `https://${this.platform}.com/post/${Date.now()}`,
      postedAt: new Date().toISOString()
    };
  }

  /**
   * Format content for social media
   * @param {object} content - Raw content
   * @returns {object} - Formatted content
   */
  formatContent(content) {
    const formatted = {
      text: content.text || '',
      mediaUrl: content.mediaUrl || null,
      hashtags: this.extractHashtags(content.text || '')
    };

    // Ensure hashtags are at the end
    if (formatted.hashtags.length > 0) {
      const textWithoutHashtags = formatted.text.replace(/#[\w]+/g, '').trim();
      const hashtagString = this.formatHashtags(formatted.hashtags);
      formatted.text = `${textWithoutHashtags}\n\n${hashtagString}`;
    }

    return formatted;
  }

  /**
   * Get platform-specific posting guidelines
   * @returns {object} - Posting guidelines
   */
  getPostingGuidelines() {
    return {
      bestTimes: ['9am', '1pm', '7pm'],
      recommendedHashtags: 5,
      emojiUsage: 'moderate',
      ctaPlacement: 'end of caption',
      mediaRequirements: {
        image: '1080x1080 or 1080x1350',
        video: '9:16 aspect ratio, 15-60 seconds'
      }
    };
  }
}
