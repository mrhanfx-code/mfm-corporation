import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SmartSearchWorkflow } from '../../src/cascade/smart-search.js';

describe('SmartSearchWorkflow', () => {
  let workflow;
  let mockEnv;

  beforeEach(() => {
    mockEnv = { test: 'env' };
    workflow = new SmartSearchWorkflow(mockEnv);
    vi.clearAllMocks();
  });

  it('should perform smart search', async () => {
    const query = 'How to implement authentication';
    const result = await workflow.smartSearch(query);

    expect(result).toBeDefined();
    expect(result.query).toBe(query);
    expect(result.results).toBeDefined();
    expect(result.metrics).toBeDefined();
  });

  it('should optimize query for token reduction', () => {
    const query = 'The quick brown fox jumps over the lazy dog';
    const optimized = workflow.optimizeQuery(query);

    expect(optimized).toBeDefined();
    expect(optimized.length).toBeLessThan(query.length);
  });

  it('should estimate tokens', () => {
    const text = 'This is a test message for token estimation';
    const tokens = workflow.estimateTokens(text);

    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toBe(Math.ceil(text.length / 4));
  });

  it('should rank results by relevance', () => {
    const results = [
      { id: '1', title: 'Result 1', relevance: 0.7 },
      { id: '2', title: 'Result 2', relevance: 0.9 },
      { id: '3', title: 'Result 3', relevance: 0.8 }
    ];

    const ranked = workflow.rankResults(results, 'test query');

    expect(ranked[0].id).toBe('2');
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].id).toBe('3');
    expect(ranked[2].id).toBe('1');
  });

  it('should generate cache key', () => {
    const query = 'test query';
    const options = { limit: 10 };

    const key = workflow.generateCacheKey(query, options);

    expect(key).toBeDefined();
    expect(key).toContain(query);
  });

  it('should cache search results', async () => {
    const query = 'test query';
    await workflow.smartSearch(query);

    const stats = workflow.getSearchStatistics();

    expect(stats.cacheSize).toBe(1);
  });

  it('should use cached results on subsequent calls', async () => {
    const query = 'test query';
    const firstResult = await workflow.smartSearch(query);
    const secondResult = await workflow.smartSearch(query);

    expect(firstResult.results).toEqual(secondResult.results);
  });

  it('should update token reduction statistics', async () => {
    const query = 'The quick brown fox jumps over the lazy dog';
    await workflow.smartSearch(query);

    const stats = workflow.getSearchStatistics();

    expect(stats.totalQueries).toBe(1);
    expect(stats.totalTokensSaved).toBeGreaterThan(0);
  });

  it('should get search history', async () => {
    await workflow.smartSearch('query 1');
    await workflow.smartSearch('query 2');

    const history = workflow.getSearchHistory();

    expect(history.length).toBeGreaterThanOrEqual(1);
  });

  it('should limit search history', async () => {
    for (let i = 0; i < 10; i++) {
      await workflow.smartSearch(`query ${i}`);
    }

    const history = workflow.getSearchHistory(5);

    expect(history.length).toBe(5);
  });

  it('should clear cache', async () => {
    await workflow.smartSearch('test query');
    expect(workflow.searchCache.size).toBe(1);

    workflow.clearCache();

    expect(workflow.searchCache.size).toBe(0);
  });

  it('should clear history', async () => {
    await workflow.smartSearch('test query');
    expect(workflow.searchHistory.size).toBe(1);

    workflow.clearHistory();

    expect(workflow.searchHistory.size).toBe(0);
  });

  it('should reset statistics', async () => {
    await workflow.smartSearch('test query');
    expect(workflow.tokenReductionStats.totalQueries).toBe(1);

    workflow.resetStatistics();

    expect(workflow.tokenReductionStats.totalQueries).toBe(0);
  });

  it('should return search statistics', async () => {
    await workflow.smartSearch('test query');

    const stats = workflow.getSearchStatistics();

    expect(stats).toBeDefined();
    expect(stats.totalQueries).toBe(1);
    expect(stats.cacheSize).toBe(1);
  });

  it('should handle empty query optimization', () => {
    const query = 'is';
    const optimized = workflow.optimizeQuery(query);

    expect(optimized).toBe(query);
  });

  it('should calculate reduction percentage correctly', async () => {
    const query = 'The quick brown fox jumps over the lazy dog';
    const result = await workflow.smartSearch(query);

    expect(result.metrics.reductionPercentage).toBeDefined();
    expect(result.metrics.reductionPercentage).toContain('%');
  });
});
