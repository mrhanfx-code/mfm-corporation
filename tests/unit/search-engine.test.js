import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BM25Search, VectorSearch, HybridSearchEngine, SearchEngineManager } from '../../src/core/search-engine.js';

describe('BM25Search', () => {
  let bm25;

  beforeEach(() => {
    bm25 = new BM25Search();
  });

  it('should tokenize text correctly', () => {
    const terms = bm25.tokenize('Hello World! This is a test.');
    expect(terms).toEqual(['hello', 'world', 'this', 'is', 'a', 'test']);
  });

  it('should add documents to index', () => {
    bm25.addDocument('doc1', 'This is a test document');
    expect(bm25.totalDocs).toBe(1);
    expect(bm25.documents.has('doc1')).toBe(true);
  });

  it('should calculate term frequency correctly', () => {
    const terms = ['test', 'test', 'hello', 'world', 'test'];
    const termFreq = bm25.calculateTermFreq(terms);
    expect(termFreq.get('test')).toBe(3);
    expect(termFreq.get('hello')).toBe(1);
  });

  it('should calculate IDF correctly', () => {
    bm25.addDocument('doc1', 'test document');
    bm25.addDocument('doc2', 'another test');
    const idf = bm25.calculateIDF('test');
    expect(idf).toBeGreaterThan(0);
  });

  it('should search documents and return ranked results', () => {
    bm25.addDocument('doc1', 'test document about testing');
    bm25.addDocument('doc2', 'another document');
    bm25.addDocument('doc3', 'test case');
    
    const results = bm25.search('test');
    expect(results.length).toBeGreaterThan(0);
    expect(results.map(r => r.docId)).toContain('doc1');
    expect(results.map(r => r.docId)).toContain('doc3');
    // Results should be sorted by score descending
    for (let i = 1; i < results.length; i++) {
      expect(results[i-1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it('should return empty results for non-matching query', () => {
    bm25.addDocument('doc1', 'test document');
    const results = bm25.search('nonexistent');
    expect(results.length).toBe(0);
  });

  it('should limit results correctly', () => {
    bm25.addDocument('doc1', 'test one');
    bm25.addDocument('doc2', 'test two');
    bm25.addDocument('doc3', 'test three');
    
    const results = bm25.search('test', 2);
    expect(results.length).toBe(2);
  });

  it('should clear the index', () => {
    bm25.addDocument('doc1', 'test document');
    bm25.clear();
    expect(bm25.totalDocs).toBe(0);
    expect(bm25.documents.size).toBe(0);
  });
});

describe('VectorSearch', () => {
  let vectorSearch;
  let mockEnv;

  beforeEach(() => {
    vectorSearch = new VectorSearch();
    mockEnv = { OPENAI_API_KEY: 'test-key' };
    
    // Mock fetch for OpenAI API
    global.fetch = vi.fn();
  });

  it('should generate embedding for text', async () => {
    const mockEmbedding = Array(1536).fill(0.1);
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: mockEmbedding }] })
    });

    const embedding = await vectorSearch.generateEmbedding('test text', mockEnv);
    expect(embedding).toEqual(mockEmbedding);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/embeddings',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-key'
        })
      })
    );
  });

  it('should throw error if API key not configured', async () => {
    await expect(vectorSearch.generateEmbedding('test', {})).rejects.toThrow('OPENAI_API_KEY not configured');
  });

  it('should calculate cosine similarity correctly', () => {
    const vecA = [1, 0, 0];
    const vecB = [1, 0, 0];
    const similarity = vectorSearch.cosineSimilarity(vecA, vecB);
    expect(similarity).toBe(1);
  });

  it('should calculate cosine similarity for orthogonal vectors', () => {
    const vecA = [1, 0, 0];
    const vecB = [0, 1, 0];
    const similarity = vectorSearch.cosineSimilarity(vecA, vecB);
    expect(similarity).toBe(0);
  });

  it('should add document with embedding', async () => {
    const mockEmbedding = Array(1536).fill(0.1);
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: mockEmbedding }] })
    });

    await vectorSearch.addDocument('doc1', 'test content', mockEnv);
    expect(vectorSearch.embeddings.has('doc1')).toBe(true);
  });

  it('should search documents by similarity', async () => {
    const mockEmbedding = Array(1536).fill(0.1);
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: mockEmbedding }] })
    });

    await vectorSearch.addDocument('doc1', 'similar content', mockEnv);
    await vectorSearch.addDocument('doc2', 'different content', mockEnv);

    const results = await vectorSearch.search('similar content', mockEnv);
    expect(results.length).toBeGreaterThan(0);
  });

  it('should clear the index', () => {
    vectorSearch.embeddings.set('doc1', { content: 'test', embedding: [1, 2, 3] });
    vectorSearch.clear();
    expect(vectorSearch.embeddings.size).toBe(0);
  });
});

describe('HybridSearchEngine', () => {
  let hybridSearch;
  let mockEnv;

  beforeEach(() => {
    hybridSearch = new HybridSearchEngine();
    mockEnv = { OPENAI_API_KEY: 'test-key' };
    global.fetch = vi.fn();
  });

  it('should add document to both indices', async () => {
    const mockEmbedding = Array(1536).fill(0.1);
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: mockEmbedding }] })
    });

    await hybridSearch.addDocument('doc1', 'test content', mockEnv);
    expect(hybridSearch.bm25.documents.has('doc1')).toBe(true);
    expect(hybridSearch.vector.embeddings.has('doc1')).toBe(true);
  });

  it('should search using hybrid approach', async () => {
    const mockEmbedding = Array(1536).fill(0.1);
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: mockEmbedding }] })
    });

    await hybridSearch.addDocument('doc1', 'test content', mockEnv);
    await hybridSearch.addDocument('doc2', 'another test', mockEnv);

    const results = await hybridSearch.search('test', mockEnv);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('bm25Score');
    expect(results[0]).toHaveProperty('vectorScore');
    expect(results[0]).toHaveProperty('score');
  });

  it('should combine BM25 and vector scores', async () => {
    const mockEmbedding = Array(1536).fill(0.1);
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: mockEmbedding }] })
    });

    await hybridSearch.addDocument('doc1', 'test content', mockEnv);
    const results = await hybridSearch.search('test', mockEnv);
    
    // Combined score should be weighted average
    const expectedScore = (results[0].bm25Score * hybridSearch.bm25Weight) + 
                         (results[0].vectorScore * hybridSearch.vectorWeight);
    expect(results[0].score).toBeCloseTo(expectedScore, 5);
  });

  it('should set combination weights', () => {
    hybridSearch.setWeights(0.7, 0.3);
    expect(hybridSearch.bm25Weight).toBe(0.7);
    expect(hybridSearch.vectorWeight).toBe(0.3);
  });

  it('should normalize weights to sum to 1', () => {
    hybridSearch.setWeights(2, 1);
    expect(hybridSearch.bm25Weight).toBeCloseTo(0.667, 3);
    expect(hybridSearch.vectorWeight).toBeCloseTo(0.333, 3);
  });

  it('should clear both indices', async () => {
    const mockEmbedding = Array(1536).fill(0.1);
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: mockEmbedding }] })
    });

    await hybridSearch.addDocument('doc1', 'test', mockEnv);
    hybridSearch.clear();
    expect(hybridSearch.bm25.documents.size).toBe(0);
    expect(hybridSearch.vector.embeddings.size).toBe(0);
  });
});

describe('SearchEngineManager', () => {
  let manager;
  let mockEnv;

  beforeEach(() => {
    mockEnv = { OPENAI_API_KEY: 'test-key' };
    manager = new SearchEngineManager(mockEnv);
    global.fetch = vi.fn();
  });

  it('should create default engine', () => {
    const engine = manager.getEngine();
    expect(engine).toBeDefined();
    expect(manager.defaultEngine).toBe(engine);
  });

  it('should create named engines', () => {
    const engine1 = manager.getEngine('engine1');
    const engine2 = manager.getEngine('engine2');
    expect(engine1).not.toBe(engine2);
    expect(manager.engines.size).toBe(2);
  });

  it('should reuse existing engines', () => {
    const engine1 = manager.getEngine('test');
    const engine2 = manager.getEngine('test');
    expect(engine1).toBe(engine2);
  });

  it('should add document to engine', async () => {
    const mockEmbedding = Array(1536).fill(0.1);
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: mockEmbedding }] })
    });

    await manager.addDocument('doc1', 'test content');
    const engine = manager.getEngine();
    expect(engine.bm25.documents.has('doc1')).toBe(true);
  });

  it('should search documents', async () => {
    const mockEmbedding = Array(1536).fill(0.1);
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: mockEmbedding }] })
    });

    await manager.addDocument('doc1', 'test content');
    const results = await manager.search('test');
    expect(results.length).toBeGreaterThan(0);
  });

  it('should clear engine', async () => {
    const mockEmbedding = Array(1536).fill(0.1);
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: mockEmbedding }] })
    });

    await manager.addDocument('doc1', 'test');
    manager.clear();
    const engine = manager.getEngine();
    expect(engine.bm25.documents.size).toBe(0);
  });

  it('should set engine weights', () => {
    manager.setWeights(0.8, 0.2);
    const engine = manager.getEngine();
    expect(engine.bm25Weight).toBe(0.8);
    expect(engine.vectorWeight).toBe(0.2);
  });
});
