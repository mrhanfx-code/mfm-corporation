// Tool Execution Cache
// Caches tool results to reduce redundant executions

import { logger } from './logger.js';
import { createHash } from 'crypto';

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  // Default TTL in seconds (5 minutes)
  defaultTTL: 300,
  
  // Tool-specific TTLs
  toolTTLs: {
    'web-fetch': 600,           // 10 minutes
    'exa-search': 300,         // 5 minutes
    'perplexity-search': 300,   // 5 minutes
    'brave-search': 300,        // 5 minutes
    'github-issues': 600,       // 10 minutes
    'notion-search': 300,       // 5 minutes
    'drive-list': 300,          // 5 minutes
    'drive-read': 600,          // 10 minutes
    'calendar-list': 60,        // 1 minute
    'stripe-balance': 300,      // 5 minutes
    'stripe-charges': 300,      // 5 minutes
    'github-list-repos': 600,   // 10 minutes
    'd1-query': 60,             // 1 minute
    'memory-search': 300,        // 5 minutes
    'memory-context': 300,       // 5 minutes
    'codegraph-query': 600,     // 10 minutes
    'codegraph-context': 600     // 10 minutes
  },
  
  // Tools that should never be cached (write operations)
  noCache: new Set([
    'send-email',
    'social-post',
    'github-push',
    'github-create-repo',
    'drive-write',
    'calendar-create',
    'slack-notify',
    'sms-alert',
    'pdf-generate',
    'memory-remember',
    'memory-enrich',
    'video-prompt'
  ])
};

/**
 * Tool Cache Manager
 * Caches tool results in KV namespace with TTL-based invalidation
 */
export class ToolCache {
  constructor(env) {
    this.env = env;
    this.enabled = !!env.KV;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  /**
   * Check if a tool should be cached
   */
  shouldCache(toolName) {
    return !CACHE_CONFIG.noCache.has(toolName);
  }

  /**
   * Get TTL for a tool
   */
  getTTL(toolName) {
    return CACHE_CONFIG.toolTTLs[toolName] || CACHE_CONFIG.defaultTTL;
  }

  /**
   * Generate cache key from tool name and args
   */
  generateCacheKey(toolName, args) {
    const argsStr = JSON.stringify(args || {});
    const hash = createHash('sha256').update(`${toolName}:${argsStr}`).digest('hex');
    return `tool-cache:${toolName}:${hash}`;
  }

  /**
   * Get cached result for a tool call
   */
  async get(toolName, args) {
    if (!this.enabled || !this.shouldCache(toolName)) {
      this.stats.misses++;
      return null;
    }

    try {
      const cacheKey = this.generateCacheKey(toolName, args);
      const cached = await this.env.KV.get(cacheKey, { type: 'json' });

      if (cached) {
        this.stats.hits++;
        logger.info('tool_cache', 'hit', { tool: toolName, cacheKey });
        return cached.result;
      }

      this.stats.misses++;
      logger.debug('tool_cache', 'miss', { tool: toolName, cacheKey });
      return null;
    } catch (error) {
      logger.error('tool_cache', 'get_error', { tool: toolName, error: error.message });
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set cached result for a tool call
   */
  async set(toolName, args, result) {
    if (!this.enabled || !this.shouldCache(toolName)) {
      return;
    }

    try {
      const cacheKey = this.generateCacheKey(toolName, args);
      const ttl = this.getTTL(toolName);

      await this.env.KV.put(cacheKey, JSON.stringify({ result }), {
        expirationTtl: ttl
      });

      this.stats.sets++;
      logger.info('tool_cache', 'set', { tool: toolName, cacheKey, ttl });
    } catch (error) {
      logger.error('tool_cache', 'set_error', { tool: toolName, error: error.message });
    }
  }

  /**
   * Invalidate cache for a specific tool
   */
  async invalidate(toolName) {
    if (!this.enabled) {
      return;
    }

    try {
      // List all cache keys for this tool
      const list = await this.env.KV.list({ prefix: `tool-cache:${toolName}:` });
      
      // Delete all keys
      for (const key of list.keys) {
        await this.env.KV.delete(key.name);
        this.stats.deletes++;
      }

      logger.info('tool_cache', 'invalidate', { tool: toolName, count: list.keys.length });
    } catch (error) {
      logger.error('tool_cache', 'invalidate_error', { tool: toolName, error: error.message });
    }
  }

  /**
   * Invalidate cache for a specific tool call
   */
  async invalidateSpecific(toolName, args) {
    if (!this.enabled) {
      return;
    }

    try {
      const cacheKey = this.generateCacheKey(toolName, args);
      await this.env.KV.delete(cacheKey);
      this.stats.deletes++;
      
      logger.info('tool_cache', 'invalidate_specific', { tool: toolName, cacheKey });
    } catch (error) {
      logger.error('tool_cache', 'invalidate_specific_error', { tool: toolName, error: error.message });
    }
  }

  /**
   * Clear all tool cache
   */
  async clearAll() {
    if (!this.enabled) {
      return;
    }

    try {
      const list = await this.env.KV.list({ prefix: 'tool-cache:' });
      
      for (const key of list.keys) {
        await this.env.KV.delete(key.name);
        this.stats.deletes++;
      }

      logger.info('tool_cache', 'clear_all', { count: list.keys.length });
    } catch (error) {
      logger.error('tool_cache', 'clear_all_error', { error: error.message });
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      ...this.stats,
      total,
      hitRate: hitRate.toFixed(2) + '%'
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  /**
   * Execute tool with caching
   */
  async execute(toolName, args, executeFn) {
    // Try to get from cache
    const cached = await this.get(toolName, args);
    if (cached !== null) {
      return cached;
    }

    // Execute tool
    const result = await executeFn(toolName, args);

    // Cache result
    await this.set(toolName, args, result);

    return result;
  }
}
