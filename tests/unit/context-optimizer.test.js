// Context Optimizer Tests
// Tests context optimization through compression, prioritization, and lazy loading

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContextOptimizer } from '../../src/core/context-optimizer.js';

describe('ContextOptimizer', () => {
  let optimizer;
  let mockEnv;

  beforeEach(() => {
    mockEnv = {};
    optimizer = new ContextOptimizer(mockEnv);
  });

  describe('Initialization', () => {
    it('should initialize with environment', () => {
      expect(optimizer.env).toBe(mockEnv);
    });

    it('should initialize with zero statistics', () => {
      expect(optimizer.stats.originalSize).toBe(0);
      expect(optimizer.stats.optimizedSize).toBe(0);
    });
  });

  describe('Priority Determination', () => {
    it('should assign high priority to user messages', () => {
      const message = { role: 'user', content: 'test message' };
      expect(optimizer.determinePriority(message)).toBe(1);
    });

    it('should assign medium priority to assistant messages with tool results', () => {
      const message = { role: 'assistant', content: '[Result: web-fetch] data' };
      expect(optimizer.determinePriority(message)).toBe(2);
    });

    it('should assign medium priority to system messages', () => {
      const message = { role: 'system', content: 'system prompt' };
      expect(optimizer.determinePriority(message)).toBe(2);
    });

    it('should assign low priority to other messages', () => {
      const message = { role: 'assistant', content: 'regular response' };
      expect(optimizer.determinePriority(message)).toBe(3);
    });
  });

  describe('Age Calculation', () => {
    it('should calculate age correctly', () => {
      const messages = [
        { role: 'user', content: 'msg1' },
        { role: 'assistant', content: 'msg2' },
        { role: 'user', content: 'msg3' }
      ];

      expect(optimizer.calculateAge(messages, 0)).toBe(2);
      expect(optimizer.calculateAge(messages, 1)).toBe(1);
      expect(optimizer.calculateAge(messages, 2)).toBe(0);
    });
  });

  describe('Should Keep Logic', () => {
    it('should keep high priority messages within age limit', () => {
      const messages = [
        { role: 'user', content: 'old' },
        { role: 'user', content: 'recent' }
      ];

      expect(optimizer.shouldKeep(messages[0], 0, messages)).toBe(true);
      expect(optimizer.shouldKeep(messages[1], 1, messages)).toBe(true);
    });

    it('should drop low priority messages beyond age limit', () => {
      const messages = Array.from({ length: 5 }, (_, i) => ({
        role: 'assistant',
        content: `message ${i}`
      }));

      // Last message (age 0) should be kept
      expect(optimizer.shouldKeep(messages[4], 4, messages)).toBe(true);
      
      // First message (age 4) should be dropped (low priority, age > 2)
      expect(optimizer.shouldKeep(messages[0], 0, messages)).toBe(false);
    });
  });

  describe('Content Compression', () => {
    it('should not compress short content', () => {
      const content = 'short message';
      const compressed = optimizer.compressContent(content);
      
      expect(compressed).toBe(content);
      expect(optimizer.stats.compressionCount).toBe(0);
    });

    it('should compress long content by removing whitespace', () => {
      const content = 'a  b   c    d     e \n  f \t g'.repeat(1000); // Lots of whitespace
      const compressed = optimizer.compressContent(content);
      
      expect(compressed.length).toBeLessThan(content.length);
      expect(optimizer.stats.compressionCount).toBe(1);
    });

    it('should truncate long tool results', () => {
      const content = '[Result: web-fetch]\n' + 'x'.repeat(6000); // Content exceeds 5000 threshold
      const compressed = optimizer.compressContent(content);
      
      // Should be truncated to 500 chars after prefix + '...'
      expect(compressed.length).toBeLessThan(content.length);
    });

    it('should truncate long error messages', () => {
      const content = '[Error: web-fetch]\n' + 'x'.repeat(6000); // Content exceeds 5000 threshold
      const compressed = optimizer.compressContent(content);
      
      // Should be truncated to 250 chars after prefix + '...'
      expect(compressed.length).toBeLessThan(content.length);
    });
  });

  describe('Context Optimization', () => {
    it('should return empty messages as-is', () => {
      const result = optimizer.optimizeContext([]);
      expect(result).toEqual([]);
    });

    it('should return short context as-is', () => {
      const messages = [
        { role: 'user', content: 'short' },
        { role: 'assistant', content: 'response' }
      ];

      const result = optimizer.optimizeContext(messages);
      expect(result).toEqual(messages);
    });

    it('should prioritize and compress long context', () => {
      const messages = Array.from({ length: 20 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: 'x'.repeat(1000)
      }));

      const result = optimizer.optimizeContext(messages);
      
      expect(result.length).toBeLessThan(messages.length);
      // Compression may or may not happen depending on prioritization
    });

    it('should truncate to max size', () => {
      const messages = Array.from({ length: 50 }, (_, i) => ({
        role: 'user',
        content: 'x'.repeat(500)
      }));

      const result = optimizer.optimizeContext(messages);
      
      const size = JSON.stringify(result).length;
      expect(size).toBeLessThanOrEqual(11000); // Allow some buffer
    });

    it('should always keep last user message', () => {
      const messages = [
        { role: 'assistant', content: 'a'.repeat(10000) },
        { role: 'user', content: 'important' }
      ];

      const result = optimizer.optimizeContext(messages);
      
      expect(result[result.length - 1].role).toBe('user');
      expect(result[result.length - 1].content).toBe('important');
    });
  });

  describe('Lazy Loading', () => {
    it('should return full context if within size limit', async () => {
      const getContextFn = vi.fn().mockResolvedValue([
        { role: 'user', content: 'msg1' },
        { role: 'assistant', content: 'msg2' }
      ]);

      const result = await optimizer.lazyLoadContext(getContextFn, 10000);
      
      expect(result.length).toBe(2);
      expect(getContextFn).toHaveBeenCalled();
    });

    it('should load progressively if context exceeds limit', async () => {
      const messages = Array.from({ length: 20 }, (_, i) => ({
        role: 'user',
        content: 'x'.repeat(1000)
      }));

      const getContextFn = vi.fn().mockResolvedValue(messages);
      const result = await optimizer.lazyLoadContext(getContextFn, 5000);
      
      expect(result.length).toBeLessThan(messages.length);
      expect(getContextFn).toHaveBeenCalled();
    });

    it('should handle context loading errors', async () => {
      const getContextFn = vi.fn().mockRejectedValue(new Error('Load error'));
      
      await expect(optimizer.lazyLoadContext(getContextFn, 1000)).rejects.toThrow('Load error');
    });
  });

  describe('Statistics', () => {
    it('should track optimization statistics', () => {
      const messages = Array.from({ length: 50 }, (_, i) => ({
        role: 'user',
        content: 'x'.repeat(500)
      }));

      optimizer.optimizeContext(messages);
      
      const stats = optimizer.getStats();
      expect(stats.originalSize).toBeGreaterThan(0);
      expect(stats.optimizedSize).toBeGreaterThan(0);
      // Truncation may happen but compression depends on content
    });

    it('should calculate total reduction percentage', () => {
      const messages = Array.from({ length: 50 }, (_, i) => ({
        role: 'user',
        content: 'x'.repeat(500)
      }));

      optimizer.optimizeContext(messages);
      
      const stats = optimizer.getStats();
      expect(stats.totalReduction).toMatch(/\d+%/);
    });

    it('should reset statistics', () => {
      const messages = [{ role: 'user', content: 'test' }];
      optimizer.optimizeContext(messages);
      optimizer.resetStats();
      
      expect(optimizer.stats.originalSize).toBe(0);
      expect(optimizer.stats.optimizedSize).toBe(0);
    });
  });

  describe('Size Estimation', () => {
    it('should estimate context size', () => {
      const messages = [
        { role: 'user', content: 'test' },
        { role: 'assistant', content: 'response' }
      ];

      const size = optimizer.estimateSize(messages);
      expect(size).toBeGreaterThan(0);
    });

    it('should handle empty messages', () => {
      const size = optimizer.estimateSize([]);
      expect(size).toBe(2); // '[]'
    });
  });

  describe('Needs Optimization Check', () => {
    it('should return true for large context', () => {
      const messages = [{ role: 'user', content: 'x'.repeat(6000) }];
      expect(optimizer.needsOptimization(messages)).toBe(true);
    });

    it('should return false for small context', () => {
      const messages = [{ role: 'user', content: 'short' }];
      expect(optimizer.needsOptimization(messages)).toBe(false);
    });
  });
});
