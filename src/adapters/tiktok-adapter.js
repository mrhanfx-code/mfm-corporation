// TikTok Adapter — TikTok platform adapter

import { SocialAdapter } from './social-adapter.js';

export class TikTokAdapter extends SocialAdapter {
  constructor(config) {
    super(config);
    this.platform = 'tiktok';
    this.maxTextLength = 150; // TikTok captions are shorter
    this.maxMediaSize = 500 * 1024 * 1024; // 500MB for videos
    this.supportedMediaTypes = ['video'];
    this.maxHashtags = 5; // TikTok recommends fewer hashtags
  }

  /**
   * Post content to TikTok
   * @param {object} content - Content to post
   * @returns {Promise<object>} - Post result
   */
  async post(content) {
    const validation = this.validateContent(content);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const formatted = this.formatContent(content);
    
    // This would call the actual TikTok API
    // For now, return a mock response
    return {
      success: true,
      postId: `tiktok_${Date.now()}`,
      platform: 'tiktok',
      url: `https://tiktok.com/@username/video/${Date.now()}`,
      postedAt: new Date().toISOString()
    };
  }

  /**
   * Format content for TikTok
   * @param {object} content - Raw content
   * @returns {object} - Formatted content
   */
  formatContent(content) {
    const formatted = {
      text: content.text || '',
      mediaUrl: content.mediaUrl || null,
      hashtags: this.extractHashtags(content.text || '')
    };

    // TikTok-specific formatting
    // Hook in first 3 words
    const words = formatted.text.split(' ');
    if (words.length > 3) {
      const hook = words.slice(0, 3).join(' ');
      const rest = words.slice(3).join(' ');
      formatted.text = `${hook}\n${rest}`;
    }

    // Hashtags at the end, limited to 5
    if (formatted.hashtags.length > 0) {
      const textWithoutHashtags = formatted.text.replace(/#[\w]+/g, '').trim();
      const topHashtags = formatted.hashtags.slice(0, 5);
      const hashtagString = this.formatHashtags(topHashtags);
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
      bestTimes: ['7am', '2pm', '9pm'],
      recommendedHashtags: 3,
      emojiUsage: 'high',
      ctaPlacement: 'first line or end of caption',
      mediaRequirements: {
        video: '9:16 aspect ratio, 15-60 seconds, vertical only',
        audio: 'Use trending sounds for better reach',
        captions: 'Auto-captions recommended for accessibility'
      },
      contentTips: {
        hook: 'First 3 words must stop the scroll',
        pacing: 'Fast cuts, dynamic content',
        trending: 'Use trending sounds and effects',
        consistency: 'Post daily for algorithm favor'
      }
    };
  }

  /**
   * Validate content for TikTok
   * @param {object} content - Content to validate
   * @returns {object} - Validation result
   */
  validateContent(content) {
    const validation = super.validateContent(content);
    
    // TikTok-specific validation
    if (content.text && content.text.length > 150) {
      validation.errors.push('TikTok captions cannot exceed 150 characters');
    }
    
    if (!content.mediaUrl) {
      validation.errors.push('TikTok requires video content');
    }
    
    if (content.mediaUrl && !content.mediaUrl.match(/\.(mp4|mov|webm)$/i)) {
      validation.warnings.push('TikTok supports MP4, MOV, and WebM video formats');
    }
    
    // Check for hook in first 3 words
    if (content.text) {
      const firstThreeWords = content.text.split(' ').slice(0, 3).join(' ');
      if (firstThreeWords.length < 10) {
        validation.warnings.push('Hook should be at least 10 characters for better engagement');
      }
    }
    
    return validation;
  }

  /**
   * Extract trending sounds from content metadata
   * @param {object} metadata - Content metadata
   * @returns {string} - Trending sound ID or name
   */
  extractTrendingSound(metadata) {
    return metadata.soundId || metadata.soundName || null;
  }

  /**
   * Get trending hashtags for TikTok
   * @param {string} topic - Topic to get trending hashtags for
   * @returns {string[]} - Trending hashtags
   */
  getTrendingHashtags(topic) {
    const trendingMap = {
      'business': ['#business', '#entrepreneur', '#startup', '#businesstips'],
      'ai': ['#ai', '#artificialintelligence', '#tech', '#innovation'],
      'marketing': ['#marketing', '#digitalmarketing', '#socialmediamarketing', '#branding'],
      'malaysia': ['#malaysia', '#malaysian', '#my', '#kualalumpur'],
      'default': ['#fyp', '#foryou', '#viral', '#trending']
    };
    
    return trendingMap[topic.toLowerCase()] || trendingMap['default'];
  }
}
