import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryIntegration, MEMORY_CONFIG } from '../../src/core/memory-integration.js';

describe('MemoryIntegration', () => {
  let system;
  let mockEnv;

  beforeEach(() => {
    mockEnv = {
      db: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            all: vi.fn().mockResolvedValue({ results: [] })
          })
        })
      },
      KV: {
        get: vi.fn().mockResolvedValue('0'),
        put: vi.fn()
      }
    };
    system = new MemoryIntegration(mockEnv);
  });

  describe('memorySearch', () => {
    it('should search memory with query', async () => {
      // Add some test memories
      await system.memoryRemember('This is a test error message', { category: 'error' });
      await system.memoryRemember('Task assigned to John', { category: 'task' });

      const result = await system.memorySearch('error', { limit: 10 });
      
      expect(result.success).toBe(true);
      expect(result.results).toBeInstanceOf(Array);
    });

    it('should filter by category', async () => {
      await system.memoryRemember('Error in production', { category: 'error' });
      await system.memoryRemember('Task for review', { category: 'task' });

      const result = await system.memorySearch('production', { categories: ['error'] });
      
      expect(result.success).toBe(true);
    });

    it('should respect threshold', async () => {
      await system.memoryRemember('Completely different content', { category: 'general' });

      const result = await system.memorySearch('xyz', { threshold: 0.9 });
      
      expect(result.success).toBe(true);
      expect(result.results.length).toBe(0);
    });
  });

  describe('memoryRemember', () => {
    it('should remember content with category', async () => {
      const result = await system.memoryRemember('Important information', { category: 'general' });
      
      expect(result.success).toBe(true);
      expect(result.memoryId).toBeDefined();
      expect(result.memory.content).toBe('Important information');
    });

    it('should store metadata', async () => {
      const metadata = { source: 'user', priority: 'high' };
      const result = await system.memoryRemember('Data with metadata', { metadata });
      
      expect(result.success).toBe(true);
      expect(result.memory.metadata).toEqual(metadata);
    });

    it('should store importance level', async () => {
      const result = await system.memoryRemember('Critical data', { importance: 'high' });
      
      expect(result.success).toBe(true);
      expect(result.memory.importance).toBe('high');
    });
  });

  describe('memoryContext', () => {
    it('should retrieve context for query', async () => {
      await system.memoryRemember('Context item 1', { category: 'general' });
      await system.memoryRemember('Context item 2', { category: 'general' });

      const result = await system.memoryContext('context', { limit: 5 });
      
      expect(result.success).toBe(true);
      expect(result.context).toBeInstanceOf(Array);
    });

    it('should include recent history when requested', async () => {
      await system.memoryRemember('Recent memory 1', { category: 'general' });
      await system.memoryRemember('Recent memory 2', { category: 'general' });

      const result = await system.memoryContext('query', { includeHistory: true });
      
      expect(result.success).toBe(true);
    });
  });

  describe('memoryEnrich', () => {
    it('should enrich content with category', async () => {
      const result = await system.memoryEnrich('This is an error in the system', { enrichWith: ['category'] });
      
      expect(result.success).toBe(true);
      expect(result.enriched.enrichments.category).toBe('error');
    });

    it('should extract metadata', async () => {
      const result = await system.memoryEnrich('Check @john for #task at https://example.com', { enrichWith: ['metadata'] });
      
      expect(result.success).toBe(true);
      expect(result.enriched.enrichments.metadata.mentions).toContain('@john');
      expect(result.enriched.enrichments.metadata.hashtags).toContain('#task');
    });

    it('should find related memories', async () => {
      await system.memoryRemember('Related information about errors', { category: 'error' });

      const result = await system.memoryEnrich('error', { enrichWith: ['related'] });
      
      expect(result.success).toBe(true);
      expect(result.enriched.enrichments.related).toBeInstanceOf(Array);
    });
  });

  describe('calculateSimilarity', () => {
    it('should calculate similarity between query and content', () => {
      const similarity = system.calculateSimilarity('test error', 'test error message');
      
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    it('should return 0 for completely different strings', () => {
      const similarity = system.calculateSimilarity('xyz', 'abc');
      
      expect(similarity).toBe(0);
    });
  });

  describe('inferCategory', () => {
    it('should infer error category', () => {
      const category = system.inferCategory('There was a bug in the system');
      
      expect(category).toBe('error');
    });

    it('should infer task category', () => {
      const category = system.inferCategory('Assign this task to the team');
      
      expect(category).toBe('task');
    });

    it('should infer decision category', () => {
      const category = system.inferCategory('Approve the proposal');
      
      expect(category).toBe('decision');
    });

    it('should return general for unknown content', () => {
      const category = system.inferCategory('Random text here');
      
      expect(category).toBe('general');
    });
  });

  describe('extractMetadata', () => {
    it('should extract mentions', () => {
      const metadata = system.extractMetadata('Hello @john and @jane');
      
      expect(metadata.mentions).toContain('@john');
      expect(metadata.mentions).toContain('@jane');
    });

    it('should extract hashtags', () => {
      const metadata = system.extractMetadata('This is #important and #urgent');
      
      expect(metadata.hashtags).toContain('#important');
      expect(metadata.hashtags).toContain('#urgent');
    });

    it('should extract URLs', () => {
      const metadata = system.extractMetadata('Visit https://example.com for more info');
      
      expect(metadata.urls).toContain('https://example.com');
    });

    it('should extract numbers', () => {
      const metadata = system.extractMetadata('There are 5 items with 123 total');
      
      expect(metadata.numbers).toContain('5');
      expect(metadata.numbers).toContain('123');
    });
  });

  describe('MEMORY_CONFIG', () => {
    it('should define configuration constants', () => {
      expect(MEMORY_CONFIG).toHaveProperty('maxEntries');
      expect(MEMORY_CONFIG).toHaveProperty('retentionDays');
      expect(MEMORY_CONFIG).toHaveProperty('embeddingDimension');
      expect(MEMORY_CONFIG).toHaveProperty('searchLimit');
      expect(MEMORY_CONFIG).toHaveProperty('contextLimit');
    });

    it('should have reasonable default values', () => {
      expect(MEMORY_CONFIG.maxEntries).toBe(10000);
      expect(MEMORY_CONFIG.retentionDays).toBe(365);
      expect(MEMORY_CONFIG.searchLimit).toBe(10);
      expect(MEMORY_CONFIG.contextLimit).toBe(5);
    });
  });

  describe('getConfig', () => {
    it('should return configuration', () => {
      const config = system.getConfig();
      
      expect(config).toEqual(MEMORY_CONFIG);
    });
  });
});
