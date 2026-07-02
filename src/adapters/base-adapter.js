// Base Platform Adapter — abstract interface for social media platforms

export class BasePlatformAdapter {
  constructor(config) {
    this.platform = config.platform;
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.accessToken = config.accessToken;
  }

  /**
   * Post content to the platform
   * @param {object} content - Content to post (text, media, etc.)
   * @returns {Promise<object>} - Post result with ID and URL
   */
  async post(content) {
    throw new Error('post() must be implemented by subclass');
  }

  /**
   * Validate content before posting
   * @param {object} content - Content to validate
   * @returns {object} - Validation result with errors and warnings
   */
  validateContent(content) {
    const errors = [];
    const warnings = [];

    if (!content.text && !content.mediaUrl) {
      errors.push('Content must have either text or media');
    }

    if (content.text && content.text.length > this.maxTextLength) {
      errors.push(`Text exceeds maximum length of ${this.maxTextLength} characters`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Format content for the platform
   * @param {object} content - Raw content
   * @returns {object} - Platform-formatted content
   */
  formatContent(content) {
    return content;
  }

  /**
   * Get platform-specific constraints
   * @returns {object} - Platform constraints
   */
  getConstraints() {
    return {
      maxTextLength: this.maxTextLength || 2200,
      maxMediaSize: this.maxMediaSize || 100 * 1024 * 1024, // 100MB default
      supportedMediaTypes: this.supportedMediaTypes || ['image', 'video'],
      maxHashtags: this.maxHashtags || 30
    };
  }

  /**
   * Extract hashtags from text
   * @param {string} text - Text with hashtags
   * @returns {string[]} - Array of hashtags
   */
  extractHashtags(text) {
    const hashtagRegex = /#[\w]+/g;
    return text.match(hashtagRegex) || [];
  }

  /**
   * Clean and format hashtags
   * @param {string[]} hashtags - Array of hashtags
   * @returns {string} - Formatted hashtag string
   */
  formatHashtags(hashtags) {
    return hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
  }
}
