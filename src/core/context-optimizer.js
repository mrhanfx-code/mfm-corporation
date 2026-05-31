// Context Optimizer
// Optimizes context loading and management to reduce overhead

import { logger } from './logger.js';

/**
 * Context optimization configuration
 */
const CONTEXT_CONFIG = {
  // Maximum context size in characters
  maxContextSize: 10000,
  
  // Context compression threshold
  compressionThreshold: 5000,
  
  // Context priority levels
  priorityLevels: {
    high: 1,    // Recent, user-relevant
    medium: 2,  // System messages, tool results
    low: 3      // Older, less relevant
  },
  
  // Context age limits (in turns)
  ageLimits: {
    high: 10,    // Keep last 10 high-priority
    medium: 5,   // Keep last 5 medium-priority
    low: 2       // Keep last 2 low-priority
  }
};

/**
 * Context Optimizer
 * Reduces context overhead through compression, prioritization, and lazy loading
 */
export class ContextOptimizer {
  constructor(env) {
    this.env = env;
    this.stats = {
      originalSize: 0,
      optimizedSize: 0,
      compressionCount: 0,
      truncationCount: 0
    };
  }

  /**
   * Determine context priority based on message role and content
   */
  determinePriority(message) {
    const { role, content } = message;

    // User messages are high priority
    if (role === 'user') {
      return CONTEXT_CONFIG.priorityLevels.high;
    }

    // Assistant messages with tool results are medium priority
    if (role === 'assistant' && content.includes('[Result:')) {
      return CONTEXT_CONFIG.priorityLevels.medium;
    }

    // System messages are medium priority
    if (role === 'system') {
      return CONTEXT_CONFIG.priorityLevels.medium;
    }

    // Default to low priority
    return CONTEXT_CONFIG.priorityLevels.low;
  }

  /**
   * Calculate message age (turns from end)
   */
  calculateAge(messages, messageIndex) {
    return messages.length - messageIndex - 1;
  }

  /**
   * Check if message should be kept based on priority and age
   */
  shouldKeep(message, messageIndex, messages) {
    const priority = this.determinePriority(message);
    const age = this.calculateAge(messages, messageIndex);

    switch (priority) {
      case CONTEXT_CONFIG.priorityLevels.high:
        return age < CONTEXT_CONFIG.ageLimits.high;
      case CONTEXT_CONFIG.priorityLevels.medium:
        return age < CONTEXT_CONFIG.ageLimits.medium;
      case CONTEXT_CONFIG.priorityLevels.low:
        return age < CONTEXT_CONFIG.ageLimits.low;
      default:
        return false;
    }
  }

  /**
   * Compress message content by removing redundant information
   */
  compressContent(content) {
    if (content.length < CONTEXT_CONFIG.compressionThreshold) {
      return content;
    }

    this.stats.compressionCount++;

    // Remove excessive whitespace
    let compressed = content.replace(/\s+/g, ' ').trim();

    // Truncate very long tool results
    if (compressed.includes('[Result:')) {
      const resultMatch = compressed.match(/\[Result: [^\]]+\]/);
      if (resultMatch) {
        const resultPrefix = resultMatch[0];
        const resultContent = compressed.substring(resultMatch.index + resultPrefix.length).trim();
        if (resultContent.length > 500) {
          const truncatedContent = resultContent.substring(0, 500) + '...';
          compressed = compressed.substring(0, resultMatch.index) + resultPrefix + '\n' + truncatedContent;
        }
      }
    }

    // Truncate very long error messages
    if (compressed.includes('[Error:')) {
      const errorMatch = compressed.match(/\[Error: [^\]]+\]/);
      if (errorMatch) {
        const errorPrefix = errorMatch[0];
        const errorContent = compressed.substring(errorMatch.index + errorPrefix.length).trim();
        if (errorContent.length > 250) {
          const truncatedContent = errorContent.substring(0, 250) + '...';
          compressed = compressed.substring(0, errorMatch.index) + errorPrefix + '\n' + truncatedContent;
        }
      }
    }

    return compressed;
  }

  /**
   * Optimize context by prioritizing and compressing messages
   */
  optimizeContext(messages) {
    if (!messages || messages.length === 0) {
      return messages;
    }

    const originalSize = JSON.stringify(messages).length;
    this.stats.originalSize += originalSize;

    // Filter messages by priority and age
    const prioritized = messages.filter((msg, index) => this.shouldKeep(msg, index, messages));

    // Compress message content
    const compressed = prioritized.map(msg => ({
      ...msg,
      content: this.compressContent(msg.content)
    }));

    // Ensure we don't exceed max context size
    const optimized = this.truncateToMaxSize(compressed);

    const optimizedSize = JSON.stringify(optimized).length;
    this.stats.optimizedSize += optimizedSize;

    const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);
    logger.info('context_optimizer', 'optimized', { 
      originalSize, 
      optimizedSize, 
      reduction: reduction + '%',
      messageCount: messages.length,
      optimizedCount: optimized.length
    });

    return optimized;
  }

  /**
   * Truncate context to max size
   */
  truncateToMaxSize(messages) {
    let currentSize = JSON.stringify(messages).length;

    if (currentSize <= CONTEXT_CONFIG.maxContextSize) {
      return messages;
    }

    this.stats.truncationCount++;

    // Remove oldest messages first
    let truncated = [...messages];
    while (truncated.length > 0 && JSON.stringify(truncated).length > CONTEXT_CONFIG.maxContextSize) {
      truncated.shift();
    }

    // Always keep the last user message
    if (truncated.length > 0 && truncated[truncated.length - 1].role !== 'user') {
      const lastUserMsg = messages.findLast(m => m.role === 'user');
      if (lastUserMsg) {
        truncated.push(lastUserMsg);
      }
    }

    return truncated;
  }

  /**
   * Lazy load context (load only what's needed)
   */
  async lazyLoadContext(getContextFn, requiredSize) {
    try {
      const fullContext = await getContextFn();
      const fullSize = JSON.stringify(fullContext).length;

      if (fullSize <= requiredSize) {
        return fullContext;
      }

      // Load progressively until size requirement met
      let loaded = [];
      let loadedSize = 0;

      for (const msg of fullContext) {
        const msgSize = JSON.stringify(msg).length;
        if (loadedSize + msgSize <= requiredSize) {
          loaded.push(msg);
          loadedSize += msgSize;
        } else {
          break;
        }
      }

      logger.info('context_optimizer', 'lazy_loaded', { 
        fullSize, 
        loadedSize, 
        requiredSize,
        loadedCount: loaded.length,
        totalCount: fullContext.length
      });

      return loaded;
    } catch (error) {
      logger.error('context_optimizer', 'lazy_load_error', { error: error.message });
      throw error;
    }
  }

  /**
   * Get optimization statistics
   */
  getStats() {
    const totalReduction = this.stats.originalSize > 0 
      ? ((this.stats.originalSize - this.stats.optimizedSize) / this.stats.originalSize * 100).toFixed(2) + '%'
      : '0%';

    return {
      ...this.stats,
      totalReduction,
      avgReduction: this.stats.compressionCount > 0
        ? ((this.stats.originalSize - this.stats.optimizedSize) / this.stats.compressionCount).toFixed(2)
        : '0'
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      originalSize: 0,
      optimizedSize: 0,
      compressionCount: 0,
      truncationCount: 0
    };
  }

  /**
   * Estimate context size before optimization
   */
  estimateSize(messages) {
    return JSON.stringify(messages).length;
  }

  /**
   * Check if context needs optimization
   */
  needsOptimization(messages) {
    const size = this.estimateSize(messages);
    return size > CONTEXT_CONFIG.compressionThreshold;
  }
}
