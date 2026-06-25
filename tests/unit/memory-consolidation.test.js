import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryConsolidationManager } from '../../src/core/memory-consolidation.js';

describe('MemoryConsolidationManager', () => {
  let manager;
  let mockEnv;

  beforeEach(() => {
    mockEnv = { test: 'env' };
    manager = new MemoryConsolidationManager(mockEnv);
    vi.clearAllMocks();
  });

  it('should extract key insights from observations', () => {
    const observations = [
      { content: 'This is an important decision', timestamp: '2024-01-01T00:00:00Z' },
      { content: 'Critical issue found', timestamp: '2024-01-01T00:01:00Z' },
      { content: 'Regular message', timestamp: '2024-01-01T00:02:00Z' }
    ];

    const insights = manager.extractKeyInsights(observations);

    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0]).toHaveProperty('content');
    expect(insights[0]).toHaveProperty('keyword');
    expect(insights[0]).toHaveProperty('relevance');
  });

  it('should identify patterns in observations', () => {
    const observations = [
      { content: 'Error occurred in module', timestamp: '2024-01-01T00:00:00Z' },
      { content: 'Another error found', timestamp: '2024-01-01T00:01:00Z' },
      { content: 'Success message', timestamp: '2024-01-01T00:02:00Z' }
    ];

    const patterns = manager.identifyPatterns(observations);

    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0]).toHaveProperty('type');
    expect(patterns[0]).toHaveProperty('count');
    expect(patterns[0]).toHaveProperty('frequency');
  });

  it('should generate summary from observations', () => {
    const observations = [
      { content: 'Message 1', timestamp: '2024-01-01T00:00:00Z' },
      { content: 'Message 2', timestamp: '2024-01-01T00:01:00Z' }
    ];

    const keyInsights = [{ content: 'Important insight', keyword: 'important', relevance: 0.9 }];
    const patterns = [{ type: 'error', count: 2, frequency: 1 }];

    const summary = manager.generateSummary(observations, keyInsights, patterns);

    expect(summary).toContain('observations');
    expect(typeof summary).toBe('string');
  });

  it('should calculate relevance correctly', () => {
    const content = 'This is important';
    const keyword = 'important';

    const relevance = manager.calculateRelevance(content, keyword);

    expect(relevance).toBeGreaterThan(0);
  });

  it('should remove duplicates from items', () => {
    const items = [
      { content: 'Same content', id: 1 },
      { content: 'Same content', id: 2 },
      { content: 'Different content', id: 3 }
    ];

    const unique = manager.removeDuplicates(items, 'content');

    expect(unique.length).toBe(2);
  });

  it('should calculate duration between timestamps', () => {
    const start = '2024-01-01T00:00:00Z';
    const end = '2024-01-01T00:30:00Z';

    const duration = manager.calculateDuration(start, end);

    expect(duration).toContain('minute');
  });

  it('should schedule consolidation', async () => {
    const sessionId = 'test-session';
    const delayMinutes = 60;

    await manager.scheduleConsolidation(sessionId, delayMinutes);

    const schedule = manager.consolidationSchedule.get(sessionId);
    expect(schedule).toBeDefined();
    expect(schedule.sessionId).toBe(sessionId);
    expect(schedule.status).toBe('scheduled');
  });

  it('should get consolidation statistics', () => {
    manager.consolidationHistory.set('consolidation-1', {
      id: 'consolidation-1',
      originalObservations: 100,
      compressed: true,
      compressionRatio: 0.5,
      keyInsights: [{}, {}],
      patterns: [{}, {}, {}]
    });

    manager.consolidationHistory.set('consolidation-2', {
      id: 'consolidation-2',
      originalObservations: 50,
      compressed: false,
      compressionRatio: 0.2,
      keyInsights: [{}],
      patterns: [{}]
    });

    const stats = manager.getConsolidationStatistics();

    expect(stats.total).toBe(2);
    expect(stats.compressed).toBe(1);
    expect(stats.averageCompressionRatio).toBe(0.35);
    expect(stats.totalObservationsConsolidated).toBe(150);
  });

  it('should get all consolidations', () => {
    manager.consolidationHistory.set('consolidation-1', { id: 'consolidation-1' });
    manager.consolidationHistory.set('consolidation-2', { id: 'consolidation-2' });

    const consolidations = manager.getAllConsolidations();

    expect(consolidations.length).toBe(2);
  });

  it('should get specific consolidation', () => {
    const consolidation = { id: 'consolidation-1', test: 'data' };
    manager.consolidationHistory.set('consolidation-1', consolidation);

    const retrieved = manager.getConsolidation('consolidation-1');

    expect(retrieved).toEqual(consolidation);
  });

  it('should return null for non-existent consolidation', () => {
    const retrieved = manager.getConsolidation('non-existent');

    expect(retrieved).toBeNull();
  });

  it('should clear history', () => {
    manager.consolidationHistory.set('consolidation-1', { id: 'consolidation-1' });
    manager.consolidationSchedule.set('session-1', { sessionId: 'session-1' });

    expect(manager.consolidationHistory.size).toBe(1);
    expect(manager.consolidationSchedule.size).toBe(1);

    manager.clearHistory();

    expect(manager.consolidationHistory.size).toBe(0);
    expect(manager.consolidationSchedule.size).toBe(0);
  });
});
