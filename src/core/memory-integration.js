// MCP Memory Integration — memory_search, memory_remember, memory_context, memory_enrich

import { logger } from './logger.js';
import { saveMemory, getMemory } from '../tools/d1-store.js';

const MEMORY_CONFIG = {
  maxEntries: 10000,
  retentionDays: 365,
  embeddingDimension: 1536,
  searchLimit: 10,
  contextLimit: 5
};

class MemoryIntegration {
  constructor(env) {
    this.env = env;
    this.memoryCache = new Map();
    this.embeddingCache = new Map();
  }

  async memorySearch(query, options = {}) {
    const {
      limit = MEMORY_CONFIG.searchLimit,
      threshold = 0.7,
      categories = []
    } = options;

    logger.info(`Memory Integration: Searching memory`, {
      query,
      limit,
      threshold,
      categories
    });

    try {
      // Simulate semantic search (in production, would use embeddings)
      const allMemories = await this.getAllMemories();
      const results = [];

      for (const memory of allMemories) {
        // Category filter
        if (categories.length > 0 && !categories.includes(memory.category)) {
          continue;
        }

        // Simple text matching (in production, use cosine similarity)
        const score = this.calculateSimilarity(query, memory.content);
        
        if (score >= threshold) {
          results.push({
            id: memory.id,
            content: memory.content,
            category: memory.category,
            score,
            timestamp: memory.timestamp,
            metadata: memory.metadata
          });
        }
      }

      // Sort by score and limit results
      results.sort((a, b) => b.score - a.score);
      const limitedResults = results.slice(0, limit);

      logger.info(`Memory Integration: Search complete`, {
        resultsFound: limitedResults.length
      });

      return {
        success: true,
        results: limitedResults,
        query,
        totalMatches: results.length
      };
    } catch (error) {
      logger.error(`Memory Integration: Search failed`, {
        error: error.message
      });
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  async memoryRemember(content, options = {}) {
    const {
      category = 'general',
      metadata = {},
      importance = 'normal'
    } = options;

    const memoryId = `memory:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;

    logger.info(`Memory Integration: Remembering content`, {
      memoryId,
      category,
      importance
    });

    try {
      const memory = {
        id: memoryId,
        content,
        category,
        metadata,
        importance,
        timestamp: new Date().toISOString(),
        embedding: null // In production, would generate embedding
      };

      // Save to D1
      await this.saveMemoryToStorage(memory);
      
      // Update cache
      this.memoryCache.set(memoryId, memory);

      logger.info(`Memory Integration: Content remembered`, {
        memoryId
      });

      return {
        success: true,
        memoryId,
        memory
      };
    } catch (error) {
      logger.error(`Memory Integration: Remember failed`, {
        error: error.message
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  async memoryContext(query, options = {}) {
    const {
      limit = MEMORY_CONFIG.contextLimit,
      includeHistory = true
    } = options;

    logger.info(`Memory Integration: Retrieving context`, {
      query,
      limit
    });

    try {
      // Search for relevant memories
      const searchResult = await this.memorySearch(query, { limit });
      
      if (!searchResult.success) {
        return {
          success: false,
          error: searchResult.error,
          context: []
        };
      }

      // Build context from search results
      const context = searchResult.results.map(result => ({
        content: result.content,
        category: result.category,
        relevance: result.score,
        timestamp: result.timestamp
      }));

      // Add recent history if requested
      if (includeHistory) {
        const recentMemories = await this.getRecentMemories(3);
        recentMemories.forEach(memory => {
          if (!context.find(c => c.content === memory.content)) {
            context.push({
              content: memory.content,
              category: memory.category,
              relevance: 0.5,
              timestamp: memory.timestamp
            });
          }
        });
      }

      // Sort by relevance and timestamp
      context.sort((a, b) => b.relevance - a.relevance);

      logger.info(`Memory Integration: Context retrieved`, {
        contextSize: context.length
      });

      return {
        success: true,
        context,
        query
      };
    } catch (error) {
      logger.error(`Memory Integration: Context retrieval failed`, {
        error: error.message
      });
      return {
        success: false,
        error: error.message,
        context: []
      };
    }
  }

  async memoryEnrich(content, options = {}) {
    const {
      enrichWith = ['category', 'metadata', 'related'],
      query = content
    } = options;

    logger.info(`Memory Integration: Enriching content`, {
      enrichWith
    });

    try {
      const enriched = {
        original: content,
        enrichments: {}
      };

      // Add category
      if (enrichWith.includes('category')) {
        enriched.enrichments.category = this.inferCategory(content);
      }

      // Add metadata
      if (enrichWith.includes('metadata')) {
        enriched.enrichments.metadata = this.extractMetadata(content);
      }

      // Add related memories
      if (enrichWith.includes('related')) {
        const searchResult = await this.memorySearch(query, { limit: 3 });
        if (searchResult.success) {
          enriched.enrichments.related = searchResult.results.map(r => ({
            id: r.id,
            content: r.content,
            score: r.score
          }));
        }
      }

      logger.info(`Memory Integration: Content enriched`, {
        enrichmentCount: Object.keys(enriched.enrichments).length
      });

      return {
        success: true,
        enriched
      };
    } catch (error) {
      logger.error(`Memory Integration: Enrichment failed`, {
        error: error.message
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper methods

  calculateSimilarity(query, content) {
    // Simple word overlap similarity (in production, use embedding cosine similarity)
    const queryWords = new Set(query.toLowerCase().split(/\s+/));
    const contentWords = new Set(content.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...queryWords].filter(x => contentWords.has(x)));
    const union = new Set([...queryWords, ...contentWords]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  inferCategory(content) {
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('error') || contentLower.includes('bug') || contentLower.includes('fix')) {
      return 'error';
    }
    if (contentLower.includes('task') || contentLower.includes('todo') || contentLower.includes('assign')) {
      return 'task';
    }
    if (contentLower.includes('decision') || contentLower.includes('approve') || contentLower.includes('reject')) {
      return 'decision';
    }
    if (contentLower.includes('meeting') || contentLower.includes('discussion') || contentLower.includes('review')) {
      return 'communication';
    }
    if (contentLower.includes('metric') || contentLower.includes('performance') || contentLower.includes('data')) {
      return 'metric';
    }
    
    return 'general';
  }

  extractMetadata(content) {
    const metadata = {};
    
    // Extract mentions (e.g., @username)
    const mentions = content.match(/@[\w]+/g);
    if (mentions) {
      metadata.mentions = mentions;
    }
    
    // Extract hashtags (e.g., #tag)
    const hashtags = content.match(/#[\w]+/g);
    if (hashtags) {
      metadata.hashtags = hashtags;
    }
    
    // Extract URLs
    const urls = content.match(/https?:\/\/[^\s]+/g);
    if (urls) {
      metadata.urls = urls;
    }
    
    // Extract numbers
    const numbers = content.match(/\d+/g);
    if (numbers) {
      metadata.numbers = numbers;
    }
    
    return metadata;
  }

  async getAllMemories() {
    try {
      const cacheKey = 'all_memories';
      
      if (this.memoryCache.has(cacheKey)) {
        return this.memoryCache.get(cacheKey);
      }

      // In production, query D1 for all memories
      const memories = [];
      this.memoryCache.set(cacheKey, memories);
      
      return memories;
    } catch (error) {
      logger.error(`Memory Integration: Failed to get all memories`, {
        error: error.message
      });
      return [];
    }
  }

  async getRecentMemories(limit) {
    try {
      const allMemories = await this.getAllMemories();
      
      // Sort by timestamp and get recent
      const recent = allMemories
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
      
      return recent;
    } catch (error) {
      logger.error(`Memory Integration: Failed to get recent memories`, {
        error: error.message
      });
      return [];
    }
  }

  async saveMemoryToStorage(memory) {
    try {
      const memoryKey = `memory:${memory.id}`;
      await saveMemory(this.env, memoryKey, memory);
    } catch (error) {
      logger.error(`Memory Integration: Failed to save memory to storage`, {
        error: error.message
      });
    }
  }

  async getMemoryFromStorage(memoryId) {
    try {
      const memoryKey = `memory:${memoryId}`;
      const memory = await getMemory(this.env, memoryKey);
      return memory;
    } catch (error) {
      logger.error(`Memory Integration: Failed to get memory from storage`, {
        error: error.message
      });
      return null;
    }
  }

  getConfig() {
    return MEMORY_CONFIG;
  }
}

export { MemoryIntegration, MEMORY_CONFIG };
