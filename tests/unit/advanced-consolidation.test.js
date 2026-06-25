import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdvancedConsolidationManager } from '../../src/core/advanced-consolidation.js';

describe('AdvancedConsolidationManager', () => {
  let manager;
  let mockEnv;

  beforeEach(() => {
    mockEnv = { test: 'env' };
    manager = new AdvancedConsolidationManager(mockEnv);
    vi.clearAllMocks();
  });

  it('should add memory item', () => {
    const item = manager.addMemoryItem('item-1', { data: 'test' });
    
    expect(item).toBeDefined();
    expect(item.id).toBe('item-1');
    expect(item.content).toEqual({ data: 'test' });
    expect(item.metadata.createdAt).toBeDefined();
  });

  it('should track item size', () => {
    const item = manager.addMemoryItem('item-1', { data: 'test' });
    
    expect(item.size).toBeGreaterThan(0);
  });

  it('should update compression stats on add', () => {
    manager.addMemoryItem('item-1', { data: 'test' });
    
    const stats = manager.getCompressionStats();
    expect(stats.originalSize).toBeGreaterThan(0);
  });

  it('should apply lesson decay', () => {
    manager.addMemoryItem('item-1', { data: 'test' }, { accessCount: 0 });
    
    const removed = manager.applyLessonDecay(0.5, 0.6);
    
    expect(Array.isArray(removed)).toBe(true);
  });

  it('should remove items below decay threshold', () => {
    const item = manager.addMemoryItem('item-1', { data: 'test' });
    item.metadata.decayScore = 0.1;
    
    const removed = manager.applyLessonDecay(0.1, 0.2);
    
    expect(removed).toContain('item-1');
  });

  it('should find patterns in similar items', () => {
    manager.addMemoryItem('item-1', { data: 'test pattern' });
    manager.addMemoryItem('item-2', { data: 'test pattern' });
    manager.addMemoryItem('item-3', { data: 'test pattern' });
    
    const patterns = manager.findPatterns();
    
    expect(patterns.length).toBeGreaterThan(0);
  });

  it('should not find patterns with insufficient items', () => {
    manager.addMemoryItem('item-1', { data: 'test' });
    manager.addMemoryItem('item-2', { data: 'different' });
    
    const patterns = manager.findPatterns();
    
    expect(patterns.length).toBe(0);
  });

  it('should consolidate patterns', () => {
    manager.addMemoryItem('item-1', { data: 'test pattern' });
    manager.addMemoryItem('item-2', { data: 'test pattern' });
    manager.addMemoryItem('item-3', { data: 'test pattern' });
    
    const results = manager.consolidatePatterns();
    
    expect(results.patterns.length).toBeGreaterThan(0);
    expect(results.itemsRemoved).toBeGreaterThan(0);
  });

  it('should track space saved from consolidation', () => {
    manager.addMemoryItem('item-1', { data: 'test pattern' });
    manager.addMemoryItem('item-2', { data: 'test pattern' });
    manager.addMemoryItem('item-3', { data: 'test pattern' });
    
    const results = manager.consolidatePatterns();
    
    expect(results.spaceSaved).toBeGreaterThan(0);
  });

  it('should optimize storage by compressing content', () => {
    manager.addMemoryItem('item-1', { data: '  test  with  spaces  ' });
    
    const results = manager.optimizeStorage();
    
    expect(results.itemsCompressed).toBeGreaterThan(0);
  });

  it('should compress string content', () => {
    const content = '  test  with  spaces  ';
    const compressed = manager.compressContent(content);
    
    expect(compressed).toBe('test with spaces');
  });

  it('should compress array content', () => {
    const content = ['  item1  ', '  item2  '];
    const compressed = manager.compressContent(content);
    
    expect(compressed).toEqual(['item1', 'item2']);
  });

  it('should compress object content', () => {
    const content = { key1: '  value1  ', key2: '  value2  ' };
    const compressed = manager.compressContent(content);
    
    expect(compressed.key1).toBe('value1');
    expect(compressed.key2).toBe('value2');
  });

  it('should return primitive content unchanged', () => {
    expect(manager.compressContent(123)).toBe(123);
    expect(manager.compressContent(true)).toBe(true);
    expect(manager.compressContent(null)).toBe(null);
  });

  it('should get memory item', () => {
    manager.addMemoryItem('item-1', { data: 'test' });
    
    const item = manager.getMemoryItem('item-1');
    
    expect(item).toBeDefined();
    expect(item.id).toBe('item-1');
  });

  it('should update access count on get', () => {
    manager.addMemoryItem('item-1', { data: 'test' });
    
    manager.getMemoryItem('item-1');
    manager.getMemoryItem('item-1');
    
    const item = manager.getMemoryItem('item-1');
    expect(item.metadata.accessCount).toBe(3);
  });

  it('should return null for non-existent item', () => {
    const item = manager.getMemoryItem('non-existent');
    expect(item).toBeNull();
  });

  it('should get all memory items', () => {
    manager.addMemoryItem('item-1', { data: 'test1' });
    manager.addMemoryItem('item-2', { data: 'test2' });
    
    const items = manager.getAllMemoryItems();
    expect(items.length).toBe(2);
  });

  it('should get patterns', () => {
    manager.addMemoryItem('item-1', { data: 'test pattern' });
    manager.addMemoryItem('item-2', { data: 'test pattern' });
    manager.addMemoryItem('item-3', { data: 'test pattern' });
    
    manager.findPatterns();
    
    const patterns = manager.getPatterns();
    expect(patterns.length).toBeGreaterThan(0);
  });

  it('should get compression statistics', () => {
    manager.addMemoryItem('item-1', { data: 'test' });
    
    const stats = manager.getCompressionStats();
    
    expect(stats).toBeDefined();
    expect(stats.itemCount).toBe(1);
    expect(stats.originalSize).toBeGreaterThan(0);
  });

  it('should calculate compression ratio', () => {
    manager.addMemoryItem('item-1', { data: '  test  ' });
    manager.optimizeStorage();
    
    const stats = manager.getCompressionStats();
    expect(stats.compressionRatio).toBeGreaterThan(0);
  });

  it('should calculate storage reduction', () => {
    manager.addMemoryItem('item-1', { data: '  test  ' });
    manager.optimizeStorage();
    
    const stats = manager.getCompressionStats();
    expect(stats.storageReduction).toBeDefined();
  });

  it('should run full consolidation', () => {
    manager.addMemoryItem('item-1', { data: 'test pattern' });
    manager.addMemoryItem('item-2', { data: 'test pattern' });
    manager.addMemoryItem('item-3', { data: 'test pattern' });
    manager.addMemoryItem('item-4', { data: '  spaces  ' });
    
    const results = manager.runConsolidation();
    
    expect(results).toBeDefined();
    expect(results.patternsConsolidated).toBeGreaterThan(0);
  });

  it('should respect consolidation options', () => {
    manager.addMemoryItem('item-1', { data: 'test' });
    
    const results = manager.runConsolidation({ decayRate: 0.5, decayThreshold: 0.8, compress: false });
    
    expect(results).toBeDefined();
  });

  it('should reset all data', () => {
    manager.addMemoryItem('item-1', { data: 'test' });
    manager.findPatterns();
    
    manager.reset();
    
    const stats = manager.getCompressionStats();
    expect(stats.itemCount).toBe(0);
    expect(stats.patternCount).toBe(0);
  });

  it('should track last accessed timestamp', () => {
    manager.addMemoryItem('item-1', { data: 'test' });
    
    const item = manager.getMemoryItem('item-1');
    expect(item.metadata.lastAccessed).toBeDefined();
  });

  it('should initialize with zero stats', () => {
    const stats = manager.getCompressionStats();
    
    expect(stats.originalSize).toBe(0);
    expect(stats.compressedSize).toBe(0);
    expect(stats.itemsCompressed).toBe(0);
  });

  it('should handle empty content', () => {
    const item = manager.addMemoryItem('item-1', '');
    expect(item.size).toBeGreaterThanOrEqual(0);
  });

  it('should handle null content', () => {
    const item = manager.addMemoryItem('item-1', null);
    expect(item.content).toBeNull();
  });

  it('should generate signature for content', () => {
    const signature = manager.generateSignature('test content with words');
    expect(signature).toBeDefined();
    expect(typeof signature).toBe('string');
  });

  it('should generate different signatures for different content', () => {
    const sig1 = manager.generateSignature('test content one');
    const sig2 = manager.generateSignature('different content two');
    
    expect(sig1).not.toBe(sig2);
  });
});
