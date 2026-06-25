// Smart Search — Hybrid semantic search with token optimization

import { logger } from '../core/logger.js';

class SmartSearchWorkflow {
  constructor(env) {
    this.env = env;
    this.searchCache = new Map();
    this.searchHistory = new Map();
    this.tokenReductionStats = {
      totalQueries: 0,
      totalTokensSaved: 0,
      averageReduction: 0
    };
  }

  /**
   * Perform smart search with semantic understanding
   * @param {string} query - Search query
   * @param {object} options - Search options
   * @returns {object} Search results
   */
  async smartSearch(query, options = {}) {
    const searchId = `search-${Date.now()}`;
    const originalTokens = this.estimateTokens(query);

    logger.info(`Smart Search: Starting search ${searchId}`, {
      query: query.substring(0, 100),
      originalTokens
    });

    // Check cache first
    const cacheKey = this.generateCacheKey(query, options);
    if (this.searchCache.has(cacheKey)) {
      const cached = this.searchCache.get(cacheKey);
      logger.info(`Smart Search: Cache hit for ${searchId}`);
      return cached.results;
    }

    // Optimize query for token reduction
    const optimizedQuery = this.optimizeQuery(query);
    const optimizedTokens = this.estimateTokens(optimizedQuery);
    const tokensSaved = originalTokens - optimizedTokens;

    // Perform semantic search
    const results = await this.performSemanticSearch(optimizedQuery, options);

    // Rank results
    const rankedResults = this.rankResults(results, query);

    // Calculate metrics
    const reductionPercentage = (tokensSaved / originalTokens) * 100;
    this.updateTokenReductionStats(tokensSaved, originalTokens);

    const searchResult = {
      id: searchId,
      query,
      optimizedQuery,
      results: rankedResults,
      metrics: {
        originalTokens,
        optimizedTokens,
        tokensSaved,
        reductionPercentage: reductionPercentage.toFixed(1) + '%',
        resultCount: rankedResults.length
      },
      timestamp: new Date().toISOString()
    };

    // Cache results
    this.searchCache.set(cacheKey, {
      results: searchResult,
      timestamp: Date.now()
    });

    // Log to history
    this.searchHistory.set(searchId, searchResult);

    logger.info(`Smart Search: Completed search ${searchId}`, {
      reductionPercentage: reductionPercentage.toFixed(1) + '%',
      resultCount: rankedResults.length
    });

    return searchResult;
  }

  /**
   * Optimize query for token reduction
   * @param {string} query - Original query
   * @returns {string} Optimized query
   */
  optimizeQuery(query) {
    // Remove stop words and redundant phrases
    const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while', 'although', 'though', 'unless', 'except', 'since', 'even', 'though', 'whether', 'while', 'after', 'before', 'although', 'because', 'if', 'unless', 'until', 'when', 'where', 'while'];

    const words = query.toLowerCase().split(/\s+/);
    const filteredWords = words.filter(word => {
      return !stopWords.includes(word) && word.length > 1;
    });

    // Return optimized query (keep original structure if too short)
    if (filteredWords.length < 2) {
      return query;
    }

    return filteredWords.join(' ');
  }

  /**
   * Perform semantic search
   * @param {string} query - Optimized query
   * @param {object} options - Search options
   * @returns {Array} Search results
   */
  async performSemanticSearch(query, options) {
    // In production, this would call actual semantic search API
    // For now, return mock results
    const mockResults = [
      {
        id: 'result-1',
        title: 'Relevant Document 1',
        content: 'This document contains relevant information about the query topic',
        relevance: 0.95,
        source: 'knowledge-base'
      },
      {
        id: 'result-2',
        title: 'Related Article',
        content: 'Article discussing similar concepts and approaches',
        relevance: 0.87,
        source: 'articles'
      },
      {
        id: 'result-3',
        title: 'Reference Material',
        content: 'Reference documentation with detailed explanations',
        relevance: 0.82,
        source: 'documentation'
      }
    ];

    return mockResults;
  }

  /**
   * Rank search results by relevance
   * @param {Array} results - Search results
   * @param {string} query - Original query
   * @returns {Array} Ranked results
   */
  rankResults(results, query) {
    // Sort by relevance score
    const ranked = results.sort((a, b) => b.relevance - a.relevance);

    // Add rank information
    return ranked.map((result, index) => ({
      ...result,
      rank: index + 1,
      score: (result.relevance * 100).toFixed(1) + '%'
    }));
  }

  /**
   * Estimate token count
   * @param {string} text - Text to estimate
   * @returns {number} Estimated token count
   */
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }

  /**
   * Generate cache key
   * @param {string} query - Search query
   * @param {object} options - Search options
   * @returns {string} Cache key
   */
  generateCacheKey(query, options) {
    const optionsStr = JSON.stringify(options);
    return `${query}:${optionsStr}`;
  }

  /**
   * Update token reduction statistics
   * @param {number} tokensSaved - Tokens saved
   * @param {number} originalTokens - Original token count
   */
  updateTokenReductionStats(tokensSaved, originalTokens) {
    this.tokenReductionStats.totalQueries++;
    this.tokenReductionStats.totalTokensSaved += tokensSaved;
    this.tokenReductionStats.averageReduction = 
      (this.tokenReductionStats.totalTokensSaved / this.tokenReductionStats.totalQueries);
  }

  /**
   * Get search statistics
   * @returns {object} Search statistics
   */
  getSearchStatistics() {
    return {
      totalQueries: this.tokenReductionStats.totalQueries,
      totalTokensSaved: this.tokenReductionStats.totalTokensSaved,
      averageReduction: this.tokenReductionStats.averageReduction.toFixed(2),
      cacheSize: this.searchCache.size,
      historySize: this.searchHistory.size
    };
  }

  /**
   * Get search history
   * @param {number} limit - Maximum number of entries
   * @returns {Array} Search history
   */
  getSearchHistory(limit = 50) {
    const history = Array.from(this.searchHistory.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return history.slice(0, limit);
  }

  /**
   * Clear search cache
   */
  clearCache() {
    this.searchCache.clear();
    logger.info(`Smart Search: Cache cleared`);
  }

  /**
   * Clear search history
   */
  clearHistory() {
    this.searchHistory.clear();
    logger.info(`Smart Search: History cleared`);
  }

  /**
   * Reset statistics
   */
  resetStatistics() {
    this.tokenReductionStats = {
      totalQueries: 0,
      totalTokensSaved: 0,
      averageReduction: 0
    };
    logger.info(`Smart Search: Statistics reset`);
  }
}

export { SmartSearchWorkflow };
