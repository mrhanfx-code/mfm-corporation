// Search Engine - Hybrid BM25 + Vector Search Implementation

import { logger } from './logger.js';

/**
 * BM25 Search Algorithm Implementation
 * BM25 is a ranking function used by search engines to estimate the relevance of documents
 * to a given search query. It's based on the probabilistic retrieval framework.
 */
class BM25Search {
  constructor(options = {}) {
    this.k1 = options.k1 || 1.2; // Term frequency saturation parameter
    this.b = options.b || 0.75; // Length normalization parameter
    this.documents = new Map(); // Document ID -> { content, terms, length }
    this.termStats = new Map(); // Term -> { df, idf }
    this.avgDocLength = 0;
    this.totalDocs = 0;
  }

  /**
   * Tokenize text into terms
   * @param {string} text - Text to tokenize
   * @returns {string[]} Array of terms
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 0);
  }

  /**
   * Add a document to the index
   * @param {string} docId - Document identifier
   * @param {string} content - Document content
   */
  addDocument(docId, content) {
    const terms = this.tokenize(content);
    const docLength = terms.length;
    
    this.documents.set(docId, {
      content,
      terms,
      length: docLength,
      termFreq: this.calculateTermFreq(terms)
    });

    this.totalDocs++;
    this.updateAvgDocLength();
    this.updateTermStats(terms);
  }

  /**
   * Calculate term frequency for a document
   * @param {string[]} terms - Array of terms
   * @returns {Map} Term -> frequency
   */
  calculateTermFreq(terms) {
    const termFreq = new Map();
    for (const term of terms) {
      termFreq.set(term, (termFreq.get(term) || 0) + 1);
    }
    return termFreq;
  }

  /**
   * Update average document length
   */
  updateAvgDocLength() {
    let totalLength = 0;
    for (const doc of this.documents.values()) {
      totalLength += doc.length;
    }
    this.avgDocLength = totalLength / this.totalDocs;
  }

  /**
   * Update term statistics (document frequency)
   * @param {string[]} terms - Array of terms
   */
  updateTermStats(terms) {
    const uniqueTerms = new Set(terms);
    for (const term of uniqueTerms) {
      const stats = this.termStats.get(term) || { df: 0 };
      stats.df++;
      this.termStats.set(term, stats);
    }
  }

  /**
   * Calculate IDF (Inverse Document Frequency) for a term
   * @param {string} term - Term to calculate IDF for
   * @returns {number} IDF score
   */
  calculateIDF(term) {
    const stats = this.termStats.get(term);
    if (!stats || stats.df === 0) return 0;
    
    return Math.log((this.totalDocs - stats.df + 0.5) / (stats.df + 0.5) + 1);
  }

  /**
   * Calculate BM25 score for a document
   * @param {string} docId - Document ID
   * @param {string[]} queryTerms - Query terms
   * @returns {number} BM25 score
   */
  calculateBM25Score(docId, queryTerms) {
    const doc = this.documents.get(docId);
    if (!doc) return 0;

    let score = 0;
    const termFreq = doc.termFreq;

    for (const term of queryTerms) {
      const tf = termFreq.get(term) || 0;
      if (tf === 0) continue;

      const idf = this.calculateIDF(term);
      const normalizedTF = (tf * (this.k1 + 1)) / (tf + this.k1 * (1 - this.b + this.b * (doc.length / this.avgDocLength)));
      
      score += idf * normalizedTF;
    }

    return score;
  }

  /**
   * Search documents using BM25
   * @param {string} query - Search query
   * @param {number} limit - Maximum results to return
   * @returns {Array} Array of { docId, score, content }
   */
  search(query, limit = 10) {
    const queryTerms = this.tokenize(query);
    const results = [];

    for (const [docId, doc] of this.documents.entries()) {
      const score = this.calculateBM25Score(docId, queryTerms);
      if (score > 0) {
        results.push({
          docId,
          score,
          content: doc.content
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Clear the index
   */
  clear() {
    this.documents.clear();
    this.termStats.clear();
    this.avgDocLength = 0;
    this.totalDocs = 0;
  }
}

/**
 * Vector Search Implementation using OpenAI Embeddings
 */
class VectorSearch {
  constructor(options = {}) {
    this.embeddings = new Map(); // Document ID -> embedding vector
    this.model = options.model || 'text-embedding-3-small';
    this.dimension = options.dimension || 1536;
  }

  /**
   * Generate embedding for text
   * @param {string} text - Text to embed
   * @param {object} env - Environment with OpenAI API key
   * @returns {Promise<number[]>} Embedding vector
   */
  async generateEmbedding(text, env) {
    if (!env?.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: this.model,
        input: text,
        encoding_format: 'float'
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  /**
   * Add document with embedding
   * @param {string} docId - Document ID
   * @param {string} content - Document content
   * @param {object} env - Environment with OpenAI API key
   */
  async addDocument(docId, content, env) {
    const embedding = await this.generateEmbedding(content, env);
    this.embeddings.set(docId, {
      content,
      embedding
    });
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {number[]} vecA - First vector
   * @param {number[]} vecB - Second vector
   * @returns {number} Cosine similarity
   */
  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Search documents using vector similarity
   * @param {string} query - Search query
   * @param {object} env - Environment with OpenAI API key
   * @param {number} limit - Maximum results to return
   * @returns {Promise<Array>} Array of { docId, score, content }
   */
  async search(query, env, limit = 10) {
    const queryEmbedding = await this.generateEmbedding(query, env);
    const results = [];

    for (const [docId, doc] of this.embeddings.entries()) {
      const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
      if (similarity > 0) {
        results.push({
          docId,
          score: similarity,
          content: doc.content
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Clear the index
   */
  clear() {
    this.embeddings.clear();
  }
}

/**
 * Hybrid Search Engine combining BM25 and Vector Search
 */
class HybridSearchEngine {
  constructor(options = {}) {
    this.bm25 = new BM25Search(options.bm25);
    this.vector = new VectorSearch(options.vector);
    this.bm25Weight = options.bm25Weight || 0.5;
    this.vectorWeight = options.vectorWeight || 0.5;
  }

  /**
   * Add document to both indices
   * @param {string} docId - Document ID
   * @param {string} content - Document content
   * @param {object} env - Environment with OpenAI API key
   */
  async addDocument(docId, content, env) {
    this.bm25.addDocument(docId, content);
    await this.vector.addDocument(docId, content, env);
  }

  /**
   * Search using hybrid approach
   * @param {string} query - Search query
   * @param {object} env - Environment with OpenAI API key
   * @param {number} limit - Maximum results to return
   * @returns {Promise<Array>} Array of { docId, score, content, bm25Score, vectorScore }
   */
  async search(query, env, limit = 10) {
    // Get BM25 results
    const bm25Results = this.bm25.search(query, limit * 2);
    const bm25Scores = new Map();
    bm25Results.forEach(r => bm25Scores.set(r.docId, r.score));

    // Get vector results
    const vectorResults = await this.vector.search(query, env, limit * 2);
    const vectorScores = new Map();
    vectorResults.forEach(r => vectorScores.set(r.docId, r.score));

    // Combine results
    const combinedResults = new Map();
    
    // Add BM25 results
    for (const result of bm25Results) {
      combinedResults.set(result.docId, {
        docId: result.docId,
        content: result.content,
        bm25Score: result.score,
        vectorScore: 0,
        score: result.score * this.bm25Weight
      });
    }

    // Add/update with vector results
    for (const result of vectorResults) {
      const existing = combinedResults.get(result.docId);
      if (existing) {
        existing.vectorScore = result.score;
        existing.score = (existing.bm25Score * this.bm25Weight) + (result.score * this.vectorWeight);
      } else {
        combinedResults.set(result.docId, {
          docId: result.docId,
          content: result.content,
          bm25Score: 0,
          vectorScore: result.score,
          score: result.score * this.vectorWeight
        });
      }
    }

    // Sort by combined score and return
    return Array.from(combinedResults.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Clear both indices
   */
  clear() {
    this.bm25.clear();
    this.vector.clear();
  }

  /**
   * Set combination weights
   * @param {number} bm25Weight - BM25 weight (0-1)
   * @param {number} vectorWeight - Vector weight (0-1)
   */
  setWeights(bm25Weight, vectorWeight) {
    const total = bm25Weight + vectorWeight;
    this.bm25Weight = bm25Weight / total;
    this.vectorWeight = vectorWeight / total;
  }

  /**
   * Optimize combination weights using grid search
   * @param {Array} testQueries - Array of { query, expectedDocIds }
   * @param {object} env - Environment with OpenAI API key
   * @returns {Promise<object>} Best weights and accuracy
   */
  async optimizeWeights(testQueries, env) {
    const bestWeights = { bm25: 0.5, vector: 0.5, accuracy: 0 };
    
    // Grid search over weight combinations
    for (let bm25W = 0; bm25W <= 1; bm25W += 0.1) {
      for (let vectorW = 0; vectorW <= 1; vectorW += 0.1) {
        if (bm25W + vectorW === 0) continue;
        
        this.setWeights(bm25W, vectorW);
        
        let correct = 0;
        let total = 0;
        
        for (const test of testQueries) {
          const results = await this.search(test.query, env, 5);
          const foundIds = results.map(r => r.docId);
          
          for (const expectedId of test.expectedDocIds) {
            if (foundIds.includes(expectedId)) {
              correct++;
            }
            total++;
          }
        }
        
        const accuracy = correct / total;
        if (accuracy > bestWeights.accuracy) {
          bestWeights.bm25 = this.bm25Weight;
          bestWeights.vector = this.vectorWeight;
          bestWeights.accuracy = accuracy;
        }
      }
    }
    
    // Set to best weights
    this.setWeights(bestWeights.bm25, bestWeights.vector);
    
    return bestWeights;
  }
}

/**
 * Search Engine Manager
 * Manages search instances and provides unified interface
 */
class SearchEngineManager {
  constructor(env) {
    this.env = env;
    this.engines = new Map();
    this.defaultEngine = null;
  }

  /**
   * Create or get a search engine
   * @param {string} name - Engine name
   * @param {object} options - Engine options
   * @returns {HybridSearchEngine} Search engine instance
   */
  getEngine(name = 'default', options = {}) {
    if (!this.engines.has(name)) {
      const engine = new HybridSearchEngine(options);
      this.engines.set(name, engine);
      if (!this.defaultEngine) {
        this.defaultEngine = engine;
      }
    }
    return this.engines.get(name);
  }

  /**
   * Add document to engine
   * @param {string} docId - Document ID
   * @param {string} content - Document content
   * @param {string} engineName - Engine name
   */
  async addDocument(docId, content, engineName = 'default') {
    const engine = this.getEngine(engineName);
    await engine.addDocument(docId, content, this.env);
  }

  /**
   * Search documents
   * @param {string} query - Search query
   * @param {string} engineName - Engine name
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} Search results
   */
  async search(query, engineName = 'default', limit = 10) {
    const engine = this.getEngine(engineName);
    return await engine.search(query, this.env, limit);
  }

  /**
   * Clear engine
   * @param {string} engineName - Engine name
   */
  clear(engineName = 'default') {
    const engine = this.engines.get(engineName);
    if (engine) {
      engine.clear();
    }
  }

  /**
   * Set engine weights
   * @param {number} bm25Weight - BM25 weight
   * @param {number} vectorWeight - Vector weight
   * @param {string} engineName - Engine name
   */
  setWeights(bm25Weight, vectorWeight, engineName = 'default') {
    const engine = this.getEngine(engineName);
    engine.setWeights(bm25Weight, vectorWeight);
  }

  /**
   * Optimize engine weights
   * @param {Array} testQueries - Array of { query, expectedDocIds }
   * @param {string} engineName - Engine name
   * @returns {Promise<object>} Best weights and accuracy
   */
  async optimizeWeights(testQueries, engineName = 'default') {
    const engine = this.getEngine(engineName);
    return await engine.optimizeWeights(testQueries, this.env);
  }
}

export { 
  BM25Search, 
  VectorSearch, 
  HybridSearchEngine, 
  SearchEngineManager 
};
