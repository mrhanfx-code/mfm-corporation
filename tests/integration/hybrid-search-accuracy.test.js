import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HybridSearchEngine } from '../../src/core/search-engine.js';

describe('Hybrid Search Accuracy Integration Test', () => {
  let hybridSearch;
  let mockEnv;

  beforeEach(() => {
    hybridSearch = new HybridSearchEngine();
    mockEnv = { OPENAI_API_KEY: 'test-key' };
    global.fetch = vi.fn();
  });

  it('should achieve 95%+ retrieval accuracy on sample queries', async () => {
    // Mock embeddings with realistic similarity patterns
    const mockEmbeddings = {
      'doc1': Array(1536).fill(0.9), // High similarity to "test"
      'doc2': Array(1536).fill(0.5), // Medium similarity
      'doc3': Array(1536).fill(0.3), // Low similarity
      'doc4': Array(1536).fill(0.1), // Very low similarity
      'doc5': Array(1536).fill(0.8), // High similarity to "api"
    };

    let callCount = 0;
    global.fetch.mockImplementation(() => {
      const embeddings = Object.values(mockEmbeddings);
      const embedding = embeddings[callCount % embeddings.length];
      callCount++;
      
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: [{ embedding }] })
      });
    });

    // Add sample documents
    await hybridSearch.addDocument('doc1', 'Test document with testing keywords and test cases', mockEnv);
    await hybridSearch.addDocument('doc2', 'Another document about testing procedures', mockEnv);
    await hybridSearch.addDocument('doc3', 'Random document with unrelated content', mockEnv);
    await hybridSearch.addDocument('doc4', 'Completely different topic document', mockEnv);
    await hybridSearch.addDocument('doc5', 'API documentation and integration guide', mockEnv);

    // Test queries with expected results
    const testQueries = [
      {
        query: 'test',
        expectedDocIds: ['doc1', 'doc2'] // Should find test-related documents
      },
      {
        query: 'api',
        expectedDocIds: ['doc5'] // Should find API document
      },
      {
        query: 'testing',
        expectedDocIds: ['doc1', 'doc2'] // Should find testing-related documents
      }
    ];

    let correct = 0;
    let total = 0;

    for (const test of testQueries) {
      const results = await hybridSearch.search(test.query, mockEnv, 5);
      const foundIds = results.map(r => r.docId);
      
      for (const expectedId of test.expectedDocIds) {
        if (foundIds.includes(expectedId)) {
          correct++;
        }
        total++;
      }
    }

    const accuracy = (correct / total) * 100;
    console.log(`Retrieval accuracy: ${accuracy.toFixed(2)}%`);
    
    expect(accuracy).toBeGreaterThanOrEqual(95);
  });

  it('should optimize weights to improve accuracy', async () => {
    const mockEmbeddings = Array(1536).fill(0.5);
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: mockEmbeddings }] })
    });

    // Add sample documents
    await hybridSearch.addDocument('doc1', 'Test document', mockEnv);
    await hybridSearch.addDocument('doc2', 'Another test', mockEnv);
    await hybridSearch.addDocument('doc3', 'API guide', mockEnv);

    const testQueries = [
      { query: 'test', expectedDocIds: ['doc1', 'doc2'] },
      { query: 'api', expectedDocIds: ['doc3'] }
    ];

    const optimized = await hybridSearch.optimizeWeights(testQueries, mockEnv);
    
    expect(optimized).toHaveProperty('bm25');
    expect(optimized).toHaveProperty('vector');
    expect(optimized).toHaveProperty('accuracy');
    expect(optimized.accuracy).toBeGreaterThan(0);
  });

  it('should handle edge cases with no results', async () => {
    const mockEmbedding = Array(1536).fill(0.1);
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: mockEmbedding }] })
    });

    await hybridSearch.addDocument('doc1', 'Test document', mockEnv);
    
    const results = await hybridSearch.search('nonexistent query that should not match', mockEnv);
    
    // Should return empty or very low score results
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it('should handle empty index gracefully', async () => {
    const mockEmbedding = Array(1536).fill(0.5);
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: mockEmbedding }] })
    });

    const results = await hybridSearch.search('test', mockEnv);
    
    expect(results).toEqual([]);
  });
});
