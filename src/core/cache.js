// Cache Service — Redis-like caching using Cloudflare KV
// Provides structured caching with TTL, invalidation, and strategies

import { logger } from './logger.js';

class CacheService {
  constructor(kvNamespace) {
    this.kv = kvNamespace;
    this.defaultTTL = 300; // 5 minutes default
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<string|null>} Cached value or null
   */
  async get(key) {
    if (!this.kv) return null;

    try {
      const value = await this.kv.get(key);
      if (value !== null) {
        this.stats.hits++;
        logger.debug('cache', 'hit', { key });
        return value;
      }
      this.stats.misses++;
      logger.debug('cache', 'miss', { key });
      return null;
    } catch (err) {
      logger.error('cache', 'get_failed', { key, error: err.message });
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL
   * @param {string} key - Cache key
   * @param {string} value - Value to cache
   * @param {number} ttl - Time to live in seconds (optional)
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.kv) return false;

    try {
      const options = ttl > 0 ? { expirationTtl: ttl } : {};
      await this.kv.put(key, value, options);
      this.stats.sets++;
      logger.debug('cache', 'set', { key, ttl });
      return true;
    } catch (err) {
      logger.error('cache', 'set_failed', { key, error: err.message });
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  async delete(key) {
    if (!this.kv) return false;

    try {
      await this.kv.delete(key);
      this.stats.deletes++;
      logger.debug('cache', 'delete', { key });
      return true;
    } catch (err) {
      logger.error('cache', 'delete_failed', { key, error: err.message });
      return false;
    }
  }

  /**
   * Get JSON object from cache
   * @param {string} key - Cache key
   * @returns {Promise<object|null>} Parsed JSON object or null
   */
  async getJSON(key) {
    const value = await this.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch (err) {
      logger.error('cache', 'json_parse_failed', { key, error: err.message });
      return null;
    }
  }

  /**
   * Set JSON object in cache
   * @param {string} key - Cache key
   * @param {object} value - Object to cache
   * @param {number} ttl - Time to live in seconds (optional)
   * @returns {Promise<boolean>} Success status
   */
  async setJSON(key, value, ttl = this.defaultTTL) {
    try {
      const serialized = JSON.stringify(value);
      return await this.set(key, serialized, ttl);
    } catch (err) {
      logger.error('cache', 'json_serialize_failed', { key, error: err.message });
      return false;
    }
  }

  /**
   * Get or set pattern (cache-aside)
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Function to fetch data if cache miss
   * @param {number} ttl - Time to live in seconds (optional)
   * @returns {Promise<any>} Cached or fetched value
   */
  async getOrSet(key, fetchFn, ttl = this.defaultTTL) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    if (value !== null && value !== undefined) {
      await this.set(key, value, ttl);
    }
    return value;
  }

  /**
   * Invalidate cache by pattern (prefix-based)
   * @param {string} prefix - Key prefix to invalidate
   * @returns {Promise<number>} Number of keys invalidated
   */
  async invalidateByPrefix(prefix) {
    // KV doesn't support pattern deletion natively
    // This is a placeholder for manual tracking or list-based invalidation
    logger.warn('cache', 'pattern_invalidation_not_supported', { prefix });
    return 0;
  }

  /**
   * Get cache statistics
   * @returns {object} Cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      total
    };
  }

  /**
   * Reset cache statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
    logger.info('cache', 'stats_reset');
  }

  /**
   * Generate cache key with namespace
   * @param {string} namespace - Key namespace
   * @param {string} identifier - Unique identifier
   * @returns {string} Formatted cache key
   */
  static generateKey(namespace, identifier) {
    return `${namespace}:${identifier}`;
  }

  /**
   * Generate hierarchical cache key
   * @param {Array<string>} parts - Key parts in hierarchy
   * @returns {string} Formatted cache key
   */
  static generateHierarchicalKey(...parts) {
    return parts.join(':');
  }
}

export { CacheService };
