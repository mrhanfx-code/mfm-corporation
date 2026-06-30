// Smart Search — Intelligent search with context awareness and ranking

import { logger } from './logger.js';
import { saveMemory, getMemory } from '../tools/d1-store.js';
import { HybridSearchManager } from './hybrid-search.js';

class SmartSearchManager {
  constructor(env) {
    this.env = env;
    this.hybridSearch = new HybridSearchManager(env);
    this.searchHistory = new Map();
    this.queryPatterns = new Map();
  }

  async smartSearch(query, context = {}) {
    const searchId = `search:${Date.now()}`;
    
    logger.info(`Smart Search: Executing search ${searchId}`, {
      query,
      context
    });
    
    // Analyze query intent
    const intent = this.analyzeQueryIntent(query);
    
    // Expand query with related terms
    const expandedQuery = this.expandQuery(query, intent);
    
    // Execute hybrid search
    const results = await this.hybridSearch.hybridSearch(expandedQuery, {
      limit: context.limit || 20,
      bm25Weight: context.bm25Weight || 0.4,
      vectorWeight: context.vectorWeight || 0.6
    });
    
    // Re-rank results based on context
    const rankedResults = this.rerankResults(results, context, intent);
    
    // Add metadata
    const searchResult = {
      id: searchId,
      originalQuery: query,
      expandedQuery,
      intent,
      results: rankedResults,
      context,
      timestamp: new Date().toISOString(),
      totalResults: rankedResults.length
    };
    
    // Save to history
    this.searchHistory.set(searchId, searchResult);
    await this.saveSearch(searchId, searchResult);
    
    // Update query patterns
    this.updateQueryPatterns(query, intent);
    
    logger.info(`Smart Search: Search complete ${searchId}`, {
      results: rankedResults.length,
      intent
    });
    
    return searchResult;
  }

  analyzeQueryIntent(query) {
    const lowerQuery = query.toLowerCase();
    
    const intents = {
      code: ['function', 'class', 'method', 'variable', 'const', 'let', 'import', 'export'],
      documentation: ['how to', 'what is', 'explain', 'documentation', 'guide', 'tutorial'],
      debugging: ['error', 'bug', 'fix', 'issue', 'problem', 'debug', 'troubleshoot'],
      configuration: ['config', 'setting', 'setup', 'install', 'configure', 'environment'],
      api: ['api', 'endpoint', 'request', 'response', 'http', 'rest', 'graphql'],
      data: ['data', 'database', 'query', 'sql', 'schema', 'model', 'entity'],
      security: ['security', 'auth', 'permission', 'access', 'token', 'credential'],
      performance: ['performance', 'optimize', 'speed', 'latency', 'cache', 'slow'],
      testing: ['test', 'spec', 'assert', 'mock', 'stub', 'coverage']
    };
    
    let bestMatch = 'general';
    let highestScore = 0;
    
    for (const [intent, keywords] of Object.entries(intents)) {
      let score = 0;
      for (const keyword of keywords) {
        if (lowerQuery.includes(keyword)) {
          score += 1;
        }
      }
      if (score > highestScore) {
        highestScore = score;
        bestMatch = intent;
      }
    }
    
    return {
      primary: bestMatch,
      confidence: highestScore / 3,
      keywords: this.extractKeywords(query)
    };
  }

  extractKeywords(query) {
    const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once'];
    
    const words = query.toLowerCase().split(/\s+/);
    return words.filter(word => word.length > 2 && !stopWords.includes(word));
  }

  expandQuery(query, intent) {
    const expansions = {
      code: ['implementation', 'source code', 'function definition'],
      documentation: ['docs', 'reference', 'manual', 'guide'],
      debugging: ['fix', 'solution', 'troubleshooting', 'error message'],
      configuration: ['setup', 'installation', 'environment variables'],
      api: ['endpoint', 'request', 'response', 'interface'],
      data: ['database', 'schema', 'model', 'entity'],
      security: ['authentication', 'authorization', 'access control'],
      performance: ['optimization', 'speed', 'latency', 'caching'],
      testing: ['unit test', 'integration test', 'test case']
    };
    
    const intentExpansions = expansions[intent.primary] || [];
    return `${query} ${intentExpansions.join(' ')}`;
  }

  rerankResults(results, context, intent) {
    const ranked = results.map(result => {
      let score = result.score;
      
      // Boost score based on intent
      if (intent.primary === 'code' && result.content.includes('function')) {
        score *= 1.2;
      }
      if (intent.primary === 'documentation' && result.content.length > 500) {
        score *= 1.1;
      }
      if (intent.primary === 'debugging' && result.content.includes('error')) {
        score *= 1.3;
      }
      
      // Boost based on context
      if (context.fileType && result.content.includes(context.fileType)) {
        score *= 1.1;
      }
      if (context.language && result.content.includes(context.language)) {
        score *= 1.1;
      }
      
      // Recency boost
      if (result.timestamp) {
        const age = Date.now() - new Date(result.timestamp).getTime();
        const ageInDays = age / (1000 * 60 * 60 * 24);
        if (ageInDays < 30) {
          score *= 1.05;
        }
      }
      
      return {
        ...result,
        rerankedScore: score
      };
    });
    
    return ranked.sort((a, b) => b.rerankedScore - a.rerankedScore);
  }

  updateQueryPatterns(query, intent) {
    const patternKey = intent.primary;
    
    if (!this.queryPatterns.has(patternKey)) {
      this.queryPatterns.set(patternKey, {
        count: 0,
        queries: []
      });
    }
    
    const pattern = this.queryPatterns.get(patternKey);
    pattern.count++;
    pattern.queries.push({
      query,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 100 queries per pattern
    if (pattern.queries.length > 100) {
      pattern.queries = pattern.queries.slice(-100);
    }
  }

  async saveSearch(searchId, searchResult) {
    try {
      const memoryKey = `smart_search:${searchId}`;
      await saveMemory(this.env, memoryKey, searchResult);
    } catch (error) {
      logger.error(`Smart Search: Failed to save search`, {
        error: error.message
      });
    }
  }

  async getSuggestions(query, limit = 5) {
    const intent = this.analyzeQueryIntent(query);
    const pattern = this.queryPatterns.get(intent.primary);
    
    if (!pattern || pattern.queries.length === 0) {
      return [];
    }
    
    // Get similar queries from history
    const suggestions = pattern.queries
      .filter(q => q.query !== query)
      .slice(-limit)
      .map(q => q.query);
    
    return suggestions;
  }

  getSearchStatistics() {
    const stats = {
      totalSearches: this.searchHistory.size,
      intents: {},
      averageResults: 0
    };
    
    let totalResults = 0;
    
    for (const search of this.searchHistory.values()) {
      const intent = search.intent.primary;
      stats.intents[intent] = (stats.intents[intent] || 0) + 1;
      totalResults += search.totalResults;
    }
    
    if (stats.totalSearches > 0) {
      stats.averageResults = totalResults / stats.totalSearches;
    }
    
    return stats;
  }

  async clearHistory() {
    this.searchHistory.clear();
    this.queryPatterns.clear();
    logger.info(`Smart Search: History cleared`);
  }
}

export { SmartSearchManager };
