// Tool Cache Tests
// Tests tool execution caching with KV namespace

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToolCache } from '../../src/core/tool-cache.js';

describe('ToolCache', () => {
  let cache;
  let mockEnv;

  beforeEach(() => {
    mockEnv = {
      KV: {
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        list: vi.fn()
      }
    };

    cache = new ToolCache(mockEnv);
  });

  describe('Initialization', () => {
    it('should initialize with environment', () => {
      expect(cache.env).toBe(mockEnv);
      expect(cache.enabled).toBe(true);
    });

    it('should be disabled when KV is not available', () => {
      const noKVCache = new ToolCache({});
      expect(noKVCache.enabled).toBe(false);
    });
  });

  describe('Cache Configuration', () => {
    it('should identify cacheable tools', () => {
      expect(cache.shouldCache('web-fetch')).toBe(true);
      expect(cache.shouldCache('d1-query')).toBe(true);
      expect(cache.shouldCache('memory-search')).toBe(true);
    });

    it('should identify non-cacheable tools', () => {
      expect(cache.shouldCache('send-email')).toBe(false);
      expect(cache.shouldCache('github-push')).toBe(false);
      expect(cache.shouldCache('memory-remember')).toBe(false);
    });

    it('should get tool-specific TTL', () => {
      expect(cache.getTTL('web-fetch')).toBe(600);
      expect(cache.getTTL('d1-query')).toBe(60);
      expect(cache.getTTL('memory-search')).toBe(300);
    });

    it('should use default TTL for unknown tools', () => {
      expect(cache.getTTL('unknown-tool')).toBe(300);
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys', () => {
      const key1 = cache.generateCacheKey('web-fetch', { url: 'https://example.com' });
      const key2 = cache.generateCacheKey('web-fetch', { url: 'https://example.com' });
      
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different args', () => {
      const key1 = cache.generateCacheKey('web-fetch', { url: 'https://example.com' });
      const key2 = cache.generateCacheKey('web-fetch', { url: 'https://example.org' });
      
      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different tools', () => {
      const key1 = cache.generateCacheKey('web-fetch', { url: 'https://example.com' });
      const key2 = cache.generateCacheKey('d1-query', { query: 'SELECT * FROM tasks' });
      
      expect(key1).not.toBe(key2);
    });

    it('should handle empty args', () => {
      const key = cache.generateCacheKey('web-fetch', {});
      expect(key).toContain('web-fetch');
    });
  });

  describe('Cache Get', () => {
    it('should return null for non-cacheable tools', async () => {
      const result = await cache.get('send-email', { to: 'test@example.com' });
      
      expect(result).toBeNull();
      expect(cache.stats.misses).toBe(1);
    });

    it('should return null when cache is disabled', async () => {
      const noKVCache = new ToolCache({});
      const result = await noKVCache.get('web-fetch', { url: 'https://example.com' });
      
      expect(result).toBeNull();
    });

    it('should return null on cache miss', async () => {
      mockEnv.KV.get.mockResolvedValue(null);
      
      const result = await cache.get('web-fetch', { url: 'https://example.com' });
      
      expect(result).toBeNull();
      expect(cache.stats.misses).toBe(1);
      expect(mockEnv.KV.get).toHaveBeenCalled();
    });

    it('should return cached result on cache hit', async () => {
      const cachedResult = { data: 'test data' };
      mockEnv.KV.get.mockResolvedValue({ result: cachedResult });
      
      const result = await cache.get('web-fetch', { url: 'https://example.com' });
      
      expect(result).toEqual(cachedResult);
      expect(cache.stats.hits).toBe(1);
      expect(mockEnv.KV.get).toHaveBeenCalled();
    });

    it('should handle KV errors gracefully', async () => {
      mockEnv.KV.get.mockRejectedValue(new Error('KV error'));
      
      const result = await cache.get('web-fetch', { url: 'https://example.com' });
      
      expect(result).toBeNull();
      expect(cache.stats.misses).toBe(1);
    });
  });

  describe('Cache Set', () => {
    it('should not cache non-cacheable tools', async () => {
      await cache.set('send-email', { to: 'test@example.com' }, 'sent');
      
      expect(mockEnv.KV.put).not.toHaveBeenCalled();
    });

    it('should not cache when disabled', async () => {
      const noKVCache = new ToolCache({});
      await noKVCache.set('web-fetch', { url: 'https://example.com' }, 'data');
      
      expect(mockEnv.KV.put).not.toHaveBeenCalled();
    });

    it('should cache result with TTL', async () => {
      mockEnv.KV.put.mockResolvedValue();
      
      await cache.set('web-fetch', { url: 'https://example.com' }, 'data');
      
      expect(mockEnv.KV.put).toHaveBeenCalled();
      expect(cache.stats.sets).toBe(1);
    });

    it('should use tool-specific TTL', async () => {
      mockEnv.KV.put.mockResolvedValue();
      
      await cache.set('d1-query', { query: 'SELECT * FROM tasks' }, 'data');
      
      expect(mockEnv.KV.put).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ expirationTtl: 60 })
      );
    });

    it('should handle KV errors gracefully', async () => {
      mockEnv.KV.put.mockRejectedValue(new Error('KV error'));
      
      await cache.set('web-fetch', { url: 'https://example.com' }, 'data');
      
      // Should not throw
      expect(cache.stats.sets).toBe(0);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate all cache entries for a tool', async () => {
      mockEnv.KV.list.mockResolvedValue({
        keys: [
          { name: 'tool-cache:web-fetch:abc123' },
          { name: 'tool-cache:web-fetch:def456' }
        ]
      });
      mockEnv.KV.delete.mockResolvedValue();
      
      await cache.invalidate('web-fetch');
      
      expect(mockEnv.KV.list).toHaveBeenCalledWith({ prefix: 'tool-cache:web-fetch:' });
      expect(mockEnv.KV.delete).toHaveBeenCalledTimes(2);
      expect(cache.stats.deletes).toBe(2);
    });

    it('should invalidate specific cache entry', async () => {
      mockEnv.KV.delete.mockResolvedValue();
      
      await cache.invalidateSpecific('web-fetch', { url: 'https://example.com' });
      
      expect(mockEnv.KV.delete).toHaveBeenCalled();
      expect(cache.stats.deletes).toBe(1);
    });

    it('should clear all tool cache', async () => {
      mockEnv.KV.list.mockResolvedValue({
        keys: [
          { name: 'tool-cache:web-fetch:abc123' },
          { name: 'tool-cache:d1-query:def456' }
        ]
      });
      mockEnv.KV.delete.mockResolvedValue();
      
      await cache.clearAll();
      
      expect(mockEnv.KV.list).toHaveBeenCalledWith({ prefix: 'tool-cache:' });
      expect(mockEnv.KV.delete).toHaveBeenCalledTimes(2);
    });

    it('should handle invalidation errors gracefully', async () => {
      mockEnv.KV.list.mockRejectedValue(new Error('KV error'));
      
      await cache.invalidate('web-fetch');
      
      // Should not throw
      expect(cache.stats.deletes).toBe(0);
    });
  });

  describe('Cache Statistics', () => {
    it('should track hits and misses', async () => {
      mockEnv.KV.get.mockResolvedValue(null);
      
      await cache.get('web-fetch', { url: 'https://example.com' });
      await cache.get('web-fetch', { url: 'https://example.com' });
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(2);
      expect(stats.total).toBe(2);
    });

    it('should calculate hit rate', async () => {
      mockEnv.KV.get
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ result: 'data' });
      
      await cache.get('web-fetch', { url: 'https://example.com' });
      await cache.get('web-fetch', { url: 'https://example.com' });
      
      const stats = cache.getStats();
      expect(stats.hitRate).toBe('50.00%');
    });

    it('should track sets and deletes', async () => {
      mockEnv.KV.put.mockResolvedValue();
      mockEnv.KV.delete.mockResolvedValue();
      
      await cache.set('web-fetch', { url: 'https://example.com' }, 'data');
      await cache.invalidateSpecific('web-fetch', { url: 'https://example.com' });
      
      const stats = cache.getStats();
      expect(stats.sets).toBe(1);
      expect(stats.deletes).toBe(1);
    });

    it('should reset statistics', async () => {
      mockEnv.KV.get.mockResolvedValue(null);
      
      await cache.get('web-fetch', { url: 'https://example.com' });
      cache.resetStats();
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('Execute with Caching', () => {
    it('should return cached result if available', async () => {
      const cachedResult = 'cached data';
      mockEnv.KV.get.mockResolvedValue({ result: cachedResult });
      
      const executeFn = vi.fn().mockResolvedValue('fresh data');
      
      const result = await cache.execute('web-fetch', { url: 'https://example.com' }, executeFn);
      
      expect(result).toBe(cachedResult);
      expect(executeFn).not.toHaveBeenCalled();
    });

    it('should execute and cache result on miss', async () => {
      mockEnv.KV.get.mockResolvedValue(null);
      mockEnv.KV.put.mockResolvedValue();
      
      const executeFn = vi.fn().mockResolvedValue('fresh data');
      
      const result = await cache.execute('web-fetch', { url: 'https://example.com' }, executeFn);
      
      expect(result).toBe('fresh data');
      expect(executeFn).toHaveBeenCalled();
      expect(mockEnv.KV.put).toHaveBeenCalled();
    });

    it('should not cache non-cacheable tools', async () => {
      const executeFn = vi.fn().mockResolvedValue('sent');
      
      const result = await cache.execute('send-email', { to: 'test@example.com' }, executeFn);
      
      expect(result).toBe('sent');
      expect(executeFn).toHaveBeenCalled();
      expect(mockEnv.KV.put).not.toHaveBeenCalled();
    });
  });
});
